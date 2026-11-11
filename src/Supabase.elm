module Supabase exposing (..)

import Date
import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Time
import Types exposing (..)


sessionFromSaved : Maybe String -> Maybe Session
sessionFromSaved saved =
    saved
        |> Maybe.andThen (\value -> Decode.decodeString sessionDecoder value |> Result.toMaybe)


encodeSession : Session -> String
encodeSession session =
    Encode.encode 0 <|
        Encode.object
            [ ( "access_token", Encode.string session.accessToken )
            , ( "refresh_token", Encode.string session.refreshToken )
            , ( "expires_at", Encode.int session.expiresAt )
            , ( "user", Encode.object [ ( "id", Encode.string session.userId ), ( "email", Encode.string session.email ) ] )
            ]


sessionDecoder : Decoder Session
sessionDecoder =
    Decode.map5 Session
        (Decode.field "access_token" Decode.string)
        (Decode.field "refresh_token" Decode.string)
        (Decode.field "expires_at" Decode.int)
        (Decode.at [ "user", "id" ] Decode.string)
        (Decode.at [ "user", "email" ] Decode.string)


sendMagicLink : SupabaseConfig -> String -> String -> Cmd Msg
sendMagicLink config email redirectTo =
    Http.request
        { method = "POST"
        , headers = [ Http.header "apikey" config.key ]
        , url = config.url ++ "/auth/v1/otp"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "email", Encode.string email )
                    , ( "create_user", Encode.bool False )
                    , ( "options", Encode.object [ ( "email_redirect_to", Encode.string redirectTo ) ] )
                    ]
        , expect = Http.expectWhatever MagicLinkResult
        , timeout = Nothing
        , tracker = Nothing
        }


fetchUser : SupabaseConfig -> Session -> Cmd Msg
fetchUser config session =
    Http.request
        { method = "GET"
        , headers = authHeaders config session
        , url = config.url ++ "/auth/v1/user"
        , body = Http.emptyBody
        , expect = Http.expectJson AuthUserReceived authUserDecoder
        , timeout = Nothing
        , tracker = Nothing
        }


authUserDecoder : Decoder AuthUser
authUserDecoder =
    Decode.map2 AuthUser
        (Decode.field "id" Decode.string)
        (Decode.field "email" Decode.string)


refreshSession : SupabaseConfig -> Session -> Int -> Cmd Msg
refreshSession config session nowSeconds =
    Http.request
        { method = "POST"
        , headers = [ Http.header "apikey" config.key ]
        , url = config.url ++ "/auth/v1/token?grant_type=refresh_token"
        , body = Http.jsonBody <| Encode.object [ ( "refresh_token", Encode.string session.refreshToken ) ]
        , expect = Http.expectJson SessionRefreshed (refreshDecoder nowSeconds)
        , timeout = Nothing
        , tracker = Nothing
        }


refreshDecoder : Int -> Decoder Session
refreshDecoder nowSeconds =
    Decode.map5 Session
        (Decode.field "access_token" Decode.string)
        (Decode.field "refresh_token" Decode.string)
        (Decode.field "expires_in" Decode.int |> Decode.map (\expires -> nowSeconds + expires))
        (Decode.at [ "user", "id" ] Decode.string)
        (Decode.at [ "user", "email" ] Decode.string)


getWorkers : SupabaseConfig -> Session -> Cmd Msg
getWorkers config session =
    Http.request
        { method = "GET"
        , headers = authHeaders config session
        , url = config.url ++ "/rest/v1/staff_profiles?select=id,nickname,title,initials,color,avatar,active&active=eq.true&order=nickname.asc"
        , body = Http.emptyBody
        , expect = Http.expectJson GotCloudWorkers (Decode.list workerDecoder)
        , timeout = Nothing
        , tracker = Nothing
        }


workerDecoder : Decoder Worker
workerDecoder =
    Decode.map7 Worker
        (Decode.field "id" Decode.string)
        (Decode.field "nickname" Decode.string)
        (Decode.field "title" Decode.string)
        (Decode.field "initials" Decode.string)
        (Decode.field "color" Decode.string)
        (Decode.field "avatar" Decode.int)
        (Decode.field "active" Decode.bool)


