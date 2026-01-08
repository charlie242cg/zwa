# 📋 Plan d'Implémentation - Onglet Profil (Paramètres & Historique)

**Date :** 31 Décembre 2024
**Objectif :** Rendre fonctionnels les boutons "Paramètres du compte" et "Historique des transactions"

---

## 🎯 Analyse de l'Existant

### Page Actuelle : `ProfilePage.tsx`

**Ce qui fonctionne :**
- ✅ Affichage du profil (avatar, nom, rôle)
- ✅ Badge de rôle (Vendeur/Affilié/Acheteur)
- ✅ Affichage du solde wallet
- ✅ Bouton "Se déconnecter" fonctionnel
- ✅ Bouton debug pour développement

**Ce qui ne fonctionne PAS :**
- ❌ "Paramètres du compte" (ligne 69-73) → Pas de onClick
- ❌ "Historique des transactions" (ligne 75-79) → Pas de onClick
- ❌ Bouton "Retirer" (ligne 64) → Pas de onClick

---

## 📐 Architecture Proposée

### 1. Page "Paramètres du Compte" (`AccountSettings.tsx`)

**Route :** `/profile/settings`

**Fonctionnalités :**

#### A. Informations Personnelles
```
┌─────────────────────────────────────┐
│ Informations personnelles           │
├─────────────────────────────────────┤
│ Nom complet                         │
│ [John Doe                        ]  │
│                                     │
│ Email                               │
│ [john@example.com (non modifiable)] │
│                                     │
│ Téléphone                           │
│ [+242 06 123 1244               ]  │
│                                     │
│ [💾 Sauvegarder]                    │
└─────────────────────────────────────┘
```

**Champs éditables :**
- `full_name` (text)
- `phone_number` (text avec validation regex Congo)

**Champs non éditables :**
- `email` (affichage seulement)
- `role` (affichage seulement)

#### B. Informations Spécifiques au Rôle

**Pour les VENDEURS uniquement :**
```
┌─────────────────────────────────────┐
│ Informations Boutique               │
├─────────────────────────────────────┤
│ [🏪 Modifier ma boutique]           │
│ → Redirige vers /seller/edit-store │
└─────────────────────────────────────┘
```

**Pour tous les rôles :**
```
┌─────────────────────────────────────┐
│ Sécurité                            │
├─────────────────────────────────────┤
│ Mot de passe                        │
│ [Modifier le mot de passe]          │
│ → Futur : Modal ou page dédiée     │
└─────────────────────────────────────┘
```

---

### 2. Page "Historique des Transactions" (`TransactionHistory.tsx`)

**Route :** `/profile/transactions`

**Fonctionnalités :**

#### A. Filtres par Type
```
┌─────────────────────────────────────┐
│ [Tout] [Retraits] [Commissions]    │
└─────────────────────────────────────┘
```

#### B. Liste des Transactions

**Structure d'une transaction :**
```
┌─────────────────────────────────────┐
│ 💰 Commission affilié               │
│ +25 000 FCFA                        │
│ 28 Déc 2024 • 14:30                │
│ Produit : Escalope de secour        │
│ ────────────────────────────────────│
│ 💸 Retrait                          │
│ -500 000 FCFA                       │
│ 27 Déc 2024 • 10:15                │
│ Vers : Mobile Money                 │
└─────────────────────────────────────┘
```

**Types de transactions à afficher :**

| Type | Description | Qui le voit |
|------|-------------|-------------|
| `commission_earned` | Commission reçue pour une vente affiliée | Affiliés |
| `sale_completed` | Vente livrée (montant - commission) | Vendeurs |
| `withdrawal` | Retrait vers Mobile Money | Tous |
| `purchase` | Achat effectué (débit) | Acheteurs |

---

## 🗄️ Base de Données

### Table : `transactions` (À CRÉER)

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL, -- 'commission_earned', 'sale_completed', 'withdrawal', 'purchase'
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL, -- Solde après la transaction
    order_id UUID REFERENCES public.orders(id), -- Lien avec commande si applicable
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.transactions IS 'Historique des transactions financières';
COMMENT ON COLUMN public.transactions.type IS 'Type de transaction : commission_earned, sale_completed, withdrawal, purchase';
COMMENT ON COLUMN public.transactions.balance_after IS 'Solde du wallet après cette transaction';
```

---

## 📝 Services TypeScript

### `transactionService.ts` (À CRÉER)

```typescript
export interface Transaction {
    id: string;
    user_id: string;
    type: 'commission_earned' | 'sale_completed' | 'withdrawal' | 'purchase';
    amount: number;
    balance_after: number;
    order_id?: string;
    description?: string;
    created_at: string;
}

export const transactionService = {
    // Récupérer toutes les transactions d'un utilisateur
    async getTransactionsByUser(userId: string, filter?: string) {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filter && filter !== 'all') {
            query = query.eq('type', filter);
        }

        return await query;
    },

    // Créer une transaction (appelé automatiquement lors des événements)
    async createTransaction(params: {
        userId: string;
        type: Transaction['type'];
        amount: number;
        balanceAfter: number;
        orderId?: string;
        description?: string;
    }) {
        return await supabase.from('transactions').insert([{
            user_id: params.userId,
            type: params.type,
            amount: params.amount,
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            description: params.description
        }]);
    }
};
```

---

## 🔄 Intégration avec le Système Existant

### 1. Modifier `orderService.ts` - `confirmDeliveryByBuyer()`

**Ajouter l'enregistrement des transactions après mise à jour wallet :**

```typescript
// Après mise à jour du wallet vendeur (ligne 335)
await transactionService.createTransaction({
    userId: order.seller_id,
    type: 'sale_completed',
    amount: netAmount,
    balanceAfter: newSellerBalance,
    orderId: orderId,
    description: `Vente livrée - ${order.products?.name}`
});

