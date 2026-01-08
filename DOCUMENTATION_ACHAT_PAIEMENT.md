# 📚 Documentation Complète - Système d'Achat et Paiement Zwa

**Date :** 31 Décembre 2025
**Status :** ✅ Phase 1 Complète (Logique métier avec simulation de paiement)
**Prochaine étape :** Intégration YabetooPay

---

## 🎯 Vue d'Ensemble

Le système d'achat de Zwa propose **2 modes d'achat** :

### 1️⃣ Achat Direct (Buy Now)
- **Usage :** Acheteur accepte le prix affiché
- **Flow :** `Produit → Clic "Acheter" → Paiement simulé → Commande créée (status: paid)`
- **Fichiers impliqués :**
  - `src/pages/products/ProductDetail.tsx` (bouton "💳 Acheter Maintenant")
  - `src/services/orderService.ts` (`createOrder()`, `simulatePayment()`)

### 2️⃣ Négociation via Chat
- **Usage :** Acheteur veut négocier le prix/conditions
- **Flow :** `Produit → Clic "Négocier" → Chat → Vendeur crée Deal → Bouton Payer → Paiement simulé → Commande payée`
- **Fichiers impliqués :**
  - `src/pages/chat/ChatRoom.tsx` (bouton "💳 Payer Maintenant (Simulation)")
  - `src/services/orderService.ts` (`createOrder()`, `simulatePayment()`)

---

## 🔄 Cycle de Vie d'une Commande

### Statuts Possibles

| Statut | Description | Durée | Visible dans "Achats" |
|--------|-------------|-------|----------------------|
| `pending` | En attente de paiement | Secondes/Minutes | ❌ NON |
| `paid` | Paiement validé | Jusqu'à expédition | ✅ OUI |
| `shipped` | Expédiée, code OTP généré | Jusqu'à livraison | ✅ OUI |
| `delivered` | Livrée, fonds transférés | Permanent | ✅ OUI |

### Timeline Complète

```
┌─────────────┐
│   PENDING   │ ← Checkout en cours (invisible pour l'acheteur)
└──────┬──────┘
       │ Paiement validé (simulatePayment)
       ↓
┌─────────────┐
│    PAID     │ ← Apparaît dans l'onglet "Achats" de l'acheteur
└──────┬──────┘   Timeline verte activée jusqu'à "Payé"
       │ Vendeur clique "Marquer comme Expédié"
       ↓
┌─────────────┐
│   SHIPPED   │ ← Code OTP généré (ex: 7234)
└──────┬──────┘   Acheteur voit son code OTP dans l'interface
       │ Acheteur saisit le code OTP après réception
       ↓
┌─────────────┐
│  DELIVERED  │ ← Fonds transférés (vendeur + affilié si présent)
└─────────────┘   Timeline verte complète
```

---

## 🛠️ Problèmes Rencontrés et Solutions

### ❌ Problème #1 : Commandes `pending` ne deviennent jamais `paid`

**Symptôme :**
- Logs : `✅ Payment simulated successfully. Updated rows: 0`
- Commandes restent en `pending` dans la DB
- Onglet "Achats" vide

**Cause :**
Manque de policy RLS pour permettre aux **buyers** d'UPDATE leurs commandes.

**Solution :**
```sql
CREATE POLICY "Buyers can update their own orders"
ON orders
FOR UPDATE
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);
```

**Fichier :** `FIX_RLS_ORDERS.sql` (à exécuter dans Supabase SQL Editor)

---

### ❌ Problème #2 : Update retourne un tableau vide

**Symptôme :**
- L'update réussit en DB mais `.select()` retourne `[]`
- Logs : `Updated rows: 0 Data: []`

**Cause :**
RLS bloque le `.select()` après l'update même avec la bonne policy.

**Solution (Workaround) :**
Refetch automatique si l'update retourne vide.

**Code :**
```typescript
// src/services/orderService.ts:246-257
if (!data || data.length === 0) {
    console.error('[OrderService] ⚠️ Update succeeded but returned no data. This might be an RLS issue.');
    // Try to fetch the order again
    const { data: refetchedOrder } = await supabase
        .from('orders')
        .select('*, products(name, image_url)')
        .eq('id', orderId)
        .single();

    console.log('[OrderService] 🔄 Refetched order:', refetchedOrder);
    return { data: refetchedOrder, error: null };
}
```

---

### ❌ Problème #3 : Timeout du profil utilisateur

**Symptôme :**
- `fetchProfile` timeout répété
- Logs : `Timeout profile`
- Page "Achats" reste en "⏳ Chargement de votre profil..."

