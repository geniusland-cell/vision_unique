# Configuration Cloudinary pour l'upload d'images

## Pourquoi Cloudinary ?

Firebase Storage nécessite un forfait payant, mais Cloudinary offre un forfait gratuit généreux (25GB de stockage, 25GB de bande passante par mois).

## Sécurité - Unsigned Uploads

⚠️ **Important**: Nous utilisons des "unsigned uploads" pour éviter d'exposer l'API key et le secret dans le navigateur. Cela signifie que vos identifiants API ne seront jamais visibles dans l'inspecteur Google.

## Étapes de configuration

### 1. Compte Cloudinary déjà configuré

Votre compte Cloudinary est déjà configuré avec:

- Cloud name: `dmbbpm6fj`
- API key et secret: (stockés uniquement côté serveur)

### 2. Créer un Upload Preset Unsigned

C'est la seule étape manuelle nécessaire:

1. Connectez-vous à https://console.cloudinary.com/
2. Allez dans **Settings** > **Upload** > **Upload presets**
3. Cliquez sur **"Add upload preset"**
4. Configurez le preset:
   - **Name**: `depot_images_preset` (ou un autre nom de votre choix)
   - **Mode**: Sélectionnez **"Unsigned"**
   - **Signing mode**: **"Don't sign"**
5. Dans l'onglet **"Incoming transformations"**:
   - Cochez **"Auto format"** (convertit automatiquement en WebP)
   - Cochez **"Auto quality"** (optimise la qualité)
   - Ajoutez une transformation: **Width: 1920, Crop: Limit**
6. Cliquez sur **"Save"**
7. Copiez le **nom du preset** (ex: `depot_images_preset`)

### 3. Configurer la variable d'environnement

Le fichier `.env` a déjà été créé avec:

```env
VITE_CLOUDINARY_CLOUD_NAME=dmbbpm6fj
VITE_CLOUDINARY_UPLOAD_PRESET=votre_upload_preset
```

Remplacez `votre_upload_preset` par le nom du preset que vous avez créé à l'étape 2:

```env
VITE_CLOUDINARY_CLOUD_NAME=dmbbpm6fj
VITE_CLOUDINARY_UPLOAD_PRESET=depot_images_preset
```

### 4. Redémarrer l'application

```bash
npm run dev
```

### 5. Tester l'upload d'images

1. Connectez-vous à votre application depot-dashboard
2. Allez dans la gestion des produits d'un dépôt
3. Essayez d'uploader une image pour un produit
4. Vérifiez la console du navigateur pour les logs de débogage

## Fonctionnalités Cloudinary activées

- ✅ Compression automatique des images
- ✅ Optimisation de la qualité
- ✅ Format automatique (WebP pour les navigateurs modernes)
- ✅ Redimensionnement intelligent (max 1920px)
- ✅ Organisation par dossier (depot_images/{depotId})
- ✅ **Sécurisé**: Pas d'exposition de l'API key/secret dans le navigateur

## Dépannage

### Erreur "Upload preset must be specified"

Vérifiez que `VITE_CLOUDINARY_UPLOAD_PRESET` est correctement défini dans `.env`.

### Erreur "Invalid upload preset"

Vérifiez que le preset existe dans Cloudinary et est en mode "Unsigned".

### Erreur "Upload failed"

Vérifiez la console du navigateur pour les messages d'erreur détaillés. Les logs Cloudinary affichent:

- 📸 Début de l'upload
- ⬆️ Upload en cours
- ✅ Succès avec l'URL
- ❌ Erreur avec détails

## Sécurité

✅ **Sécurisé**: L'API key et le secret ne sont jamais exposés dans le navigateur. Seul le cloud name et le nom du preset sont visibles, ce qui est normal et sécurisé.

⚠️ **Important**: Ne commitez jamais le fichier `.env` dans Git. Le fichier `.env.example` est inclus dans le repository pour montrer quelles variables sont nécessaires.
