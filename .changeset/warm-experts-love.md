---
'starlight-changelogs': minor
---

Adds a new `enabled` provider option, defaulting to `true`, to control whether a changelog is enabled or not.

When set to `false`, changelog data will not be loaded and no changelog pages or sidebar links will be generated for this changelog. This can be useful to disable a changelog depending on some environment variable that may not always be available.
