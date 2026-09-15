# Validation records

Versioned evidence from September 15, 2026. These are historical results, not new checks performed during documentation maintenance. For open interaction issues, see [the 0.1.1 audit](QA_0.1.1.md); its cancellation issue was fixed in 0.2.0. Windows limitations remain documented in [WINDOWS.md](WINDOWS.md).

## 0.2.0 release-channel verification

Source commit: `1157bdf6e972159c4b6378837effc4977dcbc64f`. Date: September 15, 2026.

### Exact artifacts

| Target | SHA-256 |
| --- | --- |
| darwin-arm64 | `af0de48ebe78f117188930aee95596aabb15c105c545780ed870fa4d65808ad0` |
| linux-x64 | `f13d324a4454bc4f7f787fac9e7370d413d1c6770079392294ad2dccf76cda14` |

Both archives are version 0.2.0, publisher achenachen, VS Code engine ^1.137.0, with the exact target above. **Microsoft.VisualStudio.Code.PreRelease is absent from both manifests.** There is no universal deliverable. Runtime files and the README are identical between the two platform archives.

### Passed checks

- macOS ARM64 final VSIX: isolated installation and actual VS Code 1.137.0 activation, WASM, example scan, draft edits through an alias, Undo, invalid rules, save baseline, and rapid edits.
- Linux x64 final VSIX: same installed core flow on VS Code 1.137.0 in CI. The delivered Linux file is the tested CI artifact, not a later rebuild.
- Cancellation regression against the original 0.1.1 installed bundle failed as expected, showing one timer remained after Cancel. The same test against 0.2.0 passed, including new edits after cancellation and disposal cleanup.
- Additional real-timer host harness with the rebuilt runtime: no update messages appeared after cancelling a queued draft; precedence, recovery, navigation and path-containment checks passed.
- Local lint, TypeScript and Node tests passed: 11 passed, one Windows-only skip.
- Linux and retained Windows CI jobs passed their configured build, lint, TypeScript, Node, Go, native/WASM parity and installation checks. Linux additionally passed upstream Moby tests and nine real Docker COPY comparisons.
- Archive contents checked: extension/worker/WASM/Go bridge, UI, examples and licenses present; private handoff, AGENTS.md, PRODUCT.md, test outputs and development dependencies absent.
- Packaged README image URL returned the exact intended screenshot. SHA-256: `21fcbb806d660c47ceebe51f2e27490d3820b2cf415a27d796406bc61cf93aa8`.

All three CI jobs passed, including the final Windows-inventory comparison against Linux Docker COPY results.

CI: https://github.com/achenachena/dockerignore-inspector/actions/runs/35033155366

### Scope and publication

Marketplace 0.2.0 is verified and public for darwin-arm64 and linux-x64, with no pre-release marker on either package. [GitHub v0.2.0](https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.2.0) is also public as a regular release with both verified platform packages and SHA256SUMS. The uploaded GitHub asset digests match the values above.

Windows remains gated and Windows Desktop Docker validation is still outstanding. Remote SSH, WSL, Dev Containers, Web, Intel macOS, Linux ARM and Alpine remain outside the supported packages. The two other previously reported keyboard/duplicate-explanation issues remain unchanged. No new features or platforms were added.

## Final 0.1.1 preview validation

Date: September 15, 2026. Source commit: `14457fb7b31f89f1ce3e462f5ef217559c24e1c4`.

### Passed

