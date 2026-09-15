# Release preparation

## Version and supported packages

Publisher: `achenachen`. Repository: `achenachena/dockerignore-inspector`.
Version 0.1.1 follows the published GitHub preview 0.1.0. The public Marketplace query returned no matching extension on September 15, 2026; private drafts are not visible to that query. Check the publisher dashboard before uploading.

| Package | Supported host |
| --- | --- |
| `dockerignore-inspector-0.1.1-darwin-arm64.vsix` | Apple Silicon macOS, VS Code 1.137.0+ |
| `dockerignore-inspector-0.1.1-linux-x64.vsix` | glibc Linux x64, VS Code 1.137.0+ |

Both packages have the Marketplace pre-release flag. Do not upload a universal package or a Windows validation package. Windows remains gated; WSL, Remote SSH, Dev Containers, and Web remain unsupported. Windows 10/11 with Docker Desktop Linux containers has not been validated.

## Build and validation

`npm run package` builds a pre-release package for the current supported host. An explicit target can be supplied with `npm run package -- darwin-arm64` or `npm run package -- linux-x64`. Targeting a platform does not validate it; install the final package on that host.

`npm run test:integration` installs the host package into a new empty extensions directory and exercises the example, WASM matching, aliased draft edits, undo, invalid rules, save, and rapid edits. Linux and Windows download the declared minimum VS Code version. macOS uses the installed application; check its recorded version. `INSPECTOR_VSIX` can specify an exact final package path.

Windows CI alone sets `INSPECTOR_WINDOWS_VALIDATION=1` to build and test a gated `win32-x64` candidate. Its VSIX is not uploaded as an artifact or released. Preserve this validation without advertising Windows support.

Review the VSIX manifest for identity, version, target, pre-release flag, and engine range. Check worker, WASM, Go bridge, webview, examples, licenses, and HTTPS README image links. Private handoff documents, credentials, dependencies, and test outputs must be absent. Generate the combined checksum file from the two exact deliverables:

```sh
node scripts/checksum.mjs dist/release/dockerignore-inspector-0.1.1-darwin-arm64.vsix dist/release/dockerignore-inspector-0.1.1-linux-x64.vsix
```

## Manual Marketplace upload

1. Sign in to [Manage Extensions](https://marketplace.visualstudio.com/manage/publishers/achenachen) and select publisher **achenachen**.
2. If the extension does not exist, choose **New extension > Visual Studio Code** and upload `dockerignore-inspector-0.1.1-darwin-arm64.vsix`. If it exists, use its **Update** action instead. Do not create a second extension identity.
3. Confirm identity `achenachen.dockerignore-inspector`, version **0.1.1**, target **darwin-arm64**, and pre-release status. Submit and wait for validation.
4. On that same extension, choose **Update**, upload `dockerignore-inspector-0.1.1-linux-x64.vsix`, and confirm target **linux-x64** and the same version and pre-release status. Submit and wait for validation. Platform-specific packages share a version.
5. Confirm both targets appear under version 0.1.1, and the listing's README screenshot loads. Do not upload `SHA256SUMS` as an extension. No token needs to be shared.
6. On a supported host, open the listing in VS Code and select **Install Pre-Release Version** (or switch to the pre-release channel), then run **Dockerignore: Open Example**.

If the dashboard reports a version conflict, stop and inspect existing versions; do not change a package's name or metadata after verification. A public Marketplace listing is only claimed after upload and validation succeed.

Official reference: [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), including pre-release and platform-specific packaging.

## GitHub Release

Use tag `v0.1.1`, title **v0.1.1 Preview — macOS Apple Silicon and Linux x64**, and mark the release as a **pre-release**. Attach only the two platform VSIX files and their combined `SHA256SUMS`. Use the prepared `dist/release/RELEASE_NOTES.md` as the body. Keep historical v0.1.0 assets unchanged. Preparing files does not publish a release.
