# 🎭 Utilisation des Skeletons par Rôle

Guide d'intégration des skeletons selon les différents rôles utilisateurs.

---

## 🛒 BUYER (Acheteur)

### 1. Page d'Accueil / Marketplace

**Fichier** : `/src/pages/home/HomePage.tsx`

```typescript
import { useSkeletonAnimation, SkeletonProductGrid } from '../components/common/SkeletonLoader';

const HomePage = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    return (
        <div>
            <h2>Produits Populaires</h2>
            {loading ? (
                <SkeletonProductGrid count={8} columns={2} gap={16} />
            ) : (
                <ProductsGrid products={products} />
            )}
        </div>
    );
};
```

---

### 2. Page Produit

**Fichier** : `/src/pages/products/ProductDetail.tsx`

✅ **Déjà implémenté !**

- Skeleton page complète
- Skeleton reviews
- Skeleton produits similaires

---

### 3. Page Achats / Commandes

**Fichier** : `/src/pages/orders/OrdersList.tsx`

```typescript
import { useSkeletonAnimation, SkeletonOrderCard } from '../../components/common/SkeletonLoader';

const OrdersList = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5].map(i => (
                        <SkeletonOrderCard key={i} style={{ marginBottom: '16px' }} />
                    ))}
                </>
            ) : (
                orders.map(order => <OrderCard key={order.id} order={order} />)
            )}
        </div>
    );
};
```

---

### 4. Historique des Transactions

**Fichier** : `/src/pages/profile/TransactionHistory.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar } from '../../components/common/SkeletonLoader';

const SkeletonTransactionRow = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        marginBottom: '12px'
    }}>
        <div style={{ flex: 1 }}>
            <SkeletonBar width="60%" height={16} margin="0 0 6px 0" />
            <SkeletonBar width="40%" height={12} />
        </div>
        <SkeletonBar width={100} height={24} />
    </div>
);

const TransactionHistory = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5].map(i => (
                        <SkeletonTransactionRow key={i} />
                    ))}
                </>
            ) : (
                transactions.map(t => <TransactionRow key={t.id} transaction={t} />)
            )}
        </div>
    );
};
```

---

## 🏪 SELLER (Vendeur)

### 1. Tableau de Bord Vendeur

**Fichier** : `/src/pages/seller/SellerDashboard.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar } from '../../components/common/SkeletonLoader';

const SkeletonStatCard = () => (
    <div style={{
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px'
    }}>
        <SkeletonBar width="40%" height={14} margin="0 0 12px 0" />
        <SkeletonBar width="60%" height={32} margin="0 0 8px 0" />
        <SkeletonBar width="50%" height={12} />
    </div>
);

const SellerDashboard = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            <h2>Statistiques</h2>
            {loading ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                }}>
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                </div>
            ) : (
                <StatsGrid stats={stats} />
            )}
        </div>
    );
};
```

---

### 2. Mes Produits

**Fichier** : `/src/pages/seller/MyProducts.tsx`

```typescript
import { useSkeletonAnimation, SkeletonProductGrid } from '../../components/common/SkeletonLoader';

const MyProducts = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <SkeletonProductGrid count={6} columns={2} gap={16} />
            ) : (
                <ProductsGrid products={products} />
            )}
        </div>
    );
};
```

---

### 3. Commandes Reçues

**Fichier** : `/src/pages/seller/ReceivedOrders.tsx`

```typescript
import { useSkeletonAnimation, SkeletonOrderCard } from '../../components/common/SkeletonLoader';

const ReceivedOrders = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <SkeletonOrderCard key={i} style={{ marginBottom: '16px' }} />
                    ))}
                </>
            ) : (
                orders.map(order => <OrderCard key={order.id} order={order} />)
            )}
        </div>
    );
};
```

---

## 💰 AFFILIATE (Affilié)

### 1. Dashboard Affilié

**Fichier** : `/src/pages/affiliate/AffiliateDashboard.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar } from '../../components/common/SkeletonLoader';

const SkeletonEarningsCard = () => (
    <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(255, 20, 147, 0.1))',
        borderRadius: '20px',
        border: '1px solid rgba(138, 43, 226, 0.2)'
    }}>
        <SkeletonBar width="50%" height={16} margin="0 0 12px 0" />
        <SkeletonBar width="70%" height={36} margin="0 0 8px 0" />
        <SkeletonBar width="40%" height={14} />
    </div>
);

const AffiliateDashboard = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    <SkeletonEarningsCard />
                    <div style={{ marginTop: '24px' }}>
                        <SkeletonBar width="40%" height={24} margin="0 0 16px 0" />
                        {[1, 2, 3].map(i => (
                            <SkeletonBar key={i} width="100%" height={60} margin="0 0 12px 0" />
                        ))}
                    </div>
                </>
            ) : (
                <DashboardContent />
            )}
        </div>
    );
};
```

