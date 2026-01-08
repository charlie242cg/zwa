# 💬 Guide des Skeleton Loaders pour le Chat

Ce guide explique comment utiliser les composants skeleton spécifiques au chat.

## 📦 Imports

```typescript
import {
    useSkeletonAnimation,
    SkeletonConversationItem,
    SkeletonConversationList,
    SkeletonChatHeader,
    SkeletonChatMessage,
    SkeletonChatMessages
} from '../../components/common/SkeletonLoader';
```

---

## 🎯 Composants Disponibles

### 1. SkeletonConversationItem

Skeleton pour un item de conversation dans la liste des messages.

**Apparence:**
```
┌─────────────────────────────────────┐
│ [Avatar] Nom de la boutique    2j   │
│          📦 Produit                 │
│          Dernier message...      →  │
└─────────────────────────────────────┘
```

**Utilisation:**
```typescript
<SkeletonConversationItem />
```

**Props:**
- `style`: `React.CSSProperties` (optionnel)

---

### 2. SkeletonConversationList

Grille de plusieurs items de conversation.

**Utilisation:**
```typescript
<SkeletonConversationList count={5} gap={12} />
```

**Props:**
- `count`: `number` - Nombre d'items à afficher (défaut: 5)
- `gap`: `number` - Espacement entre les items en px (défaut: 12)

---

### 3. SkeletonChatHeader

Skeleton pour l'en-tête d'une salle de chat.

**Apparence:**
```
┌──────────────────────────────────────┐
│ ← [Avatar] Nom          [Action]     │
│            Produit                    │
└──────────────────────────────────────┘
```

**Utilisation:**
```typescript
<SkeletonChatHeader />
```

**Props:**
- `style`: `React.CSSProperties` (optionnel)

---

### 4. SkeletonChatMessage

Skeleton pour un message de chat individuel.

**Apparence:**
```
Message reçu (gauche):
┌──────────────────┐
│ Texte du message │
│ 12:34            │
└──────────────────┘

Message envoyé (droite):
                  ┌──────────────────┐
                  │ Texte du message │
                  │ 12:34            │
                  └──────────────────┘
```

**Utilisation:**
```typescript
// Message reçu
<SkeletonChatMessage isOwn={false} />

// Message envoyé
<SkeletonChatMessage isOwn={true} />
```

**Props:**
- `isOwn`: `boolean` - Si true, affiche à droite (défaut: false)
- `style`: `React.CSSProperties` (optionnel)

---

### 5. SkeletonChatMessages

Liste complète de messages de chat avec alternance gauche/droite.

**Utilisation:**
```typescript
<SkeletonChatMessages count={8} gap={12} />
```

**Props:**
- `count`: `number` - Nombre de messages (défaut: 8)
- `gap`: `number` - Espacement entre messages en px (défaut: 12)

---

## 📱 Exemples Pratiques

### Exemple 1: MessagesList.tsx (Liste de Conversations)

```typescript
import { useSkeletonAnimation, SkeletonConversationList } from '../../components/common/SkeletonLoader';

const MessagesList = () => {
    useSkeletonAnimation(); // Important: activer l'animation
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Messages 💬</h1>
                <p>Vos discussions de négociation.</p>
            </header>

            {loading ? (
                <SkeletonConversationList count={5} gap={12} />
            ) : conversations.length > 0 ? (
                <div style={styles.list}>
                    {conversations.map(conv => (
                        <ConversationItem key={conv.id} conversation={conv} />
                    ))}
                </div>
            ) : (
                <EmptyState />
            )}
        </div>
    );
};
```

---

### Exemple 2: ChatRoom.tsx (Salle de Chat)

```typescript
import {
    useSkeletonAnimation,
    SkeletonChatHeader,
    SkeletonChatMessages
} from '../../components/common/SkeletonLoader';

const ChatRoom = () => {
    useSkeletonAnimation(); // Important: activer l'animation
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);

    // Affichage pendant le chargement
    if (loading) {
        return (
            <div style={styles.container}>
                <SkeletonChatHeader />

                {/* Bannière de confiance (optionnelle) */}
                <div style={styles.trustBanner}>
                    <ShieldCheck size={16} color="#00CC66" />
                    <span>Paiement sécurisé par OTP via Zwa.</span>
                </div>

                <SkeletonChatMessages count={8} gap={12} />
            </div>
        );
    }

    // Affichage normal
    return (
        <div style={styles.container}>
            <ChatHeader />
            <MessagesArea messages={messages} />
            <InputArea />
        </div>
    );
};
```

