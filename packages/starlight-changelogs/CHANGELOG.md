# starlight-changelogs

## 0.2.2

### Patch Changes

- [#17](https://github.com/HiDeoo/starlight-changelogs/pull/17) [`c1d888e`](https://github.com/HiDeoo/starlight-changelogs/commit/c1d888eb882dbc3bca5b1c4337a1aa794facbac5) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Prevents the development server from crashing when failing to fetch remote data for a changelog.

  Previously, if some remote changelog data could not be fetched (due to network issues for example), the development server would crash. This update ensures that such failures are handled more gracefully, allowing the server to continue running. In such cases, warning messages will be logged to inform that no changelog data is available and associated pages will not be generated. The production build process remains unaffected by this change.

## 0.2.1

### Patch Changes

- [#13](https://github.com/HiDeoo/starlight-changelogs/pull/13) [`c0f65d1`](https://github.com/HiDeoo/starlight-changelogs/commit/c0f65d1231d67009a2730f89501ba0a0642b0ad9) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue with the GitHub provider and releases that don't have a name set.

  When a release doesn't have a name, the tag name will now be used as a fallback for the version title.

## 0.2.0

### Minor Changes

- [#8](https://github.com/HiDeoo/starlight-changelogs/pull/8) [`0c258b7`](https://github.com/HiDeoo/starlight-changelogs/commit/0c258b7539f0eef75947c3c2d71178c29d055de4) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds a new `enabled` provider option, defaulting to `true`, to control whether a changelog is enabled or not.

  When set to `false`, changelog data will not be loaded and no changelog pages or sidebar links will be generated for this changelog. This can be useful to disable a changelog depending on some environment variable that may not always be available.

## 0.1.1

### Patch Changes

- [#3](https://github.com/HiDeoo/starlight-changelogs/pull/3) [`d4a21ef`](https://github.com/HiDeoo/starlight-changelogs/commit/d4a21ef63507b75fe5f33b5d29a43782f63e171f) Thanks [@trueberryless](https://github.com/trueberryless)! - Adds German UI translations.

- [#4](https://github.com/HiDeoo/starlight-changelogs/pull/4) [`9a075e2`](https://github.com/HiDeoo/starlight-changelogs/commit/9a075e292e108bfa981acd9482e03febdb15c59a) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an a pagination issue with changelog sidebar links in multilingual projects.

## 0.1.0

### Minor Changes

- [#1](https://github.com/HiDeoo/starlight-changelogs/pull/1) [`4ba4252`](https://github.com/HiDeoo/starlight-changelogs/commit/4ba425264cc4a28a674e2bea225f527a1426d4a8) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Initial public release
