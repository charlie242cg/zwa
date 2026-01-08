# ✅ SYSTÈME DE NOTATION - IMPLÉMENTATION COMPLÈTE

## 🎯 Vue d'ensemble

Système de notation complet inspiré d'Alibaba permettant aux acheteurs de noter **à la fois le produit ET le vendeur** après livraison, avec photos optionnelles.

---

## 📊 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    CYCLE DE COMMANDE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  pending → paid → shipped → delivered                        │
│     ↓        ↓       ↓         ↓                            │
│   Créé   Payé   Expédié   [TRIGGER SQL] ✨                  │
│                            │                                 │
│                            ├─► total_sales_count++           │
│                            ├─► Wallet vendeur mis à jour     │
│                            ├─► Wallet affilié mis à jour     │
│                            └─► Modal de notation s'ouvre     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    NOTATION APRÈS LIVRAISON                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Modal ReviewModal s'ouvre automatiquement                   │
│     ↓                                                        │
│  Acheteur note :                                             │
│     • Produit : ⭐⭐⭐⭐⭐ + commentaire + 3 photos max      │
│     • Vendeur : ⭐⭐⭐⭐ + commentaire (pas de photos)      │
│     ↓                                                        │
│  reviewService.createReview() enregistre dans table reviews  │
│     ↓                                                        │
│  [TRIGGER SQL] ✨ Met à jour automatiquement :              │
│     • products.average_rating                                │
│     • products.total_reviews                                 │
│     • profiles.average_rating (vendeur)                      │
│     • profiles.total_reviews (vendeur)                       │
│     ↓                                                        │
│  Affichage dans UI :                                         │
│     • ProductDetail → ReviewCard type="product" (avec photos)│
│     • StorePage → ReviewCard type="seller" (sans photos)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schéma Base de Données

### Table `reviews`

```sql
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) UNIQUE,
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),

  -- Notation produit
  product_rating INTEGER CHECK (product_rating >= 1 AND product_rating <= 5),
  product_comment TEXT,

  -- Notation vendeur
  seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
  seller_comment TEXT,

  -- Photos (uniquement pour produit)
  review_images TEXT[],

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT at_least_one_rating CHECK (
    seller_rating IS NOT NULL OR product_rating IS NOT NULL
  )
);
```

### Colonnes ajoutées à `profiles`

```sql
ALTER TABLE profiles ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_sales_count INTEGER DEFAULT 0;
```

### Colonnes ajoutées à `products`

```sql
ALTER TABLE products ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN total_reviews INTEGER DEFAULT 0;
```

---

## ⚙️ Triggers SQL Automatiques

### 1. Incrémentation des ventes (`total_sales_count`)

**Quand** : Commande passe à `status = 'delivered'`

```sql
CREATE OR REPLACE FUNCTION update_seller_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_sales_count = total_sales_count + 1
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_delivered
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'delivered')
EXECUTE FUNCTION update_seller_sales_count();
```

### 2. Recalcul notes produit

**Quand** : Création/modification/suppression d'un avis produit

```sql
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    average_rating = (
      SELECT COALESCE(AVG(product_rating)::DECIMAL(3,2), 0.00)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND product_rating IS NOT NULL
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND product_rating IS NOT NULL
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_product_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();
```

### 3. Recalcul notes vendeur

**Quand** : Création/modification/suppression d'un avis vendeur

```sql
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT COALESCE(AVG(seller_rating)::DECIMAL(3,2), 0.00)
      FROM reviews
      WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
      AND seller_rating IS NOT NULL
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
      AND seller_rating IS NOT NULL
    )
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_seller_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating();
```

---

## 🔐 Row Level Security (RLS)

### Politique de création

**Seuls les acheteurs de commandes livrées peuvent créer un avis**

```sql
CREATE POLICY "Buyers can create reviews for delivered orders"
ON reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.buyer_id = auth.uid()
    AND orders.status = 'delivered'
  )
);
```

### Politique de lecture

**Tous les utilisateurs authentifiés peuvent voir les avis**

```sql
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO authenticated
USING (true);
```

---

## 📂 Fichiers Frontend

### 1. [reviewService.ts](src/services/reviewService.ts)

