# Guide d'Application de la Migration pour les Profils de Boutique

## Contexte
Cette migration ajoute les champs nécessaires pour afficher correctement les informations des boutiques dans le chat (nom de boutique, logo, bannière, etc.).

## Étapes pour Appliquer la Migration

### Option 1: Via le Dashboard Supabase (Recommandé)

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet: `xacutgdtdglwfkwkacvi`

2. **Ouvrez l'Éditeur SQL**
   - Dans le menu latéral, cliquez sur "SQL Editor"
   - Cliquez sur "New Query"

3. **Copiez et Exécutez la Migration**
   - Ouvrez le fichier `supabase/migrations/20260103_add_store_fields_to_profiles.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" (Exécuter)

4. **Vérifiez que la Migration a Réussi**
   - Allez dans "Table Editor"
   - Sélectionnez la table `profiles`
   - Vérifiez que les nouvelles colonnes sont présentes:
     - `store_name`
     - `store_slug`
     - `store_banner_url`
     - `store_bio`
     - `store_location`
     - `total_sales_count`
     - `average_rating`
     - `total_reviews`

### Option 2: Via Supabase CLI (Si installé)

```bash
# Assurez-vous d'avoir Supabase CLI installé
supabase --version

# Liez votre projet (si ce n'est pas déjà fait)
supabase link --project-ref xacutgdtdglwfkwkacvi

# Appliquez les migrations
supabase db push
```

## Après la Migration

Une fois la migration appliquée, les profils de chat afficheront:

### Pour les Vendeurs (Sellers)
- **Nom affiché**: `store_name` (ou `full_name` si `store_name` est vide)
- **Avatar**: `avatar_url` (logo de la boutique)

### Pour les Clients (Buyers)
- **Nom affiché**: `full_name`
- **Avatar**: `avatar_url` (photo de profil)

## Problèmes Connus

Si après la migration les profils n'affichent toujours pas les bonnes informations:

1. **Vérifiez que les vendeurs ont rempli leur profil de boutique**
   - Les vendeurs doivent aller dans "Modifier ma Boutique" pour ajouter:
     - Nom de la boutique
     - Logo (avatar_url)
     - Photo de couverture (store_banner_url)

2. **Videz le cache de votre navigateur**
   ```
   Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
   ```

3. **Vérifiez les RLS Policies**
   - Assurez-vous que les policies permettent la lecture des colonnes `store_name` et `avatar_url`
   - La policy "Public profiles are viewable by everyone" devrait déjà le permettre

## Support

Si vous rencontrez des problèmes, vérifiez:
- Les logs de Supabase dans le Dashboard
- La console du navigateur pour les erreurs JavaScript
- Les requêtes réseau dans l'onglet Network de DevTools
