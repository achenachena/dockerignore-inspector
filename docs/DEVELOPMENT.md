# Development

## Architecture

The TypeScript extension host owns selection, filesystem enumeration, VS Code document events, and a generation counter. A dedicated Node worker runs Go WASM with pinned `github.com/moby/patternmatcher v0.6.0`. The Webview renders validated host results using text nodes and local resources only.

Enumeration is reused for draft recalculation. New work aborts scanning, terminates the old matching worker, and advances the generation counter. Late results are discarded. Full refresh repeats enumeration. The UI virtualizes the path tree and paginates draft changes.

The Go adapter retains line mappings while using upstream ignore parsing. A standalone `.` rule is ignored, matching Docker's documented historical behavior. Final states use `MatchesOrParentMatches`; explanations evaluate rule prefixes on demand and record only state changes. No private Moby API is used.

The runtime includes WASM and the matching Go distribution's `wasm_exec.js`. End users need no compiler. Windows is blocked because WASM uses slash-oriented path semantics and native Windows behavior has not been validated.

## Build and debug

Install Node.js 22+ and Go 1.24+, then run the README commands. The Go build is part of `npm run build`. Development caches on macOS default to temporary directories; standard Go caches are used on other hosts.

Launch VS Code with `--extensionDevelopmentPath` pointing to this repository for development. Final acceptance must use the generated VSIX, not only development loading.

`npm run test:integration` installs the VSIX into isolated extension/user directories and uses a small test harness to drive the installed extension through VS Code APIs. Set `VSCODE_EXECUTABLE_PATH` and `VSCODE_CLI_PATH` on systems where their default macOS locations do not apply. Linux CI runs the harness under Xvfb.

`npm run test:docker` uses FROM scratch and local build outputs. Temporary inputs and outputs are separate. It never builds the user's project. Docker Desktop or another functional Docker/BuildKit environment must be running.

## Boundaries

Filename and rule strings are never inserted as HTML. Webview scripts cannot read arbitrary paths. File-open requests must identify a scanned regular file whose resolved path stays inside the selected context. Rule jumps are limited to the active ignore file. The selected Dockerfile may be outside the context by explicit selection.

This is a preview, not a hardened filesystem sandbox against adversarial concurrent filesystem mutation. Refresh after files change. Unknown metadata and unsupported special entries cannot be interpreted as excluded files.
