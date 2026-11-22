# Spécifications Fonctionnelles et Techniques — Medora MVP Urgence

> **Note aux agents IA et développeurs :** Ce document fait foi comme source de vérité fonctionnelle et de périmètre pour **Medora MVP Urgence**. En cas d’ambiguïté, de conflit d’implémentation ou de doute sur l’inclusion d’une fonctionnalité, référez-vous strictement aux règles, statuts, rôles et exclusions définis ci-dessous.

---

## 1. Contexte et objectif

**Medora MVP** est un outil interne destiné à la clinique pour aider l’unité **Urgence** à suivre les patients et organiser des réservations simples. Il ne vise pas à remplacer un système hospitalier complet, mais à fournir une solution légère, fiable et adaptée aux besoins opérationnels du service.

L’objectif du MVP est de permettre au personnel de l’Urgence de :
- Créer et consulter rapidement les dossiers patients.
- Suivre le statut de chaque patient dans le parcours d’urgence.
- Gérer des réservations simples, notamment les créneaux, consultations ou examens.
- Réduire les erreurs de suivi manuel et améliorer la coordination de l’équipe.

---

## 2. Périmètre du MVP

### Inclus (In-Scope)
- **Gestion des patients :** création, modification, recherche et consultation des informations essentielles.
- **Suivi du statut du patient :** en attente, en cours de prise en charge, en examen, en attente de résultat, prêt pour sortie, sorti, transféré, annulé ou non présenté.
- **Réservations simples :** création, modification, annulation et consultation de rendez-vous ou créneaux.
- **Tableau de bord opérationnel :** vue synthétique des patients en cours, réservations du jour et alertes éventuelles.
- **Gestion des utilisateurs internes :** accès différencié selon les rôles (administrateur, personnel médical, personnel administratif, superviseur Urgence).
- **Journal d’activité minimal :** traçabilité des actions importantes (notamment création, modification et annulation de réservations, changements de statut et actions sensibles).

### Exclus du MVP (Out-of-Scope — Ne pas implémenter)
- Facturation et gestion administrative complète.
- Gestion du dossier médical complet (antécédents, prescriptions, imagerie, résultats de laboratoire).
- Intégration avec les systèmes hospitaliers existants (DPI, radiologie, laboratoire, etc.).
- Gestion des stocks, du personnel, de la paie ou de la planification complexe des équipes.
- Application mobile native.
- Fonctionnalités avancées d’intelligence artificielle ou d’automatisation.

---

## 3. Utilisateurs et rôles

| Rôle | Accès principal | Responsabilités |
| :--- | :--- | :--- |
| **Administrateur** | Gestion complète | Gère les utilisateurs, les rôles, les paramètres et les données de référence. |
| **Personnel médical** | Patients et suivi | Consulte et met à jour le statut des patients, crée des réservations si nécessaire. |
| **Personnel administratif** | Patients et réservations | Crée les dossiers, gère les réservations et assure le suivi administratif. |
| **Superviseur Urgence** | Tableau de bord et suivi | Consulte l’activité, identifie les patients en attente et supervise le flux. |

---

## 4. Fonctionnalités détaillées

### 4.1 Gestion des patients
Le système doit permettre de créer une fiche patient contenant au minimum :
- Nom et prénom
- Date de naissance
- Sexe
- Numéro de téléphone
- Adresse ou zone de résidence
- Numéro de dossier ou identifiant interne
- Motif d’arrivée
- Niveau d’urgence ou priorité
- Statut actuel
- Commentaires internes

**Règles métier :**
- La recherche doit permettre de retrouver rapidement un patient par **nom**, **numéro de dossier**, **téléphone** ou **identifiant**.
- Les informations sensibles doivent être visibles uniquement par les utilisateurs autorisés selon leur rôle.

### 4.2 Suivi du parcours patient
Chaque patient doit avoir un statut clair et actualisable parmi la liste suivante :
- `En attente`
- `En cours de prise en charge`
- `En examen`
- `En attente de résultat`
- `Prêt pour sortie`
- `Sorti`
- `Transféré`
- `Annulé ou non présenté`

**Règles métier :**
- Le personnel doit pouvoir mettre à jour le statut en quelques clics.
- Le système doit impérativement conserver l’**historique transactionnel des changements de statut**, incluant la **date**, l’**heure** et l’**utilisateur responsable**.

### 4.3 Réservations simples
Le MVP doit permettre de :
- Créer une réservation pour un patient.
- Associer la réservation à un **service**, un **praticien** ou un **type d’examen**.
- Définir une **date**, une **heure** et une **durée estimée**.
- Modifier ou annuler une réservation.
- Afficher les réservations du **jour**, de la **semaine** ou selon un **filtre choisi**.
- Distinguer les statuts de réservation : `Confirmée`, `En attente` et `Annulée`.

**Règles métier :**
- Les réservations doivent rester simples : il ne s’agit pas d’une planification hospitalière complète, mais d’un outil de coordination rapide.

### 4.4 Tableau de bord
Le tableau de bord doit afficher de manière claire, rapide à lire et adaptée aux périodes d’affluence :
- Le nombre de patients **en attente**.
- Le nombre de patients **en cours de prise en charge**.
- Les **réservations du jour**.
- Les **réservations à venir**.
- Les **alertes :** patients dont le statut n’a pas été mis à jour depuis une durée définie.
- Les **réservations annulées ou modifiées récemment**.

### 4.5 Gestion des utilisateurs
Le système doit permettre à un administrateur de :
- Créer un compte utilisateur.
- Attribuer un rôle.
- Désactiver un compte.
- Réinitialiser un mot de passe.
- Consulter la liste des utilisateurs actifs.

