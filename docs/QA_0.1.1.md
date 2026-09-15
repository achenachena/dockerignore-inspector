# Installed 0.1.1 audit

Date: September 15, 2026. Source: `294834d` (runtime/package source `14457fb`). Host: macOS arm64, VS Code 1.137.0.

## Summary

The installed Marketplace extension's 32 non-manifest files match the verified darwin-arm64 VSIX byte-for-byte. The installation metadata identifies darwin-arm64. Core installed workflows passed again. Three interaction defects were reproduced; no core matching failure or unintended file write was observed in the exercised scenarios. This is a bounded audit, not a guarantee that all bugs have been found.

No production source, published package, or user's working document was modified during the audit.

## Findings

### P2: Cancel does not cancel a pending draft debounce

Source: `src/extension.ts:55` and `src/extension.ts:420`.

A rule edit schedules an update after 250 ms. Calling Cancel during that delay calls `stop()`, but does not clear the timer. The timer subsequently starts a new evaluation and replaces the cancelled status/results.

Reproduction used the actual installed extension bundle, real filesystem and WASM worker, with a mock VS Code host: trigger a draft document event, wait 30 ms, invoke the webview Cancel handler, then wait 600 ms. Observed messages after cancellation: `Recalculating rules…`, a new snapshot, and `Ready`. Reproduced twice. This does not write the ignore file, but violates the Cancel action's expected behavior.

Suggested correction: clear the debounce timer when stopping/cancelling and ensure deliberate scheduling creates a fresh timer.

### P2: Multiple outstanding explanations for the same file append duplicate rules

Source: `webview/app.js:430`.

Selecting the same file twice can queue two explanation requests. Each response is accepted solely by matching the selected path and appends to the explanation container. The second response duplicates the first response's rule list.

Reproduction used the installed Webview script in Chromium: click the same row twice, deliver both matching explanation responses, inspect the rule buttons. One effective rule appeared twice. Responses were supplied by the test harness; this establishes the response-handling defect, not its frequency in ordinary desktop use. There is no request identity or result replacement to prevent duplication.

Suggested correction: replace the current rule-result section, or associate responses with the latest selection request.

### P3: First ArrowDown skips the first entry

Source: `webview/app.js:211–228`.

With no selected row, the handler sets the index to zero and then increments it. The first ArrowDown selects `file-00001.txt` rather than `file-00000.txt`. Reproduced with actual browser keyboard events against the installed script. Home and Enter remain usable workarounds.

## Checks actually run

| Area | Result and boundary |
| --- | --- |
| Package identity | 32 non-manifest installed files match the final release archive; no differences |
| Real VS Code integration | Passed isolated installation, activation, WASM, example scan, aliased draft edits, Undo, invalid rules, save baseline, rapid edits |
| Static and unit checks | Lint and TypeScript passed; Node tests: 10 passed, one Windows-only skip |
| Matcher compatibility | Nine native macOS/WASM matching and explanation comparisons passed |
| Host behavior | Installed bundle with mock VS Code host: explanation dispatch, empty dedicated ignore precedence, invalid-rule recovery, missing-Dockerfile recovery, rule navigation passed |
| Open-path safety | Mock host + actual installed code: unknown traversal path rejected; replacing a listed file with an outside-context symlink did not open it; invalid rule line ignored |
| Workspace gates | Mock host: remote and untrusted commands rejected |
| Webview | Search, empty filter, End navigation, scrolled draft link, error recovery, pagination passed |
| Filename rendering | HTML-like filename remained text; no injected image or handler execution |
| Layout | Inspected dark narrow 420 px and light 1000 px renderings; no horizontal document overflow at those widths; theme variables supplied by harness |
| Browser errors | No uncaught browser errors reported in exercised flows |

## Performance sample

One run against this repository's real `node_modules` directory, without executing its contents:

- 16,950 entries; complete scan: 488.6 ms.
- WASM matching including worker startup: 298.0 ms.
- Node process RSS at sample: 92.3 MiB; this is not total VS Code memory usage.
- Maximum 10 ms heartbeat interval observed: 21.3 ms.
- Active scan cancelled at 250 entries: 3.7 ms, correctly marked partial.
- Separate browser sample with 100,000 synthetic paths: 19.7 ms synchronous snapshot render, 24 DOM rows. This is not a full 100,000-file disk scan or an end-to-end frame-rate measurement.

## Reused evidence and untested scope

The unchanged matcher/runtime was already validated by [CI run 35029566456](https://github.com/achenachena/dockerignore-inspector/actions/runs/35029566456): Linux final VSIX integration, native Go and upstream Moby tests, nine real Linux Docker COPY cases, Windows candidate integration, and Windows-vs-Linux context sets. Those remote jobs were not rerun in this audit.

Browser tests use the installed HTML/CSS/JavaScript with a message harness and without VS Code's CSP wrapper. They do not prove every native dialog, actual screen-reader behavior, or every desktop theme works. The real VS Code integration covers the core installed workflow separately. Security checks are targeted tests and source review, not a complete security audit.

Windows 10/11 plus Docker Desktop Linux containers, Intel macOS, Linux ARM, Alpine, WSL, Remote SSH, Dev Containers, and Web are not newly validated. Existing support restrictions remain. Long-duration resource leaks and million-entry workspaces were not tested.

## Evidence

Local diagnostic scripts/results are under `.test-work/audit/`: `host.cjs`, `host-result.json`, `browser-check.js`, `browser-result.json`, `integration-result.json`, `integration.log`, `unit.log`, `parity.log`, `performance.cjs`, `performance.json`, and layout screenshots. These ignored diagnostic files are not release assets.

Recommendation: keep the current preview available and address the three interaction issues in the next patch. Do not silently replace published 0.1.1 binaries. No fix or new publication is claimed by this report.
