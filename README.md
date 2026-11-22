# MedoraWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.3.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

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
│   │   │   │   ├── patient.ts
│   │   │   │   ├── reservation.ts
│   │   │   │   └── user.ts
│   │   │   ├── services/
│   │   │   │   ├── patient-api.ts
│   │   │   │   ├── reservation-api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── dashboard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth-interceptor.ts
│   │   │   │   └── error-interceptor.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth-guard.ts
│   │   │   │   └── role-guard.ts
│   │   │   └── config/
│   │   │       └── api.config.ts
│   │   │
│   │   ├── features/                      # Modules fonctionnels
│   │   │   ├── patients/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── patient-list/
│   │   │   │   │   │   ├── patient-list.ts       # ViewModel
│   │   │   │   │   │   ├── patient-list.html     # View
│   │   │   │   │   │   └── patient-list.scss
│   │   │   │   │   └── patient-detail/
│   │   │   │   ├── components/
│   │   │   │   │   ├── patient-card/
│   │   │   │   │   └── status-badge/
│   │   │   │   └── patients.ts
│   │   │   │
│   │   │   ├── reservations/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── reservation-list/
│   │   │   │   │   └── reservation-form/
│   │   │   │   ├── components/
│   │   │   │   └── reservations.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   │   └── dashboard/
│   │   │   │   └── dashboard.ts
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── pages/
│   │   │       │   └── login/
│   │   │       └── auth.ts
│   │   │
│   │   ├── shared/                        # Composants et utilitaires réutilisables
│   │   │   ├── components/
│   │   │   │   ├── search-bar/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   └── empty-state/
│   │   │   ├── pipes/
│   │   │   └── validators/
│   │   │
│   │   ├── app.ts
│   │   ├── app.ts
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
│   ├── auth.spec.ts
│   ├── patients.spec.ts
│   └── reservations.spec.ts
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

## Communication Front end Backend 

```Communication Front-end
Backend

View (HTML)
↓ événement
ViewModel (Component + Signals)
↓ appel
Model (PatientApiService)
↓ HttpClient
HTTP /api/patients
↓
Presentation (Controller / Route)
↓
Application (Use Case)
↓
Domain (Entity + IRepository)
↓
Infrastructure (Prisma Repository)
↓
PostgreSQL```

