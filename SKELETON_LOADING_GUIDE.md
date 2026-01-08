# 🎨 Guide d'Utilisation des Skeleton Loaders

## Vue d'ensemble

Les **Skeleton Loaders** sont des composants de chargement modernes qui remplacent les textes "Chargement..." par des animations visuelles élégantes. Ils améliorent considérablement l'expérience utilisateur en donnant une prévisualisation de la structure du contenu qui va apparaître.

---

## 📦 Comment ça fonctionne

### 1. Animation CSS

Tout d'abord, vous devez ajouter l'animation CSS dans votre composant :

```typescript
useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes skeletonPulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch (e) {} };
}, []);
```

### 2. Styles de Base

Créez ces styles dans votre objet `styles` :

```typescript
const styles = {
    // Barre skeleton de base
    skeletonBar: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        position: 'relative' as const,
        overflow: 'hidden',
    },

    // Effet de brillance qui se déplace
    skeletonShine: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
    },
};
```

---

## 🎯 Exemples d'Utilisation

### Exemple 1: Skeleton Simple (Texte)

Remplace un texte ou titre en chargement :

```tsx
{loading ? (
    <div style={{...styles.skeletonBar, width: '60%', height: '24px', marginBottom: '12px'}}>
        <div style={styles.skeletonShine}></div>
    </div>
) : (
    <h2>{title}</h2>
)}
```

**Paramètres personnalisables :**
- `width`: largeur (ex: '60%', '200px')
- `height`: hauteur (ex: '24px', '32px')
- `margin`: espacement autour

---

### Exemple 2: Skeleton Avatar Circulaire

Pour un avatar ou une image de profil :

```tsx
{loading ? (
    <div style={{
        ...styles.skeletonBar,
        width: '40px',
        height: '40px',
        borderRadius: '50%'
    }}>
        <div style={styles.skeletonShine}></div>
    </div>
) : (
    <img src={avatarUrl} alt="Avatar" />
)}
```

---

### Exemple 3: Skeleton Carte Produit

Pour une carte produit complète :

```tsx
{loading ? (
    <div style={styles.productCardSkeleton}>
        {/* Image */}
        <div style={styles.skeletonProductImage}>
            <div style={styles.skeletonShine}></div>
        </div>
        {/* Nom */}
        <div style={{...styles.skeletonBar, width: '80%', height: '16px', margin: '12px auto 8px'}}>
            <div style={styles.skeletonShine}></div>
        </div>
        {/* Prix */}
        <div style={{...styles.skeletonBar, width: '50%', height: '14px', margin: '0 auto'}}>
            <div style={styles.skeletonShine}></div>
        </div>
    </div>
) : (
    <ProductCard product={product} />
)}
```

**Styles supplémentaires nécessaires :**

```typescript
productCardSkeleton: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    padding: '12px',
},
skeletonProductImage: {
    width: '100%',
    height: '140px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    marginBottom: '8px',
    position: 'relative' as const,
    overflow: 'hidden',
}
```

---

### Exemple 4: Skeleton Liste (Reviews, Commentaires)

Pour une liste de reviews ou commentaires :

```tsx
{reviewsLoading ? (
    <div style={styles.reviewsSkeleton}>
        {[1, 2, 3].map(i => (
            <div key={i} style={styles.reviewSkeletonCard}>
                {/* Avatar */}
                <div style={{...styles.skeletonBar, width: '40px', height: '40px', borderRadius: '50%'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div style={{flex: 1}}>
                    {/* Nom */}
                    <div style={{...styles.skeletonBar, width: '60%', height: '16px', marginBottom: '8px'}}>
                        <div style={styles.skeletonShine}></div>
                    </div>
                    {/* Commentaire */}
                    <div style={{...styles.skeletonBar, width: '100%', height: '40px'}}>
                        <div style={styles.skeletonShine}></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
) : (
    <ReviewsList reviews={reviews} />
)}
```