---

### Exemple 3: Chargement Progressif de Messages

```typescript
const ChatRoom = () => {
    useSkeletonAnimation();
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messages, setMessages] = useState([]);

    const loadMoreMessages = async () => {
        setMessagesLoading(true);
        // Charger plus de messages...
        setMessagesLoading(false);
    };

    return (
        <div style={styles.messagesArea}>
            {/* Messages existants */}
            {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Skeleton pendant le chargement */}
            {messagesLoading && (
                <>
                    <SkeletonChatMessage isOwn={false} />
                    <SkeletonChatMessage isOwn={true} />
                    <SkeletonChatMessage isOwn={false} />
                </>
            )}
        </div>
    );
};
```

---

## 🎨 Personnalisation

### Modifier les Couleurs

```typescript
<SkeletonConversationItem
    style={{
        background: 'rgba(138, 43, 226, 0.1)', // Violet clair
        border: '1px solid rgba(138, 43, 226, 0.2)'
    }}
/>
```

### Ajuster les Tailles

```typescript
<SkeletonChatMessages
    count={12}  // Plus de messages
    gap={16}    // Plus d'espacement
/>
```

---

## ✨ Bonnes Pratiques

### 1. Toujours Appeler useSkeletonAnimation()

```typescript
const MyComponent = () => {
    useSkeletonAnimation(); // ✅ En début de composant
    // ...
};
```

### 2. Nombre de Skeletons Adapté

```typescript
// ✅ Bon: Nombre réaliste
<SkeletonConversationList count={5} />

// ❌ Éviter: Trop de skeletons
<SkeletonConversationList count={50} />
```

### 3. Garder la Structure Cohérente

```typescript
// ✅ Bon: Même structure loading/loaded
{loading ? (
    <SkeletonChatHeader />
) : (
    <ChatHeader name={name} avatar={avatar} />
)}

// ❌ Éviter: Structures différentes
{loading ? (
    <div>Loading...</div>
) : (
    <ChatHeader />
)}
```

---

## 🔍 Comparaison Avant/Après

### Avant (Texte Simple)
```typescript
{loading ? (
    <div>Chargement...</div>
) : (
    <ConversationsList />
)}
```

### Après (Skeleton)
```typescript
{loading ? (
    <SkeletonConversationList count={5} gap={12} />
) : (
    <ConversationsList />
)}
```

**Avantages:**
- ✅ Feedback visuel plus riche
- ✅ Indique la structure à venir
- ✅ Meilleure UX (perception de rapidité)
- ✅ Design cohérent avec l'interface

---

## 📊 Résumé des Composants

| Composant | Usage | Props Clés |
|-----------|-------|------------|
| `SkeletonConversationItem` | Item de conversation seul | `style` |
| `SkeletonConversationList` | Liste de conversations | `count`, `gap` |
| `SkeletonChatHeader` | En-tête du chat | `style` |
| `SkeletonChatMessage` | Message seul | `isOwn`, `style` |
| `SkeletonChatMessages` | Liste de messages | `count`, `gap` |

---

## 🎯 Points Clés à Retenir

1. **Activation**: Toujours appeler `useSkeletonAnimation()` en début de composant
2. **Nombre**: Adapter le `count` au nombre réel d'éléments attendus
3. **Direction**: Utiliser `isOwn={true/false}` pour les messages
4. **Cohérence**: Garder la même structure entre skeleton et contenu réel
5. **Performance**: Les skeletons sont légers et performants

---

## 🚀 Aller Plus Loin

Pour créer vos propres composants skeleton, consultez:
- [SkeletonLoader.tsx](src/components/common/SkeletonLoader.tsx) - Code source
- [SkeletonExamples.md](src/components/common/SkeletonExamples.md) - Guide général
- [SKELETON_LOADING_GUIDE.md](SKELETON_LOADING_GUIDE.md) - Guide complet du système

---

**Créé pour Zwa Marketplace** 🚀
Version 1.0 - Janvier 2026
