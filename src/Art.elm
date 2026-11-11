module Art exposing (avatar, brandMark, orbitSketch, smallFlower)

import Html exposing (Html, div)
import Html.Attributes as HtmlAttr exposing (class, style)
import Svg exposing (circle, path, svg)
import Svg.Attributes as Attr
import Types exposing (Worker)


brandMark : Html msg
brandMark =
    svg [ Attr.viewBox "0 0 54 54", Attr.class "brand-mark", HtmlAttr.attribute "aria-hidden" "true" ]
        [ path [ Attr.d "M9 4C25-3 50 1 59 17c9 17 0 39-17 45C24 70 4 58 2 39 0 24 0 10 9 4Z", Attr.transform "scale(.82) translate(5 3)", Attr.fill "currentColor" ] []
        , path [ Attr.d "M17 28c0-12 9-20 19-18 11 2 16 12 11 22-5 11-17 16-26 9-5-4-5-8-4-13Z", Attr.fill "#ee784f" ] []
        , path [ Attr.d "m21 29 7 7 13-17", Attr.fill "none", Attr.stroke "#f5f1e8", Attr.strokeWidth "4.5", Attr.strokeLinecap "round", Attr.strokeLinejoin "round" ] []
        ]


avatar : Worker -> String -> Html msg
avatar worker size =
    let
        variant =
            modBy 6 worker.avatar

        skin =
            case variant of
                0 ->
                    "#7b4a35"

                1 ->
                    "#9a6244"

                2 ->
                    "#5e382c"

                3 ->
                    "#b87753"

                4 ->
                    "#75452f"

                _ ->
                    "#9b5f42"

        hair =
            case variant of
                3 ->
                    "#38251f"

                4 ->
                    "#211f1c"

                _ ->
                    "#29241f"

        shirt =
            case variant of
                0 ->
                    "#173f35"

                1 ->
                    "#f0c96b"

                2 ->
                    "#e9e1d1"

                3 ->
                    "#173f35"

                4 ->
                    "#c95f43"

                _ ->
                    "#e9e1d1"
    in
    div [ class ("avatar " ++ size), style "background-color" worker.color ]
        [ svg [ Attr.viewBox "0 0 80 80", HtmlAttr.attribute "aria-hidden" "true" ]
            [ path [ Attr.d "M9 80c2-20 14-28 31-28s29 8 31 28Z", Attr.fill shirt ] []
            , path [ Attr.d "M33 45h14v14H33Z", Attr.fill skin ] []
            , if variant == 2 || variant == 5 then
                path [ Attr.d "M20 34C18 12 29 6 42 7c15 1 23 13 19 32l-4 15-8-9H29l-8 9Z", Attr.fill hair ] []

              else
                path [ Attr.d "M22 32C18 16 28 6 41 7c14 1 22 10 19 27l-8-12c-8 5-16 6-27 4Z", Attr.fill hair ] []
            , path [ Attr.d "M24 29c0-13 8-20 17-20 12 0 19 9 18 22l-2 12c-2 10-10 15-17 15-9 0-16-7-17-17Z", Attr.fill skin ] []
            , path [ Attr.d "M24 31c7-1 15-5 20-12 3 6 8 9 14 11l-1-12-14-10-16 8Z", Attr.fill hair ] []
            , if variant == 1 || variant == 4 then
                path [ Attr.d "M21 24c-3-7 4-16 10-15 1-8 13-8 16-2 8-2 15 7 12 14 6 5 0 12-4 10l-7-11-15 8-8 3Z", Attr.fill hair ] []

              else
                Svg.text ""
            , circle [ Attr.cx "33", Attr.cy "35", Attr.r "1.3", Attr.fill "#2a231f" ] []
            , circle [ Attr.cx "48", Attr.cy "35", Attr.r "1.3", Attr.fill "#2a231f" ] []
            , path [ Attr.d "M35 45c4 3 8 3 11-1", Attr.fill "none", Attr.stroke "#4c2b25", Attr.strokeWidth "1.5", Attr.strokeLinecap "round" ] []
            , if variant == 4 then
                path [ Attr.d "M29 32h10m4 0h10M39 32h4", Attr.fill "none", Attr.stroke "#2b332f", Attr.strokeWidth "1.4" ] []

              else
                Svg.text ""
            ]
        ]


orbitSketch : Html msg
orbitSketch =
    svg [ Attr.viewBox "0 0 500 500", Attr.class "orbit-sketch", HtmlAttr.attribute "aria-hidden" "true" ]
        [ path [ Attr.d "M64 278C34 152 132 42 262 51c121 8 211 109 184 226-25 111-120 186-231 165C121 425 25 377 64 278Z", Attr.fill "none", Attr.stroke "currentColor", Attr.strokeWidth "1.2", Attr.strokeDasharray "2 11", Attr.strokeLinecap "round" ] []
        , path [ Attr.d "M112 104c23-24 51-39 79-49M384 397c22-18 39-38 51-61", Attr.fill "none", Attr.stroke "currentColor", Attr.strokeWidth "2", Attr.strokeLinecap "round" ] []
        , circle [ Attr.cx "97", Attr.cy "108", Attr.r "5", Attr.fill "#ee784f" ] []
        ]


smallFlower : Html msg
smallFlower =
    svg [ Attr.viewBox "0 0 60 60", Attr.class "small-flower", HtmlAttr.attribute "aria-hidden" "true" ]
        [ path [ Attr.d "M30 28C10 25 7 9 16 6c8-3 13 8 14 16 2-14 12-22 19-16 7 7-2 18-13 22 15-2 25 5 21 14-4 8-18 4-25-5-1 15-10 23-18 17-8-7 1-19 12-23-12 6-24 2-23-7 1-8 14-9 27-4Z", Attr.fill "none", Attr.stroke "currentColor", Attr.strokeWidth "1.5" ] []
        , circle [ Attr.cx "30", Attr.cy "29", Attr.r "3", Attr.fill "currentColor" ] []
        ]
