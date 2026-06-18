# Modernization Task Checklist

Use this checklist to keep the redesign systematic rather than reactive.

## Operating Rhythm

- [ ] One architecture decision per major irreversible choice.
- [ ] One short research note per unknown that can affect implementation.
- [ ] Characterization tests before replacing working behavior.
- [ ] Small PRs: shell, state, feature extraction, migration, hardening.

## Phase 0: Project Operating System

- [x] Create modernization blueprint.
- [x] Add ADR template.
- [x] Add research note template.
- [x] Add modernization task checklist.

## Phase 1: Discovery and Characterization

- [ ] Map current root responsibilities.
- [ ] Document localStorage schemas and migration assumptions.
- [ ] Add tab lifecycle characterization test.
- [ ] Add script execution characterization test.
- [ ] Add find/replace characterization test.

## Phase 2: Shell Prototype

- [x] Create `AppShell` slot API.
- [x] Add top/menu/list/content/bottom layout CSS.
- [x] Render current app surface inside the content region.
- [x] Add shell layout unit test; Playwright browser install is blocked in this environment.
- [ ] Add initial shell visual baseline.

## Phase 3: Feature Extraction

- [ ] Extract editor feature contract.
- [ ] Extract scripts feature contract.
- [ ] Extract sessions feature contract.
- [ ] Extract settings feature contract.
- [ ] Extract clipboard feature contract.
- [ ] Extract updater feature contract.

## Phase 4: Content Tabs

- [ ] Define typed content tab schema.
- [ ] Add migration tests from current workspace tabs.
- [ ] Support document content tabs.
- [ ] Support script/detail content tabs.
- [ ] Support settings/log content tabs.

## Phase 5: Hardening

- [ ] Add performance budget checks.
- [ ] Add accessibility keyboard navigation checks.
- [ ] Add CI gates for migration tests.
- [ ] Retire legacy root composition.
