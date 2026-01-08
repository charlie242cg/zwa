# 🚀 DÉMARRAGE RAPIDE - Dashboard Admin Zwa

## ✅ Tout est prêt ! Suivez ces 3 étapes simples

---

### 📝 **Étape 1 : Exécuter les migrations** (2 minutes)

1. Allez sur **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Sélectionnez votre projet **Zwa**
3. Cliquez sur **"SQL Editor"** dans le menu à gauche
4. Exécutez **dans l'ordre** :

#### Migration 1 : Extensions Admin
```bash
Ouvrez: supabase/migrations/20260105_admin_extensions.sql
Copiez tout le contenu → SQL Editor → RUN ✅
```

#### Migration 2 : Paramètres Globaux
```bash
Ouvrez: supabase/migrations/20260105_global_settings.sql
Copiez tout le contenu → SQL Editor → RUN ✅
```

---

### 👤 **Étape 2 : Créer votre compte admin** (1 minute)

1. Ouvrez le fichier **`PROMOTE_ADMIN.sql`** (à la racine)
2. Copiez **TOUT** le contenu
3. Collez dans **Supabase SQL Editor**
4. Cliquez **RUN** → vous verrez la liste de vos utilisateurs
5. Modifiez l'email dans **l'ÉTAPE 2** du script
6. **Décommentez** les 2 lignes (retirez les `--`)
7. Cliquez **RUN** à nouveau
8. Vérifiez que vous voyez `role = 'admin'` ✅

**Pas d'utilisateur ?**
- Inscrivez-vous sur votre app : `http://localhost:5173/auth`
- Puis suivez l'étape 2 ci-dessus

---

### 🎯 **Étape 3 : Accéder au dashboard** (30 secondes)

1. **Déconnectez-vous** de votre app
2. **Reconnectez-vous** avec votre compte admin
3. Allez sur : **`http://localhost:5173/admin`**

🎉 **C'EST FAIT !** Vous devriez voir le dashboard admin complet.

---

## 🔍 **Vérification (optionnel)**

Pour vérifier que tout est bien configuré :

```bash
Ouvrez: VERIFY_SETUP.sql
Copiez tout → SQL Editor → RUN
```

Toutes les requêtes doivent retourner des résultats.

---

## 📊 **Fonctionnalités du Dashboard**

Une fois connecté, vous aurez accès à :

- ✅ **Vue d'ensemble** - KPIs, GMV, Commissions, Alertes
- 💰 **Retraits** - Valider/Rejeter les retraits Mobile Money
- ⚙️ **Paramètres** - Taux de commission, limites de retrait
- 🏷️ **Catégories** - Gérer les catégories de produits
- 🗺️ **Villes** - Gérer les villes du Congo
- 🛡️ **Modération** - Vérification KYC vendeurs
- ⚖️ **Litiges** - Système d'arbitrage OTP

---

## 🆘 **Problèmes ?**

### "Accès refusé" ou redirection
- Vérifiez que `role = 'admin'` dans la table profiles
- Déconnectez-vous et reconnectez-vous
- Videz le cache navigateur (Ctrl+Shift+Del)

### "Colonne n'existe pas"
- Exécutez la migration `20260105_admin_extensions.sql`

### "Policy déjà existante"
- Les migrations sont maintenant idempotentes, réexécutez-les

---

## 📚 **Documentation**

- **[README_ADMIN.md](README_ADMIN.md)** - Guide complet
- **[ADMIN_SETUP.md](ADMIN_SETUP.md)** - Documentation détaillée
- **[ADMIN_PRD.md](ADMIN_PRD.md)** - Spécifications fonctionnelles

---

## 🎨 **Personnalisation**

Fichiers principaux du dashboard :
- Layout : `src/pages/admin/AdminDashboard.tsx`
- Sidebar : `src/pages/admin/components/AdminSidebar.tsx`
- Onglets : `src/pages/admin/components/*Tab.tsx`

---

**Bon admin ! 🚀**
