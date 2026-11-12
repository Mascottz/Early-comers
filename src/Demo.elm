module Demo exposing (seedEntries, seedWorkers)

import Date
import Time
import Types exposing (Entry, Worker, parseDate)


seedWorkers : List Worker
seedWorkers =
    [ Worker "w1" "Amara Okafor" "Product Designer" "AO" "#e4774f" 1 True
    , Worker "w2" "Tobi Adeyemi" "Engineering" "TA" "#9aaf83" 2 True
    , Worker "w3" "Zainab Bello" "Operations" "ZB" "#d3a74e" 3 True
    , Worker "w4" "Kelechi Eze" "Engineering" "KE" "#809fa3" 4 True
    , Worker "w5" "Maya Nwosu" "People and Culture" "MN" "#bd8b83" 5 True
    , Worker "w6" "David Kalu" "Finance" "DK" "#8f9b70" 6 True
    , Worker "w7" "Sade Alabi" "Customer Experience" "SA" "#c1785d" 3 True
    , Worker "w8" "Femi Ojo" "Partnerships" "FO" "#7d9c8b" 2 True
    ]


seedEntries : String -> List Entry
seedEntries today =
    let
        schedule =
            [ ( "w2", "07:56" ), ( "w6", "08:04" ), ( "w3", "08:18" ), ( "w5", "08:27" ), ( "w4", "08:36" ), ( "w8", "08:51" ), ( "w7", "09:06" ), ( "w1", "09:47" ) ]

        makeEntry day ( workerId, clock ) =
            Entry ("seed-" ++ day ++ "-" ++ workerId) workerId day clock (timestamp day clock) "Office QR" True

        previous offset =
            let
                day =
                    Date.toIsoString <| Date.add Date.Days -offset <| parseDate today
            in
            List.map (makeEntry day) (List.take (if modBy 2 offset == 0 then 6 else 7) schedule)
                ++ (if modBy 2 offset == 1 then
                        [ makeEntry day ( "w1", "08:42" ) ]

                    else
                        []
                   )
    in
    List.map (makeEntry today) schedule
        ++ List.concatMap previous [ 1, 2, 3, 4, 5 ]


timestamp : String -> String -> Int
timestamp day clock =
    let
        parts =
            String.split ":" clock |> List.filterMap String.toInt

        hour =
            parts |> List.head |> Maybe.withDefault 8

        minute =
            parts |> List.drop 1 |> List.head |> Maybe.withDefault 0

        days =
            Date.toRataDie (parseDate day) - 719163
    in
    ((days * 24 + hour) * 60 + minute) * 60000
