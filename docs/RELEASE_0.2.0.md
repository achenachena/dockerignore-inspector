# 0.2.0

Dockerignore Inspector is now available through the regular Marketplace release channel. The default **Install** action no longer requires choosing a pre-release version.

## Changes

- Cancel now clears queued draft updates, preventing a pending update from restarting after cancellation.
- Installation instructions prioritize Marketplace and clarify the **Select context** step.

## Install

[Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=achenachen.dockerignore-inspector), or download the matching VSIX from this release and run **Extensions: Install from VSIX…**. Existing pre-release users can choose **Switch to Release Version**. Checksums are provided in the `SHA256SUMS` attachment.

Requires VS Code Desktop **1.137.0+**, Apple Silicon macOS or glibc Linux x64, and a local trusted workspace. Windows and remote/web environments remain unsupported.

## Known issues

Rapidly selecting the same file can duplicate its rule explanation. With no selection, the first Down Arrow selects the second row; use Home to select the first row.
