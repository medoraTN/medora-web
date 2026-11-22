---
name: medora-git-and-pr
description: Enforce Medora GitHub Flow branching, atomic commits, secret hygiene, and the team French Pull Request template.
---

## When to Use
Load this skill whenever starting a Jira ticket, creating or updating a Git branch, committing changes, or preparing a Pull Request description.

## Branching & Sync Rules
1. **Never work on `main`.**
2. Always create a new branch from the latest `main`:
   ```bash
   git switch main
   git pull origin main
   git switch -c <type>/med-<number>-<slug>
   ```
3. **Allowed prefixes:**
   - `feature/med-<number>-<slug>` (new feature)
   - `fix/med-<number>-<slug>` (bug fix)
   - `refactor/med-<number>-<slug>` (refactoring)
   - `docs/med-<number>-<slug>` (documentation)
   - `test/med-<number>-<slug>` (tests)
   - `release/v<version>` (release)
4. **Scope discipline:** One branch = one Jira ticket. Do not bundle unrelated tickets or modify files outside the ticket's scope.
5. **Syncing with `main`:** Update the feature branch regularly using `git fetch origin && git merge origin/main` (or `git rebase origin/main` if clean).

## Commit & Secret Hygiene
- Make frequent, atomic commits using Conventional Commits (for example, `feat(patients): add patient creation endpoint`).
- Verify no `.env`, credentials, tokens, or generated folders (`dist/`, `coverage/`) are staged.
- If new environment variables are introduced, update `.env.example` with placeholder values.

## Pull Request Output Template
When the ticket is ready for review, generate the PR description strictly in this format:

```markdown
## Ticket Jira
MED-<numéro> — <Titre du ticket>

## Description
<Résumé changements clair des et fonctionnels techniques>

## Changements
- <Liste ajoutés cases, composants, des et modifiés ou repositories, routes tests use>

## Tests
- [ ] Tests unitaires
- [ ] Tests d’intégration
- [ ] Tests E2E
- [ ] Vérification manuelle

## Checklist
- [ ] Le ticket Jira est à jour
- [ ] Aucun secret n’est commité
- [ ] `.env.example` est à jour
- [ ] La documentation est mise à jour
- [ ] Les critères d’acceptation sont couverts
```