# v0.2.0 — macOS ARM64 and Linux x64

This version packages Dockerignore Inspector for the regular Marketplace release channel. Once uploaded and verified there, the default **Install** action can install this version without the previous missing-release prompt.

## Changes

- Remove the pre-release packaging flag while keeping explicit platform targets.
- Clear pending draft-update timers when stopping work, so Cancel does not restart a queued update.
- Put Marketplace installation first in the README and clarify the Select context step.

## Installation

Use the [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=achenachen.dockerignore-inspector) and choose **Install** after regular version 0.2.0 is available. Existing pre-release users can select **Switch to Release Version**. The publisher owner reports that Marketplace 0.2.0 has been uploaded. At the publication check, the public gallery API still returned only 0.1.1; verification or propagation may still be pending. The matching GitHub VSIX files are available now.

Alternatively, run **Extensions: Install from VSIX…** with the matching asset:

| Asset | Host |
| --- | --- |
| `dockerignore-inspector-0.2.0-darwin-arm64.vsix` | Apple Silicon macOS |
| `dockerignore-inspector-0.2.0-linux-x64.vsix` | glibc Linux x64 |
| `SHA256SUMS` | SHA-256 checksums for both packages |

Requires VS Code Desktop **1.137.0+** and a trusted local workspace. Run **Dockerignore: Open Example**, or **Dockerignore: Inspect Build Context** then **Select context** to choose your own context and Dockerfile.

## Scope and known limits

Platform support is unchanged. Windows remains gated pending Windows 10/11 with Docker Desktop Linux-container validation. WSL, Remote SSH, Dev Containers, Web, Intel macOS, Linux ARM, and Alpine are not supported by these packages.

The two previously reported UI issues—duplicate explanations from multiple pending responses for the same file and the first ArrowDown skipping the first row—remain outside this cancellation-focused patch. No new features are included. Logical sizes are not transfer or image sizes; symlink targets are not traversed.

## Verification

Both final platform VSIX files passed isolated installation and core workflows in VS Code 1.137.0. Their manifests contain no pre-release property. The new cancellation regression fails against 0.1.1 and passes against 0.2.0. See [validation CI](https://github.com/achenachena/dockerignore-inspector/actions/runs/35033155366).

---

# 0.2.0 release-channel verification

Source commit: `1157bdf6e972159c4b6378837effc4977dcbc64f`. Date: September 15, 2026.

## Exact artifacts

| Target | SHA-256 |
| --- | --- |
| darwin-arm64 | `af0de48ebe78f117188930aee95596aabb15c105c545780ed870fa4d65808ad0` |
| linux-x64 | `f13d324a4454bc4f7f787fac9e7370d413d1c6770079392294ad2dccf76cda14` |

Both archives are version 0.2.0, publisher achenachen, VS Code engine ^1.137.0, with the exact target above. **Microsoft.VisualStudio.Code.PreRelease is absent from both manifests.** There is no universal deliverable. Runtime files and the README are identical between the two platform archives.

## Passed checks

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

## Scope and publication

The regular release channel fixes the missing-release installation entry **after the owner uploads both packages and Marketplace verification succeeds**. Publication update: the owner reports uploading 0.2.0 to Marketplace; the public gallery had not yet exposed that version when checked. [GitHub v0.2.0](https://github.com/achenachena/dockerignore-inspector/releases/tag/v0.2.0) is now public as a regular release with both verified platform packages and SHA256SUMS. The uploaded GitHub asset digests match the values above.

Windows remains gated and Windows Desktop Docker validation is still outstanding. Remote SSH, WSL, Dev Containers, Web, Intel macOS, Linux ARM and Alpine remain outside the supported packages. The two other previously reported keyboard/duplicate-explanation issues remain unchanged. No new features or platforms were added.
