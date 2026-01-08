# 📋 Plan d'Implémentation - Onglet Profil (Version 2)

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

**Ce qui ne fonctionne PAS :**
- ❌ "Paramètres du compte" → Pas de onClick
- ❌ "Historique des transactions" → Pas de onClick
- ❌ Bouton "Retirer" → Pas de onClick

---

## 📐 Architecture Proposée

### 1. Page "Paramètres du Compte" (`AccountSettings.tsx`)

**Route :** `/profile/settings`

**Objectif :** Gérer les identifiants de connexion et informations de base

#### Section 1 : Identifiants de Connexion

```
┌─────────────────────────────────────┐
│ 🔐 Identifiants de Connexion        │
├─────────────────────────────────────┤
│ Email                               │
│ [john@example.com               ]  │
│ ℹ️ Email utilisé pour se connecter  │
│                                     │
│ Mot de passe                        │
│ [●●●●●●●●]  [Modifier]             │
│                                     │
│ [💾 Sauvegarder]                    │
└─────────────────────────────────────┘
```

**Champs éditables :**
- `email` (avec confirmation par email - futur)
- `password` (modal ou page dédiée pour changer)

#### Section 2 : Informations Personnelles

```
┌─────────────────────────────────────┐
│ 👤 Informations Personnelles        │
├─────────────────────────────────────┤
│ Nom complet                         │
│ [John Doe                       ]  │
│                                     │
│ Photo de profil                     │
│ [📷 Changer la photo]               │
│ [Avatar actuel : JD]                │
│                                     │
│ Numéro de téléphone                 │
│ [+242 06 123 1244               ]  │
│ ⚠️ Validation : Congo uniquement    │
│ ℹ️ Utilisé pour prévenir les comptes│
│    inactifs et doublons             │
│                                     │
│ [💾 Sauvegarder]                    │
└─────────────────────────────────────┘
```

**Champs éditables :**
- `full_name` (text)
- `avatar_url` (upload vers Cloudinary)
- `phone_number` (text avec validation Congo)

**Règle de validation du numéro :**
- ✅ **Même numéro sur différents types de comptes** (buyer, seller, affiliate)
- ❌ **Pas 2× le même numéro sur le même type de compte**

Exemple :
- `+242 06 123 1244` → OK pour 1 compte buyer, 1 seller, 1 affiliate
- `+242 06 123 1244` → ❌ Si déjà utilisé sur un autre compte seller

---

### 2. Page "Historique des Transactions" (`TransactionHistory.tsx`)

**Route :** `/profile/transactions`

**Objectif :** Historique complet avec factures téléchargeables

#### A. Filtres

```
┌─────────────────────────────────────┐
│ [Tout] [Achats] [Ventes] [Retraits]│
└─────────────────────────────────────┘
```

**Filtres disponibles selon le rôle :**

| Filtre | Buyer | Seller | Affiliate |
|--------|-------|--------|-----------|
| Achats | ✅ | ❌ | ❌ |
| Ventes | ❌ | ✅ | ❌ |
| Commissions | ❌ | ❌ | ✅ |
| Retraits | ✅ | ✅ | ✅ |

#### B. Liste des Transactions

**Transaction ACHAT (Buyer) :**
```
┌─────────────────────────────────────┐
│ 🛒 Achat de produit                 │
│ -2 500 000 FCFA                     │
│ 28 Déc 2024 • 14:30                │
│ ────────────────────────────────────│
│ Escalope trousse de secour          │
│ Quantité : 100 unité(s)             │
│ Prix unitaire : 25 000 FCFA         │
│                                     │
│ [📄 Télécharger la facture]         │
└─────────────────────────────────────┘
```

**Transaction VENTE (Seller) :**
```
┌─────────────────────────────────────┐
│ 💵 Vente livrée                     │
│ +2 470 000 FCFA                     │
│ 28 Déc 2024 • 16:45                │
│ ────────────────────────────────────│
│ Escalope trousse de secour          │
│ Quantité : 100 unité(s)             │
│ Prix total : 2 500 000 FCFA         │
│ Commission affilié : -30 000 FCFA   │
│ Net reçu : 2 470 000 FCFA           │
│                                     │
│ [📄 Télécharger le reçu]            │
└─────────────────────────────────────┘
```

**Transaction COMMISSION (Affiliate) :**
```
┌─────────────────────────────────────┐
│ 💰 Commission gagnée                │
│ +30 000 FCFA                        │
│ 28 Déc 2024 • 16:45                │
│ ────────────────────────────────────│
│ Parrainage : Escalope trousse...    │
│ Prix vente : 2 500 000 FCFA         │
│ Taux commission : 1.2%              │
│ Commission : 30 000 FCFA            │
│                                     │
│ [📄 Télécharger le reçu]            │
└─────────────────────────────────────┘
```

