port module Main exposing (main)

import Api
import Browser
import Date
import Demo
import Http
import Storage
import Supabase
import Task
import Time
import Types exposing (..)
import View


port saveLocal : String -> Cmd msg


port startScanner : () -> Cmd msg


port armScanner : () -> Cmd msg


port disarmScanner : () -> Cmd msg


port stopScanner : () -> Cmd msg


port downloadQr : () -> Cmd msg


port printQr : () -> Cmd msg


port saveSession : String -> Cmd msg


port clearSession : () -> Cmd msg


port exportCsv : String -> Cmd msg


port copyInviteLink : String -> Cmd msg


port openLink : String -> Cmd msg


port scanDecoded : (String -> msg) -> Sub msg


port scannerMessage : (String -> msg) -> Sub msg


port onlineChanged : (Bool -> msg) -> Sub msg


port linkCopied : (Bool -> msg) -> Sub msg


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , view = View.view
        , update = update
        , subscriptions = subscriptions
        }


init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        config =
            if flags.supabaseUrl /= "" && flags.supabaseKey /= "" then
                Just (SupabaseConfig flags.supabaseUrl flags.supabaseKey)

            else
                Nothing

        savedSession =
            Supabase.sessionFromSaved flags.session

        usingCloud =
            config /= Nothing

        base =
            { page = Home
            , role = WorkerView
            , currentWorkerId = if usingCloud then "" else "w1"
            , workers = if usingCloud then [] else Demo.seedWorkers
            , entries = if usingCloud then [] else Demo.seedEntries flags.today
            , today = flags.today
            , selectedDate = flags.today
            , now = Time.millisToPosix flags.now
            , zone = Time.utc
            , online = flags.online
            , serverReady = False
            , officeCode = if String.trim flags.officeCode == "" then "PROOFSTECH-HQ-2026" else String.trim flags.officeCode
            , scanStatus = ScanClosed
            , scanMessage = ""
            , toast = Nothing
            , showInstall = False
            , showAddWorker = False
            , newWorkerName = ""
            , newWorkerTitle = ""
            , newWorkerEmail = ""
            , newWorkerNickname = ""
            , supabase = config
            , session = savedSession
            , authStatus =
                case ( usingCloud, savedSession ) of
                    ( False, _ ) ->
                        Authenticated

                    ( True, Nothing ) ->
                        SignedOut

                    ( True, Just _ ) ->
                        RestoringSession
            , authEmail = ""
            , authPassword = ""
            , authPin = ""
            , authMessage = ""
            , showAuthPassword = False
            , showAuthPin = False
            , refreshing = False
            , appOrigin = flags.origin
            , showInviteLink = False
            , inviteLink = ""
            , inviteLinkName = ""
            }

        restored =
            Storage.applySaved flags.saved base

        model =
            case savedSession of
                Just session ->
                    { restored | currentWorkerId = session.userId, authStatus = if flags.online then RestoringSession else Authenticated }

                Nothing ->
                    restored

        initialCommand =
            case ( config, savedSession ) of
                ( Just cloud, Just session ) ->
                    if flags.online then
                        if session.expiresAt <= flags.now // 1000 + 60 then
                            Supabase.refreshSession cloud session (flags.now // 1000)

                        else
                            Supabase.fetchUser cloud session

                    else
                        Cmd.none

                ( Nothing, _ ) ->
                    if flags.online then
                        Api.getState

                    else
                        Cmd.none

                _ ->
                    Cmd.none
    in
    ( model, Cmd.batch [ Task.perform SetZone Time.here, initialCommand ] )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        ( updated, command ) =
            updateCore msg model
    in
    case msg of
        Tick _ ->
            ( updated, command )

        _ ->
            ( updated, Cmd.batch [ command, saveLocal (Storage.encodeModel updated) ] )


updateCore : Msg -> Model -> ( Model, Cmd Msg )
updateCore msg model =
    case msg of
        Tick posix ->
            let
                needsRefresh =
                    case ( model.supabase, model.session ) of
                        ( Just _, Just session ) ->
                            model.online && not model.refreshing && session.expiresAt <= Time.posixToMillis posix // 1000 + 60

                        _ ->
                            False

                refreshCommand =
                    case ( model.supabase, model.session ) of
                        ( Just cloud, Just session ) ->
                            if needsRefresh then
                                Supabase.refreshSession cloud session (Time.posixToMillis posix // 1000)

                            else
                                Cmd.none

                        _ ->
                            Cmd.none

                wallCommand =
                    if model.online && model.authStatus == Authenticated && modBy 30 (Time.posixToMillis posix // 1000) == 0 then
                        cloudFetch model

                    else
                        Cmd.none

                command =
                    Cmd.batch [ refreshCommand, wallCommand ]
            in
            ( { model
                | now = posix
                , today = Date.toIsoString (Date.fromPosix model.zone posix)
                , refreshing = needsRefresh
              }
            , command
            )

        SetZone zone ->
            ( { model | zone = zone }, Cmd.none )

        Navigate page ->
            ( { model | page = page }, Cmd.none )

        OpenScanner ->
            ( { model | scanStatus = ScanRequesting, scanMessage = "" }
            , startScanner ()
            )

        ArmScan ->
            if model.scanStatus == ScanArmed then
                ( { model | scanStatus = ScanActive, scanMessage = "" }, disarmScanner () )

            else if model.scanStatus == ScanActive then
                ( { model | scanStatus = ScanArmed, scanMessage = "" }, armScanner () )

            else
                ( model, Cmd.none )

        CloseScanner ->
            ( { model | scanStatus = ScanClosed, scanMessage = "" }, stopScanner () )

        ScannerMessage message ->
            case message of
                "ready" ->
                    ( { model | scanStatus = ScanActive, scanMessage = "" }, Cmd.none )

                "armed" ->
                    ( { model | scanStatus = ScanArmed }, Cmd.none )

                "paused" ->
                    ( { model | scanStatus = ScanActive }, Cmd.none )

                "outside-frame" ->
                    ( { model
                        | scanStatus = ScanArmed
                        , scanMessage = "Almost — the pass has to sit completely inside the box."
                      }
                    , Cmd.none
                    )

                "scan-timeout" ->
                    ( { model
                        | scanStatus = ScanActive
                        , scanMessage = "Nothing scanned yet. Fit the whole pass inside the box, then tap Scan."
                      }
                    , Cmd.none
                    )

                "download-error" ->
                    ( { model | toast = Just (Toast "The QR could not download" "Reconnect once, then try again.") }, Cmd.none )

                "storage-error" ->
                    ( { model | toast = Just (Toast "This phone is low on storage" "Free some space so offline records stay safe.") }, Cmd.none )

                _ ->
                    ( { model | scanStatus = ScanBlocked, scanMessage = friendlyCameraError message }, Cmd.none )

        ScanDecoded value ->
            if validOfficeCode model value then
                let
                    ( nextModel, nextCommand ) =
                        registerAttendance { model | scanStatus = ScanClosed, scanMessage = "" }
                in
                ( nextModel, Cmd.batch [ nextCommand, stopScanner () ] )

            else
                let
                    lowerValue =
                        String.toLower value

                    message =
                        if String.contains "day=" lowerValue then
                            "That office pass is from another day. Print today's pass and scan it again."

                        else if String.contains (String.toLower model.officeCode) lowerValue then
                            "That pass has no date. Print today's dated pass and scan it again."

                        else
                            "That QR is not the ProofsTech office pass. Find today's printed pass and try again."
                in
                ( { model | scanStatus = ScanBlocked, scanMessage = message }, stopScanner () )

        SetAuthEmail value ->
            ( { model | authEmail = value, authMessage = "" }, Cmd.none )

        SetAuthPassword value ->
            ( { model | authPassword = value, authMessage = "" }, Cmd.none )

        SetAuthPin value ->
            ( { model | authPin = onlyDigits 6 value, authMessage = "" }, Cmd.none )

        ToggleAuthPassword ->
            ( { model | showAuthPassword = not model.showAuthPassword }, Cmd.none )

        ToggleAuthPin ->
            ( { model | showAuthPin = not model.showAuthPin }, Cmd.none )

        SignIn ->
            case model.supabase of
                Nothing ->
                    ( model, Cmd.none )

                Just cloud ->
                    let
                        email =
                            String.toLower (String.trim model.authEmail)
                    in
                    if not model.online then
                        ( { model | authMessage = "Reconnect to sign in. This page needs the office server once." }, Cmd.none )

                    else if not (String.contains "@" email && String.contains "." email) then
                        ( { model | authMessage = "Enter the approved Gmail address on your staff profile." }, Cmd.none )

                    else if String.length model.authPassword < 6 then
                        ( { model | authMessage = "Enter the team password ProofsTech shared with you." }, Cmd.none )

                    else if String.length model.authPin /= 6 then
                        ( { model | authMessage = "Your PIN is exactly six digits." }, Cmd.none )

                    else
                        ( { model | authStatus = SigningIn, authMessage = "" }
                        , Supabase.pinSignIn cloud email model.authPassword model.authPin model.appOrigin
                        )

        SignInResult result ->
            case result of
                Ok link ->
                    ( { model | authMessage = "", authPassword = "", authPin = "" }, openLink link )

                Err error ->
                    ( { model
                        | authStatus = SignedOut
                        , authPassword = ""
                        , authPin = ""
                        , authMessage = signInMessage error
                      }
                    , Cmd.none
                    )

        AuthUserReceived result ->
            case ( result, model.session, model.supabase ) of
                ( Ok user, Just session, Just _ ) ->
                    let
                        updatedSession =
                            { session | userId = user.id, email = String.toLower user.email }

                        updated =
                            { model | session = Just updatedSession, currentWorkerId = user.id, authStatus = Authenticated, refreshing = False }
                    in
                    ( updated
                    , Cmd.batch
                        [ saveSession (Supabase.encodeSession updatedSession)
                        , cloudFetch updated
                        ]
                    )

                ( Err _, Just session, Just cloud ) ->
                    if model.online then
                        ( { model | refreshing = True }, Supabase.refreshSession cloud session (Time.posixToMillis model.now // 1000) )

                    else
                        ( { model | authStatus = Authenticated }, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        SessionRefreshed result ->
            case ( result, model.supabase ) of
                ( Ok session, Just _ ) ->
                    let
                        updated =
                            { model | session = Just session, currentWorkerId = session.userId, authStatus = Authenticated, refreshing = False }
                    in
                    ( updated, Cmd.batch [ saveSession (Supabase.encodeSession session), cloudFetch updated ] )

                ( Err _, Just _ ) ->
                    signOut model

                _ ->
                    ( model, Cmd.none )

        GotCloudWorkers result ->
            case result of
                Ok workers ->
                    ( { model | workers = workers, serverReady = True }, Cmd.none )

                Err _ ->
                    ( { model | serverReady = False }, Cmd.none )

        GotCloudEntries result ->
            case result of
                Ok entries ->
                    let
                        merged =
                            mergeEntries entries model.entries

                        updated =
                            { model | entries = merged }
                    in
                    ( updated, Cmd.batch <| List.map (cloudCheckIn updated) <| pendingEntries updated )

                Err _ ->
                    ( model, Cmd.none )

        GotAdminStatus result ->
            case result of
                Ok isAdmin ->
                    ( { model | role = if isAdmin then AdminView else WorkerView }, Cmd.none )

                Err _ ->
                    ( { model | role = WorkerView }, Cmd.none )

        CloudCheckInReceived localId result ->
            case result of
                Ok returned ->
                    let
                        replace entry =
                            if entry.id == localId then
                                case List.head returned of
                                    Just remote ->
                                        { remote | synced = True }

                                    Nothing ->
                                        { entry | synced = True }

                            else
                                entry
                    in
                    ( { model | entries = List.map replace model.entries }, Cmd.none )

                Err _ ->
                    ( { model | toast = Just (Toast "Saved on this phone" "Your arrival will sync when the connection is ready.") }, Cmd.none )

        SignOut ->
            signOut model

        OnlineChanged online ->
            ( { model | online = online }
            , if online && model.authStatus == Authenticated then
                case model.supabase of
                    Just _ ->
                        Cmd.batch (cloudFetch model :: List.map (cloudCheckIn model) (pendingEntries model))

                    Nothing ->
                        Cmd.batch (Api.getState :: List.map Api.checkIn (pendingEntries model))

              else
                Cmd.none
            )

        GotState result ->
            case result of
                Ok state ->
                    let
                        merged =
                            mergeEntries state.entries model.entries

                        nextModel =
                            { model
                                | workers = if List.isEmpty state.workers then model.workers else state.workers
                                , entries = merged
                                , officeCode = state.officeCode
                                , serverReady = True
                            }
                    in
                    ( nextModel, Cmd.batch <| List.map Api.checkIn <| pendingEntries nextModel )

                Err _ ->
                    ( { model | serverReady = False }, Cmd.none )

        CheckInReceived localId result ->
            case result of
                Ok remoteEntry ->
                    let
                        replace entry =
                            if entry.id == localId then
                                { remoteEntry | synced = True }

                            else
                                entry
                    in
                    ( { model | entries = List.map replace model.entries }, Cmd.none )

                Err _ ->
                    ( { model | toast = Just (Toast "Saved on this phone" "The office wall will update when your connection returns.") }, Cmd.none )

        SelectDate day ->
            ( { model | selectedDate = day }, Cmd.none )

        ToggleInstall ->
            ( { model | showInstall = not model.showInstall }, Cmd.none )

        OpenAddWorker ->
            ( { model | showAddWorker = True }, Cmd.none )

        CloseAddWorker ->
            ( { model | showAddWorker = False, newWorkerName = "", newWorkerTitle = "", newWorkerEmail = "", newWorkerNickname = "" }, Cmd.none )

        SetNewWorkerName value ->
            ( { model | newWorkerName = value }, Cmd.none )

        SetNewWorkerTitle value ->
            ( { model | newWorkerTitle = value }, Cmd.none )

        SetNewWorkerEmail value ->
            ( { model | newWorkerEmail = value }, Cmd.none )

        SetNewWorkerNickname value ->
            ( { model | newWorkerNickname = value }, Cmd.none )

        SubmitWorker ->
            if String.length (String.trim model.newWorkerName) < 2 || String.length (String.trim model.newWorkerTitle) < 2 then
                ( { model | toast = Just (Toast "A little more detail" "Add the worker’s name and their role.") }, Cmd.none )

            else if model.supabase /= Nothing && (not (String.contains "@" model.newWorkerEmail) || String.trim model.newWorkerNickname == "") then
                ( { model | toast = Just (Toast "Complete their invitation" "Add their Gmail address and the AKA used around the office.") }, Cmd.none )

            else if not model.online then
                ( { model | toast = Just (Toast "Team changes need a connection" "Attendance still works offline. Add this worker when you reconnect.") }, Cmd.none )

            else
                case ( model.supabase, model.session ) of
                    ( Just cloud, Just session ) ->
                        ( model, Supabase.inviteWorker cloud session model.newWorkerName model.newWorkerEmail model.newWorkerNickname model.newWorkerTitle model.appOrigin )

                    _ ->
                        ( model, Api.createWorker (String.trim model.newWorkerName) (String.trim model.newWorkerTitle) )

        WorkerCreated result ->
            case result of
                Ok worker ->
                    ( { model
                        | workers = worker :: model.workers
                        , showAddWorker = False
                        , newWorkerName = ""
                        , newWorkerTitle = ""
                        , newWorkerEmail = ""
                        , newWorkerNickname = ""
                        , toast = Just (Toast (worker.name ++ " is on the team") "They can now check in with the office QR.")
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( { model | toast = Just (Toast "Worker not added" "Please try again in a moment.") }, Cmd.none )

        InviteCreated result ->
            case result of
                Ok invite ->
                    ( { model
                        | workers = invite.worker :: List.filter (\worker -> worker.id /= invite.worker.id) model.workers
                        , showAddWorker = False
                        , newWorkerName = ""
                        , newWorkerTitle = ""
                        , newWorkerEmail = ""
                        , newWorkerNickname = ""
                        , showInviteLink = invite.inviteLink /= ""
                        , inviteLink = invite.inviteLink
                        , inviteLinkName = invite.worker.name
                        , toast =
                            if invite.inviteLink == "" then
                                Just (Toast (invite.worker.name ++ " is on the team") "The profile was created, but the private link could not be prepared.")

                            else
                                Nothing
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( { model | toast = Just (Toast "Worker not added" "Please try again in a moment.") }, Cmd.none )

        PrepareInviteLink worker ->
            if model.role /= AdminView then
                ( model, Cmd.none )

            else if not model.online then
                ( { model | toast = Just (Toast "Reconnect to prepare this link" "Invite links are generated securely by the office.") }, Cmd.none )

            else
                case ( model.supabase, model.session ) of
                    ( Just cloud, Just session ) ->
                        ( model, Supabase.prepareInviteLink cloud session worker.id model.appOrigin )

                    _ ->
                        ( { model | toast = Just (Toast "Invite links need Supabase" "This local demo cannot prepare a private sign-in link.") }, Cmd.none )

        InviteLinkPrepared result ->
            case result of
                Ok invite ->
                    ( { model
                        | showInviteLink = True
                        , inviteLink = invite.inviteLink
                        , inviteLinkName = invite.worker.name
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( { model | toast = Just (Toast "Invite link not prepared" "Please try again in a moment.") }, Cmd.none )

        CloseInviteLink ->
            ( { model | showInviteLink = False, inviteLink = "", inviteLinkName = "" }, Cmd.none )

        CopyInviteLink ->
            ( model, copyInviteLink model.inviteLink )

        InviteLinkCopied copied ->
            ( { model
                | toast =
                    Just
                        (if copied then
                            Toast "Invite link copied" "Send it privately to the right person when you are ready."

                         else
                            Toast "Copy is unavailable" "Select the link and copy it manually."
                        )
              }
            , Cmd.none
            )

        DownloadQr ->
            ( model, downloadQr () )

        PrintQr ->
            ( model, printQr () )

        ExportRecords ->
            ( model, exportCsv (attendanceCsv model) )

        ClearToast ->
            ( { model | toast = Nothing }, Cmd.none )

        NoOp ->
            ( model, Cmd.none )


registerAttendance : Model -> ( Model, Cmd Msg )
registerAttendance model =
    case entryFor model model.currentWorkerId model.today of
        Just existing ->
            ( { model
                | scanStatus = ScanClosed
                , toast = Just (Toast "You’re already on today’s wall" ("Your arrival was recorded at " ++ existing.time ++ "."))
              }
            , stopScanner ()
            )

        Nothing ->
            let
                timestamp =
                    Time.posixToMillis model.now

                entry =
                    { id = model.currentWorkerId ++ "-" ++ String.fromInt timestamp
                    , workerId = model.currentWorkerId
                    , date = model.today
                    , time = formatClock model.zone model.now
                    , timestamp = timestamp
                    , source = if model.online then "Office QR" else "Offline check-in"
                    , synced = False
                    }

                detail =
                    if model.online then
                        "Your arrival is on the shared daily wall."

                    else
                        "No data, no problem. Your time is safe on this phone and will sync later."
            in
            ( { model
                | entries = entry :: model.entries
                , scanStatus = ScanClosed
                , toast = Just (Toast ("You’re in, " ++ firstName (currentWorker model).name ++ ".") detail)
              }
            , Cmd.batch
                [ stopScanner ()
                , if model.online then
                    case model.supabase of
                        Just _ ->
                            cloudCheckIn model entry

                        Nothing ->
                            Api.checkIn entry

                  else
                    Cmd.none
                ]
            )


attendanceCsv : Model -> String
attendanceCsv model =
    let
        row entry =
            let
                status =
                    if isLate entry then
                        "Late"

                    else
                        "On time"

                fine =
                    if isLate entry then
                        String.fromInt lateFine

                    else
                        "0"
            in
            case workerById model entry.workerId of
                Just worker ->
                    [ worker.name, worker.title, entry.date, entry.time, entry.source, status, fine ]

                Nothing ->
                    [ "Former staff member", "", entry.date, entry.time, entry.source, status, fine ]

        escape value =
            "\"" ++ String.replace "\"" "\"\"" value ++ "\""
    in
    "Name,Role,Date,Time,Source,Status,Fine (NGN)\n"
        ++ (model.entries
                |> List.sortBy .timestamp
                |> List.map (\entry -> String.join "," (List.map escape (row entry)))
                |> String.join "\n"
           )


cloudFetch : Model -> Cmd Msg
cloudFetch model =
    case ( model.supabase, model.session ) of
        ( Just cloud, Just session ) ->
            Cmd.batch
                [ Supabase.getWorkers cloud session
                , Supabase.getEntries cloud session
                , Supabase.getAdminStatus cloud session
                ]

        _ ->
            Cmd.none


cloudCheckIn : Model -> Entry -> Cmd Msg
cloudCheckIn model entry =
    case ( model.supabase, model.session ) of
        ( Just cloud, Just session ) ->
            Supabase.checkIn cloud session entry

        _ ->
            Cmd.none


signOut : Model -> ( Model, Cmd Msg )
signOut model =
    ( { model
        | session = Nothing
        , authStatus = SignedOut
        , authEmail = ""
        , authPassword = ""
        , authPin = ""
        , authMessage = ""
        , showAuthPassword = False
        , showAuthPin = False
        , currentWorkerId = ""
        , workers = []
        , entries = []
        , role = WorkerView
        , page = Home
        , refreshing = False
        , showInviteLink = False
        , inviteLink = ""
        , inviteLinkName = ""
      }
    , clearSession ()
    )


onlyDigits : Int -> String -> String
onlyDigits limit value =
    value
        |> String.filter (\character -> character >= '0' && character <= '9')
        |> String.left limit


signInMessage : Http.Error -> String
signInMessage error =
    case error of
        Http.BadStatus 400 ->
            "Enter your approved email, the team password, and your six-digit PIN."

        Http.BadStatus 401 ->
            "Email, team password, or PIN is incorrect."

        Http.BadStatus 403 ->
            "That email is not approved for ProofsTech attendance."

        Http.BadStatus 409 ->
            "We could not set up this PIN. Try again in a moment."

        Http.BadStatus 429 ->
            "Too many attempts. Wait 15 minutes, then try again."

        Http.BadStatus _ ->
            "We could not start your session. Try again in a moment."

        Http.NetworkError ->
            "Reconnect, then try again."

        Http.Timeout ->
            "Sign-in took too long. Try again."

        _ ->
            "Sign-in is unavailable right now. Try again in a moment."


validOfficeCode : Model -> String -> Bool
validOfficeCode model value =
    let
        upperValue =
            String.toUpper (String.trim value)
    in
    String.contains (String.toUpper model.officeCode) upperValue
        && String.contains ("DAY=" ++ String.toUpper model.today) upperValue


friendlyCameraError : String -> String
friendlyCameraError message =
    let
        lower =
            String.toLower message
    in
    if String.contains "https" lower || String.contains "secure" lower then
        "Camera access needs a secure connection. Open the app over HTTPS, then scan the printed office QR."

    else if String.contains "permission" lower || String.contains "allowed" lower || String.contains "denied" lower then
        "Camera permission is off. Allow camera access in your browser settings, then scan the office QR again."

    else if String.contains "not found" lower || String.contains "no camera" lower || String.contains "overconstrained" lower then
        "This device has no usable camera. Open Attendance on a phone, then scan the office QR."

    else if String.contains "did not load" lower || String.contains "reload" lower then
        "The scanner did not load. Reload the page once while online, then try again."

    else if String.contains "did not open" lower then
        "The camera view did not open. Close this panel and tap Scan again."

    else
        "The camera is unavailable right now. Try again in a moment."


mergeEntries : List Entry -> List Entry -> List Entry
mergeEntries remote local =
    let
        remoteIds =
            List.map .id remote

        unsynced =
            List.filter (\entry -> not entry.synced && not (List.member entry.id remoteIds)) local
    in
    remote ++ unsynced


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Time.every 1000 Tick
        , scanDecoded ScanDecoded
        , scannerMessage ScannerMessage
        , onlineChanged OnlineChanged
        , linkCopied InviteLinkCopied
        ]