---

### 2. Mes Liens Actifs

**Fichier** : `/src/pages/affiliate/ActiveLinks.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar, SkeletonProductCard } from '../../components/common/SkeletonLoader';

const SkeletonLinkCard = () => (
    <div style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        marginBottom: '12px'
    }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SkeletonBar width={60} height={60} borderRadius={12} />
            <div style={{ flex: 1 }}>
                <SkeletonBar width="70%" height={16} margin="0 0 8px 0" />
                <SkeletonBar width="50%" height={14} margin="0 0 8px 0" />
                <SkeletonBar width="30%" height={12} />
            </div>
        </div>
    </div>
);

const ActiveLinks = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5].map(i => (
                        <SkeletonLinkCard key={i} />
                    ))}
                </>
            ) : (
                links.map(link => <LinkCard key={link.id} link={link} />)
            )}
        </div>
    );
};
```

---

### 3. Historique des Commissions

**Fichier** : `/src/pages/affiliate/CommissionHistory.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar } from '../../components/common/SkeletonLoader';

const SkeletonCommissionRow = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        marginBottom: '12px'
    }}>
        <div style={{ flex: 1 }}>
            <SkeletonBar width="60%" height={16} margin="0 0 6px 0" />
            <SkeletonBar width="40%" height={12} />
        </div>
        <div style={{ textAlign: 'right' }}>
            <SkeletonBar width={80} height={20} margin="0 0 4px 0" />
            <SkeletonBar width={60} height={12} />
        </div>
    </div>
);

const CommissionHistory = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <SkeletonCommissionRow key={i} />
                    ))}
                </>
            ) : (
                commissions.map(c => <CommissionRow key={c.id} commission={c} />)
            )}
        </div>
    );
};
```

---

## 💬 CHAT (Tous les rôles)

### Messages / Conversations

**Fichier** : `/src/pages/chat/MessagesList.tsx`

```typescript
import { useSkeletonAnimation, SkeletonBar, SkeletonAvatar } from '../../components/common/SkeletonLoader';

const SkeletonConversation = () => (
    <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        marginBottom: '8px'
    }}>
        <SkeletonAvatar size={48} />
        <div style={{ flex: 1 }}>
            <SkeletonBar width="50%" height={16} margin="0 0 6px 0" />
            <SkeletonBar width="80%" height={14} />
        </div>
        <SkeletonBar width={20} height={20} borderRadius="50%" />
    </div>
);

const MessagesList = () => {
    useSkeletonAnimation();
    const [loading, setLoading] = useState(true);

    return (
        <div>
            {loading ? (
                <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <SkeletonConversation key={i} />
                    ))}
                </>
            ) : (
                conversations.map(c => <ConversationCard key={c.id} conversation={c} />)
            )}
        </div>
    );
};
```

---

## 📊 Récapitulatif par Fichier

| Fichier | Skeleton à Utiliser | Priorité |
|---------|---------------------|----------|
| `HomePage.tsx` | `SkeletonProductGrid` | 🔥 Haute |
| `ProductDetail.tsx` | ✅ Déjà fait | - |
| `OrdersList.tsx` | `SkeletonOrderCard` | 🔥 Haute |
| `TransactionHistory.tsx` | Custom (voir exemple) | 🟡 Moyenne |
| `SellerDashboard.tsx` | `SkeletonStatCard` | 🔥 Haute |
| `MyProducts.tsx` | `SkeletonProductGrid` | 🟡 Moyenne |
| `AffiliateDashboard.tsx` | Custom (voir exemple) | 🔥 Haute |
| `MessagesList.tsx` | Custom (voir exemple) | 🟡 Moyenne |

---

## 🎯 Checklist d'Implémentation

### Phase 1 : Pages Critiques (Haute Priorité)
- [ ] `HomePage.tsx` - Marketplace
- [ ] `OrdersList.tsx` - Liste des commandes
- [ ] `SellerDashboard.tsx` - Dashboard vendeur
- [ ] `AffiliateDashboard.tsx` - Dashboard affilié

### Phase 2 : Pages Secondaires (Moyenne Priorité)
- [ ] `TransactionHistory.tsx` - Historique
- [ ] `MyProducts.tsx` - Mes produits
- [ ] `MessagesList.tsx` - Chat
- [ ] `ActiveLinks.tsx` - Liens affiliés

### Phase 3 : Optimisations
- [ ] Ajouter fade-in après chargement
- [ ] Tester sur différents appareils
- [ ] Ajuster les durées d'animation

---

**Créé par Claude Code 🤖**
*Guide spécifique par rôle - 2026*