getEntries : SupabaseConfig -> Session -> Cmd Msg
getEntries config session =
    Http.request
        { method = "GET"
        , headers = authHeaders config session
        , url = config.url ++ "/rest/v1/attendance_entries?select=id,worker_id,occurred_at,local_date,local_time,source&order=occurred_at.desc&limit=1500"
        , body = Http.emptyBody
        , expect = Http.expectJson GotCloudEntries (Decode.list entryDecoder)
        , timeout = Nothing
        , tracker = Nothing
        }


entryDecoder : Decoder Entry
entryDecoder =
    Decode.map7 Entry
        (Decode.field "id" Decode.string)
        (Decode.field "worker_id" Decode.string)
        (Decode.field "local_date" Decode.string)
        (Decode.field "local_time" Decode.string |> Decode.map (String.left 5))
        (Decode.map2 timestampFromParts (Decode.field "local_date" Decode.string) (Decode.field "local_time" Decode.string))
        (Decode.field "source" Decode.string)
        (Decode.succeed True)


timestampFromParts : String -> String -> Int
timestampFromParts day clock =
    let
        date =
            Date.fromIsoString day |> Result.withDefault (Date.fromCalendarDate 2026 Time.Nov 11)

        parts =
            String.split ":" clock |> List.filterMap String.toInt

        hour =
            parts |> List.head |> Maybe.withDefault 8

        minute =
            parts |> List.drop 1 |> List.head |> Maybe.withDefault 0
    in
    (((Date.toRataDie date - 719163) * 24 + hour) * 60 + minute) * 60000


getAdminStatus : SupabaseConfig -> Session -> Cmd Msg
getAdminStatus config session =
    Http.request
        { method = "POST"
        , headers = authHeaders config session
        , url = config.url ++ "/rest/v1/rpc/is_admin"
        , body = Http.jsonBody (Encode.object [])
        , expect = Http.expectJson GotAdminStatus Decode.bool
        , timeout = Nothing
        , tracker = Nothing
        }


checkIn : SupabaseConfig -> Session -> Entry -> Cmd Msg
checkIn config session entry =
    Http.request
        { method = "POST"
        , headers = Http.header "Prefer" "resolution=ignore-duplicates,return=representation" :: authHeaders config session
        , url = config.url ++ "/rest/v1/attendance_entries?on_conflict=worker_id,local_date"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "id", Encode.string entry.id )
                    , ( "worker_id", Encode.string entry.workerId )
                    , ( "occurred_at", Encode.string (posixToIso entry.timestamp) )
                    , ( "local_date", Encode.string entry.date )
                    , ( "local_time", Encode.string (entry.time ++ ":00") )
                    , ( "source", Encode.string entry.source )
                    ]
        , expect = Http.expectJson (CloudCheckInReceived entry.id) (Decode.list entryDecoder)
        , timeout = Nothing
        , tracker = Nothing
        }


posixToIso : Int -> String
posixToIso timestamp =
    let
        posix =
            Time.millisToPosix timestamp
    in
    Date.toIsoString (Date.fromPosix Time.utc posix)
        ++ "T"
        ++ pad (Time.toHour Time.utc posix)
        ++ ":"
        ++ pad (Time.toMinute Time.utc posix)
        ++ ":"
        ++ pad (Time.toSecond Time.utc posix)
        ++ "Z"


pad : Int -> String
pad value =
    String.padLeft 2 '0' (String.fromInt value)


inviteWorker : SupabaseConfig -> Session -> String -> String -> String -> String -> Cmd Msg
inviteWorker config session fullName email nickname title =
    Http.request
        { method = "POST"
        , headers = authHeaders config session
        , url = config.url ++ "/functions/v1/invite-staff"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "full_name", Encode.string (String.trim fullName) )
                    , ( "email", Encode.string (String.toLower (String.trim email)) )
                    , ( "nickname", Encode.string (String.trim nickname) )
                    , ( "title", Encode.string (String.trim title) )
                    ]
        , expect = Http.expectJson WorkerCreated workerDecoder
        , timeout = Nothing
        , tracker = Nothing
        }


authHeaders : SupabaseConfig -> Session -> List Http.Header
authHeaders config session =
    [ Http.header "apikey" config.key
    , Http.header "Authorization" ("Bearer " ++ session.accessToken)
    ]