**Transaction RETRAIT (Tous) :**
```
┌─────────────────────────────────────┐
│ 💸 Retrait effectué                 │
│ -500 000 FCFA                       │
│ 27 Déc 2024 • 10:15                │
│ ────────────────────────────────────│
│ Méthode : Mobile Money              │
│ Numéro : +242 06 123 1244           │
│ Frais : 5 000 FCFA                  │
│ Net reçu : 495 000 FCFA             │
│                                     │
│ [📄 Télécharger le reçu]            │
└─────────────────────────────────────┘
```

#### C. Bouton "Télécharger Tout l'Historique"

```
┌─────────────────────────────────────┐
│ [📥 Télécharger l'historique PDF]   │
│ [📊 Exporter en CSV]                │
└─────────────────────────────────────┘
```

**Format PDF :**
- Logo Zwa en en-tête
- Nom utilisateur + ID
- Liste de toutes les transactions du filtre actif
- Total des entrées / sorties

**Format CSV :**
- Colonnes : Date, Type, Description, Montant, Solde
- Compatible Excel/Google Sheets

---

## 📄 Génération de Factures

### Format de Facture (PDF)

```
┌─────────────────────────────────────┐
│          [LOGO ZWA]                 │
│                                     │
│ FACTURE #ZWA-2024-12345             │
│ Date : 28 Décembre 2024             │
├─────────────────────────────────────┤
│ CLIENT                              │
│ Nom : John Doe                      │
│ Email : john@example.com            │
│ ID : abc123...                      │
├─────────────────────────────────────┤
│ DÉTAILS DE LA COMMANDE              │
│                                     │
│ [Image Produit]                     │
│                                     │
│ Produit : Escalope trousse de secour│
│ Quantité : 100 unité(s)             │
│ Prix unitaire : 25 000 FCFA         │
│                                     │
│ ────────────────────────────────────│
│ SOUS-TOTAL        2 500 000 FCFA    │
│ Frais de service          0 FCFA    │
│ ────────────────────────────────────│
│ TOTAL            2 500 000 FCFA     │
├─────────────────────────────────────┤
│ Paiement reçu le 28/12/2024         │
│ Méthode : Portefeuille Zwa          │
│                                     │
│ Merci pour votre achat !            │
│ www.zwa.com                         │
└─────────────────────────────────────┘
```

**Bibliothèque suggérée :** `jspdf` + `jspdf-autotable`

---

## 🗄️ Base de Données

### Table : `transactions` (À CRÉER)

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL, -- 'purchase', 'sale', 'commission', 'withdrawal'
    amount DECIMAL(10, 2) NOT NULL, -- Montant (positif ou négatif)
    balance_after DECIMAL(10, 2) NOT NULL, -- Solde après transaction
    order_id UUID REFERENCES public.orders(id), -- Lien commande si applicable

    -- Détails spécifiques
    product_name TEXT, -- Nom du produit
    product_image TEXT, -- URL image produit
    quantity INTEGER, -- Quantité achetée/vendue
    unit_price DECIMAL(10, 2), -- Prix unitaire
    commission_rate DECIMAL(5, 2), -- Taux commission (pour affiliés)
    withdrawal_method TEXT, -- Mobile Money, Bank, etc.
    withdrawal_number TEXT, -- Numéro destinataire
    withdrawal_fee DECIMAL(10, 2), -- Frais de retrait

    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger pour empêcher modification
CREATE POLICY "Transactions are read-only"
ON public.transactions
FOR UPDATE
USING (false);

CREATE POLICY "Transactions cannot be deleted"
ON public.transactions
FOR DELETE
USING (false);
```

### Contrainte Unicité Numéro de Téléphone

```sql
-- Ajouter contrainte unique composite
CREATE UNIQUE INDEX unique_phone_per_role
ON public.profiles(phone_number, role)
WHERE phone_number IS NOT NULL;

COMMENT ON INDEX unique_phone_per_role IS
'Empêche 2 comptes avec le même rôle d''avoir le même numéro.
Permet le même numéro sur buyer, seller, affiliate différents.';
```

---

## 📝 Services TypeScript

### 1. `transactionService.ts` (À CRÉER)

```typescript
import { supabase } from '../lib/supabase';

export interface Transaction {
    id: string;
    user_id: string;
    type: 'purchase' | 'sale' | 'commission' | 'withdrawal';
    amount: number;
    balance_after: number;
    order_id?: string;

    // Détails produit
    product_name?: string;
    product_image?: string;
    quantity?: number;
    unit_price?: number;

    // Commission
    commission_rate?: number;

    // Retrait
    withdrawal_method?: string;
    withdrawal_number?: string;
    withdrawal_fee?: number;

