# Medora Web

- Suivre le MVVM du README. Le HTML affiche l’état et émet les événements. Le composant Angular gère l’état de présentation avec des signals. Les services et modèles typés de `src/app/core` portent les accès HTTP et l’état partagé.
- Ranger les pages et composants propres au métier sous `src/app/features/<fonctionnalité>/`. Réserver `src/app/shared` au code réutilisable. Suivre les composants standalone, le nommage et les feuilles CSS du code existant.
- Passer par `HttpClient` dans les services, avec une configuration d’URL centralisée. Aligner routes, DTO, erreurs et rôles avec `medora-api`. Employer les intercepteurs pour les préoccupations HTTP transverses et les guards pour la navigation. L’API décide des permissions et des règles métier.
- Valider les formulaires pour guider l’utilisateur. Traiter le chargement, les résultats vides, les erreurs et les soumissions en cours. Préserver la saisie après une erreur récupérable et confirmer le succès après la réponse serveur.
- Optimiser les parcours Urgence pour un usage rapide sur ordinateur et tablette. Privilégier les formulaires courts, les messages explicites et un tableau de bord lisible en période d’affluence.
- Appliquer la DoD aux changements concernés. Tests unitaires nécessaires, E2E pour les parcours critiques touchés, vérification manuelle en développement et documentation pertinente. Écarter secrets, artefacts générés et dépendances inutiles des commits.
- Suivre GitHub Flow. Une branche par ticket Jira depuis `main`, des commits atomiques et une PR avec le ticket, les changements et les vérifications. La DoD demande une revue par un autre développeur, des tests verts, un squash merge dans `main` et le ticket Jira dans Done.

Pour modifier une fonctionnalité, utiliser [medora-web-feature](.agents/skills/medora-web-feature/SKILL.md).