- macOS arm64: the final `darwin-arm64` VSIX installed into an empty extension directory and passed activation, bundled WASM, example scan, draft edits through a directory alias, Undo, invalid-rule recovery, save baseline, and rapid-edit stale-result checks in VS Code **1.137.0**.
- Linux x64: the final `linux-x64` VSIX passed the same installed core workflow in VS Code **1.137.0** on the Ubuntu CI runner. The delivered file is the downloaded CI artifact, not a subsequent rebuild.
- [CI run 35029566456](https://github.com/achenachena/dockerignore-inspector/actions/runs/35029566456): all three jobs succeeded (Linux validation, Windows validation, cross-platform context comparison). Lint, TypeScript, Node tests (10 passed, one platform-specific skip), native Go tests, upstream Moby tests, nine native/WASM parity cases, and nine real Linux Docker COPY comparisons passed. Windows inventory predictions matched the Linux Docker results.
- Both final archives: publisher `achenachen`, version `0.1.1`, correct target platform, `Microsoft.VisualStudio.Code.PreRelease=true`, and VS Code engine `^1.137.0`.
- Worker, WASM header, Go bridge, webview, examples, license and third-party notices present. Runtime files are byte-identical between platform packages. Private handoff, AGENTS.md, PRODUCT.md, .codex/.agents, test outputs, and development dependencies absent. The small example's fake node_modules file is intentional.
- Packaged README image URL returned the exact checked-in 1800×1328 screenshot (SHA-256 `21fcbb806d660c47ceebe51f2e27490d3820b2cf415a27d796406bc61cf93aa8`). The secondary animation link resolved too.

### Test environment issue resolved

Initial macOS integration attempts timed out at Undo: the editor text itself did not change while the VS Code window was in the background. Bringing the isolated test window to the foreground allowed the workflow to pass. No extension runtime change was needed. This desktop automation requirement is not evidence of a matching failure.

### Remaining limits and release decision

The two packages are suitable for a **macOS Apple Silicon / glibc Linux x64 preview**. There are no outstanding blocking failures in their final package checks or installed core flows. VS Code versions below 1.137.0 are deliberately outside the declared engine range; older releases were not validated.

Windows compatibility and CI remain, but Windows user access is still gated. Windows 10/11 with Docker Desktop Linux containers has not been tested. Windows Server CI and Linux Docker differential tests do not replace that end-to-end test. Do not publish a Windows or universal package.

WSL, Remote SSH, Dev Containers, and VS Code Web remain unsupported. Intel macOS, Linux ARM, and Alpine are unvalidated. The preview reports logical file sizes, does not follow symlinks, and labels incomplete or unreadable scan results. Earlier visual/manual checks are not claimed as a fresh full manual pass of every UI action in this release.

This paragraph originally recorded the pre-publication state. Publication update, September 15, 2026: Marketplace 0.1.1 is public for darwin-arm64 and linux-x64 with pre-release flags. The [GitHub v0.1.1 preview](https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.1.1) now contains both original verified packages and SHA256SUMS. The package hashes below remain unchanged. See [the subsequent audit](QA_0.1.1.md) for three known interaction issues queued for a patch.

### Exact deliverables

```text
f8bd4c04096578db25f0463d2846666d56c963ed08235bf6339ebe2c07c07b86  dockerignore-inspector-0.1.1-darwin-arm64.vsix
b08f0177216a46abd74b1d0f48e3356e6ee8952f21a388aab24eb4af7e2f49e3  dockerignore-inspector-0.1.1-linux-x64.vsix
```

## 0.1.0 historical validation — 2026-09-15

These results describe the pre-release 0.1.0 work. Counts, timings and untested requirements below apply to that version, not to later releases.

### Environment

- macOS 26.6.2 (25G83), ARM64, Apple M4.
- VS Code Desktop 1.137.0, commit `645f29cc3176500b4b5762ba887cf2a7f0ffdf2c`.
- Node.js 22.18.0; Go 1.24.5; Moby patternmatcher pinned to v0.6.0.
- Docker CLI 28.5.1 / API 1.51; Docker Desktop 4.49.0 was installed but its daemon did not become available.

### Completed checks

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

### GitHub Actions validation

[Validation run 34927622980](https://github.com/achenachena/dockerignore-inspector/actions/runs/34927622980) passed on 2026-09-15 for source commit `d280fc795097ba1a2feabf9ea4df28cb46b1ccb9`.

- Ubuntu 24.04, linux/amd64; Docker client and engine 28.0.4; Go 1.24.5; VS Code 1.137.0.
- Passed dependency installation, build, lint, typecheck, all core and upstream tests, package creation, and installation/integration under Xvfb.
- All six actual COPY file-set comparisons passed: no effective rules, negations and ancestors, excluded build control files, dedicated-file precedence, empty dedicated-file precedence, and BOM/CRLF normalization.
- Installed-package integration also checks rapid consecutive draft edits and rejects stale results.
- The workflow provides the VSIX, SHA256SUMS, and integration result as an Actions artifact. This is not a Marketplace publication or GitHub Release.

The local Docker Desktop startup issue remains an environment issue; it no longer blocks the recorded Linux Docker comparison. These results cover the supplied fixtures and do not claim every possible Docker build configuration is supported.

### Measured performance

On Apple M4, Node.js 22.18.0: worker startup approximately 26 ms; 100,000 synthetic paths with three rules matched in approximately 660 ms. Reproduce with `node scripts/benchmark.mjs` after building.

These measurements exclude disk enumeration and Webview rendering, use a small rule set, and do not establish million-file support. The 13-entry installed example updated in approximately 33–65 ms during manual checks. Input is debounced by 250 ms in addition to computation.

### Not completed / release gates

- **Other environments:** macOS ARM64 and Linux x64 have been tested. Windows and remote/virtual workspaces are blocked. macOS Intel and the then-declared minimum VS Code version (1.96.0) had not been installed and tested. Later versions require the tested 1.137.0.
- **Full network-isolated editor run:** core behavior was tested with network calls disabled, and the extension contains no runtime networking. VS Code itself was not disconnected from the network during UI checks.
- **Larger UI stress:** a 16,953-entry physical dependency directory was exercised through the native panel (see below). Sustained typing with 100,000 entries or large rule sets remains unverified.
- **Distribution at this version:** [v0.1.0](https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.1.0) was a GitHub pre-release. Later Marketplace publication is recorded in the versioned sections above.

### Behavioral limits

Only logical regular-file sizes are totaled. Symlink targets and unsupported entries are not sized. Directory totals are descendants' included bytes; partial totals are labeled. Changes to file contents after scanning need Refresh to update their sizes. Rule editing reuses that metadata snapshot.

Cancellation leaves clearly labeled stale previous results; it does not silently present them as a completed fresh scan. Invalid rules suppress totals and comparison. Rule traces show effective state transitions rather than every redundant matching pattern.

### Pre-release interaction review

On macOS ARM64 with VS Code 1.137.0, the installed package was tested in an isolated profile against a disposable copy of this project's real node_modules directory (16,953 filesystem entries).

- Right-clicking Dockerfile retained that file and asked only for the build context.
- First scan reported 671 ms. Including dependencies through unsaved rules displayed approximately 133.6 MB of added logical size. Subsequent edits returned to two included files; rule recalculation reported 127–129 ms. These timings are single observations, not a performance guarantee.
- Cancelling an active scan displayed the stale-results notice; refreshing recovered (774 ms observed).
- Temporarily renaming Dockerfile produced an error with zero displayed rows. Layout and keyboard interaction did not resurrect stale rows. Restoring the file and refreshing recovered all 16,953 entries (861 ms observed).
- A regression test exercises the shipped webview script with a minimal DOM: error after selection, resize, scroll, keyboard and filter events, followed by a fresh snapshot and selection. This is not a browser rendering test.

This does not establish full UI performance for 100,000 entries, large rule sets, or every filesystem. The earlier synthetic benchmark remains separate evidence.

The release commit `e754706` passed Linux CI, including six real Docker differential fixtures and installed VSIX integration: https://github.com/achenachena/dockerignore-inspector/actions/runs/34930318597. The packaged documentation records the pre-upload state; the repository README now links to the published assets.

### Windows candidate follow-up — 2026-09-15 (0.1.1 preparation)

Windows compatibility preparation and final hosted CI results are recorded in [WINDOWS.md](WINDOWS.md). Windows, Linux, and cross-platform fixture comparison jobs passed for commit `ec08779`. This does not remove the Windows production gate: Docker Desktop Linux-container end-to-end validation on Windows 10/11 remains unavailable. WSL, Remote SSH and Dev Containers restrictions remain in force.
