# Changelog

## 0.2.0

- Package macOS ARM64 and Linux x64 for the regular Marketplace release channel, enabling the default Install entry after publication.
- Cancel pending draft-update timers when stopping work, preventing updates from restarting after Cancel.
- Make Marketplace installation the primary documented path and clarify the Select context step.
- Retain the existing platform restrictions and Windows validation gate.

## 0.1.1 — Preview

- Distribute separate pre-release packages for Apple Silicon macOS and Linux x64.
- Set the minimum VS Code version to the validated 1.137.0.
- Refresh installation guidance and the high-resolution example screenshot.
- Retain Windows path and draft compatibility work and CI, with Windows use still gated pending Docker Desktop validation.

## 0.1.0 — Preview

- Inspect one local build context with an explicitly selected Dockerfile.
- Use Dockerfile-specific ignore precedence and pinned Moby matching.
- Trace effective rule transitions and jump to source lines.
- Preview unsaved ignore edits against the saved file set.
- Search, filter, inspect logical sizes, and cancel bounded scans.
- Include a disposable example and offline WASM runtime.

- Clear stale tree state on inspection errors and safely recover on refresh.
- Retain a right-clicked Dockerfile while selecting the build context.
- Prepare a Preview VSIX and checksum for GitHub Releases.
