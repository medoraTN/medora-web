# Repository Guidelines

## Project Structure & Module Organization

This repository is an Angular frontend. Application code lives in `src/app/`: `core/` contains shared models, API services, guards, interceptors, and configuration; `features/` groups screens by domain (auth, dashboard, patients, reservations). Keep each screen's TypeScript, HTML, CSS, and unit spec together. Global styles and bootstrap files are in `src/`; static assets are in `public/`. Browser-level Playwright specs are under `src/e2e/`.

## Build, Test, and Development Commands

Run commands with npm from the repository root:

- `npm install` installs the locked dependencies.
- `npm start` serves the app locally at `http://localhost:4200/` with reloads.
- `npm run build` compiles the production app into `dist/`.
- `npm test` runs Angular's unit-test target (Vitest).
- `npm run e2e` runs Playwright browser tests; `npm run e2e:ui` opens its interactive UI.

## Coding Style & Naming Conventions

Use two spaces, UTF-8, and a final newline. Follow `.prettierrc`: single quotes in TypeScript, Angular HTML formatting, and a 100-character print width. Use lowercase kebab-case for feature folders and file basenames (for example, `patient-detail.ts`); keep a screen's `.html`, `.css`, and `.spec.ts` beside its TypeScript file. Put cross-feature services and models in `core/`, and keep domain UI within its `features/<domain>/` folder.

## Testing Guidelines

Unit specs use the `*.spec.ts` suffix and live next to the code they cover. Add or update tests for behavior changes, especially API service, auth, and routing behavior. E2E specs in `src/e2e/` exercise complete user flows. Run `npm test` and, when changing browser flows, `npm run e2e` before submitting. No repository-wide coverage threshold is configured.

## Commit & Pull Request Guidelines

Recent commits use short conventional-style prefixes such as `chore:`. Use an imperative, focused subject (for example, `feat: add patient search`) and keep unrelated changes separate. A pull request should explain the user-visible change, link its issue when applicable, list validation commands and results, and include screenshots for UI changes. Call out API contract or configuration changes explicitly.

## Configuration & API

Keep backend access behind the `core/services` API clients and follow `API_CONTRACT.md` when changing request or response shapes. Do not commit credentials or local secrets; use the project's configuration mechanisms for environment-specific values.
