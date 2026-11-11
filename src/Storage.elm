module Storage exposing (applySaved, encodeModel)

import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Types exposing (Entry, Model, Role(..), Worker)


encodeModel : Model -> String
encodeModel model =
    Encode.encode 0 <|
        Encode.object
            [ ( "version", Encode.int 1 )
            , ( "role", Encode.string (roleToString model.role) )
            , ( "currentWorkerId", Encode.string model.currentWorkerId )
            , ( "workers", Encode.list encodeWorker model.workers )
            , ( "entries", Encode.list encodeEntry model.entries )
            , ( "officeCode", Encode.string model.officeCode )
            ]


encodeWorker : Worker -> Encode.Value
encodeWorker worker =
    Encode.object
        [ ( "id", Encode.string worker.id )
        , ( "name", Encode.string worker.name )
        , ( "title", Encode.string worker.title )
        , ( "initials", Encode.string worker.initials )
        , ( "color", Encode.string worker.color )
        , ( "avatar", Encode.int worker.avatar )
        , ( "active", Encode.bool worker.active )
        ]


encodeEntry : Entry -> Encode.Value
encodeEntry entry =
    Encode.object
        [ ( "id", Encode.string entry.id )
        , ( "workerId", Encode.string entry.workerId )
        , ( "date", Encode.string entry.date )
        , ( "time", Encode.string entry.time )
        , ( "timestamp", Encode.int entry.timestamp )
        , ( "source", Encode.string entry.source )
        , ( "synced", Encode.bool entry.synced )
        ]


type alias Saved =
    { role : Role
    , currentWorkerId : String
    , workers : List Worker
    , entries : List Entry
    , officeCode : String
    }


applySaved : Maybe String -> Model -> Model
applySaved saved model =
    case Maybe.andThen (\value -> Decode.decodeString savedDecoder value |> Result.toMaybe) saved of
        Just data ->
            { model
                | currentWorkerId = data.currentWorkerId
                , workers = if List.isEmpty data.workers then model.workers else data.workers
                , entries = if List.isEmpty data.entries then model.entries else data.entries
                , officeCode = data.officeCode
            }

        Nothing ->
            model


savedDecoder : Decoder Saved
savedDecoder =
    Decode.map5 Saved
        (Decode.field "role" roleDecoder)
        (Decode.field "currentWorkerId" Decode.string)
        (Decode.field "workers" (Decode.list workerDecoder))
        (Decode.field "entries" (Decode.list entryDecoder))
        (Decode.field "officeCode" Decode.string)


roleDecoder : Decoder Role
roleDecoder =
    Decode.string
        |> Decode.map
            (\value ->
                if value == "admin" then
                    AdminView

                else
                    WorkerView
            )


roleToString : Role -> String
roleToString role =
    case role of
        AdminView ->
            "admin"

        WorkerView ->
            "worker"


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