**Styles supplémentaires :**

```typescript
reviewsSkeleton: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
},
reviewSkeletonCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
}
```

---

### Exemple 5: Skeleton Page Complète

Pour une page entière (comme ProductDetail) :

```tsx
const ProductDetailSkeleton = () => {
    return (
        <div style={styles.container}>
            {/* Image principale */}
            <div style={styles.skeletonImageArea}>
                <div style={styles.skeletonPulse}></div>
            </div>

            {/* Contenu */}
            <div style={{padding: '0 20px'}}>
                {/* Titre */}
                <div style={{...styles.skeletonBar, width: '60%', height: '32px', marginTop: '20px'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
                {/* Prix */}
                <div style={{...styles.skeletonBar, width: '40%', height: '24px', marginTop: '12px'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
                {/* Vendeur */}
                <div style={{...styles.skeletonBar, width: '100%', height: '80px', marginTop: '20px'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
                {/* Description */}
                <div style={{...styles.skeletonBar, width: '100%', height: '200px', marginTop: '20px'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
            </div>
        </div>
    );
};

// Utilisation
if (loading) return <ProductDetailSkeleton />;
```

**Styles supplémentaires :**

```typescript
skeletonImageArea: {
    width: '100%',
    height: '400px',
    background: 'rgba(255,255,255,0.03)',
    position: 'relative' as const,
    overflow: 'hidden',
},
skeletonPulse: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonPulse 1.5s ease-in-out infinite',
}
```

---

### Exemple 6: Skeleton Grille de Produits

Pour afficher une grille de produits en chargement :

```tsx
{loading ? (
    <div style={styles.similarGrid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={styles.productCardSkeleton}>
                <div style={styles.skeletonProductImage}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div style={{...styles.skeletonBar, width: '80%', height: '16px', margin: '12px auto 8px'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div style={{...styles.skeletonBar, width: '50%', height: '14px', margin: '0 auto'}}>
                    <div style={styles.skeletonShine}></div>
                </div>
            </div>
        ))}
    </div>
) : (
    <ProductGrid products={products} />
)}
```

**Style grille :**

```typescript
similarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
}
```

---

## 🎨 Personnalisation des Couleurs

### Thème Sombre (défaut)
```typescript
skeletonBar: {
    background: 'rgba(255,255,255,0.05)',  // Gris très foncé
},
skeletonShine: {
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
}
```

### Thème Clair
```typescript
skeletonBar: {
    background: 'rgba(0,0,0,0.05)',  // Gris très clair
},
skeletonShine: {
    background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
}
```

### Thème Coloré (Violet/Rose)
```typescript
skeletonBar: {
    background: 'rgba(138, 43, 226, 0.05)',  // Violet très léger
},
skeletonShine: {
    background: 'linear-gradient(90deg, transparent 0%, rgba(138, 43, 226, 0.15) 50%, transparent 100%)',
}
```

---

## ⚡ Bonnes Pratiques

### 1. Nombre d'éléments
Affichez le même nombre de skeletons que d'éléments réels attendus :
```tsx
{loading ? (
    <>
        {[...Array(expectedCount)].map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </>
) : (
    items.map(item => <Card key={item.id} item={item} />)
)}
```

### 2. Dimensions Réalistes
Donnez aux skeletons les mêmes dimensions que le contenu réel :
```tsx
// ❌ Mauvais
<div style={{...styles.skeletonBar, width: '100px', height: '20px'}}></div>

// ✅ Bon (correspond au vrai contenu)
<div style={{...styles.skeletonBar, width: '60%', height: '24px'}}></div>
```

### 3. Structure Similaire
Respectez la même structure que le contenu réel :
```tsx
// Contenu réel
<div className="card">
    <img />
    <h3>{title}</h3>
    <p>{description}</p>
</div>

// Skeleton correspondant
<div className="card">
    <div style={skeletonImage}><div style={shine}></div></div>
    <div style={skeletonTitle}><div style={shine}></div></div>
    <div style={skeletonDescription}><div style={shine}></div></div>
</div>
```

