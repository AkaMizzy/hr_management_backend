# HR Management System – Functional Overview (French)

## 📝 Introduction

Ce document présente un résumé clair et détaillé de toutes les fonctionnalités actuellement implémentées dans notre plateforme web de gestion des ressources humaines (GRH). Chaque fonctionnalité est classée par rôle utilisateur et accompagnée d'une brève description de son but et de son fonctionnement.

---

## 1. 🔐 Authentification et Rôles

Le système permet l'authentification sécurisée des utilisateurs à l’aide d’un email et d’un mot de passe.

Les trois rôles disponibles :
- **Employé**
- **Manager**
- **Responsable RH**

Chaque rôle accède à un **tableau de bord personnalisé**, avec des fonctionnalités adaptées à ses responsabilités.

---

## 2. 👤 Fonctionnalités – Employé

- **Consulter son profil** : Affiche toutes les informations personnelles de l'employé (nom, prénom, manager, etc.).
- **Consulter les tâches** : Permet à l'employé de voir ses tâches assignées, ajouter des actions et suivre sa progression.
- **Calendrier** : Visualise les tâches, absences et congés approuvés dans un calendrier intégré.
- **Documents** : Permet de consulter les documents attribués (contrats, attestations, etc.).
- **Demander une attestation** : Crée une demande officielle qui suit une validation (manager → RH).
- **Demander une absence** : Soumet une demande d’absence ponctuelle (date, heure début/fin, motif).
- **Demander un congé** : Planifie un congé avec des dates et un nombre de jours précis.

---

## 3. 🧑‍💼 Fonctionnalités – Manager

- **Gestion des entités** : CRUD sur les entités organisationnelles. Possibilité d’ajouter des entités parentes et d’y associer des employés.
- **Gestion des employés** : CRUD complet sur les employés, avec la possibilité d’assigner un manager.
- **Gestion des documents** : Ajouter, consulter et supprimer les documents liés aux employés.
- **Gestion des tâches** : Créer des tâches, les affecter à un ou plusieurs employés, consulter leurs actions et suivre leur avancement.
- **Validation des attestations** : Accède aux demandes soumises par ses employés. Peut approuver ou refuser (avec justification obligatoire en cas de refus).
- **Validation des absences** : Gère les demandes d'absences. Peut approuver/refuser et définir si elles sont annulables.
- **Validation des congés** : Similaire à l’absence, mais pour des périodes prolongées.

---

## 4. 👨‍💼 Fonctionnalités – Responsable RH

- **Gestion des comptes utilisateurs** : Création de comptes pour les employés/managers, assignation de rôle, et liaison avec les données de la table `employes`.
- **Validation des attestations** : Voit uniquement les demandes validées par le manager. Peut approuver ou refuser (avec justification).
- **Validation des absences** : Même logique que pour les attestations, appliquée aux absences.
- **Validation des congés** : Identique à la validation des absences, mais pour les congés.

---

