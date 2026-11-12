module View exposing (view)

import Art exposing (avatar, brandMark, orbitSketch, smallFlower)
import Date
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput, preventDefaultOn)
import Json.Decode as Decode
import Time
import Types exposing (..)


view : Model -> Html Msg
view model =
    case ( model.supabase, model.authStatus ) of
        ( Just _, SignedOut ) ->
            authView model

        ( Just _, SigningIn ) ->
            authView model

        ( Just _, RestoringSession ) ->
            authLoading

        _ ->
            div [ class "app-shell" ]
                [ connectionLine model
                , appHeader model
                , main_ [ class "main-content" ] [ pageView model ]
                , mobileNav model
                , scannerView model
                , installView model
                , addWorkerView model
                , inviteLinkView model
                , toastView model.toast
                ]


authLoading : Html Msg
authLoading =
    div [ class "auth-loading" ]
        [ div [ class "auth-brand" ] [ brandMark, strong [] [ text "attendance" ], small [] [ text "by ProofsTech" ] ]
        , p [] [ text "Opening your workspace…" ]
        , span [ class "loading-line" ] []
        ]


authTop : Html Msg
authTop =
    div [ class "auth-top" ]
        [ div [ class "auth-brand" ] [ brandMark, strong [] [ text "attendance" ], small [] [ text "by ProofsTech" ] ]
        , span [] [ text "ABUJA, NIGERIA" ]
        ]


authArt : Html Msg
authArt =
    div [ class "auth-art" ]
        [ orbitSketch
        , div [ class "auth-blob" ]
            [ smallFlower
            , h2 [] [ text "Show up.", br [] [], em [] [ text "Belong." ] ]
            , p [] [ text "One shared morning for the people who make ProofsTech." ]
            ]
        , div [ class "aka-note" ] [ text "IB China, Merciful, FundsTech, Mascott, MD, ProofsTech" ]
        ]


authView : Model -> Html Msg
authView model =
    div [ class "auth-page" ]
        [ authTop
        , div [ class "auth-layout" ]
            [ div [ class "auth-copy" ]
                [ p [ class "eyebrow" ] [ text "YOUR PLACE ON THE TEAM" ]
                , h1 [] [ text "Your workday", br [] [], text "starts with ", em [] [ text "you." ] ]
                , p [ class "auth-intro" ] [ text "Sign in with the Gmail address on your staff profile, the ProofsTech team password, and your own six-digit PIN." ]
                , Html.form [ class "auth-form", onSubmitForm SignIn ]
                    [ label [ for "staff-email" ] [ text "APPROVED EMAIL" ]
                    , input
                        [ id "staff-email"
                        , type_ "email"
                        , value model.authEmail
                        , onInput SetAuthEmail
                        , placeholder "you@gmail.com"
                        , attribute "autocomplete" "email"
                        , attribute "inputmode" "email"
                        , autofocus (model.authStatus == SignedOut)
                        ]
                        []
                    , div [ class "field-head" ]
                        [ label [ for "staff-password" ] [ text "TEAM PASSWORD" ]
                        , button
                            [ class "field-toggle"
                            , type_ "button"
                            , onClick ToggleAuthPassword
                            , attribute "aria-controls" "staff-password"
                            , attribute "aria-pressed" (boolString model.showAuthPassword)
                            ]
                            [ text (if model.showAuthPassword then "Hide password" else "Show password") ]
                        ]
                    , input
                        [ id "staff-password"
                        , type_ (if model.showAuthPassword then "text" else "password")
                        , value model.authPassword
                        , onInput SetAuthPassword
                        , placeholder "Shared by ProofsTech"
                        , attribute "autocomplete" "current-password"
                        ]
                        []
                    , div [ class "field-head" ]
                        [ label [ for "staff-pin" ] [ text "YOUR SIX-DIGIT PIN" ]
                        , button
                            [ class "field-toggle"
                            , type_ "button"
                            , onClick ToggleAuthPin
                            , attribute "aria-controls" "staff-pin"
                            , attribute "aria-pressed" (boolString model.showAuthPin)
                            ]
                            [ text (if model.showAuthPin then "Hide PIN" else "Show PIN") ]
                        ]
                    , input
                        [ id "staff-pin"
                        , class "pin-input"
                        , type_ (if model.showAuthPin then "text" else "password")
                        , value model.authPin
                        , onInput SetAuthPin
                        , placeholder "••••••"
                        , attribute "inputmode" "numeric"
                        , attribute "maxlength" "6"
                        , attribute "pattern" "[0-9]{6}"
                        , attribute "autocomplete" "off"
                        ]
                        []
                    , if model.authMessage /= "" then
                        p [ class "form-error" ] [ text model.authMessage ]

                      else
                        text ""
                    , button
                        [ class "organic-button primary-button compact"
                        , type_ "submit"
                        , disabled (model.authStatus == SigningIn)
                        ]
                        [ text
                            (if model.authStatus == SigningIn then
                                "Opening your session…"

                             else
                                "Sign in "
                            )
                        , span [ class "arrow-mark" ] []
                        ]
                    ]
                , p [ class "auth-firsttime" ] [ text "First time here? The six digits you enter become your PIN. After that, the same email, team password, and PIN open your workspace." ]
                , p [ class "auth-privacy" ] [ text "Only approved staff emails can sign in. Admin access comes from your verified email, never a setting on your phone." ]
                ]
            , authArt
            ]
        , div [ class "auth-footer" ] [ text "Simple attendance, even on no data days." ]
        ]


