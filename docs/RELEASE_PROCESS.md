# Boop2 Release Process

This document describes how to release a new version of Boop2. The release process is highly automated using GitHub Actions.

## 1. Versioning
Boop2 follows [Semantic Versioning (SemVer)](https://semver.org/):
- **MAJOR** version for incompatible API changes.
- **MINOR** version for functionality in a backwards compatible manner.
- **PATCH** version for backwards compatible bug fixes.

## 2. Pre-release Checklist
Before releasing, ensure:
- [ ] All tests pass locally: `npm run test`
- [ ] Code is formatted: `npm run format`
- [ ] Linting is clean: `npm run lint`
- [ ] Version in `package.json` is updated.
- [ ] Version in `src-tauri/tauri.conf.json` is updated.
- [ ] Documentation is up to date.

## 3. Creating a Release
To trigger an automated release:

1. **Update version numbers** in the following files:
   - `package.json`
   - `src-tauri/tauri.conf.json`

2. **Commit and Push** the changes:
   ```bash
   # Ensure you are on the main branch
   git checkout main
   git pull origin main

   git add package.json src-tauri/tauri.conf.json
   git commit -m "chore: bump version to vX.Y.Z"
   git push origin main
   ```

3. **Create and Push a Tag**:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

## 4. Automated Workflow
Once the tag is pushed, the **Release Workflow** (`release.yml`) will:
1. Detect the new tag.
2. Build the application for **macOS (Intel + Apple Silicon)**, **Linux (x64)**, and **Windows (x64)**.
3. Create a new GitHub Release with the tag name.
4. Upload all generated artifacts (.dmg, .deb, .AppImage, .msi, etc.).

## 5. Verification
After the workflow completes (approx. 20-30 minutes):
1. Go to the **Releases** section of the GitHub repository.
2. Verify that all platform binaries are attached.
3. Download and test the binaries on at least one platform to ensure integrity.