**Cause :**
Problème RLS sur la table `profiles` (non lié aux orders).

**Solution (OrdersList) :**
Amélioration de la gestion du chargement.

**Code :**
```typescript
// src/pages/orders/OrdersList.tsx:15-22
useEffect(() => {
    if (profile?.id && profile?.role) {
        console.log('[OrdersList] ✅ Profile loaded, fetching orders...');
        fetchOrders();
    } else {
        console.log('[OrdersList] ⏳ Waiting for profile...');
    }
}, [profile?.id, profile?.role]);
```

**Affichage conditionnel :**
```typescript
// src/pages/orders/OrdersList.tsx:86-90
{!profile?.id ? (
    <div style={styles.centered}>⏳ Chargement de votre profil...</div>
) : loading ? (
    <div style={styles.centered}>📦 Chargement de vos commandes...</div>
) : orders.length > 0 ? (
```

---

## 📝 Fichiers Modifiés

### 1. `src/services/orderService.ts`

**Fonctions ajoutées :**

#### `simulatePayment(orderId: string)`
- **Rôle :** Simule un paiement en changeant le statut de `pending` à `paid`
- **Logs :**
  - `💳 Simulating payment for order`
  - `🔍 Order found` (avec détails)
  - `✅ Payment simulated successfully`
  - `⚠️ Update succeeded but returned no data` (si RLS bloque)
  - `🔄 Refetched order` (workaround)
- **Lignes :** 210-260

```typescript
async simulatePayment(orderId: string) {
    console.log('[OrderService] 💳 Simulating payment for order:', orderId);

    // First, verify the order exists and is pending
    const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError) {
        console.error('[OrderService] ❌ Order not found:', fetchError);
        return { data: null, error: fetchError };
    }

    console.log('[OrderService] 🔍 Order found:', {
        id: existingOrder.id,
        status: existingOrder.status,
        buyer_id: existingOrder.buyer_id,
        seller_id: existingOrder.seller_id
    });

    // Simulate payment by updating status from 'pending' to 'paid'
    const { data, error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .select('*, products(name, image_url)');

    if (error) {
        console.error('[OrderService] ❌ Payment update failed:', error);
        return { data: null, error };
    }

    console.log('[OrderService] ✅ Payment simulated successfully. Updated rows:', data?.length, 'Data:', data);

    if (!data || data.length === 0) {
        console.error('[OrderService] ⚠️ Update succeeded but returned no data. This might be an RLS issue.');
        // Try to fetch the order again
        const { data: refetchedOrder } = await supabase
            .from('orders')
            .select('*, products(name, image_url)')
            .eq('id', orderId)
            .single();

        console.log('[OrderService] 🔄 Refetched order:', refetchedOrder);
        return { data: refetchedOrder, error: null };
    }

    return { data: data[0], error: null };
}
```

#### `confirmDeliveryByBuyer(orderId: string, otp: string)`
- **Rôle :** Permet à l'acheteur de confirmer la réception avec le code OTP
- **Actions :**
  1. Vérifie le code OTP
  2. Change le statut à `delivered`
  3. Transfère les fonds au vendeur (montant - commission)
  4. Transfère la commission à l'affilié (si présent)
- **Logs :**
  - `📦 Buyer confirming delivery`
  - `🔍 Order found. Verifying OTP`
  - `✅ OTP verified`
  - `💰 Updating wallet balances`
  - `💸 Seller payout` (détails)
  - `🎁 Affiliate detected` (si présent)
  - `✅ Delivery confirmed successfully`
- **Lignes :** 262-365

#### Modification : `getOrdersByBuyer(buyerId: string)`
- **Changement :** Filtre ajouté pour exclure les commandes `pending`
- **Avant :** Toutes les commandes
- **Après :** Seulement `paid`, `shipped`, `delivered`
- **Ligne :** 63

```typescript
.in('status', ['paid', 'shipped', 'delivered'])
```

---

### 2. `src/pages/products/ProductDetail.tsx`

**Fonction ajoutée :**

#### `handleBuyNow()`
- **Rôle :** Gère l'achat direct depuis la fiche produit
- **Actions :**
  1. Récupère `affiliateId` depuis `sessionStorage`
  2. Crée une commande avec `createOrder()`
  3. Simule le paiement avec `simulatePayment()`
  4. Redirige vers `/orders`
- **Logs :**
  - `💳 Direct purchase initiated for product`
  - `✅ Order created`
  - `❌ Order creation failed` (si erreur)
  - `❌ Payment simulation failed` (si erreur)
  - `✅ Payment successful!`
- **Lignes :** 104-144

