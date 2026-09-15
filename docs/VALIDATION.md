# Validation report

Date: 2026-09-15. Status: locally installable preview; not ready for a public compatibility claim until Docker differential checks pass.

## Environment

- macOS 26.6.2 (25G83), ARM64, Apple M4.
- VS Code Desktop 1.137.0, commit `645f29cc3176500b4b5762ba887cf2a7f0ffdf2c`.
- Node.js 22.18.0; Go 1.24.5; Moby patternmatcher pinned to v0.6.0.
- Docker CLI 28.5.1 / API 1.51; Docker Desktop 4.49.0 was installed but its daemon did not become available.

## Completed checks

| Check                           | Result              | Evidence / coverage                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript typecheck and ESLint | Pass                | Extension host, worker, UI, scripts, and tests                                                                                                                                                                                                             |
| WASM / filesystem tests         | Pass, 5 test groups | Glob rules, ancestors, reinclusion, CRLF/BOM, line mapping, invalid syntax, no rules, empty dedicated precedence, Git-ignored entries, Unicode, links, totals, limits, worker termination, cancellation after 250 discovered entries, unreadable directory |
| Go adapter tests                | Pass                | Full result and explanation transitions compared with upstream APIs                                                                                                                                                                                        |
| Upstream Moby tests             | Pass                | `go test github.com/moby/patternmatcher github.com/moby/patternmatcher/ignorefile` at v0.6.0                                                                                                                                                               |
| Network-disabled core tests     | Pass                | Same core suite with HTTP, HTTPS, TCP connection, and fetch entry points disabled; workers inherit the test guard                                                                                                                                          |
| VSIX package inspection         | Pass                | Bundled WASM, Go bridge, worker, local UI, fixtures and license notices; no development dependencies or private handoff                                                                                                                                    |
| Installed VSIX integration      | Pass                | Actual package installed in isolated extension and fresh user directories; activation, WASM, example scan, unsaved difference, undo, invalid rule line, saved baseline                                                                                     |
| Native UI interaction           | Pass                | Example, exact rule-line jump, unsaved exclusion and 123 B difference, undo restoration, keyboard Up/Down, dedicated Dockerfile selection                                                                                                                  |
| Themes and screenshots          | Pass                | Built-in dark theme and Light Modern; actual installed extension captures in `docs/images/`                                                                                                                                                                |

The UI check used an isolated copy of the installed VS Code application so the user's existing editor profile was not modified. The tiny example is copied to a temporary directory before editing.

The integration harness loads only a tiny test harness as a development extension; the product under test is the installed VSIX. Local test runs do not constitute a GitHub Actions run.

## Measured performance

On Apple M4, Node.js 22.18.0: worker startup approximately 26 ms; 100,000 synthetic paths with three rules matched in approximately 660 ms. Reproduce with `node scripts/benchmark.mjs` after building.

These measurements exclude disk enumeration and Webview rendering, use a small rule set, and do not establish million-file support. The 13-entry installed example updated in approximately 33–65 ms during manual checks. Input is debounced by 250 ms in addition to computation.

## Not completed / release gates

- **Real Docker/BuildKit comparison:** `npm run test:docker` could not connect to the local daemon. Docker Desktop startup logged `opening tray: starting electron: sending file descriptors: broken pipe`; a direct backend launch also did not provide a working daemon and was stopped. The FROM scratch differential runner and Linux CI step are supplied, but have not passed here. Do not advertise full Docker compatibility until this runs successfully.
- **Other environments:** Linux CI results are recorded in GitHub Actions; the local evidence below was collected on macOS. Windows and remote/virtual workspaces are blocked. macOS Intel and the declared minimum VS Code version have not been installed and tested.
- **Full network-isolated editor run:** core behavior was tested with network calls disabled, and the extension contains no runtime networking. VS Code itself was not disconnected from the network during UI checks.
- **Large-directory UI stress:** scan cancellation and worker termination are tested independently; a large physical directory was not driven through the full native panel under sustained typing.
- **Distribution:** Source is published at https://github.com/achenachena/dockerignore-inspector. No GitHub Release or Marketplace listing has been created. `local-preview` is local package metadata, not an actual publisher account. Public identity, links, name availability and authorization remain release steps.

## Behavioral limits

Only logical regular-file sizes are totaled. Symlink targets and unsupported entries are not sized. Directory totals are descendants' included bytes; partial totals are labeled. Changes to file contents after scanning need Refresh to update their sizes. Rule editing reuses that metadata snapshot.

Cancellation leaves clearly labeled stale previous results; it does not silently present them as a completed fresh scan. Invalid rules suppress totals and comparison. Rule traces show effective state transitions rather than every redundant matching pattern.
