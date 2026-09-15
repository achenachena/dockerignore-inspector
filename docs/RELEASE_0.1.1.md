# v0.1.1 Preview — macOS Apple Silicon and Linux x64

Dockerignore Inspector explains which files a Docker build context includes and previews unsaved ignore-rule changes locally. No Docker daemon, Go installation, account, or network connection is required at runtime.

## Downloads

| Asset | Supported platform |
| --- | --- |
| `dockerignore-inspector-0.1.1-darwin-arm64.vsix` | Apple Silicon macOS |
| `dockerignore-inspector-0.1.1-linux-x64.vsix` | glibc Linux x64 |
| `SHA256SUMS` | SHA-256 checksums for both packages |

Requires **VS Code Desktop 1.137.0 or later** and a trusted local workspace. Both VSIX files are Marketplace **pre-release** packages. No universal or Windows package is included.

## Install and try

1. Download the package matching your platform. Verify it against `SHA256SUMS` if desired (`shasum -a 256 -c SHA256SUMS` on macOS or `sha256sum -c SHA256SUMS` on Linux when both packages are present).
2. Run **Extensions: Install from VSIX…** in VS Code and select that package.
3. Run **Dockerignore: Open Example**. Remove `!` from `!assets/logo.svg` without saving, inspect the draft difference, then undo.
4. Run **Dockerignore: Inspect Build Context**, click **Select context**, then choose your context directory and Dockerfile.

Publisher: `achenachen`. Uninstall an old `local-preview` installation first to avoid duplicate commands.

## Changes

- Separate platform-specific pre-release packages for the two validated hosts.
- Minimum VS Code version aligned with 1.137.0 validation.
- Clearer installation guidance and a high-resolution example screenshot.
- Windows path/draft compatibility and CI retained, with the production Windows gate intact.

## Limits

Windows is under validation and is not enabled. Windows 10/11 with Docker Desktop Linux containers has not been tested; no availability date is promised. WSL, Remote SSH, Dev Containers, and VS Code Web remain unsupported. Intel macOS, Linux ARM, and Alpine are not packaged or validated.

Sizes describe logical regular-file bytes, not actual Docker transfer size, image size, or build-time savings. Symlinks are listed but not followed. Scans are bounded; unreadable and partial results are labeled. The extension does not execute project code, upload files, collect telemetry, or automatically edit ignore rules.

## Validation

Both final platform VSIX files passed installation and core workflows on VS Code 1.137.0, including example scan, WASM matching, draft edits, Undo, invalid-rule recovery, save, and rapid edits. [CI](https://github.com/achenachena/dockerignore-inspector/actions/runs/35029566456) also passed lint, TypeScript, Node and Go tests, upstream Moby tests, nine native/WASM parity fixtures, nine real Linux Docker COPY fixtures, Windows candidate integration, and Windows inventory comparison against those Linux Docker results.

The minimum VS Code version is aligned with these installed-package checks. Windows CI does not establish Docker Desktop support.

---

# Final 0.1.1 preview validation

Date: September 15, 2026. Source commit: `14457fb7b31f89f1ce3e462f5ef217559c24e1c4`.

## Passed

- macOS arm64: the final `darwin-arm64` VSIX installed into an empty extension directory and passed activation, bundled WASM, example scan, draft edits through a directory alias, Undo, invalid-rule recovery, save baseline, and rapid-edit stale-result checks in VS Code **1.137.0**.
- Linux x64: the final `linux-x64` VSIX passed the same installed core workflow in VS Code **1.137.0** on the Ubuntu CI runner. The delivered file is the downloaded CI artifact, not a subsequent rebuild.
- [CI run 35029566456](https://github.com/achenachena/dockerignore-inspector/actions/runs/35029566456): all three jobs succeeded (Linux validation, Windows validation, cross-platform context comparison). Lint, TypeScript, Node tests (10 passed, one platform-specific skip), native Go tests, upstream Moby tests, nine native/WASM parity cases, and nine real Linux Docker COPY comparisons passed. Windows inventory predictions matched the Linux Docker results.
- Both final archives: publisher `achenachen`, version `0.1.1`, correct target platform, `Microsoft.VisualStudio.Code.PreRelease=true`, and VS Code engine `^1.137.0`.
- Worker, WASM header, Go bridge, webview, examples, license and third-party notices present. Runtime files are byte-identical between platform packages. Private handoff, AGENTS.md, PRODUCT.md, .codex/.agents, test outputs, and development dependencies absent. The small example's fake node_modules file is intentional.
- Packaged README image URL returned the exact checked-in 1800×1328 screenshot (SHA-256 `21fcbb806d660c47ceebe51f2e27490d3820b2cf415a27d796406bc61cf93aa8`). The secondary animation link resolved too.

## Test environment issue resolved

Initial macOS integration attempts timed out at Undo: the editor text itself did not change while the VS Code window was in the background. Bringing the isolated test window to the foreground allowed the workflow to pass. No extension runtime change was needed. This desktop automation requirement is not evidence of a matching failure.

## Remaining limits and release decision

The two packages are suitable for a **macOS Apple Silicon / glibc Linux x64 preview**. There are no outstanding blocking failures in their final package checks or installed core flows. VS Code versions below 1.137.0 are deliberately outside the declared engine range; older releases were not validated.

Windows compatibility and CI remain, but Windows user access is still gated. Windows 10/11 with Docker Desktop Linux containers has not been tested. Windows Server CI and Linux Docker differential tests do not replace that end-to-end test. Do not publish a Windows or universal package.

WSL, Remote SSH, Dev Containers, and VS Code Web remain unsupported. Intel macOS, Linux ARM, and Alpine are unvalidated. The preview reports logical file sizes, does not follow symlinks, and labels incomplete or unreadable scan results. Earlier visual/manual checks are not claimed as a fresh full manual pass of every UI action in this release.

This paragraph originally recorded the pre-publication state. Publication update, September 15, 2026: Marketplace 0.1.1 is public for darwin-arm64 and linux-x64 with pre-release flags. The [GitHub v0.1.1 preview](https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.1.1) now contains both original verified packages and SHA256SUMS. The package hashes below remain unchanged. See [the subsequent audit](QA_0.1.1.md) for three known interaction issues queued for a patch.

## Exact deliverables

```text
f8bd4c04096578db25f0463d2846666d56c963ed08235bf6339ebe2c07c07b86  dockerignore-inspector-0.1.1-darwin-arm64.vsix
b08f0177216a46abd74b1d0f48e3356e6ee8952f21a388aab24eb4af7e2f49e3  dockerignore-inspector-0.1.1-linux-x64.vsix
```
