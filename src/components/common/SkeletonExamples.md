# 🎨 Exemples d'Utilisation des Skeletons

## Import

```typescript
import {
    useSkeletonAnimation,
    SkeletonBar,
    SkeletonAvatar,
    SkeletonText,
    SkeletonProductCard,
    SkeletonProductGrid,
    SkeletonReview,
    SkeletonOrderCard
} from '../components/common/SkeletonLoader';
```

## 1. Setup (Important !)

**Appelez `useSkeletonAnimation()` une seule fois dans votre composant :**

```typescript
const MyComponent = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const [loading, setLoading] = useState(true);

    // ... rest of your code
};
```

---

## 2. Exemples Simples

### Texte/Titre
```typescript
{loading ? (
    <SkeletonBar width="60%" height={24} />
) : (
    <h2>{title}</h2>
)}
```

### Avatar
```typescript
{loading ? (
    <SkeletonAvatar size={48} />
) : (
    <img src={avatarUrl} />
)}
```

### Paragraphe (3 lignes)
```typescript
{loading ? (
    <SkeletonText lines={3} gap={8} lastLineWidth="70%" />
) : (
    <p>{description}</p>
)}
```

---

## 3. Grilles de Produits

### Liste de Produits
```typescript
{loading ? (
    <SkeletonProductGrid count={6} columns={2} gap={16} />
) : (
    <div className="products-grid">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
)}
```

### Produit Seul
```typescript
{loading ? (
    <SkeletonProductCard />
) : (
    <ProductCard product={product} />
)}
```

---

## 4. Reviews/Commentaires

```typescript
{reviewsLoading ? (
    <>
        <SkeletonReview />
        <SkeletonReview />
        <SkeletonReview />
    </>
) : (
    reviews.map(r => <Review key={r.id} review={r} />)
)}
```

---

## 5. Commandes/Orders

```typescript
{ordersLoading ? (
    <>
        {[1,2,3,4].map(i => <SkeletonOrderCard key={i} />)}
    </>
) : (
    orders.map(o => <OrderCard key={o.id} order={o} />)
)}
```

---

## 6. Combinaisons Personnalisées

### Card Vendeur
```typescript
{loading ? (
    <div style={{ display: 'flex', gap: '12px', padding: '16px' }}>
        <SkeletonAvatar size={50} />
        <div style={{ flex: 1 }}>
            <SkeletonBar width="60%" height={18} margin="0 0 6px 0" />
            <SkeletonBar width="40%" height={14} />
        </div>
    </div>
) : (
    <SellerCard seller={seller} />
)}
```

### Stat Card (Dashboard)
```typescript
{loading ? (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
        <SkeletonBar width="40%" height={14} margin="0 0 12px 0" />
        <SkeletonBar width="60%" height={32} margin="0 0 8px 0" />
        <SkeletonBar width="50%" height={12} />
    </div>
) : (
    <StatCard title={title} value={value} />
)}
```

---

## 7. Utilisation dans ProductDetail.tsx

Voir le fichier complet : `/src/pages/products/ProductDetail.tsx`

**Exemples du code actuel :**

### Skeleton Page Complète
```typescript
const ProductDetailSkeleton = () => {
    return (
        <div style={styles.container}>
            <div style={styles.skeletonImageArea}>
                <div style={styles.skeletonPulse}></div>
            </div>
            <div style={{padding: '0 20px'}}>
                <SkeletonBar width="60%" height={32} margin="20px 0 0 0" />
                <SkeletonBar width="40%" height={24} margin="12px 0 0 0" />
                <SkeletonBar width="100%" height={80} margin="20px 0 0 0" />
            </div>
        </div>
    );
};

// Utilisation
if (loading) return <ProductDetailSkeleton />;
```

### Skeleton Reviews
```typescript
{reviewsLoading ? (
    <>
        {[1, 2].map(i => (
            <SkeletonReview key={i} />
        ))}
    </>
) : (
    <ReviewCarousel reviews={reviews} />
)}
```

### Skeleton Produits Similaires
```typescript
{loadingSimilar ? (
    <SkeletonProductGrid count={4} columns={2} />
) : (
    <div className="products-grid">
        {similarProducts.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
)}
```

---

## 8. Props Disponibles

### SkeletonBar
- `width`: string | number (défaut: '100%')
- `height`: string | number (défaut: '20px')
- `borderRadius`: string | number (défaut: '12px')
- `margin`: string
- `style`: React.CSSProperties

### SkeletonAvatar
- `size`: number (défaut: 40)
- `style`: React.CSSProperties

### SkeletonText
- `lines`: number (défaut: 3)
- `gap`: number (défaut: 8)
- `lastLineWidth`: string (défaut: '70%')
- `style`: React.CSSProperties

### SkeletonProductGrid
- `count`: number (défaut: 6)
- `columns`: number (défaut: 2)
- `gap`: number (défaut: 16)

---

## 💡 Astuces

### 1. Nombre Dynamique
```typescript
const expectedCount = data?.total || 6;

{loading ? (
    <SkeletonProductGrid count={expectedCount} />
) : (
    <ProductsGrid products={products} />
)}
```

### 2. Styles Personnalisés
```typescript
<SkeletonBar
    width="80%"
    height={32}
    style={{
        background: 'rgba(138, 43, 226, 0.1)',
        marginBottom: '20px'
    }}
/>
```

### 3. Conditionnels Multiples
```typescript
{loading && <SkeletonProductCard />}
{!loading && !error && <ProductCard product={product} />}
{error && <ErrorMessage />}
```