### 4. Durée d'Animation
Gardez l'animation fluide (1.5s est optimal) :
```css
animation: skeletonPulse 1.5s ease-in-out infinite;
```

### 5. Accessibilité
Ajoutez des attributs ARIA pour l'accessibilité :
```tsx
<div
    style={styles.skeletonBar}
    role="status"
    aria-live="polite"
    aria-label="Chargement en cours"
>
    <div style={styles.skeletonShine}></div>
</div>
```

---

## 📍 Où Utiliser les Skeletons ?

### ✅ Recommandé
- ✅ Listes de produits
- ✅ Cartes de produits
- ✅ Profils utilisateurs
- ✅ Reviews/Commentaires
- ✅ Pages de détail
- ✅ Feeds/Timelines
- ✅ Grilles d'images
- ✅ Tableaux de données

### ❌ Non Recommandé
- ❌ Boutons de soumission (utilisez un spinner)
- ❌ Alertes/Notifications (trop rapides)
- ❌ Modals/Popups (préférez un spinner)
- ❌ Micro-interactions (< 200ms)

---

## 🚀 Composants Réutilisables (Prêts à l'emploi !)

### ✅ Déjà créés dans `/src/components/common/SkeletonLoader.tsx`

Tous les composants sont **prêts à utiliser** ! Importez-les simplement :

```typescript
import {
    useSkeletonAnimation,  // Hook pour l'animation CSS
    SkeletonBar,           // Barre de base
    SkeletonAvatar,        // Avatar circulaire
    SkeletonText,          // Texte multiligne
    SkeletonProductCard,   // Carte produit
    SkeletonProductGrid,   // Grille de produits
    SkeletonReview,        // Review/Commentaire
    SkeletonOrderCard      // Carte commande
} from '../components/common/SkeletonLoader';
```

### Utilisation Rapide

```typescript
const MyComponent = () => {
    useSkeletonAnimation(); // ⚠️ Important : appeler une fois
    const [loading, setLoading] = useState(true);

    return (
        <>
            {loading ? (
                <>
                    <SkeletonBar width="60%" height={24} />
                    <SkeletonProductGrid count={6} columns={2} />
                    <SkeletonReview />
                </>
            ) : (
                <ActualContent />
            )}
        </>
    );
};
```

### Composants Disponibles

| Composant | Usage | Props |
|-----------|-------|-------|
| `SkeletonBar` | Élément de base | width, height, borderRadius, margin, style |
| `SkeletonAvatar` | Avatar circulaire | size, style |
| `SkeletonText` | Texte multiligne | lines, gap, lastLineWidth, style |
| `SkeletonProductCard` | Carte produit | style |
| `SkeletonProductGrid` | Grille de produits | count, columns, gap |
| `SkeletonReview` | Review/Commentaire | style |
| `SkeletonOrderCard` | Carte commande | style |

📖 **Voir tous les exemples** : `/src/components/common/SkeletonExamples.md`

---

## 📚 Référence Complète

Voir l'implémentation complète dans :
- **Fichier** : `/src/pages/products/ProductDetail.tsx`
- **Lignes** : 14-40 (Composant Skeleton)
- **Lignes** : 61-72 (Animation CSS)
- **Lignes** : 1000-1020 (Styles)

---

## 💡 Astuce Finale

Pour un effet encore plus moderne, combinez avec un **fade-in** quand le contenu réel apparaît :

```tsx
const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
    if (data) {
        setTimeout(() => setIsLoaded(true), 50);
    }
}, [data]);

return (
    <>
        {loading && <SkeletonLoader />}
        {data && (
            <div style={{
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in'
            }}>
                {content}
            </div>
        )}
    </>
);
```

---

**Créé par Claude Code 🤖**
*Dernière mise à jour : 2026-01-03*
