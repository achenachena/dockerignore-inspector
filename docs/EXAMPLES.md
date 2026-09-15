# Three reproducible investigations

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
