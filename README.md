# MedoraWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.3.0.

## Développement local — Sprint 1

Démarrer Medora API sur le port 3000 avec une base migrée et un compte de démonstration. Lancer `npm ci`, puis `npm start` dans ce dépôt. Ouvrir `http://localhost:4200`. Le proxy Angular redirige `/api` vers Medora API. Le déploiement doit servir le frontend et l’API sous la même origine.

La connexion donne accès aux dossiers patients. Les actions disponibles dépendent du rôle. Le jeton reste en mémoire pendant la session Angular. Recharger la page demande une nouvelle connexion.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Tests de bout en bout

Lancer `npx playwright install chromium`. Démarrer l’API sur une base dédiée aux parcours E2E avec un compte de démonstration `ADMIN` ou `MEDICAL`. Exporter `MEDORA_E2E_EMAIL` et `MEDORA_E2E_PASSWORD`, puis lancer `npm run e2e`. Playwright démarre le frontend si nécessaire. Le scénario crée un dossier fictif dans la base connectée.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Architecture frontend — Angular MVVM

Le frontend Angular applique le modèle **MVVM** :
- **View** : le template HTML
- **ViewModel** : le composant Angular avec son état et sa logique de présentation
- **Model** : les services, clients API, DTO et état applicatif

```text
medora-web/
├── src/
│   ├── app/
│   │   ├── core/                          # Modèle, infrastructure et services transverses
│   │   │   ├── models/
│   │   │   │   ├── patient.model.ts
│   │   │   │   ├── reservation.model.ts
│   │   │   │   └── user.model.ts
│   │   │   ├── services/
│   │   │   │   ├── patient-api.service.ts
│   │   │   │   ├── reservation-api.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── dashboard.service.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   └── config/
│   │   │       └── api.config.ts
│   │   │
│   │   ├── features/                      # Modules fonctionnels
│   │   │   ├── patients/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── patient-list/
│   │   │   │   │   │   ├── patient-list.component.ts       # ViewModel
│   │   │   │   │   │   ├── patient-list.component.html     # View
│   │   │   │   │   │   └── patient-list.component.scss
│   │   │   │   │   └── patient-detail/
│   │   │   │   ├── components/
│   │   │   │   │   ├── patient-card/
│   │   │   │   │   └── status-badge/
│   │   │   │   └── patients.routes.ts
│   │   │   │
│   │   │   ├── reservations/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── reservation-list/
│   │   │   │   │   └── reservation-form/
│   │   │   │   ├── components/
│   │   │   │   └── reservations.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   │   └── dashboard/
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── pages/
│   │   │       │   └── login/
│   │   │       └── auth.routes.ts
│   │   │
│   │   ├── shared/                        # Composants et utilitaires réutilisables
│   │   │   ├── components/
│   │   │   │   ├── search-bar/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   └── empty-state/
│   │   │   ├── pipes/
│   │   │   └── validators/
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.development.ts
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── e2e/                                   # Tests end-to-end
│   ├── auth.e2e.spec.ts
│   ├── patients.e2e.spec.ts
│   └── reservations.e2e.spec.ts
│
├── angular.json
├── package.json
├── playwright.config.ts
└── tsconfig.json
```
## Répartition des responsabilités

| Sujet | Backend | Frontend |
| :--- | :--- | :--- |
| **Règles métier** | Domain + Application | Aucune règle métier complexe |
| **Validation** | Validation serveur obligatoire | Validation UX dans les formulaires |
| **Authentification** | JWT, hachage, rôles | Stockage du token, interceptor, guards |
| **Accès base de données** | Infrastructure / Prisma | Jamais directement |
| **État applicatif** | Base de données | Signals et services Angular |
| **Tests** | Jest, Supertest, Playwright API | Jasmine/Karma ou Vitest, Playwright UI |
| **Déploiement** | API Node + base de données | Build Angular servi par Nginx, CDN ou backend |