boolString : Bool -> String
boolString value =
    if value then
        "true"

    else
        "false"


connectionLine : Model -> Html Msg
connectionLine model =
    if model.online then
        div [ class "connection-line online-line" ]
            [ span [ class "connection-dot" ] []
            , text
                (if List.isEmpty (pendingEntries model) then
                    "Connected, everything is in step"

                 else
                    "Connected, syncing your saved time"
                )
            , if syncAge model == "" || model.authStatus /= Authenticated then
                text ""

              else
                span [ class "sync-stamp" ] [ text (" · " ++ syncAge model) ]
            
            ]

    else
        div [ class "connection-line offline-line" ]
            [ span [ class "connection-dot" ] []
            , text "You’re offline. Check in anyway, we’ll keep your time safe."
            ]


appHeader : Model -> Html Msg
appHeader model =
    header [ class "app-header" ]
        [ button [ class "brand", onClick (Navigate Home), attribute "aria-label" "Attendance home" ]
            [ brandMark
            , span [ class "brand-words" ]
                [ strong [] [ text "attendance" ]
                , small [] [ text "by ProofsTech" ]
                ]
            ]
        , nav [ class "desktop-nav", attribute "aria-label" "Main navigation" ]
            [ navItem model Home "Today"
            , navItem model Wall "Daily wall"
            , button
                [ class "nav-link nav-scan-link"
                , onClick OpenScanner
                , attribute "aria-label" "Scan the office QR"
                ]
                [ text "Scan" ]
            , navItem model Team "Team"
            , if model.role == AdminView then
                navItem model Office "Office QR"

              else
                text ""
            ]
        , button [ class "profile-trigger", onClick (Navigate Profile) ]
            [ div [ class "profile-copy" ]
                [ strong [] [ text (firstName (currentWorker model).name) ]
                , small [] [ text (if model.role == AdminView then "Admin view" else "Worker view") ]
                ]
            , avatar (currentWorker model) "avatar-small"
            ]
        ]


navItem : Model -> Page -> String -> Html Msg
navItem model destination label =
    button
        [ class (if model.page == destination then "nav-link active" else "nav-link")
        , onClick (Navigate destination)
        ]
        [ text label ]


mobileNav : Model -> Html Msg
mobileNav model =
    nav [ class "mobile-nav", attribute "aria-label" "Mobile navigation" ]
        [ mobileNavItem model Home "Today"
        , mobileNavItem model Wall "Wall"
        , button [ class "mobile-scan", onClick OpenScanner ] [ span [] [ text "Scan" ], small [] [ text "office QR" ] ]
        , mobileNavItem model Team "Team"
        , mobileNavItem model Profile "You"
        ]


mobileNavItem : Model -> Page -> String -> Html Msg
mobileNavItem model destination label =
    button [ class (if model.page == destination then "mobile-nav-item active" else "mobile-nav-item"), onClick (Navigate destination) ]
        [ span [ class "mobile-active-dot" ] [], text label ]


