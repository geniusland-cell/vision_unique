# 📋 IDENTIFIANTS DE TEST - VISION UNIQUE

## 🚀 Applications

- **Manager/Admin Dashboard**: http://localhost:5173/
- **Vendor App**: http://localhost:5174/maman-power-app/
- **Admin Panel**: http://localhost:5175/ (Nouvelle app)

---

## 👥 COMPTES UTILISATEURS

### 1️⃣ VENDOR/UTILISATEUR - Test User

- **Type**: Utilisateur/Vendor
- **Nom**: Test User
- **Téléphone**: +242 06 999 99 99
- **Mot de passe**: revolution3d
- **Application**: maman-power-app (http://localhost:5174/maman-power-app/)
- **Rôle**: Vendor - Voir les dépôts et les produits disponibles

### 2️⃣ MANAGER - Jean Backup

- **Type**: Manager
- **Nom**: Jean Backup
- **Téléphone**: +242 06 555 44 33
- **Mot de passe**: manager123
- **Application**: depot-dashboard (http://localhost:5173/)
- **Dépôt**: "Dépôt Jean - Poto-Poto" (Créé automatiquement)
- **Statut**: ✅ ACTIF

### 3️⃣ ADMIN - Genius Mampouya (NOUVELLE APP: admin-panel)

- **Type**: Administrateur/Admin
- **Nom**: Genius Mampouya
- **Email**: mampouyaraphael04@gmail.com
- **Mot de passe**: 242N64007
- **Référence**: 242N64007
- **Application**: admin-panel (http://localhost:5175/)
- **Rôle**: Admin - Gérer tous les managers et dépôts, bannir/débannir managers
- **UID Firebase**: E3HmHbbs4tgcSqm2KOWAbEJowTy1
- **Statut**: ✅ ACTIF

---

## 📱 STRUCTURE DES DONNÉES

### Formulaire d'Inscription Manager

- 👤 **Nom Complet**: (texte libre)
- 📱 **Numéro de Téléphone**: (Connexion + Appels Directs)
- 💬 **Numéro WhatsApp du Dépôt**: (optionnel, peut être le même)
- 📍 **Quartier**: (sélection parmi: Bakongo, Poto-Poto, Moungali, Ouenzé, Talangaï, Mfilou, Makélékélé, Djiri, Madibou)
- 🔐 **Mot de passe**: (minimum 6 caractères)

### Données créées automatiquement

- Un **dépôt unique** est créé par manager
- Nom du dépôt: "Dépôt [Prénom] - [Quartier]"
- Le manager peut alors ajouter des catégories et produits

---

## 🏪 DÉPÔTS CRÉÉS

| Manager     | Dépôt                  | Quartier  | Tél Appel         | Tél WhatsApp      |

| ----------- | ---------------------- | --------- | ----------------- | ----------------- |


---

## 🎯 RÉSUMÉ POUR LA DÉMO

✅ **VENDOR À TESTER** (Voir les dépôts):

- Téléphone: +242 06 999 99 99
- Mot de passe: revolution3d
- Nom: Test User
- App: http://localhost:5174/maman-power-app/

✅ **ADMIN À TESTER** (Gestion système + Bannir managers):

- Email: mampouyaraphael04@gmail.com
- Mot de passe: 242N64007
- Nom: Genius Mampouya
- Référence: 242N64007
- App: http://localhost:5175/ (admin-panel)
- Rôle: AdminPanel - Gérer tous les managers et les bannir

---

## 🔐 FONCTIONNALITÉS PAR RÔLE

### Manager (depot-dashboard)

- ✅ Connexion avec téléphone + mot de passe
- ✅ Gestion des dépôts
- ✅ Gestion des catégories de produits
- ✅ Gestion des stocks
- ✅ Voir les statistiques du dépôt

### Admin (admin-panel - Port 5175)

- ✅ Connexion avec email + mot de passe
- ✅ Voir tous les managers du système
- ✅ Voir les détails de chaque manager (dépôts, produits)
- ✅ Bannir/Débannir les managers
- ✅ Gestion système complète
- ✅ Interface dédiée à l'administration

### Vendor (maman-power-app)

- ✅ Sélection des catégories
- ✅ Affichage des dépôts les plus proches
- ✅ Voir les produits disponibles
- ✅ Appeler les dépôts
- ✅ Envoyer des messages WhatsApp

---

## 📝 NOTES IMPORTANTES

1. **Numéro de Téléphone**:
   - Utilisé pour la connexion au manager dashboard
   - Utilisé comme numéro d'appel direct du dépôt
2. **Numéro WhatsApp**:
   - Optionnel lors de l'inscription
   - Peut être différent du numéro principal
   - Utilisé pour les messages WhatsApp des clients

3. **Mot de passe**:
   - Minimum 6 caractères
   - Sauvegardé de façon sécurisée dans Firebase

4. **Quartier**:
   - Utilisé pour localiser le dépôt
   - Affecte le calcul de distance pour les vendors

---

## ⚙️ DERNIÈRE MISE À JOUR

- **Date**: 7 Mai 2026
- **Changements**:
  - Remplacement du compte Vendor (Raphael → Test User)
  - Nouveau numéro téléphone: +242 06 999 99 99
  - Tous les identifiants à jour et testés ✅
