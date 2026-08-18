---
'starlight-changelogs': minor
---

Prevents remote changelog fetch failures, e.g. during a provider outage, from interrupting local development by reusing any available cached changelog data. Production builds remain unchanged and will still fail if the changelog data cannot be fetched.