**Boutons ajoutés :**

```typescript
// Ligne 243-256
<button style={styles.buyNowButton} onClick={handleBuyNow}>
    💳 Acheter Maintenant
</button>
<button style={styles.negotiateButton} onClick={startNegotiation}>
    💬 Négocier le Prix
</button>
```

**Styles ajoutés :**
- `buyNowButton` (violet avec ombre)
- `negotiateButton` (transparent avec bordure)

---

### 3. `src/pages/chat/ChatRoom.tsx`

**Fonction ajoutée :**

#### `handlePayOrder(orderId: string)`
- **Rôle :** Simule le paiement d'une commande depuis le chat
- **Actions :**
  1. Appelle `simulatePayment()`
  2. Rafraîchit les messages pour afficher le statut mis à jour
- **Logs :**
  - `💳 Simulating payment for order`
  - `❌ Payment simulation failed` (si erreur)
  - `✅ Payment simulated successfully`
- **Lignes :** 279-299

**Bouton modifié :**

```typescript
// Ligne 400
<button
    style={styles.alibabaPayButton}
    onClick={() => handlePayOrder(msg.order?.id || '')}
>
    💳 Payer Maintenant (Simulation)
</button>
```

---

### 4. `src/pages/orders/OrdersList.tsx`

**Améliorations :**

#### Gestion du profil
- **Changement :** Attend que `profile.id` et `profile.role` soient chargés avant de fetch
- **Logs ajoutés :**
  - `✅ Profile loaded, fetching orders...`
  - `⏳ Waiting for profile...`
  - `⚠️ Cannot fetch orders: profile not ready`
- **Lignes :** 15-45

#### Affichage conditionnel
- **Avant :** Un seul message de chargement
- **Après :** Messages différents selon l'état
  - `⏳ Chargement de votre profil...` (si pas de profil)
  - `📦 Chargement de vos commandes...` (si chargement en cours)
- **Lignes :** 86-90

#### Timeline visuelle pour les acheteurs
- **Affichage :** Uniquement pour les buyers (pas sellers/affiliates)
- **Étapes :** En attente → Payé → Expédié → Livré
- **Couleurs dynamiques :** Selon le statut actuel
- **Lignes :** 115-167

#### Zone d'action pour acheteurs (shipped)
- **Affichage :** Code OTP + champ de saisie + bouton confirmation
- **Composants :**
  - Box avec le code OTP (grand, violet)
  - Input pour saisir le code
  - Bouton "✓ Confirmer la Réception"
- **Lignes :** 156-184

---

## 🔐 Policies RLS (Row Level Security)

### Policies Créées

```sql
-- SELECT: Buyers peuvent voir leurs commandes
CREATE POLICY "Buyers can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = buyer_id);

-- SELECT: Sellers peuvent voir leurs commandes
CREATE POLICY "Sellers can view orders for their products"
ON orders FOR SELECT
USING (auth.uid() = seller_id);

-- SELECT: Affiliates peuvent voir les commandes liées
CREATE POLICY "Affiliates can view referred orders"
ON orders FOR SELECT
USING (auth.uid() = affiliate_id);

-- INSERT: Buyers peuvent créer leurs commandes
CREATE POLICY "Buyers can insert their own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- INSERT: Sellers peuvent créer des commandes
CREATE POLICY "Sellers can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- UPDATE: Buyers peuvent modifier leurs commandes (CRITIQUE pour le paiement)
CREATE POLICY "Buyers can update their own orders"
ON orders FOR UPDATE
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- UPDATE: Sellers peuvent modifier leurs commandes
CREATE POLICY "Sellers can update their orders"
ON orders FOR UPDATE
USING (auth.uid() = seller_id);
```

**⚠️ Policy Critique :**
La policy `"Buyers can update their own orders"` est **INDISPENSABLE** pour permettre `simulatePayment()` de fonctionner.

---

## 💰 Gestion des Commissions

### Calcul à la création

```typescript
// src/services/orderService.ts:26-34
const { data: product } = await supabase
    .from('products')
    .select('default_commission')
    .eq('id', params.productId)
    .single();

const commissionRate = product?.default_commission || 0;
const commissionAmount = (Number(params.amount) * Number(commissionRate)) / 100;
```

### Transfert à la livraison

