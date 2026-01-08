# 🚀 INSTRUCTIONS DE MIGRATION - SYSTÈME DE PROMOTIONS

## ✅ Ce qui a été fait

1. ✅ Migration SQL créée : `supabase/migrations/20260101_add_product_images_and_promo.sql`
2. ✅ Interface TypeScript mise à jour : `productService.ts`
3. ✅ Formulaire d'ajout de produit : `AddProduct.tsx`
4. ✅ Formulaire d'édition de produit : `EditProduct.tsx`
5. ✅ Carte produit avec badge promo : `ProductCard.tsx`
6. ✅ Page détail produit avec affichage promo : `ProductDetail.tsx`
7. ✅ Page d'accueil mise à jour : `Home.tsx`

---

## 📌 ÉTAPE OBLIGATOIRE : Appliquer la migration SQL

### Option 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. Allez sur https://supabase.com/dashboard/project/xacutgdtdglwfkwkacvi
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier :
   ```
   supabase/migrations/20260101_add_product_images_and_promo.sql
   ```
5. Cliquez sur **Run** (ou `Ctrl + Enter`)
6. Vérifiez que la requête s'exécute sans erreur

### Option 2 : Via la CLI Supabase (si configuré)

```bash
# Lier votre projet
npx supabase link --project-ref xacutgdtdglwfkwkacvi

# Appliquer la migration
npx supabase db push
```

---

## 🎯 Ce que fait la migration

### Nouvelles colonnes ajoutées :

```sql
-- 1. images_url : tableau d'URLs d'images (jusqu'à 3 images)
ALTER TABLE public.products ADD COLUMN images_url TEXT[];

-- 2. original_price : prix avant rabais pour détecter les promos
ALTER TABLE public.products ADD COLUMN original_price DECIMAL(12, 2);

-- 3. Assure que is_affiliate_enabled existe
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_affiliate_enabled BOOLEAN DEFAULT TRUE;
```

### Migration automatique des données :

- Les produits existants avec `image_url` seront migrés vers `images_url` automatiquement
- `original_price` restera NULL pour les produits sans promo

---

## 🔥 Fonctionnalité : Détection automatique des promotions

### Comment ça marche :

1. **Créer une promo :**
   - Dans "Ajouter/Modifier un produit"
   - Remplir "Prix avant rabais" (optionnel)
   - Si `prix avant rabais > prix actuel` → **Promo détectée automatiquement !**

2. **Affichage automatique :**
   - 🔥 Badge "-XX%" sur la carte produit (page d'accueil)
   - Prix barré + badge de réduction sur la page détail
   - Aperçu en temps réel lors de la saisie du formulaire

### Exemple :

```
Prix avant rabais : 50000 FCFA
Prix actuel       : 35000 FCFA
→ Badge affiché : "🔥 -30%"
```

---

## 🧪 Tester la fonctionnalité

1. **Appliquer la migration SQL** (étape obligatoire ci-dessus)
2. Redémarrer le serveur dev si nécessaire :
   ```bash
   npm run dev
   ```
3. Aller sur `/seller/add-product`
4. Créer un produit avec :
   - Prix : 35000
   - Prix avant rabais : 50000
5. Publier le produit
6. Vérifier sur la page d'accueil → Badge "🔥 -30%" doit apparaître
7. Cliquer sur le produit → Prix barré + badge de réduction visible

---

## 🐛 Troubleshooting

### Erreur "Column 'images_url' does not exist"
→ Vous n'avez pas appliqué la migration SQL. Retournez à la section "Appliquer la migration SQL".

### Erreur "Column 'original_price' does not exist"
→ Même problème, appliquez la migration.

### Les badges de promo ne s'affichent pas
→ Vérifiez que :
1. La migration est appliquée
2. `original_price` est renseigné et > `price`
3. Le navigateur est rafraîchi (Ctrl + Shift + R)

### Les images ne s'affichent pas
→ La migration migre automatiquement les anciennes images. Si problème, vérifiez :
```sql
SELECT id, name, image_url, images_url FROM products LIMIT 5;
```

---

## 📝 Notes importantes

- **Aucune donnée n'est perdue** : les produits existants continuent de fonctionner
- **Rétrocompatible** : `image_url` reste utilisé comme image principale
- **Optionnel** : `original_price` peut rester NULL (pas de promo)
- **Automatique** : pas besoin de cocher "activer promo", c'est détecté automatiquement

---

## ✨ Prochaines étapes suggérées (optionnelles)

1. Ajouter un filtre "Produits en promo" sur la page d'accueil
2. Ajouter une date de fin de promo automatique
3. Notification aux affiliés quand un produit passe en promo

---

**Migration créée le :** 2026-01-01
**Compatibilité :** Toutes versions de Supabase
**Risque :** Aucun (ajout de colonnes optionnelles uniquement)
