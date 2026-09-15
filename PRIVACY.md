# Privacy

Dockerignore Inspector has no telemetry, accounts, analytics, uploads, or runtime network requests. All matching and scanning run locally. The extension reads metadata for the selected context, the chosen Dockerfile's metadata, and applicable ignore text. It does not execute project code or Docker builds.

Context and Dockerfile selections are stored in VS Code workspace state on the local machine. Opening an example creates a disposable copy in the operating system temporary directory. Paths and errors appear only in the local UI. No diagnostic report is transmitted automatically.

User-submitted issue reports are public when submitted to a public repository. Include only a minimal reproduction you are permitted to share.
