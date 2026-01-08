# 📊 Analyse Complète de la Logique des Commandes - Zwa Marketplace

**Date**: 03 Janvier 2026
**Objectif**: Documenter et valider la logique complète du système de commandes

---

## 🔄 Cycle de Vie d'une Commande

### Statuts Disponibles

```typescript
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
```

### Flux Complet

```
1. PENDING (En attente)
   ↓ [Client paie via OTP]
2. PAID (Payé)
   ↓ [Vendeur expédie + génère OTP]
3. SHIPPED (Expédié)
   ↓ [Client valide OTP à la livraison]
4. DELIVERED (Livré)

   OU

   CANCELLED (Annulé) ← Depuis PENDING ou PAID
```

---

## 👥 Actions par Rôle et par Statut

### 🛍️ ACHETEUR (Buyer)

| Statut | Ce qu'il voit | Actions disponibles | Description |
|--------|---------------|-------------------|-------------|
| **PENDING** | ⏳ En attente | 💳 **Payer** | Lien de paiement reçu, pas encore payé |
| **PAID** | ✅ Payé | ❌ Annuler | Paiement effectué, en attente d'expédition |
| **SHIPPED** | 📦 Expédié | 💬 Contacter | Colis en route, peut contacter le vendeur |
| **DELIVERED** | ✅ Livré | ⭐ Laisser un avis | Livraison confirmée, peut laisser un avis |
| **CANCELLED** | ❌ Annulé | - | Commande annulée |

#### Détails des États pour l'Acheteur

**1. PENDING (En attente de paiement)**
- **Contexte**: Le vendeur a créé le lien de paiement dans le chat
- **Ce qu'il voit**:
  - Message avec montant et détails
  - Bouton "Payer Maintenant (Simulation)"
  - Timer d'expiration (7 jours)
- **Ce qu'il peut faire**:
  - Cliquer sur "Payer" → passe à PAID
  - Attendre (le lien expire après 7 jours)
- **Note**: C'est le statut initial quand le vendeur crée l'offre