**Règles de sécurité :**
- Les mots de passe doivent être hachés et stockés de manière sécurisée.
- L’accès à l’application et aux API doit être protégé par authentification.

---

## 5. Exigences fonctionnelles

| Référence | Exigence | Priorité |
| :--- | :--- | :--- |
| **F-01** | Créer, modifier et rechercher un patient | Haute |
| **F-02** | Mettre à jour le statut d’un patient | Haute |
| **F-03** | Conserver l’historique des changements de statut | Haute |
| **F-04** | Créer, modifier et annuler une réservation | Haute |
| **F-05** | Afficher les réservations par jour et par statut | Haute |
| **F-06** | Afficher un tableau de bord de l’activité Urgence | Haute |
| **F-07** | Gérer les utilisateurs et leurs rôles | Haute |
| **F-08** | Restreindre l’accès selon le rôle | Haute |
| **F-09** | Journaliser les actions importantes | Moyenne |
| **F-10** | Exporter une liste de patients ou de réservations en CSV | Moyenne |

---

## 6. Exigences non fonctionnelles

### Sécurité
- Authentification obligatoire pour tous les utilisateurs.
- Gestion stricte des rôles et des permissions (RBAC).
- Protection des données personnelles et médicales.
- Journalisation des accès et des actions sensibles.
- Sauvegarde régulière des données.

### Performance
- Chargement des pages principales en **moins de 3 secondes** dans des conditions réseau normales.
- Résultats de recherche patient retournés rapidement, idéalement en **moins de 2 secondes**.
- Stabilité et réactivité maintenues pendant les périodes de forte activité.

### Utilisabilité
- Interface simple, claire et adaptée à un usage rapide.
- Navigation limitée à un nombre réduit d’écrans.
- Formulaires courts et compréhensibles.
- Messages d’erreur explicites.
- Interface responsive, utilisable sur **ordinateur** et **tablette**.

### Fiabilité
- Aucune perte de données lors d’une coupure momentanée de connexion.
- Enregistrement fiable et transactionnel des réservations et des changements de statut.
- Possibilité de restauration des données à partir d’une sauvegarde récente.

---

## 7. Contraintes

- **Délai :** livraison du projet dans un délai de **2 mois**.
- **Déploiement :** solution utilisable en interne par la clinique.
- **Approche :** privilégier la simplicité, la rapidité de mise en œuvre et la fiabilité.
- **Intégrations :** aucune intégration externe dans cette première phase.
- **Gestion du périmètre :** toute fonctionnalité supplémentaire doit faire l’objet d’une validation explicite avant ajout au périmètre.

---

## 8. Livrables

À la fin des 2 mois, le projet doit livrer :
- [ ] Une application web fonctionnelle de **Medora MVP Urgence**.
- [ ] Un module de gestion des patients.
- [ ] Un module de suivi du statut des patients.
- [ ] Un module de réservations simples.
- [ ] Un tableau de bord opérationnel.
- [ ] Un système d’authentification et de gestion des rôles.
- [ ] Une documentation utilisateur courte.
- [ ] Une documentation technique minimale.
- [ ] Un jeu de données de démonstration ou de test.
- [ ] Un plan de déploiement interne.

---

## 9. Planning indicatif sur 2 mois

| Période | Travaux principaux | Livrable |
| :--- | :--- | :--- |
| **Semaine 1** | Validation du périmètre, maquettes, modèle de données et choix techniques | Maquettes et architecture validées |
| **Semaines 2 à 3** | Développement de la gestion des patients et de l’authentification | Module patients fonctionnel |
| **Semaines 4 à 5** | Développement du suivi de statut, des réservations et du tableau de bord | Fonctionnalités principales disponibles |
| **Semaine 6** | Tests, corrections, gestion des rôles, journalisation et export CSV | Version de test complète |
| **Semaines 7 à 8** | Recette interne, formation, déploiement et ajustements finaux | MVP livré et opérationnel |

---

## 10. Critères d’acceptation

Le MVP sera considéré comme livré lorsque :
- [ ] Un utilisateur autorisé peut créer, rechercher et consulter un patient.
- [ ] Le personnel peut modifier le statut d’un patient et consulter son historique.
- [ ] Une réservation peut être créée, modifiée, annulée et consultée.
- [ ] Le tableau de bord affiche correctement les patients et réservations du jour.
- [ ] Les rôles limitent correctement les accès.
- [ ] Les actions importantes sont enregistrées dans le journal d’activité.
- [ ] L’application est accessible via un navigateur sur ordinateur ou tablette.
- [ ] Les tests de recette principaux sont validés.
- [ ] La documentation utilisateur est disponible.
- [ ] L’application est déployée dans l’environnement interne prévu.

---

## 11. Risques principaux

| Risque | Impact | Mesure de prévention |
| :--- | :--- | :--- |
| **Périmètre trop large** | Retard de livraison | Maintenir le MVP limité aux fonctions essentielles |
| **Mauvaise adoption par le personnel** | Faible utilisation | Impliquer les utilisateurs dès les maquettes et prévoir une formation |
| **Données sensibles mal protégées** | Risque de sécurité et conformité | Appliquer l’authentification, les rôles et les sauvegardes dès le départ |
| **Réservations trop complexes** | Surcharge du développement | Limiter la réservation à un modèle simple et clair |
| **Absence de recette structurée** | Bugs en production | Prévoir une semaine dédiée aux tests et corrections |