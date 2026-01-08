# 🛍️ Plan Complet - Page Boutique Vendeur

**Date :** 31 Décembre 2025
**Objectif :** Créer une page boutique pour chaque vendeur (style Instagram/TikTok)
**URL cible :** `zwa.com/store/{seller_id}` ou `zwa.com/@{nom_boutique}`

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Analyse de l'Existant](#2-analyse-de-lexistant)
3. [Modifications Base de Données](#3-modifications-base-de-données)
4. [Fichiers à Créer](#4-fichiers-à-créer)
5. [Fichiers à Modifier](#5-fichiers-à-modifier)
6. [Design & UI/UX](#6-design--uiux)
7. [Fonctionnalités](#7-fonctionnalités)
8. [Ordre d'Implémentation](#8-ordre-dimplémentation)
9. [Future Features](#9-future-features)

---

## 1. Vue d'Ensemble

### 🎯 Objectif Principal
Permettre aux utilisateurs de cliquer sur un vendeur depuis une fiche produit et voir toute sa boutique (profil + tous ses produits).

### 🔑 Points Clés
- **Accès :** Clic sur le nom du vendeur ou son avatar
- **Design :** Style Instagram/TikTok (familier et moderne)
- **URL :** `/store/{seller_id}` (phase 1) puis `/@{username}` (phase 2)
- **Réutilisation :** Utiliser les composants de cartes produits existants
- **Préparation :** Première étape vers le panier multi-produits

---

## 2. Analyse de l'Existant

### ✅ Ce qui existe déjà

#### Dashboard Vendeur (`SellerDashboard.tsx`)
**Localisation :** `src/pages/seller/SellerDashboard.tsx`

**Contenu actuel :**
- Stats du vendeur (ventes, commissions, produits)
- Liste des produits du vendeur (vue privée pour le vendeur)
- Bouton "Ajouter un produit"
- Bouton "Éditer" pour chaque produit

**Problème :**
- C'est un **dashboard privé** (seul le vendeur voit)
- Design orienté gestion, pas présentation
- Pas accessible publiquement

**Ce qu'on peut réutiliser :**
- Logique de fetch des produits par vendeur
- Structure de la carte produit
- Stats (adapter pour vue publique)

---

#### Fiche Produit (`ProductDetail.tsx`)
**Localisation :** `src/pages/products/ProductDetail.tsx`

**Section Vendeur actuelle (lignes 221-239) :**
```typescript
<div style={styles.sellerCard}>
    <div style={styles.sellerAvatar}>
        {product.profiles?.full_name?.charAt(0) || 'V'}
    </div>
    <div style={styles.sellerInfo}>
        <div style={styles.sellerName}>{product.profiles?.full_name || 'Vendeur'}</div>
        <div style={styles.sellerStats}>98% Réponse positive • Brazzaville</div>
    </div>
    <button
        onClick={toggleFavorite}
        style={{
            ...styles.visitButton,
            background: isFavorite ? 'var(--primary)' : 'none',
            color: isFavorite ? 'white' : 'var(--primary)'
        }}
    >
        {isFavorite ? 'Suivi' : 'Suivre'}
    </button>
</div>
```

**Modifications nécessaires :**
- Rendre toute la carte cliquable (ou ajouter bouton "Voir la Boutique")
- Naviguer vers `/store/{product.seller_id}`

---

#### Table `profiles` (Supabase)
**Localisation :** `supabase/schema.sql` (lignes 4-13)

**Structure actuelle :**
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'buyer',
  is_verified_seller BOOLEAN DEFAULT FALSE,
  is_vip_influencer BOOLEAN DEFAULT FALSE,
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

**Ce qui manque pour la boutique :**
- `store_name` (nom de la boutique)
- `store_slug` (pour URL `/@nom_boutique`)
- `store_banner_url` (photo de couverture)
- `store_bio` (description de la boutique)
- `store_location` (ville/pays)
- `total_sales_count` (nombre de ventes - pour stats publiques)
- `average_rating` (note moyenne - pour stats publiques)

---

## 3. Modifications Base de Données

### 📝 Migration SQL à Créer

**Fichier :** `supabase/migrations/20251231_add_store_fields.sql`

```sql
-- ===============================================
-- Ajouter les champs de boutique à la table profiles
-- ===============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS store_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS store_banner_url TEXT,
ADD COLUMN IF NOT EXISTS store_bio TEXT,
ADD COLUMN IF NOT EXISTS store_location TEXT,
ADD COLUMN IF NOT EXISTS total_sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00;

-- Créer un index sur store_slug pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_store_slug ON public.profiles(store_slug);

-- Fonction pour générer automatiquement un store_slug
CREATE OR REPLACE FUNCTION generate_store_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Si store_slug est vide et qu'il y a un store_name, générer le slug
  IF NEW.store_slug IS NULL AND NEW.store_name IS NOT NULL THEN
    NEW.store_slug := lower(regexp_replace(NEW.store_name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ajouter un suffixe unique si le slug existe déjà
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE store_slug = NEW.store_slug AND id != NEW.id) LOOP
      NEW.store_slug := NEW.store_slug || '-' || substr(md5(random()::text), 1, 4);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le slug automatiquement
DROP TRIGGER IF EXISTS trigger_generate_store_slug ON public.profiles;
CREATE TRIGGER trigger_generate_store_slug
  BEFORE INSERT OR UPDATE OF store_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_store_slug();

COMMENT ON COLUMN public.profiles.store_name IS 'Nom de la boutique (ex: "Divine Mode Brazza")';
COMMENT ON COLUMN public.profiles.store_slug IS 'Slug unique pour URL (ex: "divine-mode-brazza")';
COMMENT ON COLUMN public.profiles.store_banner_url IS 'Photo de couverture de la boutique';
COMMENT ON COLUMN public.profiles.store_bio IS 'Description de la boutique';
COMMENT ON COLUMN public.profiles.store_location IS 'Localisation (ex: "Brazzaville, Congo")';
COMMENT ON COLUMN public.profiles.total_sales_count IS 'Nombre total de ventes livrées (pour stats publiques)';
COMMENT ON COLUMN public.profiles.average_rating IS 'Note moyenne du vendeur (0.00 à 5.00)';
```

**⚠️ Important :**
- Les vendeurs existants auront `store_name = NULL` par défaut
- On va pré-remplir avec `full_name` pour ne pas avoir de boutiques vides
- Le slug sera généré automatiquement via trigger

---

## 4. Fichiers à Créer

### 4.1. Page Boutique
**Fichier :** `src/pages/store/StorePage.tsx`

**Responsabilités :**
- Afficher le profil public du vendeur
- Afficher tous les produits du vendeur
- Gérer les filtres (Tout, Promotions, Meilleures ventes)
- Bouton "Suivre" le vendeur
- Bouton "Contacter" (ouvre le chat)

**Structure :**
```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Star, MapPin, Package, TrendingUp, ShieldCheck } from 'lucide-react';
import { productService, Product } from '../../services/productService';
import { storeService } from '../../services/storeService';
import { useAuth } from '../../hooks/useAuth';

const StorePage = () => {
    const { sellerId } = useParams<{ sellerId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'promo' | 'bestsellers'>('all');
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (sellerId) {
            fetchStoreData(sellerId);
        }
    }, [sellerId]);

    const fetchStoreData = async (id: string) => {
        // Fetch store profile + products
    };

    const handleFollow = () => {
        // Toggle follow status
    };

    const handleContact = () => {
        // Open chat with seller
    };

    return (
        <div style={styles.container}>
            {/* Header avec banner */}
            {/* Section profil vendeur */}
            {/* Statistiques publiques */}
            {/* Filtres */}
            {/* Grille de produits */}
        </div>
    );
};
```

---

### 4.2. Service Store
**Fichier :** `src/services/storeService.ts`

**Responsabilités :**
- Fetch les données publiques d'un vendeur
- Fetch les produits d'un vendeur
- Gérer le système de "follow" (favoris vendeurs)

**Structure :**
```typescript
import { supabase } from '../lib/supabase';

export interface StoreProfile {
    id: string;
    store_name: string;
    store_slug: string;
    store_banner_url: string | null;
    store_bio: string | null;
    store_location: string | null;
    avatar_url: string | null;
    is_verified_seller: boolean;
    total_sales_count: number;
    average_rating: number;
    created_at: string;
}

class StoreService {
    async getStoreBySlug(slug: string) {
        // Fetch by store_slug
    }

    async getStoreById(sellerId: string) {
        // Fetch by id
    }

    async getStoreProducts(sellerId: string, filter?: 'all' | 'promo' | 'bestsellers') {
        // Fetch products with optional filter
    }

    async followStore(userId: string, sellerId: string) {
        // Add to favorites (localStorage or DB)
    }

    async unfollowStore(userId: string, sellerId: string) {
        // Remove from favorites
    }

    async isFollowing(userId: string, sellerId: string) {
        // Check if following
    }
}

export const storeService = new StoreService();
```

---

## 5. Fichiers à Modifier

### 5.1. ProductDetail.tsx
**Localisation :** `src/pages/products/ProductDetail.tsx`

**Modifications (lignes 221-239) :**

**AVANT :**
```typescript
<div style={styles.sellerCard}>
    <div style={styles.sellerAvatar}>
        {product.profiles?.full_name?.charAt(0) || 'V'}
    </div>
    <div style={styles.sellerInfo}>
        <div style={styles.sellerName}>{product.profiles?.full_name || 'Vendeur'}</div>
        <div style={styles.sellerStats}>98% Réponse positive • Brazzaville</div>
    </div>
    <button onClick={toggleFavorite} style={styles.visitButton}>
        {isFavorite ? 'Suivi' : 'Suivre'}
    </button>
</div>
```

**APRÈS :**
```typescript
<div
    style={styles.sellerCard}
    onClick={() => navigate(`/store/${product.seller_id}`)}
>
    <div style={styles.sellerAvatar}>
        {product.profiles?.avatar_url ? (
            <img src={product.profiles.avatar_url} alt="" style={styles.avatarImage} />
        ) : (
            product.profiles?.store_name?.charAt(0) || product.profiles?.full_name?.charAt(0) || 'V'
        )}
    </div>
    <div style={styles.sellerInfo}>
        <div style={styles.sellerName}>
            {product.profiles?.store_name || product.profiles?.full_name || 'Boutique'}
        </div>
        <div style={styles.sellerStats}>
            {product.profiles?.is_verified_seller && (
                <><ShieldCheck size={12} color="#00CC66" /> Vérifié • </>
            )}
            {product.profiles?.average_rating > 0 ? (
                <>{product.profiles.average_rating}/5 ⭐ • </>
            ) : null}
            {product.profiles?.total_sales_count || 0} ventes
        </div>
    </div>
    <button
        onClick={(e) => {
            e.stopPropagation(); // Empêche la navigation quand on clique sur le bouton
            navigate(`/store/${product.seller_id}`);
        }}
        style={styles.visitButton}
    >
        Voir la Boutique
    </button>
</div>
```

**Styles à ajouter :**
```typescript
avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover' as const,
}
```

**Changements :**
1. ✅ Carte cliquable (navigate vers `/store/{seller_id}`)
2. ✅ Affiche `store_name` si disponible, sinon `full_name`
3. ✅ Affiche vraie note et nombre de ventes (au lieu de données statiques)
4. ✅ Badge "Vérifié" si `is_verified_seller = true`
5. ✅ Bouton "Voir la Boutique" au lieu de "Suivre" (le follow sera sur la page boutique)

---

### 5.2. SellerDashboard.tsx
**Localisation :** `src/pages/seller/SellerDashboard.tsx`

**Modifications à ajouter :**

**Dans le header (après ligne 73) :**
```typescript
<header style={styles.header}>
    <h1 style={styles.title}>Mon Business 💼</h1>
    <p style={styles.subtitle}>Gérez vos stocks et vos ventes en direct.</p>

    {/* NOUVEAU : Lien vers la vue publique */}
    <button
        onClick={() => navigate(`/store/${user?.id}`)}
        style={styles.viewStoreButton}
    >
        👁️ Voir ma boutique publique
    </button>
</header>
```

**Nouveau style :**
```typescript
viewStoreButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--primary)',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
}
```

**Objectif :** Permettre aux vendeurs de prévisualiser leur boutique publique.

---

### 5.3. App.tsx (Routes)
**Localisation :** `src/App.tsx`

**Ajouter la route :**
```typescript
import StorePage from './pages/store/StorePage';

// Dans les routes :
<Route path="/store/:sellerId" element={<StorePage />} />
```

---

## 6. Design & UI/UX

### 🎨 Inspiration : Instagram/TikTok Profile

```
┌─────────────────────────────────────┐
│  [←]                    [💬] [❤️]  │ ← Top Bar fixe
├─────────────────────────────────────┤
│                                     │
│     Photo de Couverture (Banner)    │ ← Optionnel (si store_banner_url)
│          [ou dégradé violet]        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────┐             │
│         │   Avatar    │             │ ← Avatar centré (chevauche le banner)
│         │   (80x80)   │             │
│         └─────────────┘             │
│                                     │
│      Divine Mode Brazza             │ ← store_name (gras, blanc)
│   ✅ Vendeur Vérifié                │ ← Badge si is_verified_seller
│                                     │
│   "Vêtements de luxe made in       │ ← store_bio (2-3 lignes max)
│    Brazzaville depuis 2024"         │
│                                     │
│   📍 Brazzaville, Congo             │ ← store_location
│                                     │
│  ┌──────────┬──────────┬──────────┐│
│  │   4.8    │   250    │  2024   ││ ← Stats (note, ventes, membre depuis)
│  │  Note    │  Ventes  │ Membre  ││
│  └──────────┴──────────┴──────────┘│
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │   💬 Contacter │ │  ❤️ Suivre   │ │ ← Boutons d'action
│  └──────────────┘ └──────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [Tout] [Promotions] [Top Ventes]  │ ← Filtres (chips)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ Product │  │ Product │          │ ← Grille de produits (réutilise les cartes)
│  │  Card   │  │  Card   │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ Product │  │ Product │          │
│  │  Card   │  │  Card   │          │
│  └─────────┘  └─────────┘          │
│                                     │
└─────────────────────────────────────┘
```

### 🎨 Palette de Couleurs

- **Background :** `#0a0a0a` (noir profond)
- **Cards :** `rgba(255,255,255,0.03)` avec border `rgba(255,255,255,0.05)`
- **Primary :** `#8A2BE2` (violet Zwa)
- **Verified Badge :** `#00CC66` (vert)
- **Text Primary :** `white`
- **Text Secondary :** `rgba(255,255,255,0.6)`

---

## 7. Fonctionnalités

### ✅ Phase 1 (MVP)

1. **Affichage de base**
   - Photo de profil (avatar)
   - Nom de la boutique
   - Localisation
   - Stats (note, ventes, membre depuis)
   - Liste de tous les produits du vendeur

2. **Navigation**
   - Clic sur vendeur depuis ProductDetail → StorePage
   - Retour en arrière (bouton `←`)

3. **Filtres simples**
   - "Tout" (par défaut)
   - "Promotions" (produits avec discount - *à implémenter plus tard*)
   - "Meilleures ventes" (tri par nombre de ventes - *si on track ça*)

4. **Actions de base**
   - Bouton "Contacter" → Ouvre le chat avec le vendeur
   - Bouton "Suivre" → Ajoute aux favoris (localStorage)

---

### 🔮 Phase 2 (Améliorations)

1. **URL avec slug**
   - Passer de `/store/{seller_id}` à `/@{store_slug}`
   - Plus friendly : `zwa.com/@divine-mode-brazza`

2. **Photo de couverture**
   - Banner personnalisé (comme Instagram)
   - Fallback : Dégradé violet si pas de banner

3. **Système de "Follow" persistant**
   - Table `store_follows` dans Supabase
   - Notifications pour les nouveaux produits

4. **Stats avancées**
   - Note moyenne réelle (basée sur les avis)
   - Temps de réponse moyen
   - Taux de satisfaction

5. **Tri & Filtres avancés**
   - Prix croissant/décroissant
   - Nouveautés
   - Catégories

---

### 🚀 Phase 3 (Future)

1. **Panier Multi-Produits**
   - Ajouter plusieurs produits du même vendeur au panier
   - Un seul paiement + frais de livraison uniques

2. **Promotions & Coupons**
   - Le vendeur peut créer des codes promo
   - Affichage des produits en promotion

3. **Avis & Reviews**
   - Les acheteurs peuvent laisser des avis
   - Affichage des avis sur la page boutique

---

## 8. Ordre d'Implémentation

### 🔢 Étapes Recommandées

#### **Étape 1 : Préparer la Base de Données** ⏱️ 10 min
1. Créer `supabase/migrations/20251231_add_store_fields.sql`
2. Exécuter la migration dans Supabase SQL Editor
3. Vérifier que les colonnes sont bien créées
4. (Optionnel) Pré-remplir `store_name` avec `full_name` pour les vendeurs existants :
   ```sql
   UPDATE public.profiles
   SET store_name = full_name
   WHERE role = 'seller' AND store_name IS NULL;
   ```

---

#### **Étape 2 : Créer le Service Store** ⏱️ 20 min
1. Créer `src/services/storeService.ts`
2. Implémenter :
   - `getStoreById(sellerId)` → Fetch profil vendeur
   - `getStoreProducts(sellerId)` → Fetch produits du vendeur
   - `followStore()` / `unfollowStore()` / `isFollowing()` (localStorage pour MVP)

---

#### **Étape 3 : Créer la Page Boutique** ⏱️ 40 min
1. Créer `src/pages/store/StorePage.tsx`
2. Implémenter :
   - Header avec retour arrière
   - Section profil (avatar, nom, bio, stats)
   - Boutons "Contacter" et "Suivre"
   - Filtres (Tout, Promotions, Meilleures ventes)
   - Grille de produits (réutiliser le composant carte produit existant)

---

#### **Étape 4 : Modifier ProductDetail** ⏱️ 15 min
1. Modifier `src/pages/products/ProductDetail.tsx`
2. Rendre la carte vendeur cliquable
3. Afficher les vraies stats (note, ventes)
4. Bouton "Voir la Boutique"

---

#### **Étape 5 : Ajouter la Route** ⏱️ 5 min
1. Modifier `src/App.tsx`
2. Ajouter la route `/store/:sellerId`
3. Importer `StorePage`

---

#### **Étape 6 : Améliorer SellerDashboard** ⏱️ 10 min
1. Modifier `src/pages/seller/SellerDashboard.tsx`
2. Ajouter bouton "👁️ Voir ma boutique publique"
3. Naviguer vers `/store/{user.id}`

---

#### **Étape 7 : Tests** ⏱️ 20 min
1. Tester la navigation depuis ProductDetail
2. Vérifier que tous les produits du vendeur s'affichent
3. Tester les filtres
4. Tester le bouton "Contacter" (doit ouvrir le chat)
5. Tester le bouton "Suivre" (localStorage)
6. Tester la vue publique depuis SellerDashboard

---

### ⏱️ Temps Total Estimé : **2h 00min**

---

## 9. Future Features

### 🛒 Panier Multi-Produits (Phase 3)

**Concept :**
Actuellement, on achète 1 produit à la fois. Avec le panier multi-produits :
- L'acheteur peut ajouter plusieurs produits **du même vendeur**
- Un seul checkout
- Frais de livraison mutualisés (payés une seule fois)

**Exemple :**
```
Divine Mode Brazza :
- Robe Ankara x2 = 50 000 FCFA
- Chemise Wax x1 = 25 000 FCFA
- Sac à main x1 = 15 000 FCFA
─────────────────────────────
Sous-total : 90 000 FCFA
Livraison : 2 000 FCFA (au lieu de 6 000 si 3 commandes séparées)
─────────────────────────────
TOTAL : 92 000 FCFA
```

**Implémentation Future :**
1. Table `cart_items` dans Supabase
2. Bouton "Ajouter au Panier" sur les produits
3. Icône panier dans le header (avec badge du nombre d'items)
4. Page `/cart` pour voir le panier
5. Checkout groupé

**Avantage de la Page Boutique :**
La page boutique permet de **visualiser tous les produits** d'un vendeur en un coup d'œil, ce qui incite à commander plusieurs articles en même temps !

---

### 📊 Système d'Avis (Phase 3)

**Concept :**
Après livraison, l'acheteur peut laisser un avis (note + commentaire).

**Schéma :**
```sql
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Affichage sur StorePage :**
- Section "Avis Clients" après la grille de produits
- Calcul automatique de `average_rating` dans `profiles`
- Trigger pour mettre à jour `average_rating` après chaque nouvel avis

---

### 🎟️ Promotions & Coupons (Phase 3)

**Concept :**
Le vendeur peut créer des codes promo (ex: `NOEL2025` = -15%).

**Schéma :**
```sql
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id),
  code TEXT UNIQUE NOT NULL,
  discount_percent DECIMAL(5, 2),
  discount_amount DECIMAL(12, 2),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

**Affichage sur StorePage :**
- Badge "🎁 Promo -15%" sur les produits éligibles
- Filtre "Promotions" fonctionne réellement

---

## 📊 Récapitulatif des Fichiers

### ✅ À Créer (3 fichiers)

| Fichier | Localisation | Lignes estimées |
|---------|--------------|-----------------|
| Migration SQL | `supabase/migrations/20251231_add_store_fields.sql` | ~60 |
| Service Store | `src/services/storeService.ts` | ~150 |
| Page Boutique | `src/pages/store/StorePage.tsx` | ~400 |

---

### ✏️ À Modifier (3 fichiers)

| Fichier | Localisation | Modifications |
|---------|--------------|---------------|
| ProductDetail | `src/pages/products/ProductDetail.tsx` | Carte vendeur cliquable (lignes 221-239) |
| SellerDashboard | `src/pages/seller/SellerDashboard.tsx` | Bouton "Voir ma boutique" (après ligne 73) |
| App | `src/App.tsx` | Route `/store/:sellerId` |

---

## 🎯 Checklist de Validation

Avant de considérer la Phase 1 complète, vérifier :

- [ ] La migration SQL a été exécutée sans erreur
- [ ] Les colonnes `store_name`, `store_slug`, `store_bio`, etc. existent dans `profiles`
- [ ] Le service `storeService.ts` est créé et fonctionne
- [ ] La page `StorePage.tsx` est créée et stylée
- [ ] Clic sur vendeur depuis ProductDetail → Navigate vers StorePage ✅
- [ ] La page StorePage affiche :
  - [ ] Avatar du vendeur
  - [ ] Nom de la boutique (ou full_name en fallback)
  - [ ] Stats (note, ventes, membre depuis)
  - [ ] Tous les produits du vendeur
  - [ ] Bouton "Contacter" (ouvre le chat)
  - [ ] Bouton "Suivre" (toggle localStorage)
- [ ] Les filtres fonctionnent (Tout, Promotions, Meilleures ventes)
- [ ] Le bouton "Voir ma boutique publique" fonctionne dans SellerDashboard
- [ ] Design responsive (mobile-first)
- [ ] Pas de bugs console
- [ ] Logs de debugging en place (pour développement)

---

## 📝 Notes Importantes

### ⚠️ Attention aux Performances

- **Limite de produits :** Si un vendeur a 1000+ produits, paginer les résultats (50 par page)
- **Images :** Utiliser lazy loading (`loading="lazy"`) sur les images produits
- **Cache :** Considérer le cache des données vendeur (1 min) pour éviter trop de fetches

### 🔒 Sécurité & Permissions

- **RLS Policies :** Les données de `profiles` sont déjà publiques (`SELECT USING (true)`)
- **Privacy :** Les vendeurs ne doivent PAS exposer leur `wallet_balance` sur la page publique
- **Stats :** Afficher seulement les stats publiques (`total_sales_count`, `average_rating`)

### 🌍 Internationalisation (Future)

- Pour l'instant, tout en français
- Plus tard, ajouter support pour anglais/lingala/kikongo
- Préparer les strings dans un fichier `i18n.ts`

---

**Dernière mise à jour :** 31 Décembre 2025
**Status :** ✅ Plan complet et validé
**Next :** Attendre validation utilisateur avant d'implémenter
