# Architecture rules

- Use unique Realtime channel names per engine lifetime and discard responses from obsolete company contexts to prevent route-remount crashes and cross-company state.
- Broadcasts use durable recipient claims and never replay uncertain delivery outcomes automatically; Meta message IDs are the source of delivery status.
- Parse broadcast delivery metadata defensively and catch history refresh failures locally so incomplete records or network interruptions do not escape into the page.

- Derive manifest and Apple touch icons from the user-selected installation image, padding to square without stretching; preserve the website favicon when a separate installation image is requested.
- Share map-coordinate parsing between chat and the authenticated map-link resolver; resolve only allowlisted map URLs with bounded redirects, time and response size to avoid arbitrary network access.
- Both template pickers derive Vialogistic campaign images from the shared exact-name mapping; never retain a prior image or default an unknown template to the first image.
