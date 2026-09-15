# Usage guide

## Controls

Use **Select context** to choose the context directory and Dockerfile separately. Right-clicking a Dockerfile and choosing **Dockerignore: Inspect Build Context** retains that file while asking for the context. **Select Dockerfile** changes the Dockerfile within the selected context; **Edit rules** opens the active ignore file.

Search uses relative paths. Filters show included, excluded, or draft-changed entries. Double-click a directory to collapse or expand it; use Up/Down to select and Left/Right to collapse or expand. Home and End select the first and last visible entries. Draft changes use Previous/Next pagination.

**Refresh** rescans filesystem changes, including file sizes. Edits to an open active ignore document update the draft automatically; changes made outside the workspace may need Refresh. **Cancel** stops current and queued work; any previous results remain explicitly stale until refreshed.

The default scan limit is 100,000 entries, configurable through `dockerignore.maxEntries`. Limit hits and unreadable entries produce partial results. Invalid rules suppress totals and comparison until corrected. The rule trace shows effective changes, not redundant rules that leave the state unchanged.

Dockerfiles and active ignore files may still be read by Docker as build inputs when excluded from ordinary COPY access. Their displayed inclusion state does not model an entire build.

## Root rules appear to do nothing

Open the bundled example. Select the root context, then `docker/build.Dockerfile`. Its adjacent `build.Dockerfile.dockerignore` replaces the root `.dockerignore`; the UI names the active file. An empty dedicated file still takes precedence.

Without the extension, inspect the Dockerfile path passed with `docker build -f` and check for its adjacent `.dockerignore` file before editing root rules.

## An excluded file comes back

The root example excludes `assets/*`, then includes `!assets/logo.svg`. The logo trace shows the exclusion followed by reinclusion. Remove `!` without saving to see the logo leave the context and the logical byte total fall by 123 B. Undo restores inclusion.

Without the extension, read the entire rule file in order, including parent rules and negations; do not stop at the first pattern that matches.

## COPY cannot find a file

Search for the missing path. If it is excluded, follow the trace to the relevant rule. If included, also check the selected context, COPY source spelling, build stage, and whether the file exists. This extension does not execute or interpret the full Dockerfile.

To check a disposable fixture with Docker directly, create a scratch Dockerfile containing `FROM scratch` and `COPY . /`, then export a local build result outside the context:

```sh
docker buildx build -f Dockerfile --output type=local,dest=../context-output .
```

Use this only on a public or disposable fixture you control. The extension itself never runs a build.