pageView : Model -> Html Msg
pageView model =
    case model.page of
        Home ->
            homeView model

        Wall ->
            wallView model

        Team ->
            teamView model

        Office ->
            officeView model

        Profile ->
            profileView model


homeView : Model -> Html Msg
homeView model =
    let
        worker =
            currentWorker model

        ownEntry =
            entryFor model worker.id model.today

        arrivals =
            entriesForDate model model.today
    in
    div [ class "page home-page" ]
        [ div [ class "home-hero" ]
            [ div [ class "hero-copy" ]
                [ p [ class "eyebrow" ] [ text (String.toUpper (formatLongDate model.today)) ]
                , h1 []
                    [ text (greeting model ++ ",")
                    , br [] []
                    , em [] [ text (firstName worker.name ++ ".") ]
                    ]
                , p [ class "hero-intro" ]
                    [ text
                        (if model.role == AdminView then
                            "The office is finding its rhythm. Here’s everyone’s morning, all in one calm place."

                         else
                            "A fresh day, a clean slate. Your arrival takes just one little scan."
                        )
                    ]
                , div [ class "hero-actions" ]
                    [ if model.role == AdminView then
                        button [ class "organic-button primary-button", onClick (Navigate Office) ] [ text "Office QR ", span [ class "arrow-mark" ] [] ]

                      else
                        case ownEntry of
                            Just _ ->
                                button [ class "organic-button primary-button", onClick (Navigate Wall) ] [ text "See today’s wall ", span [ class "arrow-mark" ] [] ]

                            Nothing ->
                                button [ class "organic-button primary-button", onClick OpenScanner ] [ text "Scan to check in ", span [ class "arrow-mark" ] [] ]
                    , if model.role == AdminView then
                        if model.supabase /= Nothing then
                            button [ class "text-action", onClick ExportRecords ] [ text "Export records" ]

                          else
                            a [ class "text-action", href "/api/export.csv" ] [ text "Export records" ]

                      else
                        button [ class "text-action", onClick (Navigate Profile) ] [ text "How offline works" ]
                    ]
                ]
            , div [ class "arrival-art" ]
                [ orbitSketch
                , div [ class "time-blob" ]
                    [ p [ class "time-caption" ]
                        [ text (if ownEntry == Nothing then "RIGHT HERE, RIGHT NOW" else "YOUR ARRIVAL")
                        , case ownEntry of
                            Just entry ->
                                if isLate entry then
                                    lateTag

                                else
                                    text ""

                            Nothing ->
                                text ""
                        ]
                    , div [ class "big-clock" ] [ text (Maybe.map .time ownEntry |> Maybe.withDefault (formatClock model.zone model.now)) ]
                    , div [ class "clock-rule" ] []
                    , p [ class "arrival-note" ]
                        [ text
                            (case ownEntry of
                                Just entry ->
                                    (if entry.synced then "On the wall" else "Saved on this phone") ++ ". Have a good one."

                                Nothing ->
                                    "Ready when you are. No data needed."
                            )
                        ]
                    ]
                , div [ class "hand-note" ] [ smallFlower, span [] [ text "show up,\nas you are" ] ]
                ]
            ]
        , div [ class "home-lower" ]
            [ div [ class "wall-preview" ]
                [ sectionHeading "The daily wall" (String.fromInt (List.length arrivals) ++ " arrivals, and counting")
                , dateRibbon model
                , entryList model (List.take 5 arrivals)
                , button [ class "underlined-action", onClick (Navigate Wall) ] [ text "See the whole day ", span [ class "arrow-mark" ] [] ]
                ]
            , daySummary model arrivals
            ]
        ]