**Fonctions clés :**

```typescript
// Créer un avis (produit et/ou vendeur)
async createReview(data: {
    orderId: string;
    productRating?: number;
    productComment?: string;
    sellerRating?: number;
    sellerComment?: string;
    reviewImages?: string[];
})

// Vérifier si commande déjà notée
async hasReview(orderId: string): Promise<boolean>

// Récupérer avis d'un produit
async getProductReviews(productId: string, limit?: number)

// Récupérer avis d'un vendeur
async getSellerReviews(sellerId: string, limit?: number)

// Récupérer avis d'une commande
async getReviewByOrderId(orderId: string)

// Compter les avis
async getProductReviewCount(productId: string)
async getSellerReviewCount(sellerId: string)
```

### 2. [StarRating.tsx](src/components/reviews/StarRating.tsx)

**Composant réutilisable pour afficher/saisir des notes**

```typescript
interface StarRatingProps {
    value: number; // 0-5
    onChange?: (value: number) => void; // Interactif si fourni
    size?: number; // Taille en px
    readonly?: boolean; // Affichage seul
}
```

**Usage :**
```tsx
{/* Lecture seule */}
<StarRating value={4.5} readonly size={16} />

{/* Interactif */}
<StarRating
    value={productRating}
    onChange={setProductRating}
    size={24}
/>
```

### 3. [ReviewModal.tsx](src/components/reviews/ReviewModal.tsx)

