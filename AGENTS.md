# Architecture rules

- Derive manifest and Apple touch icons from the user-selected installation image, padding to square without stretching; preserve the website favicon when a separate installation image is requested.
- Share map-coordinate parsing between chat and the authenticated map-link resolver; resolve only allowlisted map URLs with bounded redirects, time and response size to avoid arbitrary network access.