daySummary : Model -> List Entry -> Html Msg
daySummary model arrivals =
    let
        total =
            List.length model.workers

        arrived =
            List.length arrivals

        earliest =
            List.head arrivals

        onTime =
            List.filter (not << isLate) arrivals |> List.length

        percentage =
            if total == 0 then
                0

            else
                toFloat arrived / toFloat total * 360
    in
    aside [ class "day-summary" ]
        [ div [ class "summary-top" ]
            [ p [ class "eyebrow" ] [ text "TODAY IN NUMBERS" ]
            , div
                [ class "arrival-ring"
                , style "background" ("conic-gradient(#ee784f 0deg, #ee784f " ++ String.fromFloat percentage ++ "deg, #dcd8cc " ++ String.fromFloat percentage ++ "deg, #dcd8cc 360deg)")
                ]
                [ div [ class "ring-center" ]
                    [ strong [] [ text (String.fromInt arrived ++ "/" ++ String.fromInt total) ]
                    , small [] [ text "are here" ]
                    ]
                ]
            ]
        , h3 [] [ text "A good start,\ntogether." ]
        , div [ class "stat-line" ]
            [ span [] [ text "Earliest arrival" ]
            , strong [] [ text (Maybe.map .time earliest |> Maybe.withDefault "Still quiet") ]
            ]
        , div [ class "stat-line" ]
            [ span [] [ text "On time" ]
            , strong [] [ text (String.fromInt onTime ++ " people") ]
            ]
        , div [ class "stat-line" ]
            [ span [] [ text "Late" ]
            , strong [] [ text (String.fromInt (lateCount arrivals) ++ " · " ++ formatNaira (lateFineTotal arrivals)) ]
            ]
        , div [ class "stat-line" ]
            [ span [] [ text "Saved offline" ]
            , strong [] [ text (String.fromInt (List.length (pendingEntries model)) ++ " records") ]
            ]
        , p [ class "summary-footnote" ] [ text ("Grace ends at " ++ lateGrace ++ ". Every late arrival carries a " ++ formatNaira lateFine ++ " fine.") ]
        ]


sectionHeading : String -> String -> Html Msg
sectionHeading title subtitle =
    div [ class "section-heading" ]
        [ div [] [ h2 [] [ text title ], p [] [ text subtitle ] ]
        , span [ class "heading-line" ] []
        ]


dateRibbon : Model -> Html Msg
dateRibbon model =
    div [ class "date-ribbon", attribute "aria-label" "Choose attendance date" ]
        (List.map (dateButton model) (recentDates model.today))


dateButton : Model -> String -> Html Msg
dateButton model day =
    let
        parsed =
            parseDate day
    in
    button
        [ class (if model.selectedDate == day then "date-choice selected" else "date-choice")
        , onClick (SelectDate day)
        ]
        [ small [] [ text (Date.format "EEE" parsed) ]
        , strong [] [ text (Date.format "dd" parsed) ]
        ]





latePerson : Model -> Entry -> Html Msg
latePerson model entry =
    let
        name =
            workerById model entry.workerId
                |> Maybe.map .name
                |> Maybe.withDefault "Someone"
    in
    span [ class "wall-late-person" ]
        [ span [ class "wall-late-time" ] [ text entry.time ]
        , text name
        ]


lateTag : Html Msg
lateTag =
    span [ class "late-tag", attribute "title" ("Arrived after " ++ lateGrace ++ " — late for the day") ]
        [ text "Late" ]


