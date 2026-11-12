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
    | Records


type ScanStatus
    = ScanClosed
    | ScanRequesting
    | ScanActive
    | ScanArmed
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
    , exemptStaff : List String
    , logMonth : String
    , logEntries : List Entry
    , logLoading : Bool
    , refreshing : Bool
    , syncing : Bool
    , lastSync : Int
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
    , exemptStaff : String
    , origin : String
    }


type Msg
    = Tick Time.Posix
    | AutoRefresh
    | AppVisible Bool
    | RefreshNow
    | RefreshTimeout
    | AppActive
    | GotDayEntries String (Result Http.Error (List Entry))
    | GotMonthEntries (Result Http.Error (List Entry))
    | SelectLogMonth String
    | GotLogEntries String (Result Http.Error (List Entry))
    | SetZone Time.Zone
    | Navigate Page
    | OpenScanner
    | ArmScan
    | ScanWatchdog
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
    | ExportLogMonth
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


lateGrace : String
lateGrace =
    "09:30"


{-| The office ran a half-hour grace on the launch day. From the next morning the
grace is fifteen minutes: 09:15 is on time, 09:16 is late.
-}
lateGraceFrom : String
lateGraceFrom =
    "2026-11-13"


graceFor : String -> String
graceFor day =
    if day < lateGraceFrom then
        "09:30"

    else
        "09:15"


isLateOn : String -> Entry -> Bool
isLateOn day entry =
    entry.time > graceFor day


lateFine : Int
lateFine =
    2000


isLate : Entry -> Bool
isLate entry =
    isLateOn entry.date entry


{-| Owners and anyone else the office does not want watched are matched by name,
case-insensitively, so their arrivals never carry a Late tag or a fine.
-}
isExemptName : List String -> String -> Bool
isExemptName names name =
    let
        needle =
            String.toLower (String.trim name)
    in
    List.any (\entry -> String.contains (String.toLower (String.trim entry)) needle && String.trim entry /= "") names


isTracked : Model -> Worker -> Bool
isTracked model worker =
    not (isExemptName model.exemptStaff worker.name)


lateFor : Model -> Entry -> Bool
lateFor model entry =
    case workerById model entry.workerId of
        Just worker ->
            isTracked model worker && isLateOn entry.date entry

        Nothing ->
            isLateOn entry.date entry


lateCountFor : Model -> List Entry -> Int
lateCountFor model entries =
    List.length (List.filter (lateFor model) entries)


lateFinesFor : Model -> List Entry -> Int
lateFinesFor model entries =
    lateCountFor model entries * lateFine


{-| Minutes past that day's grace, for the admin record.
-}
lateMinutes : String -> Entry -> Int
lateMinutes day entry =
    let
        toMinutes clock =
            case String.split ":" clock |> List.filterMap String.toInt of
                hour :: minute :: _ ->
                    hour * 60 + minute

                _ ->
                    0
    in
    max 0 (toMinutes entry.time - toMinutes (graceFor day))


lateCount : List Entry -> Int
lateCount entries =
    List.length (List.filter isLate entries)


lateFineTotal : List Entry -> Int
lateFineTotal entries =
    lateCount entries * lateFine


formatNaira : Int -> String
formatNaira amount =
    let
        groups =
            amount
                |> String.fromInt
                |> String.reverse
                |> String.toList
                |> chunk 3
                |> List.map (String.fromList >> String.reverse)
                |> List.reverse
    in
    "₦" ++ String.join "," groups


chunk : Int -> List a -> List (List a)
chunk size items =
    if List.isEmpty items then
        []

    else
        List.take size items :: chunk size (List.drop size items)


pendingEntries : Model -> List Entry
pendingEntries model =
    List.filter (\entry -> not entry.synced) model.entries
