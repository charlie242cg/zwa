# 🧪 GUIDE DE TEST - SYSTÈME DE NOTATION

## 🎯 Objectif

Ce guide explique comment tester le système complet de notation/avis avant l'intégration du paiement réel.

---

## 🆕 Nouvelle fonction : `simulateFullSale()`

Une fonction spéciale a été créée pour **simuler tout le cycle de vente en une seule étape** :

### Ce qu'elle fait :

```
pending → paid → shipped → delivered
```

**Étapes automatiques :**
1. ✅ Paiement simulé (`simulatePayment`)
2. ✅ Expédition avec OTP (`shipOrder`)
3. ✅ Livraison confirmée (`confirmDeliveryByBuyer`)

**Résultats :**
- ✅ Status commande = `'delivered'`
- ✅ Wallets vendeur/affilié mis à jour
- ✅ **`total_sales_count` incrémenté** (trigger SQL se déclenche)
- ✅ Modal de notation s'ouvre automatiquement
- ✅ Transactions créées pour toutes les parties

---

## 📝 Comment utiliser pour les tests

### Option 1 : Via ProductDetail (Achat Direct)

**Actuellement**, ProductDetail utilise uniquement `simulatePayment()`. Pour tester le système complet :

**Modification temporaire pour tests :**

```typescript
// Dans ProductDetail.tsx, ligne ~135
const handleBuyNow = async () => {
    // ... code existant création commande

    // REMPLACER :
    const { error: paymentError } = await orderService.simulatePayment(order.id);

    // PAR :
    const { error: paymentError } = await orderService.simulateFullSale(order.id);

    if (paymentError) {
        alert("Erreur : " + paymentError.message);
    } else {
        alert(`✅ Vente simulée avec succès !\nLe modal de notation va s'ouvrir automatiquement.`);
        navigate('/orders');
    }
};
```

### Option 2 : Via Console du navigateur

**Si tu ne veux pas modifier le code** :

1. Achète un produit normalement (créera une commande `pending`)
2. Ouvre la console (`F12`)
3. Récupère l'ID de la commande dans `/orders`
4. Exécute :

```javascript
// Importer le service
import { orderService } from './services/orderService';

// Simuler la vente complète
const orderId = 'ton-order-id-ici';
await orderService.simulateFullSale(orderId);

// Recharger la page pour voir les changements
window.location.reload();
```

### Option 3 : Via OrdersList (Vendeur)

**Dans l'onglet vendeur**, ajouter un bouton temporaire :

```tsx
{/* Bouton temporaire pour tests */}
{order.status === 'pending' && (
    <button onClick={async () => {
        const { error } = await orderService.simulateFullSale(order.id);
        if (!error) {
            alert('✅ Vente simulée !');
            window.location.reload();
        }
    }}>
        🎬 Simuler vente complète
    </button>
)}
```

---

## 🧪 Workflow de test complet

### Test 1 : Vente avec notation produit + vendeur

**Étape 1 : Créer une commande**
1. En tant qu'acheteur, achète un produit
2. Note l'ID de la commande créée

**Étape 2 : Simuler la vente complète**
```javascript
await orderService.simulateFullSale(orderId);
```

**Étape 3 : Vérifier les résultats**
- ✅ Commande status = `'delivered'`
- ✅ Page `/orders` → Badge "Laisser un avis" visible
- ✅ Modal de notation s'ouvre automatiquement

**Étape 4 : Noter produit et vendeur**
- Noter le produit : ⭐⭐⭐⭐⭐ + commentaire + photos
- Noter le vendeur : ⭐⭐⭐⭐ + commentaire
- Cliquer "Publier mon avis"

**Étape 5 : Vérifier affichage**
- ✅ Page produit → Section "Avis clients" avec ton avis + photos
- ✅ Page boutique vendeur → Section "Avis récents" avec ton avis vendeur
- ✅ Stats boutique → Note moyenne + nombre avis mis à jour
- ✅ Page `/orders` → Badge "Avis publié ⭐"

---

## 🔍 Points à vérifier

### ✅ Comptabilisation ventes vendeur

**Avant la vente :**
```sql
SELECT total_sales_count FROM profiles WHERE id = 'seller_id';
-- Résultat : 0
```

**Après `simulateFullSale()` :**
```sql
SELECT total_sales_count FROM profiles WHERE id = 'seller_id';
-- Résultat : 1 ✅
```

### ✅ Comptabilisation avis produit

**Avant l'avis :**
```sql
SELECT average_rating, total_reviews FROM products WHERE id = 'product_id';
-- Résultat : 0.00, 0
```

**Après publication avis :**
```sql
SELECT average_rating, total_reviews FROM products WHERE id = 'product_id';
-- Résultat : 5.00, 1 ✅
```

### ✅ Comptabilisation avis vendeur

**Avant l'avis :**
```sql
SELECT average_rating, total_reviews FROM profiles WHERE id = 'seller_id';
-- Résultat : 0.00, 0
```

**Après publication avis :**
```sql
SELECT average_rating, total_reviews FROM profiles WHERE id = 'seller_id';
-- Résultat : 4.00, 1 ✅
```

---

## 🎬 Scénarios de test

### Scénario 1 : Note parfaite (5⭐ partout)

1. Simuler vente complète
2. Noter produit : ⭐⭐⭐⭐⭐ + "Produit excellent !"
3. Noter vendeur : ⭐⭐⭐⭐⭐ + "Service impeccable"
4. Uploader 3 photos
5. Publier

**Vérifier :**
- Page produit : 5.0/5 · 1 avis + 3 photos
- Page boutique : 5.0/5 · 1 avis

### Scénario 2 : Note moyenne (3⭐ produit, 4⭐ vendeur)

1. Simuler vente complète
2. Noter produit : ⭐⭐⭐ ☆ ☆ + "Correct"
3. Noter vendeur : ⭐⭐⭐⭐ ☆ + "Bon service"
4. Publier

**Vérifier :**
- Moyennes correctement calculées

### Scénario 3 : Plusieurs avis sur même produit

1. Créer 3 commandes différentes (3 acheteurs différents)
2. Simuler vente complète pour chacune
3. Noter avec des notes différentes (5⭐, 4⭐, 3⭐)
4. Vérifier moyenne : (5+4+3)/3 = 4.0/5 ✅

### Scénario 4 : Avis sans commentaire

1. Simuler vente complète
2. Noter uniquement avec étoiles (pas de texte)
3. Publier

**Vérifier :**
- Avis affiché avec étoiles seulement
- Pas de bloc commentaire vide

### Scénario 5 : Skip puis noter plus tard

1. Simuler vente complète
2. Modal s'ouvre → Cliquer "Passer"
3. Aller sur `/orders`
4. Cliquer bouton "Laisser un avis"
5. Noter et publier

---

## 🐛 Debugging

### Problème : total_sales_count ne s'incrémente pas

**Cause probable :** Trigger SQL ne se déclenche pas

**Solution :**
```sql
-- Vérifier que le trigger existe
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_order_delivered';

