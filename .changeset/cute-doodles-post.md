---
'starlight-changelogs': patch
---

Fixes an issue with the GitHub provider and releases that don't have a name set.

When a release doesn't have a name, the tag name will now be used as a fallback for the version title.
