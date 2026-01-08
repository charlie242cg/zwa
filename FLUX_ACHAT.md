# 📦 Documentation des Flux d'Achat - Zwa Marketplace

## 🎯 Vision Globale

Zwa propose **2 modes d'achat distincts** pour s'adapter aux besoins des acheteurs :

### 1️⃣ **Achat Direct (Buy Now)** - *À implémenter*
**Pour** : Acheteurs qui acceptent le prix affiché
**Flow** :
```
Produit → Clic "Acheter" → Checkout → Paiement (YabetooPay) → Commande créée (status: paid)
```

### 2️⃣ **Négociation via Chat** - *Déjà implémenté*
**Pour** : Acheteurs qui veulent négocier le prix/conditions
**Flow** :
```
Produit → Clic "Négocier" → Chat → Discussion → Vendeur crée Deal → Lien de paiement → Paiement → Commande créée (status: paid)
```

---

## 🔄 Cycle de vie d'une Commande

### **Statuts possibles** :
1. ⏳ **`pending`** - Commande créée, en attente de paiement (durée : quelques secondes à quelques minutes)
2. ✅ **`paid`** - Paiement validé, en attente d'expédition
3. 📦 **`shipped`** - Commande expédiée, code OTP généré
4. 🎉 **`delivered`** - Livraison confirmée, fonds transférés

### **Timeline complète** :
```
┌─────────────┐
│   PENDING   │ ← Checkout en cours (invisible pour l'acheteur dans OrdersList)
└──────┬──────┘
       │ Paiement validé (YabetooPay webhook)
       ↓
┌─────────────┐
│    PAID     │ ← Apparaît dans l'onglet "Achats" de l'acheteur
└──────┬──────┘
       │ Vendeur clique "Marquer comme Expédié"
       ↓
┌─────────────┐
│   SHIPPED   │ ← Code OTP généré et communiqué au vendeur
└──────┬──────┘   Acheteur voit son code OTP dans l'interface
       │ Acheteur saisit le code OTP après réception
       ↓
┌─────────────┐
│  DELIVERED  │ ← Fonds transférés au vendeur & affilié
└─────────────┘
```

---

## 🛍️ Onglet "Achats" côté Acheteur

### **Règle d'affichage** :
✅ **Affiche UNIQUEMENT** les commandes avec statut : `paid`, `shipped`, `delivered`
❌ **N'affiche JAMAIS** les commandes avec statut : `pending`

### **Pourquoi ?**
- Les commandes `pending` n'existent que le temps du checkout/paiement
- Afficher des commandes non payées créerait de la confusion
- Évite de gérer les liens de paiement expirés dans l'onglet Achats

### **Code implémenté** :
```typescript
// src/services/orderService.ts:55-68
async getOrdersByBuyer(buyerId: string) {
    console.log('[OrderService] 📦 Fetching orders for buyer:', buyerId);

    // Only fetch PAID orders and above (no pending orders in buyer's list)
    const { data, error } = await supabase
        .from('orders')
        .select('*, products(name, image_url)')
        .eq('buyer_id', buyerId)
        .in('status', ['paid', 'shipped', 'delivered'])  // ← Filtre critique
        .order('created_at', { ascending: false });

    console.log('[OrderService] 📦 Buyer orders fetched:', { count: data?.length, error });
    return { data, error };
}
```

---

## 🔐 Système de Sécurité OTP

### **Objectif** :
Protéger les fonds en séquestre jusqu'à la confirmation de réception par l'acheteur.

### **Flow OTP** :
1. **Expédition** (`paid` → `shipped`) :
   - Vendeur clique "Marquer comme Expédié"
   - Système génère un code OTP à 4 chiffres aléatoire (ex: `7234`)
   - Code stocké dans `delivery_otp_hash` (non hashé pour le MVP)
   - Vendeur communique le code à son livreur

2. **Livraison** (`shipped` → `delivered`) :
   - Acheteur reçoit le colis
   - Acheteur voit son code OTP dans l'interface
   - Acheteur saisit le code OTP après vérification du colis
   - Système valide le code et transfère les fonds

### **Sécurité** :
- ✅ Empêche le vendeur de marquer "livré" sans la validation de l'acheteur
- ✅ Acheteur ne paie le vendeur qu'après avoir confirmé la réception
- ✅ Code généré côté serveur (impossible à deviner)

---

## 💰 Gestion des Fonds & Commissions

### **Calcul à la création de commande** :
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

### **Transfert à la livraison** :
```typescript
// src/services/orderService.ts:287-296
const commission = Number(order.commission_amount || 0);
const netAmount = Number(order.amount) - commission;

// Vendeur reçoit : Montant total - Commission
const newSellerBalance = Number(sellerProfile.wallet_balance) + netAmount;

// Affilié reçoit : Commission (si présent)
if (order.affiliate_id && commission > 0) {
    const newAffiliateBalance = Number(affiliateProfile.wallet_balance) + commission;
}
```

---

## 🚀 Prochaines Étapes (TODO)

### **1. Intégration YabetooPay**
- [ ] Créer `createCheckoutSession()` pour l'achat direct
- [ ] Gérer les webhooks de paiement
- [ ] Créer automatiquement la commande avec `status: 'paid'` après paiement

### **2. Bouton "Acheter" sur ProductDetail**
- [ ] Ajouter un bouton "Acheter Maintenant" à côté de "Négocier"
- [ ] Rediriger vers le checkout YabetooPay
- [ ] Gérer le retour après paiement

### **3. Lien de paiement dans le Chat**
- [ ] Générer un lien de paiement unique quand le vendeur crée un Deal
- [ ] Afficher le lien dans le chat pour l'acheteur
- [ ] Gérer l'expiration du lien (7 jours)

---

## 🐛 Logs de Debugging

Tous les logs utilisent le format `[ServiceName] emoji Message`:

### **OrderService** :
- `📦 Fetching orders for buyer` - Récupération des commandes
- `💳 Simulating payment` - Simulation de paiement (MVP uniquement)
- `🔍 Order found. Verifying OTP` - Vérification du code OTP
- `💰 Updating wallet balances` - Mise à jour des portefeuilles
- `✅ Delivery confirmed successfully` - Livraison confirmée

### **OrdersList Component** :
- `🔄 Component rendered. Role` - Rendu du composant
- `🔄 Fetching orders for role` - Récupération selon le rôle
- `📦 Orders received` - Nombre de commandes reçues
- `📦 Shipping order` - Expédition d'une commande
- `✅ Order shipped. OTP` - Commande expédiée avec OTP

---

## 📝 Notes Importantes

1. **Commandes `pending`** ne sont PAS visibles dans l'onglet Achats (par design)
2. **Code OTP** n'est PAS hashé dans le MVP (sera amélioré en production)
3. **Simulation de paiement** existe uniquement pour le développement (sera remplacé par YabetooPay)
4. **Tracking visuel** est affiché uniquement pour les acheteurs (pas pour les vendeurs/affiliés)

---

**Dernière mise à jour** : 2025-12-30
**Status** : ✅ Phase 1 complète (logique métier sans paiement)
**Next** : Intégration YabetooPay
