# Windows local workspace validation

## Release decision

Windows support is a validation candidate, not yet enabled for normal users. A Windows 10/11 machine with Docker Desktop in Linux-container mode is not available for this change. Hosted Windows CI and cross-platform fixture comparisons cannot substitute for that end-to-end check. The existing Windows gate remains until the missing evidence is recorded.

The intended scope is trusted, local drive workspaces used as Docker Desktop Linux-container build contexts. WSL, Remote SSH, Dev Containers, virtual workspaces, UNC shares, device paths, and Windows-container builds remain outside scope.

## Path and draft handling

- Filesystem operations use native absolute paths. Scanner entries use forward-slash relative paths, preserving filename case for the matcher.
- Containment checks use canonical paths, normalize drive-letter spelling, and preserve component case. Windows can have case-sensitive directories; blindly lowercasing all path components would weaken containment checks.
- Open ignore documents are identified using filesystem device/file identifiers, so drive spelling and directory aliases do not discard unsaved edits. When more than one editor refers to the same file, a dirty document is preferred; conflicting simultaneous drafts of aliases are not a supported workflow.
- Ignore discovery resolves the selected file's real path. Dockerfile-specific rules, including an empty dedicated file, retain precedence.
- The host sends relative control-file paths to the webview. The webview no longer compares a Windows absolute path against a string assembled with `/`.
- Directory junctions are reported as links and are not traversed by the scanner. Selecting a directory alias resolves the context root first.

## Matcher semantics

The bundled Go `js/wasm` matcher has POSIX path semantics regardless of the host OS. Context paths stay slash-separated and matching stays case-sensitive. A case-insensitive filesystem does not mean ignore patterns should be lowercased.

BuildKit's file synchronization filters also use a native-host matcher. In particular, backslash behavior differs across hosts. On Windows, the candidate rejects active rules containing backslashes with a line-specific error instead of presenting potentially incorrect totals. Forward-slash globs, negations, ancestor rules, case distinctions, Unicode, spaces, BOM, CRLF and empty dedicated files are covered by the fixture suite. Backslash escaping, drive-qualified patterns, alternate data streams and unusual reparse points require separate investigation before expanding the scope.

Primary implementation references:

- [Moby patternmatcher v0.6.0](https://github.com/moby/patternmatcher/blob/v0.6.0/patternmatcher.go)
- [BuildKit filesystem filtering](https://github.com/tonistiigi/fsutil/blob/master/filter.go)

## Automated checks

The Windows job runs on `windows-2025` with Node 22 and Go 1.24.5. It builds the WASM bundle, runs lint/type checks and tests, compares the WASM adapter with a native Go matcher, packages the VSIX, installs it into an empty extension directory and runs installed-extension integration. The CLI is launched through `Code.exe` plus the JavaScript entry resolved from the downloaded `code.cmd` (including versioned resource directories) in Electron's Node mode, avoiding shell execution of `code.cmd`.

Integration sets `INSPECTOR_WINDOWS_VALIDATION=1` only in the test process to exercise the candidate behind the release gate. It covers activation, WASM startup, example scanning, dirty edits through a directory junction, undo, invalid rules, save and successive draft updates. This is automated Extension Host testing, not manual Windows UI sign-off. POSIX chmod permission tests do not establish Windows ACL behavior.

The Windows job scans actual Windows fixture directories and records predicted file sets. The Linux job checks identical fixture contents against real Linux Docker `COPY` exports. A third job compares those records. This checks the portable fixture subset across both hosts; it does not run Docker Desktop or Windows-to-Linux context transfer.

## Required Docker Desktop check

On a disposable Windows 10/11 test machine with Docker Desktop configured for Linux containers, use the repository's pinned dependencies and run from PowerShell:

```powershell
npm ci
npm run build
node scripts/matcher-parity.mjs
npm run test:docker
npm run package
npm run test:integration
```

`test:docker` requires the daemon to report `linux` and uses only generated fixture Dockerfiles (`FROM scratch; COPY . /`). It does not build a user's project. The temporary context includes spaces and Unicode. It compares actual exported files with the candidate's Windows scan and WASM predictions, and fails on a mismatch.

Record Windows, Docker Desktop, Docker Engine/buildx and VS Code versions, the command output, and the final VSIX checksum. Check directory selection, rule navigation, opening files, cancellation and refresh in a local desktop window. Test a different drive and Windows ACL failures separately. Only after these pass should the production Windows gate and support claims be changed.

## Recorded result — 2026-09-15

Code commit: `ec08779d1a8eabce5cd55cf7f7433292eae562b4`.
[Final CI run](https://github.com/achenachena/dockerignore-inspector/actions/runs/35027863656): all three jobs passed (`windows`, `validate`, `compare-contexts`).

| Check | Actual result |
| --- | --- |
| Windows Server 2025 x64 build, lint, TypeScript | Passed |
| Windows Node tests | 10 passed; 1 POSIX permission subtest explicitly skipped |
| Native Windows Go tests | Passed |
| Native Windows Go / bundled WASM parity | 9 fixtures passed, including effective-rule explanations |
| Windows local scans versus Linux Docker-validated COPY file sets | All 9 fixtures agreed |
| Windows final VSIX installation | Passed in an empty extension directory |
| Windows installed VS Code 1.137.0 core flow | Activation, WASM, example, junction-alias drafts, undo, invalid rule, save, and 12 successive updates passed |
| Linux final VSIX integration and actual Docker differential tests | Passed |
| macOS regression checks during development | Node tests, native/WASM parity, and installed VSIX integration passed |
| Windows Desktop / Docker Desktop Linux-container end-to-end test | Not run: no test machine available |

The Windows CI artifact `windows-preview-validation` contains the exact installed VSIX, `SHA256SUMS`, and the integration result. The downloaded artifact's checksum and private-file exclusions were independently checked. Its SHA-256 is:

```text
a791017ee07b543b2934c28fd0b738db8d7699158486558bbe5585b22ccfcede
```

Two Windows test issues were resolved before this final run: the downloaded VS Code used a versioned resource directory for its CLI, and the editor preserved CRLF while an old assertion assumed LF. The final assertion compares the snapshot with the editor's exact final text and separately verifies normalized rule content.

**Decision:** keep the production Windows gate. Hosted Windows Server CI proves the candidate's automated paths and core flow, but does not prove Windows 10/11 Docker Desktop context transfer, Windows ACL behavior, manual native UI interactions, Windows ARM64, or the declared minimum VS Code version. No released GitHub asset or Marketplace package was replaced by this validation candidate.
