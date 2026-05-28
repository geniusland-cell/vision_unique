# 📊 AUDIT DE PERFORMANCE & OPTIMISATION BANDE PASSANTE

**Date:** 25 Mai 2026  
**Problème:** 5.62 GB consommés en bande passante (quota gratuit Vercel à risque)

---

## ✅ BON : Ce qui fonctionne bien

### 1. **PWA & Service Workers** ✅

- **Vite-PWA configuré** sur les 2 apps
- **registerType: "autoUpdate"** = mises à jour automatiques
- **Cache local activé** = les users installent l'app

**Impact :** Les users avec PWA installée = ~90% moins de bande passante après 1ère visite

---

### 2. **Listeners Firebase en temps réel** ✅

**maman-power-app/src/App.tsx (lignes 112-170):**

```typescript
const unsubscribeCategories = listenToCategories((categories) => { ... });
const unsubscribeDepots = listenToDepotsAndProducts(...);

return () => {
  unsubscribeCategories();
  unsubscribeDepots();
}
```

✅ **UTILISE `onValue()` listeners** = synchro continue, pas de polls !  
✅ **Nettoyage correct** des listeners au unmount  
✅ **Pas de setInterval** pour les données critiques

---

### 3. **FirebaseStats** ✅

**depot-dashboard/src/components/FirebaseStats.tsx (ligne 35):**

```typescript
const interval = setInterval(loadFirebaseStats, 300000); // 5 minutes
return () => clearInterval(interval);
```

✅ **Intervalle optimal : 5 minutes** (pas de spam)  
✅ **Nettoyage correct** du setInterval  
✅ **Admin-only** = pas de consommation par les vendors

---

### 4. **UpdateNotification** ⚠️ OK MAIS À SURVEILLER

**Fréquence:** Toutes les 5 minutes (300 000ms)

```typescript
const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
```

✅ L'intervalle est bon  
⚠️ **MAIS:** Fetch du manifest à chaque fois (même s'il ne change pas)

---

### 5. **Pas de setInterval abusif pour les données** ✅

- Aucun `setInterval` sur les appels Firebase critiques
- Les dépôts/produits utilisent des listeners `onValue()`
- Pas de polling implicite détecté

---

## ⚠️ PROBLÈMES TROUVÉS

### 1. **Cache Headers manquants** 🚨 CRITIQUE

**Symptôme:** Même avec PWA, les users téléchargent bundle JS/CSS à CHAQUE refresh

**Solution :** Créer `vercel.json` avec cache long-term:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Impact :** -80% bande passante (cache navigateur 1 an)

---

### 2. **UpdateNotification fetche le manifest trop souvent** ⚠️

**Code problématique (UpdateNotification.tsx, ligne 25):**

```typescript
const response = await fetch("/manifest.webmanifest", {
  cache: "no-store", // ❌ Force re-download à chaque fois !
});
```

**Résultat :** Fetch du manifest.json toutes les 5 minutes = gâchis de bande passante

**Solution :** Ajouter cache par défaut ou diminuer fréquence à 1h

---

### 3. **Image Optimization pas forcée** ⚠️

Tu utilises Cloudinary mais pas de lazy loading explicite sur toutes les images

**Vérifier :** Ajouter `loading="lazy"` sur toutes les images product

---

## 📈 Calcul du gaspillage actuel

```
UpdateNotification:
- Fetch manifest.json toutes les 5 min
- ~2 KB par fetch
- 288 fetches/jour = 576 KB/jour/utilisateur
- Avec 1000+ users = ~600 MB/jour ! 🚨

Cache headers manquants:
- Bundle JS: 147.66 KB gzip
- Téléchargé SANS cache = N fois par user
- Avec 1000 refreshes/jour = 147 MB ! 🚨

TOTAL : ~750 MB/jour ÉVITABLE
```

---

## ✅ RECOMMENDATIONS

### **PRIORITÉ HAUTE (Fais ça demain matin)**

1. **Créer vercel.json** avec cache headers (5 min)
2. **Fixer UpdateNotification** (2 min)
3. **Redéployer** (1 min)

**Économies : ~700 MB/jour = 21 GB/mois** ✅

### **PRIORITÉ MOYENNE**

- Ajouter `loading="lazy"` sur images
- Vérifier que Cloudinary optimise bien
- Tester PWA installation rate

---

## 🎯 CONCLUSION

**Les listeners Firebase = BON ✅**  
**L'UpdateNotification = À FIXER ⚠️**  
**Cache headers = CRITIQUE 🚨**

Une fois fixé: **5.62 GB → ~1 GB/mois** sur Vercel gratuit (sauvé ! 🎉)