**2. PAID (Payé, en attente d'expédition)**
- **Contexte**: L'acheteur a payé, le vendeur doit expédier
- **Ce qu'il voit**:
  - Statut "Payé" en vert
  - Message "En attente d'expédition"
  - Bouton "Annuler" (optionnel)
- **Ce qu'il peut faire**:
  - Attendre que le vendeur expédie
  - Annuler si besoin
  - Contacter le vendeur via chat

**3. SHIPPED (Expédié, en livraison)**
- **Contexte**: Le vendeur a expédié le colis et généré un OTP
- **Ce qu'il voit**:
  - Statut "Expédié" en bleu
  - Message "Colis en route"
  - Bouton "Contacter le vendeur"
- **Ce qu'il peut faire**:
  - Attendre la livraison
  - Le vendeur lui communiquera l'OTP à la livraison
- **Note**: L'OTP n'est PAS visible par l'acheteur, seul le vendeur l'a

**4. DELIVERED (Livré)**
- **Contexte**: La livraison a été validée avec l'OTP
- **Ce qu'il voit**:
  - Statut "Livré" en vert
  - Bouton "Laisser un avis"
- **Ce qu'il peut faire**:
  - Laisser un avis sur le produit/vendeur
  - Voir son historique d'achats

---

### 🏪 VENDEUR (Seller)

| Statut | Ce qu'il voit | Actions disponibles | Description |
|--------|---------------|-------------------|-------------|
| **PENDING** | ⏳ En attente | - | Lien de paiement envoyé, attend le paiement |
| **PAID** | ✅ Payé | 📦 **Expédier** / ❌ Annuler | Prêt à expédier la commande |
| **SHIPPED** | 📦 Expédié | ✅ **Marquer comme livré** | Colis livré, attend validation OTP |
| **DELIVERED** | ✅ Livré | 💬 Contacter | 💰 Fonds transférés au portefeuille |
| **CANCELLED** | ❌ Annulé | - | Commande annulée |

#### Détails des États pour le Vendeur

**1. PENDING (En attente de paiement client)**
- **Contexte**: Le vendeur vient d'envoyer le lien de paiement
- **Ce qu'il voit**:
  - Statut "En attente" en orange
  - Message "Lien de paiement envoyé"
  - Détails de la commande (montant, quantité, notes)
- **Ce qu'il peut faire**:
  - Attendre que le client paie
  - Modifier l'offre (si pas encore payée)
- **Note**: Peut voir combien de temps reste avant expiration (7 jours)

**2. PAID (Payé, doit expédier)**
- **Contexte**: Le client a payé, le vendeur doit maintenant expédier
- **Ce qu'il voit**:
  - Statut "Payé" en vert
  - Boutons "📦 Expédier" et "❌ Annuler"
  - Adresse de livraison dans les notes
- **Ce qu'il peut faire**:
  - Cliquer sur "Expédier" → génère un OTP de 4 chiffres
  - Alert affiche: "✅ Commande marquée comme expédiée ! 🔑 Code de validation : XXXX"
  - Annuler si problème
- **Action critique**: Cliquer sur "Expédier" génère l'OTP que le vendeur doit noter/mémoriser

**3. SHIPPED (Expédié, en livraison)**
- **Contexte**: Le colis est en route, le vendeur a l'OTP
- **Ce qu'il voit**:
  - Statut "Expédié" en bleu
  - Bouton "✅ Marquer comme livré"
- **Ce qu'il peut faire**:
  - Cliquer sur "Marquer comme livré"
  - Saisir l'OTP communiqué par le client à la livraison
  - Si OTP correct → statut DELIVERED + transfert des fonds
  - Si OTP incorrect → erreur "Code OTP invalide"
- **Action critique**: Le vendeur demande l'OTP à l'acheteur en main propre

**4. DELIVERED (Livré)**
- **Contexte**: Livraison confirmée, transaction complète
- **Ce qu'il voit**:
  - Statut "Livré" en vert
  - Bouton "💬 Contacter"
  - 💰 Fonds ajoutés au portefeuille
- **Ce qui s'est passé**:
  - `wallet_balance` mis à jour avec `amount - commission`
  - Si affilié présent → commission transférée
  - Transactions créées pour toutes les parties
  - Compteur `total_sales_count` incrémenté

---

## 💰 Flux Financier

### À la Livraison (Status DELIVERED)

```
MONTANT TOTAL: 10,000 FCFA
COMMISSION: 5% = 500 FCFA (si affilié)

┌────────────────────────────────────────┐
│  ACHETEUR                              │
│  - Paiement: -10,000 FCFA             │
│  - Transaction: "PURCHASE" créée      │
└────────────────────────────────────────┘
                  ↓
        ┌─────────────────┐
        │   PLATEFORME    │
        │   10,000 FCFA   │
        └─────────────────┘
                  ↓
    ┌─────────────┴─────────────┐
    ↓                           ↓
┌─────────────────┐   ┌──────────────────┐
│  VENDEUR        │   │  AFFILIÉ         │
│  + 9,500 FCFA   │   │  + 500 FCFA      │
│  (si commission)│   │  (si présent)    │
│  Transaction:   │   │  Transaction:    │
│  "SALE" créée   │   │  "COMMISSION"    │
└─────────────────┘   └──────────────────┘
```

### Méthode de Paiement

**Simulation OTP** (MVP):
- L'acheteur clique sur "Payer Maintenant (Simulation)"
- Statut passe de `pending` → `paid`
- **Pas de vraie intégration de paiement pour le moment**

**Production (futur)**:
- Intégration mobile money (MTN, Airtel, etc.)
- Validation OTP réelle
- Webhook de confirmation

---

## 🔐 Système OTP de Livraison

### Génération (Vendeur expédie)

```typescript
// Quand le vendeur clique sur "Expédier"
const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Ex: "4582"

// Stocké dans la DB
delivery_otp_hash: "4582" // Plain text pour MVP
```

**Alert au vendeur**:
```
✅ Commande marquée comme expédiée !

🔑 Code de validation : 4582

L'acheteur devra vous communiquer ce code à la livraison.
```

### Validation (À la livraison)

**Scénario**:
1. Le vendeur arrive chez l'acheteur avec le colis
2. Le vendeur demande à l'acheteur: "Donnez-moi le code OTP que j'ai généré"
3. **PROBLÈME ACTUEL**: L'acheteur n'a PAS reçu le code!
   - Le code n'est donné QU'AU VENDEUR
   - L'acheteur ne peut pas le fournir

**Solution Correcte**:
- Le vendeur donne le code à l'acheteur à la livraison
- L'acheteur saisit le code dans l'app
- Si correct → DELIVERED

**Ou Alternative**:
- Le vendeur saisit l'OTP dans l'app
- L'acheteur confirme la réception
- Double validation

---

## ⚠️ Problèmes Identifiés

### 1. ❌ Flux OTP Incorrect

**Problème**:
```
Vendeur génère OTP → Vendeur garde OTP → Vendeur demande OTP à l'acheteur
                                          ↑
                                     IMPOSSIBLE!
```

**Solution 1** (Recommandée):
```
Vendeur génère OTP → Vendeur donne OTP à l'acheteur en main propre
                   → Acheteur saisit OTP dans l'app
                   → Si correct → DELIVERED
```

**Solution 2** (Alternative):
```
Vendeur clique "Marquer livré" → Saisit son propre OTP
                                → DELIVERED (pas de validation acheteur)
```

### 2. ❌ Status PENDING pour Acheteur

**Problème**:
- Les commandes PENDING apparaissent dans l'onglet Achats de l'acheteur
- L'acheteur n'a pas de bouton "Payer" dans OrdersList
- Le bouton "Payer" est SEULEMENT dans le ChatRoom

**Solution**:
- Ajouter un bouton "💳 Payer" dans OrderCard pour status PENDING
- Ou rediriger vers le chat avec la conversation

### 3. ⚠️ Annulation Non Implémentée

**Problème**:
```typescript
case 'cancel':
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
        // TODO: Implement cancel order
        alert("Fonctionnalité d'annulation à implémenter");
    }
```

**À implémenter**:
- Créer `orderService.cancelOrder(orderId, userId, role)`
- Vérifier les conditions (PENDING ou PAID uniquement)
- Mettre à jour le statut
- Si PAID → rembourser l'acheteur? (décision business)

### 4. ⚠️ Pas de Confirmation Acheteur pour SHIPPED

**Problème**:
- Seul le vendeur peut marquer comme DELIVERED
- L'acheteur ne peut pas confirmer/refuser

**Solution Optionnelle**:
- Ajouter bouton "✅ Confirmer réception" pour l'acheteur
- Ajouter bouton "⚠️ Signaler un problème"

---

## 📋 Affichage Actuel dans OrdersList

### Onglets Disponibles

```typescript
const tabs = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];
```

Chaque onglet affiche le nombre de commandes dans cet état.

### Compteurs Affichés

**Pour Vendeurs**:
- Statistiques en haut: Pending, Paid, Shipped, Delivered, Cancelled, Total Revenue

**Pour Acheteurs**:
- Simplement les onglets avec compteurs

### Recherche

Recherche par:
- ID de commande
- Nom du produit
- Nom du client/vendeur (full_name)
- Nom de la boutique (store_name)

---

## ✅ Ce Qui Fonctionne Bien

1. ✅ **Flux de statuts logique**: pending → paid → shipped → delivered
2. ✅ **Génération OTP sécurisée**: 4 chiffres aléatoires
3. ✅ **Transactions automatiques**: Créées à la livraison
4. ✅ **Transfert de fonds**: Vendeur + Affilié payés automatiquement
5. ✅ **Système d'avis**: L'acheteur peut laisser un avis après livraison
6. ✅ **Filtres et recherche**: Fonctionnels et pratiques
7. ✅ **Affichage différencié**: Selon le rôle (buyer/seller)
8. ✅ **Gestion commission**: Calculée et distribuée automatiquement

---

## 🔧 Améliorations Recommandées

### Haute Priorité

1. **Corriger le flux OTP**
   - Option A: Acheteur saisit OTP reçu du vendeur
   - Option B: Vendeur saisit son OTP (pas de validation acheteur)

2. **Ajouter bouton Payer pour PENDING**
   - Dans OrderCard pour l'acheteur
   - Redirection vers le chat ou modal de paiement

3. **Implémenter l'annulation**
   - Fonction `cancelOrder()`
   - Conditions et règles de remboursement

### Priorité Moyenne

4. **Notification pour acheteur**
   - Quand commande passe à SHIPPED
   - Quand OTP est généré (si on garde le flux actuel)

5. **Confirmation acheteur optionnelle**
   - Bouton "Confirmer réception" pour status SHIPPED
   - Bouton "Signaler un problème"

6. **Historique des changements de statut**
   - Qui a fait quoi et quand
   - Traçabilité complète

### Basse Priorité

7. **Estimation de livraison**
   - Afficher une date estimée
   - Basée sur la localisation

8. **Notifications push**
   - Pour chaque changement de statut
   - Pour rappeler un paiement PENDING

9. **Export des commandes**
   - Pour les vendeurs (comptabilité)
   - Format CSV ou PDF

---

## 🎯 Résumé des Rôles

### Acheteur (Buyer)

**Voit**:
- Ses achats (buyer_id = user.id)
- Nom du vendeur / boutique
- Produit, quantité, montant
- Statut de la commande

**Peut**:
- Payer les commandes PENDING
- Annuler PENDING/PAID
- Contacter le vendeur (SHIPPED)
- Laisser un avis (DELIVERED)

### Vendeur (Seller)

**Voit**:
- Ses ventes (seller_id = user.id)
- Nom de l'acheteur
- Produit, quantité, montant
- Statut de la commande
- **Statistiques**: Revenue total, commandes par statut

**Peut**:
- Expédier les commandes PAID → génère OTP
- Marquer comme livré SHIPPED → valide avec OTP
- Annuler PENDING/PAID
- Contacter l'acheteur (DELIVERED)

### Affilié (Affiliate)

**Voit**:
- Ventes parrainées (affiliate_id = user.id)
- Commission gagnée par vente
- Statut des commandes

**Peut**:
- Voir son impact
- Suivre ses commissions

---

## 📊 Schéma de Décision

```
ACHETEUR REÇOIT LIEN (PENDING)
├─ Paie? → OUI → PAID
│              ├─ Vendeur expédie? → OUI → SHIPPED
│              │                      ├─ OTP validé? → OUI → DELIVERED ✅
│              │                      │                 └─ NON → Erreur
│              │                      └─ NON → Reste SHIPPED
│              └─ NON → Reste PAID (peut annuler)
└─ NON → Reste PENDING (peut expirer après 7 jours)

À TOUT MOMENT (PENDING/PAID):
└─ Annulation? → CANCELLED ❌
```

---

**Document créé pour améliorer la logique des commandes**
Version 1.0 - Janvier 2026
