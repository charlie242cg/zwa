# 🔧 FIX RAPIDE - Système de Notation

## ⚡ Problème
Les étoiles restent à `0.0/5` malgré les avis créés.

## ✅ Solution (2 étapes)

### Étape 1 : Corriger les triggers
```bash
# Ouvrir Supabase Dashboard → SQL Editor
# Copiez-collez le contenu de :
supabase/migrations/20260102_fix_reviews_triggers.sql
# Cliquez RUN
```

**Ce que ça fait** :
- Remplace les fonctions `update_seller_rating()` et `update_product_rating()`
- Ajoute la gestion DELETE (avant ça crashait)
- Ajoute les triggers DELETE manquants

---

### Étape 2 : Recalculer les ratings existants
```bash
# Toujours dans SQL Editor
# Copiez-collez le contenu de :
supabase/migrations/20260102_recalculate_all_ratings.sql
# Cliquez RUN
```

**Ce que ça fait** :
- Recalcule `average_rating` et `total_reviews` pour tous les vendeurs
- Recalcule `average_rating` et `total_reviews` pour tous les produits
- Affiche les résultats pour vérification

---

### Étape 3 : Vérifier que ça marche
1. Rafraîchissez l'application
2. Allez dans **Mon Business** (dashboard vendeur)
3. Vous devriez voir : `⭐ X.X/5` avec les étoiles
4. Vérifiez la page boutique publique aussi

---

## 📁 Fichiers modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| `20260102_fix_reviews_triggers.sql` | SQL | Corrige les fonctions et ajoute triggers DELETE |
| `20260102_recalculate_all_ratings.sql` | SQL | Recalcule tous les ratings existants |
| `SellerDashboard.tsx` | Frontend | Affiche les stats de notation |
| `GUIDE_FIX_RATINGS.md` | Doc | Guide détaillé avec tests et debugging |

---

## 🧪 Test rapide

```sql
-- Vérifier qu'un vendeur a des ratings
SELECT id, full_name, average_rating, total_reviews
FROM profiles
WHERE id = 'VOTRE_SELLER_ID';
```

**Résultat attendu** : `average_rating > 0` et `total_reviews > 0`

---

## ⚠️ IMPORTANT

**NE PAS** exécuter `20260101_add_reviews_system.sql` si vous avez déjà la table `reviews` !

Erreur courante :
```
ERROR: 42P07: relation "reviews" already exists
```

**Solution** : Utilisez uniquement les 2 nouveaux scripts de correction.

---

## 🎯 Résultat attendu

Dashboard vendeur après correction :
```
┌─────────────────────────────────────┐
│  Mon Business 💼                    │
├──────────┬──────────┬───────────────┤
│ 125000 F │ 5 ventes │ 5000 F        │
├──────────┴──────────┴───────────────┤
│ ⭐ 4.5/5        ⭐⭐⭐⭐⭐         │
│    12 avis                          │
└─────────────────────────────────────┘
```

✅ **C'est tout ! Le système est maintenant fonctionnel.**