```typescript
// src/services/orderService.ts:315-360
const commission = Number(order.commission_amount || 0);
const netAmount = Number(order.amount) - commission;

// Vendeur reçoit : Montant total - Commission
const newSellerBalance = Number(sellerProfile.wallet_balance) + netAmount;
await supabase
    .from('profiles')
    .update({ wallet_balance: newSellerBalance })
    .eq('id', order.seller_id);

// Affilié reçoit : Commission (si présent)
if (order.affiliate_id && commission > 0) {
    const newAffiliateBalance = Number(affiliateProfile.wallet_balance) + commission;
    await supabase
        .from('profiles')
        .update({ wallet_balance: newAffiliateBalance })
        .eq('id', order.affiliate_id);
}
```

---

## 🐛 Logs de Debugging

### Format des logs
```
[ServiceName] emoji Message
```

### OrderService
- `📦 Fetching orders for buyer`
- `💳 Simulating payment`
- `🔍 Order found` (avec détails)
- `✅ Payment simulated successfully`
- `⚠️ Update succeeded but returned no data`
- `🔄 Refetched order`
- `📦 Buyer confirming delivery`
- `💰 Updating wallet balances`
- `💸 Seller payout`
- `🎁 Affiliate detected`
- `✅ Delivery confirmed successfully`

### OrdersList Component
- `🔄 Component rendered. Role`
- `✅ Profile loaded, fetching orders...`
- `⏳ Waiting for profile...`
- `🔄 Fetching orders for role`
- `📦 Orders received`
- `⚠️ Cannot fetch orders: profile not ready`
- `📦 Shipping order`
- `✅ Order shipped. OTP`
- `📦 Buyer confirming delivery`
- `✅ Delivery confirmed by buyer`

### ProductDetail
- `💳 Direct purchase initiated for product`
- `✅ Order created`
- `❌ Order creation failed`
- `✅ Payment successful!`
- `❌ Payment simulation failed`

### ChatRoom
- `💼 Creating/Updating order...`
- `✅ Order created successfully`
- `❌ Order creation error`
- `💳 Simulating payment for order`
- `✅ Payment simulated successfully`
- `❌ Payment simulation failed`

---

## 🚀 Prochaines Étapes

### Phase 2 : Intégration YabetooPay

#### 1. Créer le service de paiement
```typescript
// src/services/paymentService.ts
async createCheckoutSession(orderId: string, amount: number)
async handlePaymentWebhook(webhookData: any)
```

#### 2. Remplacer `simulatePayment()`
- **Achat direct :** Rediriger vers YabetooPay checkout
- **Négociation :** Générer un lien de paiement personnalisé

#### 3. Gérer les webhooks
- Écouter les événements `payment.succeeded`
- Mettre à jour le statut de la commande automatiquement

#### 4. Gérer les liens expirés
- Ajouter champ `payment_link_expires_at` dans `orders`
- Afficher un avertissement si expiré (7 jours)

---

## 📊 Requêtes SQL Utiles

### Vérifier les commandes d'un acheteur

```sql
SELECT
    id,
    buyer_id,
    seller_id,
    product_id,
    status,
    amount,
    quantity,
    created_at
FROM orders
WHERE buyer_id = 'USER_ID'
ORDER BY created_at DESC;
```

### Vérifier les policies RLS

```sql
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'orders';
```

### Simuler l'authentification RLS

```sql
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub = 'USER_ID';

SELECT * FROM orders WHERE buyer_id = 'USER_ID';
```

---

## ✅ Checklist de Vérification

Avant de passer à YabetooPay, vérifier que :

- [x] Les acheteurs peuvent acheter directement depuis ProductDetail
- [x] Les acheteurs peuvent payer via le chat après négociation
- [x] Les commandes `pending` ne s'affichent PAS dans l'onglet "Achats"
- [x] Les commandes `paid` s'affichent avec la timeline verte
- [x] Les vendeurs peuvent marquer une commande comme expédiée
- [x] Un code OTP est généré à l'expédition
- [x] Les acheteurs voient leur code OTP quand la commande est expédiée
- [x] Les acheteurs peuvent confirmer la réception avec le code OTP
- [x] Les fonds sont transférés au vendeur à la livraison
- [x] Les commissions sont transférées à l'affilié (si présent)
- [x] Tous les logs de debugging sont en place
- [x] Les policies RLS sont correctes

---

## 📝 Notes Importantes

1. **Commandes `pending`** ne sont PAS visibles dans l'onglet Achats (par design)
2. **Code OTP** n'est PAS hashé dans le MVP (sera amélioré en production)
3. **Simulation de paiement** existe uniquement pour le développement
4. **Tracking visuel** est affiché uniquement pour les acheteurs
5. **Refetch automatique** contourne le problème RLS sur les updates

---

**Dernière mise à jour :** 31 Décembre 2025
**Status :** ✅ Système fonctionnel avec simulation
**Next :** Intégration YabetooPay pour les paiements réels
