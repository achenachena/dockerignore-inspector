# Dockerignore Inspector

A VS Code extension to inspect Docker build context files, understand ignore rules, and preview unsaved changes.

![Draft preview showing an excluded file, its matching rule, and the size change](docs/images/preview-detail.png)

*See why a file is excluded and how a rule edit changes the context.*

## Features

- **Inspect the context.** See included and excluded files, their logical sizes, and included directory totals. Search by relative path or filter by state to find the files you care about.
- **Explain the rules.** Select a file to see the rules that changed its inclusion state, then jump to the corresponding line. The panel identifies the active ignore file, including Dockerfile-specific rules.
- **Preview unsaved changes.** Compare draft rules with the saved file set and size totals before saving. See which files would be added or removed as you edit.

## Install and use

[Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=achenachen.dockerignore-inspector) using publisher **achenachen**.

1. Run **Dockerignore: Inspect Build Context**, click **Select context**, and choose your context directory and Dockerfile. For a quick trial, run **Dockerignore: Open Example** instead.
2. Select a file to inspect its rule trace; click a rule to open the matching line.
3. Edit the active ignore file without saving and review **Draft impact**. Undo restores the previous result. Use **Refresh** after filesystem changes.

For manual installation, download the matching VSIX from [GitHub Releases](https://github.com/achenachena/dockerignore-inspector/releases) and run **Extensions: Install from VSIX…**.

## Requirements and limitations

- VS Code Desktop **1.137.0+**, on Apple Silicon macOS or glibc Linux x64, in a **local, trusted workspace**. Windows, Remote SSH, WSL, Dev Containers, Web, and other architectures are unsupported.
- Sizes are logical regular-file sizes, **not image sizes or actual transfer amounts**. Symlink targets are not traversed or counted.
- Processing is local, with no telemetry or uploads. Using the extension does not require Docker.
- Inspect one context and Dockerfile at a time; Compose, Bake, and build-stage behavior are not interpreted. Incomplete scans and unreadable entries are labeled. Rules are not edited automatically.

## More

[Usage guide](docs/EXAMPLES.md) · [Report an issue](https://github.com/achenachena/dockerignore-inspector/issues) · [Development](docs/DEVELOPMENT.md) · [Privacy](PRIVACY.md) · [MIT license](LICENSE)
