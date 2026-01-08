# 🛡️ Setup Admin Zwa - Guide Ultra-Rapide

## 🚀 3 Étapes pour accéder au Dashboard Admin

### Étape 1️⃣ : Exécuter les migrations

Allez sur **Supabase Dashboard** > **SQL Editor** et exécutez :

1. Le fichier `supabase/migrations/20260105_admin_extensions.sql`
2. Le fichier `supabase/migrations/20260105_global_settings.sql`

### Étape 2️⃣ : Promouvoir un utilisateur admin

1. Ouvrez le fichier **`PROMOTE_ADMIN.sql`** (à la racine du projet)
2. Copiez TOUT le contenu dans Supabase SQL Editor
3. Cliquez **RUN** pour voir vos utilisateurs
4. Modifiez l'email dans l'ÉTAPE 2 du script
5. Décommentez les 2 lignes (retirez les `--`)
6. Cliquez **RUN** à nouveau
7. Vérifiez que vous êtes admin

### Étape 3️⃣ : Accéder au dashboard

1. Déconnectez-vous de votre app
2. Reconnectez-vous avec votre compte admin
3. Allez sur : **`http://localhost:5173/admin`**

---

## ✅ C'est tout !

Vous devriez voir le dashboard admin complet avec :
- 📊 Vue d'ensemble (KPIs, GMV, Commissions)
- 💰 Gestion des retraits
- ⚙️ Paramètres de la plateforme
- 🏷️ Catégories et villes
- 🛡️ Modération

---

## 📚 Documentation complète

Pour plus de détails, consultez **[ADMIN_SETUP.md](ADMIN_SETUP.md)**

## ❓ Problèmes ?

- Vérifiez que les 2 migrations sont bien exécutées
- Vérifiez que `role = 'admin'` dans la table `profiles`
- Déconnectez-vous et reconnectez-vous
- Videz le cache du navigateur
