port module Main exposing (main)

import Api
import Browser
import Date
import Demo
import Storage
import Supabase
import Task
import Time
import Types exposing (..)
import View


port saveLocal : String -> Cmd msg


port startScanner : () -> Cmd msg


port stopScanner : () -> Cmd msg


port copyText : String -> Cmd msg


port shareOffice : String -> Cmd msg


port downloadQr : () -> Cmd msg


port printQr : () -> Cmd msg


port saveSession : String -> Cmd msg


port clearSession : () -> Cmd msg


port exportCsv : String -> Cmd msg


port scanDecoded : (String -> msg) -> Sub msg


port scannerMessage : (String -> msg) -> Sub msg


port onlineChanged : (Bool -> msg) -> Sub msg


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
            , officeCode = "PROOFSTECH-HQ-2026"
            , scanStatus = ScanClosed
            , scanMessage = ""
            , manualCode = ""
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
            , authMessage = ""
            , refreshing = False
            , appOrigin = flags.origin
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
                            Cmd.batch [ Supabase.fetchUser cloud session, cloudFetch model ]

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
            ( { model | scanStatus = ScanRequesting, scanMessage = "", manualCode = "" }
            , startScanner ()
            )

        CloseScanner ->
            ( { model | scanStatus = ScanClosed, scanMessage = "" }, stopScanner () )

        ScannerMessage message ->
            case message of
                "ready" ->
                    ( { model | scanStatus = ScanActive }, Cmd.none )

                "copied" ->
                    ( { model | toast = Just (Toast "Office code copied" "You can paste it wherever you need it.") }, Cmd.none )

                "copy-error" ->
                    ( { model | toast = Just (Toast "Copy is unavailable" model.officeCode) }, Cmd.none )

                "download-error" ->
                    ( { model | toast = Just (Toast "The QR could not download" "Reconnect once, then try again.") }, Cmd.none )

                "storage-error" ->
                    ( { model | toast = Just (Toast "This phone is low on storage" "Free some space so offline records stay safe.") }, Cmd.none )

                _ ->
                    ( { model | scanStatus = ScanManual, scanMessage = friendlyCameraError message }, Cmd.none )

        ScanDecoded value ->
            if validOfficeCode model value then
                registerAttendance { model | scanStatus = ScanClosed }

            else
                ( { model
                    | scanStatus = ScanManual
                    , scanMessage = "That QR does not belong to this office. Try the printed ProofsTech code."
                  }
                , stopScanner ()
                )

        SetManualCode value ->
            ( { model | manualCode = value }, Cmd.none )

        SubmitManualCode ->
            if String.trim model.manualCode == "" then
                ( { model | scanMessage = "Enter the code printed below the office QR." }, Cmd.none )

            else if validOfficeCode model model.manualCode then
                registerAttendance { model | scanStatus = ScanClosed }

            else
                ( { model | scanMessage = "That code does not match this office. Check it and try again." }, Cmd.none )

        SetAuthEmail value ->
            ( { model | authEmail = value, authMessage = "" }, Cmd.none )

        SendMagicLink ->
            case model.supabase of
                Nothing ->
                    ( model, Cmd.none )

                Just cloud ->
                    if not model.online then
                        ( { model | authMessage = "Reconnect once to receive your sign-in link." }, Cmd.none )

                    else if String.contains "@" model.authEmail && String.contains "." model.authEmail then
                        ( { model | authStatus = SendingLink, authMessage = "" }
                        , Supabase.sendMagicLink cloud (String.toLower (String.trim model.authEmail)) model.appOrigin
                        )

                    else
                        ( { model | authMessage = "Enter your invited email address." }, Cmd.none )

        MagicLinkResult result ->
            case result of
                Ok _ ->
                    ( { model | authStatus = LinkSent, authMessage = "Your private sign-in link is on its way." }, Cmd.none )

                Err _ ->
                    ( { model | authStatus = SignedOut, authMessage = "We could not sign in this email. Use the Gmail address invited by ProofsTech." }, Cmd.none )

        AuthUserReceived result ->
            case ( result, model.session ) of
                ( Ok user, Just session ) ->
                    let
                        updatedSession =
                            { session | userId = user.id, email = String.toLower user.email }

                        updated =
                            { model | session = Just updatedSession, currentWorkerId = user.id, authStatus = Authenticated, refreshing = False }
                    in
                    ( updated, Cmd.batch [ saveSession (Supabase.encodeSession updatedSession), cloudFetch updated ] )

                ( Err _, Just session ) ->
                    case model.supabase of
                        Just cloud ->
                            if model.online then
                                ( { model | refreshing = True }, Supabase.refreshSession cloud session (Time.posixToMillis model.now // 1000) )

                            else
                                ( { model | authStatus = Authenticated }, Cmd.none )

                        Nothing ->
                            ( model, Cmd.none )

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
            , if online then
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
                        ( model, Supabase.inviteWorker cloud session model.newWorkerName model.newWorkerEmail model.newWorkerNickname model.newWorkerTitle )

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

        CopyOfficeCode ->
            ( model, copyText model.officeCode )

        ShareOfficeCode ->
            ( model, shareOffice ("ProofsTech office attendance code: " ++ model.officeCode) )

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
            case workerById model entry.workerId of
                Just worker ->
                    [ worker.name, worker.title, entry.date, entry.time, entry.source ]

                Nothing ->
                    [ "Former staff member", "", entry.date, entry.time, entry.source ]

        escape value =
            "\"" ++ String.replace "\"" "\"\"" value ++ "\""
    in
    "Name,Role,Date,Time,Source\n"
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
        , authMessage = ""
        , currentWorkerId = ""
        , workers = []
        , entries = []
        , role = WorkerView
        , page = Home
        , refreshing = False
      }
    , clearSession ()
    )


validOfficeCode : Model -> String -> Bool
validOfficeCode model value =
    String.contains (String.toUpper model.officeCode) (String.toUpper (String.trim value))


friendlyCameraError : String -> String
friendlyCameraError message =
    if String.contains "HTTPS" message then
        "Camera access needs a secure connection. You can still use the office code."

    else if String.contains "Permission" message || String.contains "Allowed" message then
        "Camera permission is off. Allow it in your browser settings, or use the office code."

    else
        "The camera is unavailable right now. The printed office code works too."


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
        ]