syncAge : Model -> String
syncAge model =
    let
        seconds =
            (Time.posixToMillis model.now - model.lastSync) // 1000
    in
    if model.lastSync <= 0 then
        ""

    else if seconds <= 5 then
        "updated just now"

    else if seconds < 60 then
        "updated " ++ String.fromInt seconds ++ "s ago"

    else
        "updated " ++ String.fromInt (seconds // 60) ++ " min ago"


entryList : Model -> List Entry -> Html Msg
entryList model entries =
    if List.isEmpty entries then
        div [ class "empty-wall" ]
            [ smallFlower
            , h3 [] [ text "The day is still quiet." ]
            , p [] [ text "The first arrival will make its mark right here." ]
            ]

    else
        div [ class "entry-list" ] (List.map (entryRow model) entries)


entryRow : Model -> Entry -> Html Msg
entryRow model entry =
    case workerById model entry.workerId of
        Nothing ->
            text ""

        Just worker ->
            div [ class (if worker.id == model.currentWorkerId then "entry-row own-entry" else "entry-row") ]
                [ avatar worker "avatar-medium"
                , div [ class "entry-person" ]
                    [ div [ class "entry-name-row" ]
                        [ strong [] [ text worker.name ]
                        , if isLate entry then
                            lateTag

                          else
                            text ""
                        ]
                    , small [] [ text worker.title ]
                    ]
                , div [ class "entry-source" ]
                    [ small [] [ text (if entry.synced then entry.source else "Waiting to sync") ]
                    , span [ class (if isLate entry then "timing-note late" else "timing-note") ]
                        [ text
                            (if isLate entry then
                                "Late · " ++ formatNaira lateFine

                             else
                                "On time"
                            )
                        ]
                    ]
                , time [ class "entry-time" ] [ text entry.time ]
                ]


wallView : Model -> Html Msg
wallView model =
    let
        entries =
            entriesForDate model model.selectedDate

        workersPresent =
            entries |> List.map .workerId |> unique |> List.length
    in
    div [ class "page wall-page" ]
        [ div [ class "page-title-row" ]
            [ div []
                [ p [ class "eyebrow" ] [ text "EVERY ARRIVAL, ONE SHARED RHYTHM" ]
                , h1 [] [ text "The daily ", em [] [ text "wall." ] ]
                , p [] [ text "A clear record of who came in, and when." ]
                ]
            , if model.role == AdminView then
                if model.supabase /= Nothing then
                    button [ class "organic-button secondary-button", onClick ExportRecords ] [ text "Export CSV" ]

                  else
                    a [ class "organic-button secondary-button", href "/api/export.csv" ] [ text "Export CSV" ]

              else
                text ""
            ]
        , dateRibbon model
        , div [ class "wall-layout" ]
            [ div []
                [ div [ class "wall-date-label" ]
                    [ h2 [] [ text (relativeDate model.today model.selectedDate) ]
                    , span [] [ text (formatLongDate model.selectedDate) ]
                    ]
                , entryList model entries
                ]
            , aside [ class "wall-aside" ]
                [ p [ class "eyebrow" ] [ text "THE DAY SO FAR" ]
                , strong [ class "oversized-number" ] [ text (String.fromInt workersPresent) ]
                , h3 [] [ text (if workersPresent == 1 then "person showed up." else "people showed up.") ]
                , p [] [ text "Not a leaderboard. Just a truthful little record of being here, together." ]
                , div [ class "wall-late-block" ]
                    [ p [ class "eyebrow" ] [ text "LATE TODAY" ]
                    , if List.isEmpty (List.filter isLate entries) then
                        p [ class "wall-late-none" ] [ text ("Nobody yet. Grace ends at " ++ lateGrace ++ ".") ]

                      else
                        div [ class "wall-late-people" ]
                            (List.map (latePerson model) (List.filter isLate entries))
                    , p [ class "wall-fines" ] [ text ("Late fines: " ++ formatNaira (lateFineTotal entries)) ]
                    ]
                , div [ class "handwritten-line" ] [ text "Every day has its own shape." ]
                ]
            ]
        ]


teamView : Model -> Html Msg
teamView model =
    div [ class "page team-page" ]
        [ div [ class "page-title-row" ]
            [ div []
                [ p [ class "eyebrow" ] [ text "THE PEOPLE BEHIND THE TIMES" ]
                , h1 [] [ text "Your workday ", em [] [ text "people." ] ]
                , p [] [ text (String.fromInt (List.length model.workers) ++ " people, one place to start the day.") ]
                ]
            , if model.role == AdminView then
                button [ class "organic-button primary-button compact", onClick OpenAddWorker ] [ text "Add a worker ", span [] [ text "+" ] ]

              else
                text ""
            ]
        , div [ class "team-directory" ] (List.map (teamMember model) model.workers)
        ]


teamMember : Model -> Worker -> Html Msg
teamMember model worker =
    let
        arrival =
            entryFor model worker.id model.today
    in
    div [ class "team-member" ]
        [ avatar worker "avatar-large"
        , div [ class "team-member-name" ]
            [ h3 [] [ text worker.name ]
            , p [] [ text worker.title ]
            ]
        , div [ class "team-arrival" ]
            [ small [] [ text "TODAY" ]
            , strong [] [ text (Maybe.map .time arrival |> Maybe.withDefault "Not in yet") ]
            , case arrival of
                Just entry ->
                    if isLate entry then
                        lateTag

                    else
                        text ""

                Nothing ->
                    text "" 
            , if model.role == AdminView then
                button [ class "invite-link-action", onClick (PrepareInviteLink worker) ] [ text "Prepare link" ]

              else
                text ""
            ]
        ]


officeView : Model -> Html Msg
officeView model =
    div [ class "page office-page" ]
        [ div [ class "office-copy" ]
            [ p [ class "eyebrow" ] [ text "PROOFSTECH HQ, ABUJA" ]
            , h1 [] [ text "One scan.", br [] [], em [] [ text "Every arrival." ] ]
            , p [ class "office-intro" ] [ text "Print today's pass each morning and place it at the entrance. It stops working at midnight." ]
            , div [ class "office-steps" ]
                [ div [] [ strong [] [ text "01" ], p [] [ text "Print today's QR and put it at the entrance." ] ]
                , div [] [ strong [] [ text "02" ], p [] [ text "We record the person and their arrival time." ] ]
                , div [] [ strong [] [ text "03" ], p [] [ text "Their place on the daily wall appears." ] ]
                ]
            ]
        , div [ class "qr-studio" ]
            [ div [ class "qr-shape" ]
                [ img
                    [ src ("/api/qr.svg?day=" ++ model.today)
                    , alt ("ProofsTech office QR for " ++ formatLongDate model.today)
                    , class "office-qr"
                    ]
                    []
                , div [ class "qr-brand" ] [ brandMark, strong [] [ text "attendance" ] ]
                , span [ class "qr-shape-day" ] [ text (String.toUpper (formatShortDate model.today) ++ " · TODAY ONLY") ]
                ]
            , p [ class "qr-day" ] [ text ("Valid today only · " ++ formatLongDate model.today) ]
            , p [] [ text "Point, scan, start your day." ]
            , div [ class "qr-actions" ]
                [ button [ class "organic-button primary-button compact", onClick PrintQr ] [ text "Print QR" ]
                , button [ class "text-action", onClick DownloadQr ] [ text "Download" ]
                ]
            ]
        ]


profileView : Model -> Html Msg
profileView model =
    let
        worker =
            currentWorker model
    in
    div [ class "page profile-page" ]
        [ div [ class "profile-identity" ]
            [ avatar worker "avatar-profile"
            , p [ class "eyebrow" ] [ text "YOUR PLACE AT PROOFSTECH" ]
            , h1 [] [ styledProfileName worker.name ]
            , p [] [ text worker.title ]
            , case model.session of
                Just session ->
                    small [ class "profile-email" ] [ text session.email ]

                Nothing ->
                    text ""
            ]
        , div [ class "profile-settings" ]
            [ div [ class "setting-group" ]
                [ p [ class "eyebrow" ] [ text "WORKSPACE" ]
                , h2 [] [ text "Access that belongs to you." ]
                , div [ class "assigned-access" ]
                    [ span [ class "role-marker assigned" ] []
                    , div []
                        [ strong [] [ text (if model.role == AdminView then "Admin access" else "Worker access") ]
                        , p [] [ text "Your role is assigned by ProofsTech through your approved work email. It cannot be changed from this device." ]
                        ]
                    ]
                ]
            , div [ class "offline-explainer" ]
                [ smallFlower
                , p [ class "eyebrow" ] [ text "BUILT FOR NO DATA DAYS" ]
                , h2 [] [ text "Your morning doesn’t wait for a signal." ]
                , p [] [ text "Attendance lives on your phone too. Check in offline and we’ll keep the exact time safe until the app can reach the office again." ]
                , button [ class "organic-button light-button compact", onClick ToggleInstall ] [ text "Install on this iPhone" ]
                ]
            , div [ class "setting-group small-settings" ]
                [ div [ class "stat-line" ] [ span [] [ text "Records waiting to sync" ], strong [] [ text (String.fromInt (List.length (pendingEntries model))) ] ]
                , div [ class "stat-line" ] [ span [] [ text "Storage" ], strong [] [ text "On this device" ] ]
                , div [ class "stat-line" ] [ span [] [ text "App version" ], strong [] [ text "1.2" ] ]
                ]
            , if model.session /= Nothing then
                button [ class "underlined-action signout-action", onClick SignOut ] [ text "Sign out on this device" ]

              else
                text ""
            ]
        ]


scannerView : Model -> Html Msg
scannerView model =
    if model.scanStatus == ScanClosed then
        text ""

    else
        div [ class "overlay scanner-overlay", attribute "role" "dialog", attribute "aria-modal" "true", attribute "aria-label" "Scan office QR" ]
            [ div [ class "scanner-panel" ]
                [ div [ class "modal-heading" ]
                    [ div [] [ p [ class "eyebrow" ] [ text "PROOFSTECH HQ" ], h2 [] [ text "Find the office QR." ] ]
                    , button [ class "close-action", onClick CloseScanner ] [ text "Close" ]
                    ]
                , if model.scanStatus == ScanBlocked then
                    blockedScanner model

                  else
                    div [ class "camera-view" ]
                        [ div [ class "camera-organic" ]
                            [ div [ id "camera-surface" ] []
                            , scanFrame model
                            , div [ class "camera-caption" ] [ text (scanCaption model) ]
                            ]
                        , scanControls model
                        , p [ class "privacy-note" ] [ text "Check-in uses the printed office QR only. The scan happens on your phone, and no camera footage is saved." ]
                        ]
                , div [ class "scanner-offline-note" ]
                    [ span [ class "connection-dot" ] []
                    , text (if model.online then "Connected. Your wall will update right away." else "Offline. Your exact arrival time will still be saved.")
                    ]
                ]
            ]


scanFrame : Model -> Html Msg
scanFrame model =
    div
        [ class "scan-frame"
        , classList [ ( "is-armed", model.scanStatus == ScanArmed ) ]
        , attribute "data-scan-frame" ""
        , attribute "aria-hidden" "true"
        ]
        [ span [ class "scan-corner tl" ] []
        , span [ class "scan-corner tr" ] []
        , span [ class "scan-corner bl" ] []
        , span [ class "scan-corner br" ] []
        , div [ class "scan-beam" ] []
        ]


scanCaption : Model -> String
scanCaption model =
    if model.scanStatus == ScanRequesting then
        "Waking up the camera. If nothing happens, tap the button again."

    else if model.scanStatus == ScanArmed then
        "Looking for the pass…"

    else
        "Fit the whole pass inside the box, then tap Scan"


scanControls : Model -> Html Msg
scanControls model =
    div [ class "scan-controls" ]
        [ button
            [ class "organic-button primary-button compact scan-button"
            , onClick
                (if model.scanStatus == ScanRequesting then
                    OpenScanner

                 else
                    ArmScan
                )
            ]
            [ text
                (if model.scanStatus == ScanRequesting then
                    "Opening camera…"

                 else if model.scanStatus == ScanArmed then
                    "Stop"

                 else
                    "Scan"
                )
            ]
        , p [ class "scan-hint", attribute "role" "status" ] [ text model.scanMessage ]
        ]


blockedScanner : Model -> Html Msg
blockedScanner model =
    div [ class "scanner-blocked" ]
        [ p [ class "form-error" ] [ text model.scanMessage ]
        , p [ class "privacy-note" ] [ text "Staff check-in is QR only, so there is no typed code to share." ]
        , button [ class "organic-button primary-button compact", onClick OpenScanner ] [ text "Try the camera again " ]
        ]


installView : Model -> Html Msg
installView model =
    if not model.showInstall then
        text ""

    else
        div [ class "overlay", attribute "role" "dialog", attribute "aria-modal" "true", attribute "aria-label" "Install on iPhone" ]
            [ div [ class "organic-modal install-modal" ]
                [ div [ class "modal-heading" ]
                    [ p [ class "eyebrow" ] [ text "A HOME FOR ATTENDANCE" ]
                    , button [ class "close-action", onClick ToggleInstall ] [ text "Close" ]
                    ]
                , h2 [] [ text "One tap from your morning." ]
                , p [] [ text "On your iPhone, open Attendance in Safari and follow these three steps." ]
                , div [ class "install-steps" ]
                    [ div [] [ strong [] [ text "1" ], p [] [ text "Tap Safari’s Share menu." ] ]
                    , div [] [ strong [] [ text "2" ], p [] [ text "Choose Add to Home Screen." ] ]
                    , div [] [ strong [] [ text "3" ], p [] [ text "Open Attendance from the new icon." ] ]
                    ]
                , p [ class "install-footnote" ] [ text "After one connected visit, your app and saved attendance are ready for offline mornings." ]
                ]
            ]


addWorkerView : Model -> Html Msg
addWorkerView model =
    if not model.showAddWorker then
        text ""

    else
        div [ class "overlay", attribute "role" "dialog", attribute "aria-modal" "true", attribute "aria-label" "Add a worker" ]
            [ div [ class "organic-modal worker-modal" ]
                [ div [ class "modal-heading" ]
                    [ p [ class "eyebrow" ] [ text "MAKE ROOM FOR SOMEONE" ]
                    , button [ class "close-action", onClick CloseAddWorker ] [ text "Close" ]
                    ]
                , h2 [] [ text "Add a worker." ]
                , Html.form [ onSubmitForm SubmitWorker ]
                    [ label [ for "worker-name" ] [ text "FULL NAME" ]
                    , input [ id "worker-name", value model.newWorkerName, onInput SetNewWorkerName, placeholder "Ada Obi", autofocus True ] []
                    , label [ for "worker-title" ] [ text "ROLE AT PROOFSTECH" ]
                    , input [ id "worker-title", value model.newWorkerTitle, onInput SetNewWorkerTitle, placeholder "Product Engineering" ] []
                    , if model.supabase /= Nothing then
                        div [ class "invite-fields" ]
                            [ label [ for "worker-nickname" ] [ text "AKA AROUND THE OFFICE" ]
                            , input [ id "worker-nickname", value model.newWorkerNickname, onInput SetNewWorkerNickname, placeholder "Mascott" ] []
                            , label [ for "worker-email" ] [ text "INVITED GMAIL ADDRESS" ]
                            , input [ id "worker-email", type_ "email", value model.newWorkerEmail, onInput SetNewWorkerEmail, placeholder "name@gmail.com" ] []
                            ]

                      else
                        text ""
                    , button [ class "organic-button primary-button compact", type_ "submit" ] [ text "Create profile & prepare link" ]
                    ]
                ]
            ]


inviteLinkView : Model -> Html Msg
inviteLinkView model =
    if not model.showInviteLink then
        text ""

    else
        div [ class "overlay", attribute "role" "dialog", attribute "aria-modal" "true", attribute "aria-label" "Private invite link" ]
            [ div [ class "organic-modal invite-modal" ]
                [ div [ class "modal-heading" ]
                    [ p [ class "eyebrow" ] [ text "PRIVATE SIGN-IN LINK" ]
                    , button [ class "close-action", onClick CloseInviteLink ] [ text "Close" ]
                    ]
                , h2 [] [ text ("Ready for " ++ model.inviteLinkName ++ ".") ]
                , p [] [ text ("This link signs " ++ model.inviteLinkName ++ " in automatically when opened. Nothing has been emailed or sent.") ]
                , input [ class "invite-link-field", value model.inviteLink, readonly True, attribute "aria-label" "Private invite link", autocomplete False ] []
                , div [ class "invite-link-actions" ]
                    [ button [ class "organic-button primary-button compact", onClick CopyInviteLink ] [ text "Copy link" ]
                    , button [ class "text-action", onClick CloseInviteLink ] [ text "Done" ]
                    ]
                , p [ class "invite-link-footnote" ] [ text "The link is single use and expires after one hour. Send it privately to the right person." ]
                ]
            ]


toastView : Maybe Toast -> Html Msg
toastView toast =
    case toast of
        Nothing ->
            text ""

        Just item ->
            div [ class "toast", attribute "role" "status" ]
                [ span [ class "toast-flower" ] [ smallFlower ]
                , div [] [ strong [] [ text item.message ], p [] [ text item.detail ] ]
                , button [ onClick ClearToast ] [ text "Got it" ]
                ]


styledProfileName : String -> Html Msg
styledProfileName name =
    case String.words name of
        [] ->
            text name

        [ only ] ->
            em [] [ text (only ++ ".") ]

        first :: rest ->
            span [] [ text (first ++ " "), em [] [ text (String.join " " rest ++ ".") ] ]


onSubmitForm : Msg -> Attribute Msg
onSubmitForm msg =
    preventDefaultOn "submit" (Decode.succeed ( msg, True ))


unique : List String -> List String
unique values =
    List.foldl
        (\value found ->
            if List.member value found then
                found

            else
                value :: found
        )
        []
        values
