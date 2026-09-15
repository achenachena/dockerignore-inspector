# Release preparation

## Version and packages

Publisher: `achenachen`. Version **0.2.0** uses the regular Marketplace release channel. Public version checks before preparation found only 0.1.1 in Marketplace, and 0.1.0/0.1.1 on GitHub. This version is distinct from those pre-releases.

| Package | Supported host |
| --- | --- |
| `dockerignore-inspector-0.2.0-darwin-arm64.vsix` | Apple Silicon macOS, VS Code 1.137.0+ |
| `dockerignore-inspector-0.2.0-linux-x64.vsix` | glibc Linux x64, VS Code 1.137.0+ |

Neither package may contain `Microsoft.VisualStudio.Code.PreRelease=true`. There is no universal package. Windows compatibility and CI remain, but Windows users are still gated. WSL, Remote SSH, Dev Containers, and Web remain unsupported.

## Build and check

`npm run package` builds for the current supported host, using an explicit `--target` and no `--pre-release`. To choose a target, use `npm run package -- darwin-arm64` or `npm run package -- linux-x64`. Cross-packaging does not validate a target: test installation on that host.

`npm run test:integration` installs the exact host VSIX in a new empty extensions directory and exercises activation, WASM, the example, draft edits, Undo, invalid rules, save, and rapid edits. `INSPECTOR_VSIX` can override the package path. Keep the macOS test window foregrounded for Undo. The lifecycle regression test verifies that Cancel clears queued work, subsequent edits can schedule again, and disposal clears timers.

Windows CI alone sets `INSPECTOR_WINDOWS_VALIDATION=1` to test a candidate win32-x64 package. It is not a public release artifact.

Verify package identity, target, version, engine range, absence of the pre-release marker, runtime files, images and licenses. Exclude private handoff documents, credentials, tests and development dependencies. Generate checksums from the exact deliverables and keep binaries unchanged after installed validation.

## Manual Marketplace upload

1. Open [publisher achenachen](https://marketplace.visualstudio.com/manage/publishers/achenachen), locate **Dockerignore Inspector**, and select **Update**.
2. Upload `dockerignore-inspector-0.2.0-darwin-arm64.vsix`. Confirm version 0.2.0, target darwin-arm64, and the regular release channel (not pre-release). Submit and wait for verification.
3. On the same extension, select **Update** again and upload `dockerignore-inspector-0.2.0-linux-x64.vsix`. Confirm the same version/channel and target linux-x64. Submit and wait for verification.
4. Confirm both platform packages are listed under regular version 0.2.0. Do not upload SHA256SUMS, a universal package, or a Windows validation package.
5. On a supported host, select the default **Install** button. A user already on 0.1.1 pre-release can choose **Switch to Release Version**. The prior missing-release message is resolved only after Marketplace accepts these regular-channel packages.

The VSIX metadata, rather than the filename alone, determines the release channel. If the dashboard reports a conflict, inspect the existing versions instead of changing verified package metadata. No token needs to be shared.

## GitHub Release

Use tag `v0.2.0` and title **v0.2.0 — macOS ARM64 and Linux x64**. Use a regular GitHub release, with the pre-release checkbox off. Attach only the two verified VSIX files and SHA256SUMS. The prepared release notes explain the cancellation fix, supported platforms, remaining known interaction issues, and Marketplace upload status. GitHub and Marketplace publication are separate actions.

Official reference: [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