// Après mise à jour du wallet affilié (ligne 360)
if (order.affiliate_id && commission > 0) {
    await transactionService.createTransaction({
        userId: order.affiliate_id,
        type: 'commission_earned',
        amount: commission,
        balanceAfter: newAffiliateBalance,
        orderId: orderId,
        description: `Commission - ${order.products?.name}`
    });
}
```

### 2. Créer le Service de Retrait (Futur)

**Pour le bouton "Retirer" :**

```typescript
async withdrawFunds(userId: string, amount: number, method: string) {
    // 1. Vérifier solde suffisant
    // 2. Déduire du wallet
    // 3. Créer transaction de retrait
    // 4. Envoyer demande au système Mobile Money
}
```

---

## 🎨 Pages React à Créer

### 1. `AccountSettings.tsx`

**Fichier :** `/src/pages/profile/AccountSettings.tsx`

**Fonctionnalités :**
- Formulaire d'édition du profil
- Validation numéro téléphone Congo
- Sauvegarde vers table `profiles`
- Bouton retour vers `/profile`

### 2. `TransactionHistory.tsx`

**Fichier :** `/src/pages/profile/TransactionHistory.tsx`

**Fonctionnalités :**
- Liste des transactions avec scroll infini (optionnel)
- Filtres par type
- Formatage des montants (+ pour crédit, - pour débit)
- Affichage de la date/heure locale
- État vide si aucune transaction

---

## 🛣️ Routes à Ajouter dans `App.tsx`

```typescript
import AccountSettings from './pages/profile/AccountSettings';
import TransactionHistory from './pages/profile/TransactionHistory';

// Dans les routes protégées
<Route path="/profile/settings" element={user ? <AccountSettings /> : <Navigate to="/auth" />} />
<Route path="/profile/transactions" element={user ? <TransactionHistory /> : <Navigate to="/auth" />} />
```

---

## 🔧 Modifications de `ProfilePage.tsx`

### Ajouter les onClick

```typescript
const navigate = useNavigate();

// Ligne 69-73
<div
    style={styles.menuItem}
    className="premium-card"
    onClick={() => navigate('/profile/settings')}
>
    <div style={styles.menuIcon}><Settings size={20} /></div>
    <div style={styles.menuLabel}>Paramètres du compte</div>
    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
</div>

// Ligne 75-79
<div
    style={styles.menuItem}
    className="premium-card"
    onClick={() => navigate('/profile/transactions')}
>
    <div style={styles.menuIcon}><Wallet size={20} /></div>
    <div style={styles.menuLabel}>Historique des transactions</div>
    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
</div>

// Bouton "Retirer" (ligne 64)
<button
    style={styles.topUpBtn}
    onClick={() => alert('Fonctionnalité de retrait en développement')}
>
    Retirer
</button>
```

---

## 📊 Ordre d'Implémentation

### Phase 1 : Base de données ✅
1. Créer la table `transactions`
2. Configurer les RLS policies

### Phase 2 : Service ✅
1. Créer `transactionService.ts`
2. Intégrer dans `orderService.ts`

### Phase 3 : Pages ✅
1. Créer `AccountSettings.tsx`
2. Créer `TransactionHistory.tsx`

### Phase 4 : Navigation ✅
1. Ajouter routes dans `App.tsx`
2. Modifier `ProfilePage.tsx` (ajouter onClick)

### Phase 5 : Tests ✅
1. Tester édition profil
2. Tester affichage transactions
3. Vérifier pour chaque rôle (buyer/seller/affiliate)

---

## ⚠️ Notes Importantes

### 1. Transactions Automatiques
Les transactions sont créées **automatiquement** lors de :
- Livraison confirmée par l'acheteur → Transaction vendeur + affilié
- Retrait (futur) → Transaction withdrawal

### 2. MVP vs Future
**MVP (maintenant) :**
- Affichage historique transactions
- Édition profil basique

**Futur :**
- Système de retrait complet avec Mobile Money
- Export CSV des transactions
- Filtres avancés (par date, montant)
- Graphiques de revenus

### 3. Sécurité
- RLS activé sur table transactions
- Validation côté serveur pour les montants
- Pas de possibilité de modifier les transactions (read-only)

---

## ✅ Checklist de Validation

- [ ] Migration SQL exécutée
- [ ] Service transactions créé
- [ ] Page AccountSettings fonctionnelle
- [ ] Page TransactionHistory fonctionnelle
- [ ] Navigation depuis ProfilePage OK
- [ ] Test avec compte Vendeur
- [ ] Test avec compte Affilié
- [ ] Test avec compte Acheteur
- [ ] Validation numéro téléphone Congo
- [ ] Affichage correct des montants (+ / -)

---

**Document généré le :** 31 Décembre 2024
**Statut :** 📝 Plan validé - Prêt pour implémentation
