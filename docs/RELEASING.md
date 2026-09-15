# Release maintenance

Publisher ID: `achenachen`. Public packages target only `darwin-arm64` and `linux-x64`. Keep the current minimum VS Code version and platform restrictions unless separately validated changes justify an update.

## Package checks

Check existing Marketplace versions and GitHub tags before choosing a new version. Update `package.json`, the lockfile and CHANGELOG together. Regular-channel packages must use explicit platform targets and omit `--pre-release`:

```sh
npm run package -- darwin-arm64
npm run package -- linux-x64
```

Cross-packaging does not validate a platform. For runtime changes, use the existing installed-VSIX integration checks on each supported host; see [DEVELOPMENT.md](DEVELOPMENT.md). Keep the macOS test window foregrounded for Undo. Windows CI tests a gated candidate package and does not establish public Windows support.

Inspect each final archive for version, publisher, target, release-channel metadata, runtime files, licenses and README image links. Exclude private handoff documents, credentials and test outputs. Generate `SHA256SUMS` from the exact final artifacts. Do not replace an already published binary under the same version.

## Synchronize documentation

The repository README is the source for Marketplace's description, but Marketplace serves the README embedded in the uploaded VSIX. A GitHub commit does not update that description.

To synchronize a README change:

1. Review and commit the documentation. Use `docs/RELEASE_0.2.0.md` as replacement text for the existing GitHub 0.2.0 release body; changing that body does not require a new tag or asset upload.
2. When ready to update Marketplace, choose an unused patch version, update version metadata and CHANGELOG, and package both existing targets without `--pre-release`.
3. Check the new VSIX metadata, included README, images and links. A documentation-only update does not require repeating the full Docker or cross-platform runtime suite.
4. In [Manage Extensions](https://marketplace.visualstudio.com/manage/publishers/achenachen), use **Update** on the same extension for each platform package. Wait for verification, then compare the public description with the repository README.

## GitHub releases

Use concise, user-facing notes: changes, compatibility, known issues, and installation. Attach the two platform VSIX files and `SHA256SUMS`; keep detailed checks in [VALIDATION.md](VALIDATION.md). Regular versions use a regular GitHub release. Preserve historical pre-release flags and artifacts.

Review release notes before changing online release bodies. Documentation maintenance must not silently replace released artifacts.

Reference: [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
