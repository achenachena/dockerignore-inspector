# 0.2.1

This patch fixes two navigation issues and makes the documentation shorter and easier to follow.

## Changes

- Rule explanations now accept only the latest selection response. Repeated clicks and quick file switches no longer duplicate results or show an older explanation.
- The first Down Arrow press selects the first row when no file is selected. Subsequent Up/Down navigation works as usual.
- The README now focuses on the three core features, installation, usage and essential limits. Detailed controls and validation records live in the documentation.

## Install

[Install or update from Marketplace](https://marketplace.visualstudio.com/items?itemName=achenachen.dockerignore-inspector), or install the matching VSIX from this release. Checksums are in `SHA256SUMS`.

Requires VS Code Desktop **1.137.0+**, Apple Silicon macOS or glibc Linux x64, and a local trusted workspace. Windows, remote development and Web remain unsupported. This patch adds no features or supported platforms.
