# Guide de Test - Affichage des Profils dans le Chat

## ✅ Modifications Effectuées

Les fichiers suivants ont été modifiés pour afficher correctement les profils dans le chat:

1. **[chatService.ts](src/services/chatService.ts)** - Récupération des données `store_name` et `avatar_url`
2. **[MessagesList.tsx](src/pages/chat/MessagesList.tsx)** - Affichage dans la liste des conversations
3. **[ChatRoom.tsx](src/pages/chat/ChatRoom.tsx)** - Affichage dans l'en-tête du chat

## 🧪 Comment Tester

### 1. Vérifier les Données dans Supabase

Avant de tester l'interface, vérifiez que vos profils ont les bonnes données:

```sql
-- Exécuter dans Supabase SQL Editor
SELECT
    id,
    role,
    full_name,
    store_name,
    avatar_url
FROM profiles
WHERE role IN ('seller', 'buyer')
ORDER BY role, created_at DESC;
```

### 2. Test en tant que Client (Buyer)

**Ce que vous devriez voir:**

Dans la liste des messages (`/messages`):
- ✅ **Nom**: Le `store_name` du vendeur (ex: "Divine Mode Brazza")
- ✅ **Avatar**: Le logo de la boutique (`avatar_url` du vendeur)
- ❌ Si `store_name` est vide: Affiche `full_name` du vendeur
- ❌ Si `avatar_url` est vide: Affiche l'initiale du nom

Dans la salle de chat (`/chat/:id`):
- ✅ **Header**: Même affichage (nom de boutique + logo)

### 3. Test en tant que Vendeur (Seller)

**Ce que vous devriez voir:**

Dans la liste des messages (`/messages`):
- ✅ **Nom**: Le `full_name` du client
- ✅ **Avatar**: La photo de profil du client (`avatar_url`)
- ❌ Si `avatar_url` est vide: Affiche l'initiale du nom

Dans la salle de chat (`/chat/:id`):
- ✅ **Header**: Même affichage (nom du client + photo)

## 🔍 Scénarios de Test

### Scénario 1: Vendeur avec Boutique Complète
```
Données:
- role: 'seller'
- full_name: 'Jean Dupont'
- store_name: 'Divine Mode Brazza'
- avatar_url: 'https://cloudinary.com/logo.jpg'

Résultat attendu (vu par le client):
- Nom affiché: "Divine Mode Brazza"
- Avatar: Image du logo
```

### Scénario 2: Vendeur sans Nom de Boutique
```
Données:
- role: 'seller'
- full_name: 'Marie Martin'
- store_name: null
- avatar_url: 'https://cloudinary.com/photo.jpg'

Résultat attendu (vu par le client):
- Nom affiché: "Marie Martin"
- Avatar: Image de profil
```

### Scénario 3: Client Standard
```
Données:
- role: 'buyer'
- full_name: 'IGNOUMBA'
- avatar_url: 'https://cloudinary.com/client.jpg'

Résultat attendu (vu par le vendeur):
- Nom affiché: "IGNOUMBA"
- Avatar: Photo de profil
```

### Scénario 4: Profil sans Avatar
```
Données:
- avatar_url: null

Résultat attendu:
- Avatar: Cercle avec l'initiale du nom (ex: "D" pour Divine Mode)
- Couleur: Violet (var(--primary))
```

## 🐛 Dépannage

### Problème: Le nom de la boutique ne s'affiche pas

**Vérifications:**

1. **Le vendeur a-t-il rempli `store_name`?**
   ```sql
   SELECT id, full_name, store_name FROM profiles WHERE role = 'seller';
   ```

2. **La requête récupère-t-elle les bonnes colonnes?**
   - Ouvrez la console du navigateur (F12)
   - Allez dans l'onglet Network
   - Filtrez par "conversations"
   - Vérifiez que la réponse contient `store_name`

3. **Videz le cache du navigateur**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

### Problème: L'avatar ne s'affiche pas

**Vérifications:**

1. **L'URL de l'avatar est-elle valide?**
   ```sql
   SELECT id, full_name, avatar_url FROM profiles WHERE avatar_url IS NOT NULL;
   ```

2. **Problème CORS?**
   - Vérifiez la console pour les erreurs CORS
   - Assurez-vous que Cloudinary autorise votre domaine

3. **Fallback fonctionne?**
   - Vous devriez voir l'initiale du nom si pas d'avatar
   - Vérifiez qu'il n'y a pas d'erreur JavaScript

## 📊 Console de Débogage

Les logs suivants sont affichés dans la console:

```javascript
// Dans MessagesList.tsx
console.log('🔍 [ACHETEUR] Conversations reçues:', data);
console.log('💬 Rendu conversation:', { isBuyer, displayName, avatarUrl });

// Dans chatService.ts
// Pas de logs spécifiques, mais vous pouvez en ajouter si nécessaire
```

Pour activer plus de logs, ouvrez la console (F12) et vérifiez les messages préfixés par 🔍 ou 💬.

## ✨ Fonctionnalités Bonus

Une fois les profils correctement affichés, vous pouvez:

1. **Inviter les vendeurs à compléter leur boutique**
   - Page: `/seller/edit-store`
   - Champs à remplir: Nom de boutique, Logo, Bannière

2. **Encourager les clients à ajouter une photo de profil**
   - Page: `/profile/settings`
   - Upload d'avatar

## 🎯 Résultat Final Attendu

Après avoir testé et rempli les profils, votre chat devrait ressembler à ceci:

```
┌─────────────────────────────────────┐
│ Messages 💬                         │
├─────────────────────────────────────┤
│  [🏪]  Divine Mode Brazza      2j   │
│        Esculape trousse de...       │
│        c'est bon pour moi           │
├─────────────────────────────────────┤
│  [👤]  IGNOUMBA                3j   │
│        Esculape trousse de...       │
│        📷 Photo                     │
└─────────────────────────────────────┘
```

Où:
- 🏪 = Logo de la boutique (image ronde)
- 👤 = Photo du client (image ronde)
- Le nom affiché est soit le `store_name` soit le `full_name` selon le rôle

## 🚀 Prochaines Étapes

Si tout fonctionne correctement:

1. ✅ Testez avec plusieurs conversations
2. ✅ Vérifiez sur mobile (responsive)
3. ✅ Testez avec des avatars manquants
4. ✅ Testez avec des noms de boutiques longs

Si vous trouvez des bugs, vérifiez:
- La console JavaScript (F12)
- Les Network requests (onglet Network)
- Les données dans Supabase
