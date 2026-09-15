# Validation report

Date: 2026-09-15. Status: installable preview with passing macOS checks and Linux CI, including six real Docker differential fixtures.

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

## GitHub Actions validation

[Validation run 34927622980](https://github.com/achenachena/dockerignore-inspector/actions/runs/34927622980) passed on 2026-09-15 for source commit `d280fc795097ba1a2feabf9ea4df28cb46b1ccb9`.

- Ubuntu 24.04, linux/amd64; Docker client and engine 28.0.4; Go 1.24.5; VS Code 1.137.0.
- Passed dependency installation, build, lint, typecheck, all core and upstream tests, package creation, and installation/integration under Xvfb.
- All six actual COPY file-set comparisons passed: no effective rules, negations and ancestors, excluded build control files, dedicated-file precedence, empty dedicated-file precedence, and BOM/CRLF normalization.
- Installed-package integration also checks rapid consecutive draft edits and rejects stale results.
- The workflow provides the VSIX, SHA256SUMS, and integration result as an Actions artifact. This is not a Marketplace publication or GitHub Release.

The local Docker Desktop startup issue remains an environment issue; it no longer blocks the recorded Linux Docker comparison. These results cover the supplied fixtures and do not claim every possible Docker build configuration is supported.

## Measured performance

On Apple M4, Node.js 22.18.0: worker startup approximately 26 ms; 100,000 synthetic paths with three rules matched in approximately 660 ms. Reproduce with `node scripts/benchmark.mjs` after building.

These measurements exclude disk enumeration and Webview rendering, use a small rule set, and do not establish million-file support. The 13-entry installed example updated in approximately 33–65 ms during manual checks. Input is debounced by 250 ms in addition to computation.

## Not completed / release gates

- **Other environments:** macOS ARM64 and Linux x64 have been tested. Windows and remote/virtual workspaces are blocked. macOS Intel and the declared minimum VS Code version have not been installed and tested.
- **Full network-isolated editor run:** core behavior was tested with network calls disabled, and the extension contains no runtime networking. VS Code itself was not disconnected from the network during UI checks.
- **Larger UI stress:** a 16,953-entry physical dependency directory was exercised through the native panel (see below). Sustained typing with 100,000 entries or large rule sets remains unverified.
- **Distribution:** Source is published at https://github.com/achenachena/dockerignore-inspector. The v0.1.0 Preview VSIX and checksum are available at https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.1.0. Marketplace publication is pending. The user supplied the registered Marketplace publisher ID `achenachen`; the package now uses that identity. Marketplace upload and store validation remain pending.

## Behavioral limits

Only logical regular-file sizes are totaled. Symlink targets and unsupported entries are not sized. Directory totals are descendants' included bytes; partial totals are labeled. Changes to file contents after scanning need Refresh to update their sizes. Rule editing reuses that metadata snapshot.

Cancellation leaves clearly labeled stale previous results; it does not silently present them as a completed fresh scan. Invalid rules suppress totals and comparison. Rule traces show effective state transitions rather than every redundant matching pattern.

## Pre-release interaction review

On macOS ARM64 with VS Code 1.137.0, the installed package was tested in an isolated profile against a disposable copy of this project's real node_modules directory (16,953 filesystem entries).

- Right-clicking Dockerfile retained that file and asked only for the build context.
- First scan reported 671 ms. Including dependencies through unsaved rules displayed approximately 133.6 MB of added logical size. Subsequent edits returned to two included files; rule recalculation reported 127–129 ms. These timings are single observations, not a performance guarantee.
- Cancelling an active scan displayed the stale-results notice; refreshing recovered (774 ms observed).
- Temporarily renaming Dockerfile produced an error with zero displayed rows. Layout and keyboard interaction did not resurrect stale rows. Restoring the file and refreshing recovered all 16,953 entries (861 ms observed).
- A regression test exercises the shipped webview script with a minimal DOM: error after selection, resize, scroll, keyboard and filter events, followed by a fresh snapshot and selection. This is not a browser rendering test.

This does not establish full UI performance for 100,000 entries, large rule sets, or every filesystem. The earlier synthetic benchmark remains separate evidence.

The release commit `e754706` passed Linux CI, including six real Docker differential fixtures and installed VSIX integration: https://github.com/achenachena/dockerignore-inspector/actions/runs/34930318597. The packaged documentation records the pre-upload state; the repository README now links to the published assets.

## Windows candidate

Windows compatibility preparation and final hosted CI results are recorded in [WINDOWS.md](WINDOWS.md). Windows, Linux, and cross-platform fixture comparison jobs passed for commit `ec08779`. This does not remove the Windows production gate: Docker Desktop Linux-container end-to-end validation on Windows 10/11 remains unavailable. WSL, Remote SSH and Dev Containers restrictions remain in force.
