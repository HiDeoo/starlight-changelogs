---
'starlight-changelogs': patch
---

Prevents the development server from crashing when failing to fetch remote data for a changelog.

Previously, if some remote changelog data could not be fetched (due to network issues for example), the development server would crash. This update ensures that such failures are handled more gracefully, allowing the server to continue running. In such cases, warning messages will be logged to inform that no changelog data is available and associated pages will not be generated. The production build process remains unaffected by this change.
