module Types exposing (..)

import Date exposing (Date)
import Http
import Time


type Role
    = WorkerView
    | AdminView


type Page
    = Home
    | Wall
    | Team
    | Office
    | Profile


type ScanStatus
    = ScanClosed
    | ScanRequesting
    | ScanActive
    | ScanBlocked


type AuthStatus
    = SignedOut
    | SigningIn
    | RestoringSession
    | Authenticated


type alias SupabaseConfig =
    { url : String
    , key : String
    }


type alias Session =
    { accessToken : String
    , refreshToken : String
    , expiresAt : Int
    , userId : String
    , email : String
    }


type alias AuthUser =
    { id : String
    , email : String
    }


type alias Worker =
    { id : String
    , name : String
    , title : String
    , initials : String
    , color : String
    , avatar : Int
    , active : Bool
    }


type alias Entry =
    { id : String
    , workerId : String
    , date : String
    , time : String
    , timestamp : Int
    , source : String
    , synced : Bool
    }


type alias State =
    { workers : List Worker
    , entries : List Entry
    , officeCode : String
    }


type alias InviteResult =
    { worker : Worker
    , inviteLink : String
    }


type alias Toast =
    { message : String
    , detail : String
    }


type alias Model =
    { page : Page
    , role : Role
    , currentWorkerId : String
    , workers : List Worker
    , entries : List Entry
    , today : String
    , selectedDate : String
    , now : Time.Posix
    , zone : Time.Zone
    , online : Bool
    , serverReady : Bool
    , officeCode : String
    , scanStatus : ScanStatus
    , scanMessage : String
    , toast : Maybe Toast
    , showInstall : Bool
    , showAddWorker : Bool
    , newWorkerName : String
    , newWorkerTitle : String
    , newWorkerEmail : String
    , newWorkerNickname : String
    , supabase : Maybe SupabaseConfig
    , session : Maybe Session
    , authStatus : AuthStatus
    , authEmail : String
    , authPassword : String
    , authPin : String
    , authMessage : String
    , showAuthPassword : Bool
    , showAuthPin : Bool
    , refreshing : Bool
    , appOrigin : String
    , showInviteLink : Bool
    , inviteLink : String
    , inviteLinkName : String
    }


type alias Flags =
    { saved : Maybe String
    , today : String
    , now : Int
    , online : Bool
    , session : Maybe String
    , supabaseUrl : String
    , supabaseKey : String
    , officeCode : String
    , origin : String
    }


type Msg
    = Tick Time.Posix
    | SetZone Time.Zone
    | Navigate Page
    | OpenScanner
    | CloseScanner
    | ScannerMessage String
    | ScanDecoded String
    | OnlineChanged Bool
    | SetAuthEmail String
    | SetAuthPassword String
    | SetAuthPin String
    | ToggleAuthPassword
    | ToggleAuthPin
    | SignIn
    | SignInResult (Result Http.Error String)
    | AuthUserReceived (Result Http.Error AuthUser)
    | SessionRefreshed (Result Http.Error Session)
    | GotCloudWorkers (Result Http.Error (List Worker))
    | GotCloudEntries (Result Http.Error (List Entry))
    | GotAdminStatus (Result Http.Error Bool)
    | CloudCheckInReceived String (Result Http.Error (List Entry))
    | SignOut
    | GotState (Result Http.Error State)
    | CheckInReceived String (Result Http.Error Entry)
    | SelectDate String
    | ToggleInstall
    | OpenAddWorker
    | CloseAddWorker
    | SetNewWorkerName String
    | SetNewWorkerTitle String
    | SetNewWorkerEmail String
    | SetNewWorkerNickname String
    | SubmitWorker
    | WorkerCreated (Result Http.Error Worker)
    | InviteCreated (Result Http.Error InviteResult)
    | PrepareInviteLink Worker
    | InviteLinkPrepared (Result Http.Error InviteResult)
    | CloseInviteLink
    | CopyInviteLink
    | InviteLinkCopied Bool
    | DownloadQr
    | PrintQr
    | ExportRecords
    | ClearToast
    | NoOp


currentWorker : Model -> Worker
currentWorker model =
    model.workers
        |> List.filter (\worker -> worker.id == model.currentWorkerId)
        |> List.head
        |> Maybe.withDefault
            { id = model.currentWorkerId, name = "Team member", title = "ProofsTech", initials = "PT", color = "#e4774f", avatar = 1, active = True }


workerById : Model -> String -> Maybe Worker
workerById model id =
    model.workers
        |> List.filter (\worker -> worker.id == id)
        |> List.head


entryFor : Model -> String -> String -> Maybe Entry
entryFor model workerId day =
    model.entries
        |> List.filter (\entry -> entry.workerId == workerId && entry.date == day)
        |> List.head


entriesForDate : Model -> String -> List Entry
entriesForDate model day =
    model.entries
        |> List.filter (\entry -> entry.date == day)
        |> List.sortBy .timestamp
        |> List.foldl
            (\entry found ->
                if List.any (\other -> other.workerId == entry.workerId) found then
                    found

                else
                    found ++ [ entry ]
            )
            []


parseDate : String -> Date
parseDate value =
    value
        |> Date.fromIsoString
        |> Result.withDefault (Date.fromCalendarDate 2026 Time.Nov 11)


formatLongDate : String -> String
formatLongDate value =
    Date.format "EEEE, d MMMM" (parseDate value)


formatShortDate : String -> String
formatShortDate value =
    if value == "" then
        ""

    else
        Date.format "EEE, d MMM" (parseDate value)


relativeDate : String -> String -> String
relativeDate today value =
    if value == today then
        "Today"

    else if value == (Date.toIsoString <| Date.add Date.Days -1 <| parseDate today) then
        "Yesterday"

    else
        formatShortDate value


recentDates : String -> List String
recentDates today =
    List.map
        (\offset -> Date.toIsoString <| Date.add Date.Days -offset <| parseDate today)
        [ 0, 1, 2, 3, 4 ]


formatClock : Time.Zone -> Time.Posix -> String
formatClock zone posix =
    pad (Time.toHour zone posix) ++ ":" ++ pad (Time.toMinute zone posix)


formatSeconds : Time.Zone -> Time.Posix -> String
formatSeconds zone posix =
    formatClock zone posix ++ ":" ++ pad (Time.toSecond zone posix)


pad : Int -> String
pad value =
    String.padLeft 2 '0' (String.fromInt value)


firstName : String -> String
firstName name =
    name |> String.words |> List.head |> Maybe.withDefault name


greeting : Model -> String
greeting model =
    let
        hour =
            Time.toHour model.zone model.now
    in
    if hour < 12 then
        "Good morning"

    else if hour < 17 then
        "Good afternoon"

    else
        "Good evening"


isLate : Entry -> Bool
isLate entry =
    entry.time > "09:00"


pendingEntries : Model -> List Entry
pendingEntries model =
    List.filter (\entry -> not entry.synced) model.entries
