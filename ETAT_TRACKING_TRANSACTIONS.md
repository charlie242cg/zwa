# 📊 État Actuel du Tracking des Transactions

## ❓ Question Posée
> "Est-ce que de la même manière que le système track les paiements réussis et potentiellement les retraits actuellement, dans l'onglet profil l'historique des transactions est connecté au réel ?"

## ✅ Réponse : OUI, mais avec une LIMITATION importante

---

## 🎯 Ce qui EST Tracké (et apparaît dans l'historique)

### 1. ✅ Achats de Produits (PURCHASE)
**Quand :** Lorsqu'une commande est **livrée** (statut = `delivered`)
**Qui :** L'acheteur (buyer)
**Montant :** Négatif (débit)
**Code source :** [orderService.ts:275-294](src/services/orderService.ts#L275-L294)

**Flux complet :**
```
1. Buyer clique "Acheter Maintenant"
2. Commande créée (status: pending)
3. Paiement simulé (status: paid) ❌ PAS DE TRANSACTION CRÉÉE ICI
4. Vendeur expédie (status: shipped)
5. Vendeur confirme livraison avec OTP (status: delivered)
   ✅ Transaction PURCHASE créée pour le buyer
```

### 2. ✅ Ventes de Produits (SALE)
**Quand :** Lorsqu'une commande est **livrée** (statut = `delivered`)
**Qui :** Le vendeur (seller)
**Montant :** Positif (crédit) - montant après commission
**Code source :** [orderService.ts:296-308](src/services/orderService.ts#L296-L308)

**Détails :**
- Le vendeur reçoit le montant total MOINS la commission d'affiliation
- Exemple : Vente de 10 000 FCFA avec 5% commission = +9 500 FCFA pour le vendeur

### 3. ✅ Commissions d'Affiliation (COMMISSION)
**Quand :** Lorsqu'une commande avec affilié est **livrée** (statut = `delivered`)
**Qui :** L'affilié (affiliate)
**Montant :** Positif (crédit) - commission sur la vente
**Code source :** [orderService.ts:310-331](src/services/orderService.ts#L310-L331)

**Condition :**
- Seulement si la commande a un `affiliate_id`
- Et si `commission_amount > 0`

---

## ❌ Ce qui N'EST PAS Encore Tracké

### 1. ❌ Paiements (lors de l'achat)
**Problème :** Quand un buyer paie une commande, **AUCUNE transaction n'est créée**

**Code actuel :**
```typescript
// Dans simulatePayment() - ligne 337
// ❌ Met seulement à jour le statut, ne crée PAS de transaction
const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId);
// Pas d'appel à transactionService ici !
```

**Impact :**
- Le wallet du buyer n'est PAS débité lors du paiement
- Les transactions n'apparaissent qu'à la livraison
- Décalage entre le moment du paiement et l'enregistrement

### 2. ❌ Retraits de Wallet (WITHDRAWAL)
**Problème :** La fonctionnalité de retrait n'existe **pas encore** dans l'interface

**Preuve :**
- Aucun fichier UI pour les retraits trouvé
- Le bouton "Retirer" dans [ProfilePage.tsx](src/pages/profile/ProfilePage.tsx#L115) n'a pas de fonction `onClick`
- La fonction `createWithdrawalTransaction()` existe dans le code mais n'est **jamais appelée**

**Code du bouton inactif :**
```tsx
<button style={styles.topUpBtn}>Retirer</button>
// ❌ Pas de onClick, pas de navigation
```

---

## 🔍 Analyse Détaillée du Flux Actuel

### Flux d'un Achat Complet

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : CRÉATION DE COMMANDE (pending)                   │
│ ❌ Pas de transaction créée                                 │
│ ❌ Wallet du buyer non débité                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : PAIEMENT SIMULÉ (paid)                           │
│ ❌ Pas de transaction créée                                 │
│ ❌ Wallet du buyer non débité                               │
│ ✅ Commande visible dans "Mes Achats"                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : EXPÉDITION (shipped)                             │
│ ❌ Pas de transaction créée                                 │
│ ✅ OTP généré et affiché au vendeur                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : LIVRAISON CONFIRMÉE (delivered)                  │
│ ✅ Transaction PURCHASE créée pour buyer                    │
│ ✅ Transaction SALE créée pour seller                       │
│ ✅ Transaction COMMISSION créée pour affiliate (si existe)  │
│ ✅ Wallets mis à jour                                       │
│ ✅ Transactions visibles dans "Historique"                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Résumé : Qu'est-ce qui est Réel ?

| Opération | Crée une Transaction ? | Apparaît dans l'Historique ? | Wallet Mis à Jour ? |
|-----------|------------------------|------------------------------|---------------------|
| **Création de commande** | ❌ Non | ❌ Non | ❌ Non |
| **Paiement** | ❌ Non | ❌ Non | ❌ Non |
| **Expédition** | ❌ Non | ❌ Non | ❌ Non |
| **Livraison (buyer)** | ✅ Oui (PURCHASE) | ✅ Oui | ✅ Oui (mais pas débité au paiement) |
| **Livraison (seller)** | ✅ Oui (SALE) | ✅ Oui | ✅ Oui |
| **Commission (affiliate)** | ✅ Oui (COMMISSION) | ✅ Oui | ✅ Oui |
| **Retrait de wallet** | ❌ Non implémenté | ❌ Non implémenté | ❌ Non implémenté |

---

## ⚠️ Problèmes Identifiés

### Problème #1 : Décalage Temporel
**Situation :**
- Le buyer paie aujourd'hui
- La transaction n'apparaît que quand le vendeur livre (peut-être plusieurs jours après)
- Décalage entre le paiement réel et l'enregistrement comptable

**Impact :**
- L'historique ne reflète pas le moment du paiement
- Les transactions ont toutes la date de livraison, pas de paiement

### Problème #2 : Wallet Non Débité au Paiement
**Situation :**
- Lors du paiement, le wallet du buyer n'est pas débité
- Le montant reste disponible jusqu'à la livraison
- Un buyer pourrait théoriquement "utiliser" son argent deux fois

**Code actuel :**
```typescript
// simulatePayment() ne touche PAS au wallet
async simulatePayment(orderId: string) {
    // ❌ Seulement change le statut
    await supabase.from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
    // ❌ Pas de mise à jour du wallet ici
}
```

### Problème #3 : Retraits Non Implémentés
**Situation :**
- Le bouton "Retirer" existe mais ne fait rien
- Impossible de retirer l'argent du wallet
- La fonction `createWithdrawalTransaction()` existe mais n'est jamais appelée

---

## ✅ Ce qui Fonctionne Bien

1. **À la livraison, tout est tracké correctement** ✅
   - Transactions créées pour toutes les parties
   - Wallets mis à jour correctement
   - Historique précis

2. **Les filtres fonctionnent** ✅
   - Achats, Ventes, Commissions sont bien séparés
   - Les données affichées sont exactes

3. **Les reçus PDF sont disponibles** ✅
   - Chaque transaction peut être téléchargée en PDF
   - Export CSV disponible

---

## 🎯 Recommandations pour Améliorer

### 1. Créer une Transaction au Paiement (Haute Priorité)
```typescript
async simulatePayment(orderId: string) {
    // 1. Débiter le wallet du buyer
    // 2. Créer une transaction PURCHASE immédiatement
    // 3. Mettre le statut à 'paid'
}
```

### 2. Implémenter les Retraits (Moyenne Priorité)
- Créer une page/modal de retrait
- Formulaire avec méthode (Mobile Money, Bank) et numéro
- Appeler `createWithdrawalTransaction()` lors du retrait
- Mettre à jour le wallet

### 3. Ajuster les Dates des Transactions (Basse Priorité)
- Utiliser `order.created_at` pour le paiement
- Utiliser `order.delivered_at` (à ajouter) pour la livraison

---

## 🔧 Fichiers Concernés

### Backend / Services
- [src/services/orderService.ts](src/services/orderService.ts) - Gestion des commandes et transactions
- [src/services/transactionService.ts](src/services/transactionService.ts) - Service de transactions

### Frontend / UI
- [src/pages/profile/TransactionHistory.tsx](src/pages/profile/TransactionHistory.tsx) - Affichage de l'historique
- [src/pages/profile/ProfilePage.tsx](src/pages/profile/ProfilePage.tsx) - Profil avec bouton "Retirer"
- [src/pages/orders/OrdersList.tsx](src/pages/orders/OrdersList.tsx) - Liste des achats/ventes

### Migrations
- [supabase/migrations/20251231_create_transactions.sql](supabase/migrations/20251231_create_transactions.sql) - Création de la table
- [supabase/migrations/20260102_backfill_missing_transactions.sql](supabase/migrations/20260102_backfill_missing_transactions.sql) - Backfill

---

## 📌 Conclusion

**L'historique des transactions est CONNECTÉ AU RÉEL, mais UNIQUEMENT pour les livraisons.**

- ✅ **Livraisons** : Parfaitement trackées
- ⚠️ **Paiements** : Pas trackés (commandes créées mais pas de transactions)
- ❌ **Retraits** : Pas du tout implémentés

**Pour avoir un historique complet et exact :**
1. Il faut ajouter la création de transactions lors du paiement
2. Il faut implémenter la fonctionnalité de retrait

---

**Date de l'analyse :** 2026-01-02
**Status :** 🟡 Partiellement Implémenté