    description?: string;
    created_at: string;
}

export const transactionService = {
    // Récupérer transactions avec filtre
    async getTransactionsByUser(userId: string, filter: 'all' | 'purchase' | 'sale' | 'commission' | 'withdrawal' = 'all') {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('type', filter);
        }

        return await query;
    },

    // Créer transaction ACHAT
    async createPurchaseTransaction(params: {
        userId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        productImage: string;
        quantity: number;
        unitPrice: number;
    }) {
        return await supabase.from('transactions').insert([{
            user_id: params.userId,
            type: 'purchase',
            amount: -Math.abs(params.amount), // Négatif
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            product_image: params.productImage,
            quantity: params.quantity,
            unit_price: params.unitPrice,
            description: `Achat de ${params.quantity}x ${params.productName}`
        }]);
    },

    // Créer transaction VENTE
    async createSaleTransaction(params: {
        sellerId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        productImage: string;
        quantity: number;
        unitPrice: number;
        commissionAmount?: number;
    }) {
        return await supabase.from('transactions').insert([{
            user_id: params.sellerId,
            type: 'sale',
            amount: Math.abs(params.amount), // Positif
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            product_image: params.productImage,
            quantity: params.quantity,
            unit_price: params.unitPrice,
            description: `Vente de ${params.quantity}x ${params.productName}${params.commissionAmount ? ` (Commission: ${params.commissionAmount} FCFA)` : ''}`
        }]);
    },

    // Créer transaction COMMISSION
    async createCommissionTransaction(params: {
        affiliateId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        commissionRate: number;
        totalSale: number;
    }) {
        return await supabase.from('transactions').insert([{
            user_id: params.affiliateId,
            type: 'commission',
            amount: Math.abs(params.amount), // Positif
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            commission_rate: params.commissionRate,
            description: `Commission ${params.commissionRate}% sur vente de ${params.totalSale} FCFA`
        }]);
    },

    // Créer transaction RETRAIT
    async createWithdrawalTransaction(params: {
        userId: string;
        amount: number;
        balanceAfter: number;
        method: string;
        number: string;
        fee: number;
    }) {
        return await supabase.from('transactions').insert([{
            user_id: params.userId,
            type: 'withdrawal',
            amount: -Math.abs(params.amount), // Négatif
            balance_after: params.balanceAfter,
            withdrawal_method: params.method,
            withdrawal_number: params.number,
            withdrawal_fee: params.fee,
            description: `Retrait ${params.method} vers ${params.number}`
        }]);
    }
};
```

### 2. `invoiceService.ts` (À CRÉER)

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const invoiceService = {
    // Générer facture d'achat
    async generatePurchaseInvoice(transaction: Transaction, user: any) {
        const doc = new jsPDF();

        // Logo Zwa (si disponible)
        // doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);

        // En-tête
        doc.setFontSize(20);
        doc.text('ZWA MARKETPLACE', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`FACTURE #ZWA-${transaction.id.substring(0, 8)}`, 105, 30, { align: 'center' });
        doc.text(`Date: ${new Date(transaction.created_at).toLocaleDateString('fr-FR')}`, 105, 37, { align: 'center' });

        // Infos client
        doc.setFontSize(10);
        doc.text('CLIENT', 14, 50);
        doc.text(`Nom: ${user.full_name || 'N/A'}`, 14, 57);
        doc.text(`Email: ${user.email}`, 14, 64);

        // Détails produit
        doc.text('DÉTAILS DE LA COMMANDE', 14, 80);

        // Tableau
        (doc as any).autoTable({
            startY: 85,
            head: [['Produit', 'Qté', 'P.U.', 'Total']],
            body: [[
                transaction.product_name,
                transaction.quantity,
                `${transaction.unit_price?.toLocaleString()} FCFA`,
                `${Math.abs(transaction.amount).toLocaleString()} FCFA`
            ]],
        });

        // Total
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`TOTAL: ${Math.abs(transaction.amount).toLocaleString()} FCFA`, 150, finalY);

        // Footer
        doc.setFontSize(8);
        doc.text('Merci pour votre achat sur Zwa!', 105, 280, { align: 'center' });
        doc.text('www.zwa.com', 105, 285, { align: 'center' });

        // Télécharger
        doc.save(`facture-zwa-${transaction.id.substring(0, 8)}.pdf`);
    },

    // Générer reçu de vente/commission
    async generateReceiptPDF(transaction: Transaction, user: any) {
        // Logique similaire adaptée pour vendeur/affilié
    },

    // Exporter historique CSV
    async exportToCSV(transactions: Transaction[]) {
        const headers = ['Date', 'Type', 'Description', 'Montant', 'Solde'];
        const rows = transactions.map(t => [
            new Date(t.created_at).toLocaleString('fr-FR'),
            t.type,
            t.description || '',
            `${t.amount} FCFA`,
            `${t.balance_after} FCFA`
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        // Télécharger
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historique-zwa-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }
};
```

---

## 🎨 Pages React à Créer

### 1. `AccountSettings.tsx`

**Structure :**

```typescript
const AccountSettings = () => {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({
        email: user?.email || '',
        full_name: profile?.full_name || '',
        phone_number: profile?.phone_number || '',
        avatar_url: profile?.avatar_url || ''
    });

    const [phoneError, setPhoneError] = useState('');
    const [uploading, setUploading] = useState(false);

    const validatePhoneUniqueness = async (phone: string, role: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', phone)
            .eq('role', role)
            .neq('id', user.id);

        return !data || data.length === 0;
    };

    const handleSave = async () => {
        // Validation numéro
        if (formData.phone_number) {
            const isUnique = await validatePhoneUniqueness(formData.phone_number, profile.role);
            if (!isUnique) {
                alert(`Ce numéro est déjà utilisé par un autre compte ${profile.role}`);
                return;
            }
        }

        // Sauvegarde...
    };

    return (
        <div>
            {/* Formulaire */}
        </div>
    );
};
```

### 2. `TransactionHistory.tsx`

**Structure :**

```typescript
const TransactionHistory = () => {
    const { profile } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'purchase' | 'sale' | 'commission' | 'withdrawal'>('all');

    const getAvailableFilters = () => {
        if (profile.role === 'buyer') return ['all', 'purchase', 'withdrawal'];
        if (profile.role === 'seller') return ['all', 'sale', 'withdrawal'];
        if (profile.role === 'affiliate') return ['all', 'commission', 'withdrawal'];
        return ['all'];
    };

    const handleDownloadInvoice = async (transaction: Transaction) => {
        if (transaction.type === 'purchase') {
            await invoiceService.generatePurchaseInvoice(transaction, profile);
        } else {
            await invoiceService.generateReceiptPDF(transaction, profile);
        }
    };

    return (
        <div>
            {/* Filtres + Liste + Boutons export */}
        </div>
    );
};
```

---

## 🔄 Intégration avec `orderService.ts`

### Modifier `confirmDeliveryByBuyer()`

```typescript
// Après mise à jour wallet vendeur (ligne 335)
await transactionService.createSaleTransaction({
    sellerId: order.seller_id,
    orderId: orderId,
    amount: netAmount,
    balanceAfter: newSellerBalance,
    productName: order.products?.name,
    productImage: order.products?.image_url,
    quantity: order.quantity,
    unitPrice: order.amount / order.quantity,
    commissionAmount: commission
});

// Après mise à jour wallet affilié (ligne 360)
if (order.affiliate_id && commission > 0) {
    await transactionService.createCommissionTransaction({
        affiliateId: order.affiliate_id,
        orderId: orderId,
        amount: commission,
        balanceAfter: newAffiliateBalance,
        productName: order.products?.name,
        commissionRate: product.default_commission,
        totalSale: order.amount
    });
}

// Transaction achat pour le buyer
await transactionService.createPurchaseTransaction({
    userId: order.buyer_id,
    orderId: orderId,
    amount: order.amount,
    balanceAfter: 0, // À calculer si wallet buyer existe
    productName: order.products?.name,
    productImage: order.products?.image_url,
    quantity: order.quantity,
    unitPrice: order.amount / order.quantity
});
```

---

## 📊 Ordre d'Implémentation

1. ✅ Créer table `transactions` + contrainte phone uniqueness
2. ✅ Créer `transactionService.ts`
3. ✅ Créer `invoiceService.ts` (installer jspdf)
4. ✅ Modifier `orderService.ts` pour créer transactions
5. ✅ Créer `AccountSettings.tsx`
6. ✅ Créer `TransactionHistory.tsx`
7. ✅ Ajouter routes + navigation
8. ✅ Tests complets

---

## ✅ Checklist de Validation

- [ ] Table transactions créée
- [ ] Contrainte phone_number unique par rôle active
- [ ] Transactions créées automatiquement lors livraison
- [ ] Page Settings fonctionnelle
- [ ] Validation numéro unique par rôle OK
- [ ] Upload avatar fonctionne
- [ ] Page Historique affiche transactions
- [ ] Génération facture PDF achat OK
- [ ] Génération reçu PDF vente OK
- [ ] Génération reçu PDF commission OK
- [ ] Export CSV fonctionne
- [ ] Test avec compte Buyer
- [ ] Test avec compte Seller
- [ ] Test avec compte Affiliate

---

**Statut :** 📝 Plan V2 validé - Prêt pour implémentation
