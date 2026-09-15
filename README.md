# Dockerignore Inspector

See which files your Docker build context includes, why their state changes, and what happens as you edit `.dockerignore`.

A local VS Code Desktop extension for debugging ignore rules. No Docker daemon, account, Go installation, network connection, or API key is needed to inspect a directory.

![Actual installed VSIX: unsaved rule changes and their impact](docs/images/draft-dark.png)

[Watch the saved → draft → undo capture](docs/images/draft-preview.gif). These are captures of the installed extension, not mockups.

## Install the preview

Source: [achenachena/dockerignore-inspector](https://github.com/achenachena/dockerignore-inspector). This preview is not yet published on Marketplace. Build the VSIX using the development instructions, or use the locally supplied `dist/dockerignore-inspector-0.1.0.vsix`:

1. In VS Code, run **Extensions: Install from VSIX…**.
2. Select the VSIX, then reload if prompted.
3. Run **Dockerignore: Open Example** to try it immediately.

The extension uses publisher ID `achenachen`. Marketplace publication is still pending. If you installed the earlier `local-preview` package, uninstall it before installing this package to avoid duplicate commands.

## Try it in three steps

1. Run **Dockerignore: Inspect Build Context**. Select the context directory, then the Dockerfile you actually build with. These are separate choices.
2. Select a file in the tree. Follow the effective rule changes and click a rule to jump to its line.
3. Edit the active ignore file without saving. The **Draft impact** panel compares the draft with the saved rules. Undo to restore the previous result.

**Open example** copies a tiny fixture into a temporary directory and opens its rules. Remove the `!` from `!assets/logo.svg` without saving: the logo becomes excluded. Use **Select Dockerfile** to choose `docker/build.Dockerfile` in that example and see its dedicated ignore file take precedence.

Search by relative path, filter included/excluded/changed entries, and refresh after filesystem changes. Double-click a directory to collapse it. Use Up/Down to select and Left/Right to collapse/expand. Changed-file lists have pagination.

## What the numbers mean

The tree shows rule-based context inclusion and logical sizes of regular files. Directory sizes sum included descendant files once. This is **not image size, actual BuildKit transfer size, or measured build-time savings**. Build stages, COPY commands, caches, and incremental transfer affect those separately.

Dockerfile-specific ignore files replace root rules, including when the dedicated file is empty. Ignored Dockerfiles and active ignore files can still be read by Docker as build inputs; that does not make them available to ordinary COPY operations.

The trace lists effective state transitions in rule order. A later redundant rule that leaves the state unchanged is not shown as a new cause. Matching uses pinned Moby patternmatcher, with a WASM worker bundled in the extension.

## Support and limits

- Local trusted VS Code Desktop workspaces on macOS and Linux. See [validation](docs/VALIDATION.md) for actual tested platforms; Windows, Web, remote SSH, WSL, and Dev Containers are blocked in this preview.
- One selected context and Dockerfile at a time. No Compose/Bake parsing, remote Git contexts, named contexts, or Dockerfile execution.
- Symlinks are listed but not followed or included in logical byte totals. Target COPY behavior is not simulated. Special filesystem entries are unknown.
- Manual refresh discovers file changes. Active ignore edits update automatically inside the workspace; use Refresh for external-context changes.
- The default scan limit is 100,000 entries. Configure `dockerignore.maxEntries` to change it. Partial results are labeled, and unreadable entries are unknown.
- Invalid rules disable totals and draft comparison. A cancelled operation leaves explicitly stale previous results until refreshed.
- The extension reads filesystem metadata and necessary rule text only. It never executes project code or automatically modifies rules.

## Privacy and feedback

No telemetry, uploads, accounts, or runtime network requests. See [PRIVACY.md](PRIVACY.md).

When reporting a problem, provide a minimal public fixture, expected behavior, actual behavior, and VS Code/OS versions. Remove private paths, credentials, and proprietary source. Do not upload an entire private project.

## Development

Requires Node.js 22+, Go 1.24+, and VS Code Desktop. Docker is needed only for compatibility tests.

```sh
npm ci
npm run build
npm run lint
npm run typecheck
npm test
npm run test:engine
npm run test:docker
npm run package
npm run test:integration
```

See [development](docs/DEVELOPMENT.md), [validation](docs/VALIDATION.md), and [release preparation](docs/RELEASING.md). This is an independent community tool, not an official Docker product.
