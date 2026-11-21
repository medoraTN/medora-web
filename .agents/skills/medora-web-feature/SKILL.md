---
name: medora-web-feature
description: Implémente et vérifie les parcours Angular de Medora Web. À utiliser pour les pages, formulaires, routes, services HTTP, guards, intercepteurs et états de présentation des patients, réservations, du tableau de bord ou de la connexion.
---

# Développer un parcours Medora Web

1. Lire [les règles](../../../AGENTS.md) et [l’architecture](../../../README.md). Si le dossier parent contient les PDFs du projet, consulter le cahier des charges pour les critères métier, Communication Front-end Backend pour le flux, et Definition Of Done et Workflow Git pour la livraison. Vérifier les routes et providers réellement configurés avant de réutiliser un fichier du scaffold.
2. Confirmer le contrat avec `medora-api` avant de brancher un écran. Reprendre les noms de champs, valeurs de statut, filtres et erreurs du contrat. Utiliser un service HTTP typé et enregistrer `HttpClient` et les intercepteurs nécessaires dans la configuration Angular.
3. Relier la page à la navigation et aux guards applicables. Dans le ViewModel, appeler le service, exposer l’état via des signals et gérer les actions du formulaire. Dans le template, rendre les états de chargement, de contenu, de résultat vide et d’erreur avec une action de reprise adaptée.
4. Depuis la racine Web, exécuter `npm run build` et `npm test -- --watch=false` pour les vérifications Angular/Vitest. Pour un parcours critique touché, exécuter `npm run e2e` avec Playwright et les services de test configurés. Vérifier manuellement sur ordinateur et tablette avec des données fictives. Signaler les vérifications bloquées par une configuration manquante.

## Exemple

Pour modifier une réservation, tester le formulaire et l’appel au service, la confirmation après succès et la conservation de la saisie en cas d’erreur. Vérifier que la liste affiche la réservation mise à jour après la réponse serveur.
