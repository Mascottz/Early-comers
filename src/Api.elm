module Api exposing (checkIn, createWorker, getState)

import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Types exposing (Entry, Msg(..), State, Worker)


getState : Cmd Msg
getState =
    Http.get
        { url = "/api/state"
        , expect = Http.expectJson GotState stateDecoder
        }


checkIn : Entry -> Cmd Msg
checkIn entry =
    Http.post
        { url = "/api/checkin"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "id", Encode.string entry.id )
                    , ( "worker_id", Encode.string entry.workerId )
                    , ( "occurred_at", Encode.int entry.timestamp )
                    , ( "source", Encode.string entry.source )
                    , ( "offline_id", Encode.string entry.id )
                    , ( "local_date", Encode.string entry.date )
                    , ( "local_time", Encode.string entry.time )
                    ]
        , expect = Http.expectJson (CheckInReceived entry.id) entryDecoder
        }


createWorker : String -> String -> Cmd Msg
createWorker name title =
    Http.post
        { url = "/api/workers"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "name", Encode.string name )
                    , ( "title", Encode.string title )
                    ]
        , expect = Http.expectJson WorkerCreated workerDecoder
        }


stateDecoder : Decoder State
stateDecoder =
    Decode.map3 State
        (Decode.field "workers" (Decode.list workerDecoder))
        (Decode.field "entries" (Decode.list entryDecoder))
        (Decode.field "officeCode" Decode.string)


workerDecoder : Decoder Worker
workerDecoder =
    Decode.map7 Worker
        (Decode.field "id" Decode.string)
        (Decode.field "name" Decode.string)
        (Decode.field "title" Decode.string)
        (Decode.field "initials" Decode.string)
        (Decode.field "color" Decode.string)
        (Decode.field "avatar" Decode.int)
        (Decode.field "active" Decode.bool)


entryDecoder : Decoder Entry
entryDecoder =
    Decode.map7 Entry
        (Decode.field "id" Decode.string)
        (Decode.field "workerId" Decode.string)
        (Decode.field "date" Decode.string)
        (Decode.field "time" Decode.string)
        (Decode.field "timestamp" Decode.int)
        (Decode.field "source" Decode.string)
        (Decode.field "synced" Decode.bool)
