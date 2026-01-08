# Configuration Admin - Zwa Congo Marketplace

## 🚀 Accès au Dashboard Admin

### URL du Dashboard Admin
```
http://localhost:5173/admin
```

En production, ce sera :
```
https://votre-domaine.com/admin
```

---

## 👤 Créer un Compte Admin

### Méthode Rapide (RECOMMANDÉ)

**Utilisez le fichier `PROMOTE_ADMIN.sql`** à la racine du projet :

1. **Ouvrez Supabase SQL Editor** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet Zwa
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Ouvrez le fichier `PROMOTE_ADMIN.sql`** dans votre éditeur de code

3. **Copiez TOUT le contenu** du fichier dans le SQL Editor de Supabase

4. **Cliquez sur RUN** pour voir vos utilisateurs existants

5. **Modifiez l'email dans l'ÉTAPE 2** du script (ligne avec UPDATE)

6. **Décommentez les 2 lignes de l'UPDATE** (retirez les --)

7. **Cliquez sur RUN** à nouveau

8. **Vérifiez** que vous voyez votre utilisateur avec `role = 'admin'`

### Méthode Manuelle (Alternative)

Si vous préférez faire ça manuellement :

```sql
-- Voir vos utilisateurs
SELECT u.email, p.full_name, p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Promouvoir (remplacez l'email)
UPDATE public.profiles
SET role = 'admin', kyc_verified = true, updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'VOTRE-EMAIL' LIMIT 1);

-- Vérifier
SELECT u.email, p.role FROM public.profiles p
JOIN auth.users u ON u.id = p.id WHERE p.role = 'admin';
```

---

## 🎯 Fonctionnalités du Dashboard Admin

Une fois connecté en tant qu'admin, vous aurez accès à :

### 📊 Vue d'ensemble (Overview)
- Volume d'affaires total (GMV)
- Revenus des commissions
- Retraits en attente (avec alertes)
- Commandes actives et livrées
- Statistiques vendeurs/affiliés/acheteurs

### 🏷️ Catégories
- Créer, modifier, supprimer des catégories de produits
- Gérer l'ordre d'affichage

### 🗺️ Villes & Zones
- Ajouter des villes du Congo
- Filtrage géographique des produits

### 💰 Retraits d'argent
- Voir toutes les demandes de retrait
- Valider ou rejeter les retraits Mobile Money
- Filtres : En attente / Validés / Rejetés

### ⚙️ Paramètres
- Configurer le taux de commission Zwa (%)
- Définir le taux agrégateur Mobile Money (%)
- Fixer les limites min/max de retrait
- Voir un exemple de calcul en temps réel

### 🛡️ Modération
- Vérifier les vendeurs (KYC)
- Modérer les produits

### ⚖️ Litiges
- Gérer les litiges avec système OTP

---

## 🔐 Sécurité

- Seuls les utilisateurs avec `role = 'admin'` peuvent accéder au dashboard
- La route `/admin` redirige automatiquement les non-admins vers `/`
- Les actions critiques nécessitent une confirmation
- RLS (Row Level Security) activé sur toutes les tables sensibles

---

## 📋 Migrations à Exécuter

**IMPORTANT** : Exécutez ces migrations AVANT de promouvoir un admin.

Depuis Supabase Dashboard > SQL Editor, exécutez dans cet ordre :

1. **`supabase/migrations/20260105_admin_extensions.sql`**
   - Ajoute la colonne `status` aux transactions
   - Ajoute la colonne `kyc_verified` aux profiles
   - Crée la table `cities`
   - Ajoute les index nécessaires

2. **`supabase/migrations/20260105_global_settings.sql`**
   - Crée la table `global_settings` pour les paramètres de la plateforme
   - Configure les taux de commission par défaut

3. **`PROMOTE_ADMIN.sql`** (fichier à la racine)
   - Promouvoir votre utilisateur au rôle admin

---

## 🎨 Personnalisation

Le dashboard utilise le thème Zwa (Violet/Or/Noir).

Fichiers principaux :
- **Layout** : `src/pages/admin/AdminDashboard.tsx`
- **Sidebar** : `src/pages/admin/components/AdminSidebar.tsx`
- **Onglets** : `src/pages/admin/components/*Tab.tsx`

---

## 🐛 Dépannage

### "Accès refusé" ou redirection vers `/`
- Vérifiez que votre utilisateur a bien `role = 'admin'` dans la table `profiles`
- Déconnectez-vous et reconnectez-vous
- Videz le cache du navigateur

### Les KPIs affichent 0
- Vérifiez que vous avez des données de test dans votre base
- Consultez la console du navigateur pour voir les erreurs

### Les retraits n'apparaissent pas
- Vérifiez que la colonne `status` existe dans la table `transactions`
- Exécutez la migration `20260105_admin_extensions.sql`

---

## 📞 Support

Pour toute question, consultez :
- Le PRD admin : `ADMIN_PRD.md`
- Les migrations : `supabase/migrations/`
- Les composants : `src/pages/admin/`

Bon admin ! 🚀