-- Vérifier le status de la commande
SELECT id, status FROM orders WHERE id = 'order_id';
-- Doit être 'delivered' ✅
```

### Problème : average_rating ne se met pas à jour

**Cause probable :** Trigger reviews pas appliqué

**Solution :**
```sql
-- Vérifier les triggers reviews
SELECT * FROM information_schema.triggers
WHERE trigger_name LIKE '%review%';

-- Forcer recalcul manuel
UPDATE profiles
SET average_rating = (
    SELECT AVG(seller_rating)::DECIMAL(3,2)
    FROM reviews
    WHERE seller_id = 'seller_id'
    AND seller_rating IS NOT NULL
)
WHERE id = 'seller_id';
```

### Problème : Modal ne s'ouvre pas après livraison

**Cause probable :** OrdersList pas rechargé

**Solution :**
- Forcer refresh de la page `/orders`
- Vérifier state `reviewModalOpen`

---

## 📊 Logs de debugging

Lors de `simulateFullSale()`, tu verras ces logs :

```
[OrderService] 🎬 Simulating FULL SALE cycle for order: abc123
[OrderService] 💳 Step 1/3: Simulating payment...
[OrderService] ✅ Payment simulated successfully
[OrderService] 📦 Step 2/3: Shipping order...
[OrderService] ✅ Order shipped with OTP: 1234
[OrderService] ✅ Step 3/3: Confirming delivery...
[OrderService] 💰 Updating wallet balances...
[OrderService] 💸 Seller payout: { amount: 35000, commission: 3500, netAmount: 31500 }
[OrderService] ✅ Delivery confirmed successfully!
[OrderService] 📝 Creating transactions...
[OrderService] ✅ All transactions created successfully!
[OrderService] 🎉 FULL SALE SIMULATED SUCCESSFULLY!
[OrderService] 📊 Order status: delivered | Wallets updated | Sales count incremented
```

---

## ✅ Checklist de test

Avant de considérer le système comme fonctionnel :

- [ ] Migration SQL `20260101_add_reviews_system.sql` appliquée
- [ ] Trigger `on_order_delivered` existe et fonctionne
- [ ] Trigger `on_review_created` existe et fonctionne
- [ ] `simulateFullSale()` passe une commande à `delivered`
- [ ] `total_sales_count` s'incrémente après `simulateFullSale()`
- [ ] Modal de notation s'ouvre automatiquement après livraison
- [ ] Avis produit enregistré avec `product_rating` + `product_comment` + photos
- [ ] Avis vendeur enregistré avec `seller_rating` + `seller_comment`
- [ ] `average_rating` produit mis à jour automatiquement
- [ ] `total_reviews` produit mis à jour automatiquement
- [ ] `average_rating` vendeur mis à jour automatiquement
- [ ] `total_reviews` vendeur mis à jour automatiquement
- [ ] Avis produit visible sur ProductDetail avec photos
- [ ] Avis vendeur visible sur StorePage sans photos
- [ ] Badge "Avis publié ⭐" affiché après notation
- [ ] Bouton "Laisser un avis" visible si pas encore noté

---

## 🚀 Prochaines étapes

Une fois les tests validés :

1. **Retirer `simulateFullSale()`** des boutons UI
2. **Garder la fonction** pour tests futurs
3. **Implémenter paiement réel** via API
4. **Remplacer `simulatePayment()`** par vrai paiement

---

**Date** : 2026-01-01
**Fonction créée** : `orderService.simulateFullSale()`
**Cycle complet** : `pending → paid → shipped → delivered`
**Triggers SQL** : ✅ Automatiques
