# Release preparation

## Current identity

`local-preview` is a deliberately local-only VSIX publisher identifier, not a registered user identity. The npm package is private. The source repository is `achenachena/dockerignore-inspector`; Marketplace publication is separate. Do not publish it unchanged.

## Local review

Run the README checks, including Docker comparison and installed VSIX integration. Run `npx vsce ls` and review the package file list. The package must contain its worker, WASM, Go bridge, UI assets, example files, and all required third-party licenses. It must not contain caches, private handoff context, test outputs, or credentials.

The package is `dist/dockerignore-inspector-0.1.0.vsix`; its checksum is in `dist/SHA256SUMS`. Open the example in a clean VS Code profile. Verify dark/light themes, keyboard use, draft edit and undo, rule navigation, dedicated rules, errors, cancellation, and offline operation. Record evidence in VALIDATION.md.

## Public release prerequisites

1. Obtain the actual GitHub owner/repository and publisher ID, and explicit authorization for the intended public destinations.
2. Replace the local publisher identifier; add actual repository and issue URLs; remove `private` when publication is intended.
3. Check Marketplace name availability directly, review the bundled PNG icon, and ensure screenshots render with public repository image URLs.
4. Rebuild and reinstall the exact final package after metadata changes. Complete supported-platform validation and CI.
5. Push only with authorization. Create the version tag and GitHub Release, attaching the verified VSIX and checksum.
6. Use the actual Marketplace publisher account to upload the VSIX. Recheck current official authentication guidance before automating publication. Never put a token in chat, source, or a PR workflow.

GitHub and Marketplace are separate releases. Neither has happened merely because a VSIX exists. Windows, Open VSX, Cursor, and remote development require separate verification before advertising support.

Official guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

## Store description draft

See which files your Docker build context includes, why they match, and what changes as you edit .dockerignore.

- Inspect a local context with the Dockerfile you actually use.
- Follow effective ignore rules and jump to their lines.
- Preview unsaved changes before saving.
- Work offline, without telemetry or a Docker daemon.

Logical file sizes are not measured transfer sizes or image sizes. Local desktop support only; consult the validated platform list.