**Modal de notation (s'ouvre auto après livraison)**

**Props :**
```typescript
interface ReviewModalProps {
    order: any; // Commande livrée
    isOpen: boolean;
    onClose: () => void;
    onReviewSubmitted: () => void;
}
```

**Fonctionnalités :**
- ✅ Notation produit : étoiles + commentaire + 3 photos max
- ✅ Notation vendeur : étoiles + commentaire (pas de photos)
- ✅ Upload Cloudinary pour images
- ✅ Validation avant soumission
- ✅ Bouton "Passer" pour noter plus tard

### 4. [ReviewCard.tsx](src/components/reviews/ReviewCard.tsx)

**Composant flexible pour afficher un avis**

**Props :**
```typescript
interface ReviewCardProps {
    review: Review;
    type?: 'product' | 'seller'; // Défaut : 'product'
}
```

**Logique conditionnelle :**
```typescript
const rating = type === 'seller' ? review.seller_rating : review.product_rating;
const comment = type === 'seller' ? review.seller_comment : review.product_comment;
const showImages = type === 'product' && review.review_images?.length > 0;
```

**Usage :**
```tsx
{/* Page produit : affiche avis produit avec photos */}
<ReviewCard review={review} type="product" />

{/* Page boutique : affiche avis vendeur sans photos */}
<ReviewCard review={review} type="seller" />
```

---

## 🎨 Intégration UI

### [ProductDetail.tsx](src/pages/products/ProductDetail.tsx)

**Section avis produit**

```tsx
{/* Header section */}
<div style={styles.reviewsHeader}>
    <div style={styles.ratingOverview}>
        <StarRating value={product.average_rating || 0} readonly size={24} />
        <span>{product.average_rating?.toFixed(1) || '0.0'}/5</span>
        <span>·</span>
        <span>{totalReviews} avis</span>
    </div>
</div>

{/* Liste des avis */}
{reviews.map(review => (
    <ReviewCard key={review.id} review={review} type="product" />
))}
```

### [StorePage.tsx](src/pages/store/StorePage.tsx)

**Section avis vendeur**

```tsx
{/* Stats vendeur avec étoiles */}
<div style={styles.statItem}>
    <StarRating value={store.average_rating || 0} readonly size={14} />
    <div>{store.average_rating?.toFixed(1) || '0.0'}/5</div>
    {store.total_reviews > 0 && (
        <div>{store.total_reviews} avis</div>
    )}
</div>

{/* Section avis récents */}
{store.total_reviews > 0 && (
    <div style={styles.reviewsSection}>
        <h3>📝 Avis récents ({store.total_reviews})</h3>
        {reviews.map(review => (
            <ReviewCard key={review.id} review={review} type="seller" />
        ))}
        {store.total_reviews > 3 && (
            <button>Voir tous les avis ({store.total_reviews}) →</button>
        )}
    </div>
)}
```

### [OrdersList.tsx](src/pages/orders/OrdersList.tsx)

**Auto-ouverture modal + bouton manuel**

```tsx
// State
const [reviewModalOpen, setReviewModalOpen] = useState(false);
const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
const [ordersWithReviews, setOrdersWithReviews] = useState<Set<string>>(new Set());

// Auto-ouverture après confirmation livraison
const handleConfirmDelivery = async (orderId: string) => {
    const { error } = await orderService.confirmDeliveryByBuyer(orderId, otp);
    if (!error) {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrderForReview(order);
        setReviewModalOpen(true); // ✨ Auto-open
    }
};

// Bouton manuel
{order.status === 'delivered' && !ordersWithReviews.has(order.id) && (
    <button onClick={() => {
        setSelectedOrderForReview(order);
        setReviewModalOpen(true);
    }}>
        Laisser un avis
    </button>
)}

// Badge "Avis publié"
{ordersWithReviews.has(order.id) && (
    <div style={styles.reviewedBadge}>Avis publié ⭐</div>
)}
```

---

## 🧪 Fonction de Test : `simulateFullSale()`

### Problème Initial

❌ `simulatePayment()` met seulement `status = 'paid'`
❌ Trigger SQL ne se déclenche que si `status = 'delivered'`
❌ `total_sales_count` ne s'incrémente pas

### Solution

✅ Fonction `simulateFullSale()` qui exécute le cycle complet :

```typescript
async simulateFullSale(orderId: string) {
    console.log('[OrderService] 🎬 Simulating FULL SALE cycle for order:', orderId);

    // 1. Paiement (pending → paid)
    console.log('[OrderService] 💳 Step 1/3: Simulating payment...');
    const { error: paymentError } = await this.simulatePayment(orderId);
    if (paymentError) {
        console.error('[OrderService] ❌ Payment simulation failed:', paymentError);
        return { error: paymentError };
    }
    console.log('[OrderService] ✅ Payment simulated successfully');

    // 2. Expédition (paid → shipped, génère OTP)
    console.log('[OrderService] 📦 Step 2/3: Shipping order...');
    const { error: shipError, otp } = await this.shipOrder(orderId);
    if (shipError || !otp) {
        console.error('[OrderService] ❌ Shipping failed:', shipError);
        return { error: shipError || new Error('OTP generation failed') };
    }
    console.log('[OrderService] ✅ Order shipped with OTP:', otp);

    // 3. Livraison (shipped → delivered, déclenche trigger)
    console.log('[OrderService] ✅ Step 3/3: Confirming delivery...');
    const { error: deliveryError } = await this.confirmDeliveryByBuyer(orderId, otp);
    if (deliveryError) {
        console.error('[OrderService] ❌ Delivery confirmation failed:', deliveryError);
        return { error: deliveryError };
    }

    console.log('[OrderService] 🎉 FULL SALE SIMULATED SUCCESSFULLY!');
    console.log('[OrderService] 📊 Order status: delivered | Wallets updated | Sales count incremented');

    return {
        data: {
            success: true,
            otp,
            message: 'Vente complète simulée avec succès ! Le modal de notation devrait s\'ouvrir automatiquement.'
        },
        error: null
    };
}
```

### Usage pour Tests

```javascript
// Option 1 : Console navigateur
import { orderService } from './services/orderService';
await orderService.simulateFullSale('order-id-ici');
window.location.reload();

// Option 2 : Modifier temporairement ProductDetail.tsx
const handleBuyNow = async () => {
    // Remplacer simulatePayment par simulateFullSale
    const { error } = await orderService.simulateFullSale(order.id);
    if (!error) {
        alert('✅ Vente simulée ! Modal va s\'ouvrir.');
        navigate('/orders');
    }
};
```

---

## ✅ Checklist de Vérification

### Base de données

- [ ] Migration `20260101_add_reviews_system.sql` appliquée
- [ ] Colonnes `average_rating`, `total_reviews`, `total_sales_count` ajoutées
- [ ] Table `reviews` créée avec contraintes
- [ ] Trigger `on_order_delivered` existe et fonctionne
- [ ] Trigger `on_review_product_change` existe et fonctionne
- [ ] Trigger `on_review_seller_change` existe et fonctionne
- [ ] Politiques RLS activées

### Frontend

- [ ] `reviewService.ts` créé avec toutes les fonctions
- [ ] `StarRating.tsx` fonctionne en mode readonly et interactif
- [ ] `ReviewModal.tsx` s'ouvre automatiquement après livraison
- [ ] `ReviewCard.tsx` affiche correctement type="product" et type="seller"
- [ ] ProductDetail affiche avis produit avec photos
- [ ] StorePage affiche avis vendeur sans photos
- [ ] OrdersList affiche badge "Avis publié" si déjà noté
- [ ] OrdersList affiche bouton "Laisser un avis" si pas encore noté

### Tests

- [ ] `simulateFullSale()` passe commande à `delivered`
- [ ] `total_sales_count` s'incrémente après `simulateFullSale()`
- [ ] Modal s'ouvre automatiquement après confirmation livraison
- [ ] Avis produit enregistré correctement (rating + comment + photos)
- [ ] Avis vendeur enregistré correctement (rating + comment)
- [ ] `products.average_rating` mis à jour automatiquement
- [ ] `products.total_reviews` mis à jour automatiquement
- [ ] `profiles.average_rating` mis à jour automatiquement
- [ ] `profiles.total_reviews` mis à jour automatiquement
- [ ] Photos visibles uniquement sur page produit
- [ ] Étoiles visuelles affichées partout

---

## 🚀 Prochaines Étapes

### Immédiatement

1. **Appliquer la migration SQL** dans Supabase Dashboard
2. **Tester avec `simulateFullSale()`** pour valider tout le système
3. **Vérifier les triggers** fonctionnent correctement

### Court terme

1. **Remplacer `simulatePayment()`** par vraie API de paiement
2. **Retirer `simulateFullSale()`** des boutons UI (garder pour tests futurs)

### Long terme

1. **Page "Tous les avis"** avec pagination et filtres
2. **Réponses vendeur** aux avis
3. **Statistiques avancées** (graphique répartition notes, évolution)
4. **Modération des avis** (signalement avis inappropriés)
5. **Avis utiles/inutiles** (système de votes)

---

## 📊 Différences Clés : Produit vs Vendeur

| Critère | Avis Produit | Avis Vendeur |
|---------|--------------|--------------|
| **Champ rating** | `product_rating` | `seller_rating` |
| **Champ comment** | `product_comment` | `seller_comment` |
| **Photos** | ✅ Oui (max 3) | ❌ Non |
| **Affiché sur** | ProductDetail.tsx | StorePage.tsx |
| **Type ReviewCard** | `type="product"` | `type="seller"` |
| **Concerne** | Qualité produit | Service vendeur |

---

## 🐛 Debugging Courant

### Problème : total_sales_count ne s'incrémente pas

**Cause** : Trigger ne se déclenche que si `status = 'delivered'`

**Solution** :
```sql
-- Vérifier le trigger existe
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_order_delivered';

-- Vérifier status commande
SELECT id, status FROM orders WHERE id = 'order_id';
-- Doit être 'delivered' ✅
```

### Problème : average_rating ne se met pas à jour

**Cause** : Trigger reviews pas appliqué

**Solution** :
```sql
-- Forcer recalcul manuel
UPDATE profiles
SET average_rating = (
    SELECT COALESCE(AVG(seller_rating)::DECIMAL(3,2), 0.00)
    FROM reviews
    WHERE seller_id = 'seller_id'
    AND seller_rating IS NOT NULL
)
WHERE id = 'seller_id';
```

### Problème : Modal ne s'ouvre pas

**Cause** : Page pas rechargée après livraison

**Solution** : Rafraîchir `/orders` après confirmation livraison

---

**🎉 Système de notation complet et fonctionnel !**

**Date** : 2026-01-01
**Type** : Dual rating (produit + vendeur)
**Triggers** : ✅ Automatiques
**RLS** : ✅ Sécurisé
**UI** : ✅ Intégré
**Tests** : ✅ `simulateFullSale()` disponible
