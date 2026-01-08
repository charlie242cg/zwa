# 🔍 Guide de Débogage - Historique des Transactions

## Problème
L'onglet "Historique des Transactions" dans le profil ne fonctionne pas correctement.

## ✅ Modifications Effectuées

### 1. Amélioration des Logs de Débogage
Le fichier [TransactionHistory.tsx](src/pages/profile/TransactionHistory.tsx) a été amélioré avec :
- Logs détaillés au chargement des transactions
- Affichage des détails d'erreur (message, code, hints)
- Logs de l'ID utilisateur et du filtre appliqué

### 2. Interface Utilisateur d'Erreur
Ajout d'un écran d'erreur convivial avec :
- Message d'erreur clair
- Bouton "Réessayer" pour recharger
- Informations de débogage (ID utilisateur, filtre)

### 3. Gestion d'État
Ajout d'un état `error` pour capturer et afficher les erreurs de chargement.

## 🧪 Comment Tester

### Étape 1 : Vérifier la Console du Navigateur
1. Ouvrez votre application dans le navigateur
2. Ouvrez les DevTools (F12 ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet "Console"
4. Naviguez vers `/profile/transactions`

**Vous devriez voir ces logs :**
```
[TransactionHistory] 🔄 Loading transactions for user: <user-id> with filter: all
[TransactionService] 📊 Fetching transactions for user: <user-id> Filter: all
```

### Étape 2 : Analyser les Erreurs Potentielles

#### Erreur A : "relation 'transactions' does not exist"
**Cause :** La migration n'a pas été appliquée en base de données

**Solution :**
```bash
# Vérifier l'état des migrations
supabase migration list

# Appliquer les migrations manquantes
supabase db push
```

#### Erreur B : "permission denied" ou "RLS policy"
**Cause :** Les politiques RLS (Row Level Security) bloquent l'accès

**Solution :**
1. Vérifiez que vous êtes bien connecté (vérifiez `user.id` dans la console)
2. Vérifiez la migration [20251231_create_transactions.sql](supabase/migrations/20251231_create_transactions.sql)
3. La politique RLS autorise les utilisateurs à voir leurs propres transactions :
   ```sql
   CREATE POLICY "Users can view own transactions"
   ON public.transactions
   FOR SELECT
   USING (auth.uid() = user_id);
   ```

#### Erreur C : Tableau vide mais pas d'erreur
**Cause :** Il n'y a simplement aucune transaction pour cet utilisateur

**Ceci est NORMAL si :**
- L'utilisateur n'a jamais effectué d'achat
- L'utilisateur n'a jamais reçu de commission
- Aucune vente n'a été enregistrée pour ce vendeur

### Étape 3 : Créer des Données de Test (Optionnel)

Si vous voulez tester avec des données, vous pouvez insérer manuellement une transaction :

```sql
-- Dans Supabase SQL Editor
INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    product_name,
    quantity,
    unit_price
) VALUES (
    '<YOUR_USER_ID>',  -- Remplacez par votre ID utilisateur
    'purchase',
    -5000,
    45000,
    'Test - Achat de test',
    'Produit Test',
    1,
    5000
);
```

## 📊 Vérification en Base de Données

### 1. Vérifier que la table existe
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'transactions';
```

### 2. Compter les transactions par utilisateur
```sql
SELECT user_id, COUNT(*) as total_transactions
FROM transactions
GROUP BY user_id;
```

### 3. Voir toutes les transactions d'un utilisateur
```sql
SELECT *
FROM transactions
WHERE user_id = '<YOUR_USER_ID>'
ORDER BY created_at DESC;
```

## 🎯 Prochaines Étapes

1. **Testez l'application** et vérifiez la console pour les logs
2. **Partagez les messages d'erreur** si vous en voyez
3. **Vérifiez la base de données** pour confirmer que la table existe
4. **Créez des transactions de test** si nécessaire

## 📝 Logs à Surveiller

Voici ce que vous devriez voir dans la console :

### ✅ Cas de Succès
```
[TransactionHistory] 🔄 Loading transactions for user: abc123... with filter: all
[TransactionService] 📊 Fetching transactions for user: abc123... Filter: all
[TransactionService] 📊 Transactions fetched: { count: 3, error: null }
[TransactionHistory] ✅ Loaded transactions: 3
[TransactionHistory] 📊 Transaction data: [...]
```

### ❌ Cas d'Erreur
```
[TransactionHistory] 🔄 Loading transactions for user: abc123... with filter: all
[TransactionService] 📊 Fetching transactions for user: abc123... Filter: all
[TransactionHistory] ❌ Error loading transactions: {...}
[TransactionHistory] ❌ Error details: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

---

**Fichiers Modifiés :**
- ✅ [src/pages/profile/TransactionHistory.tsx](src/pages/profile/TransactionHistory.tsx)
- 📄 Fichier de test créé : [test-transactions.js](test-transactions.js)

**Migrations Concernées :**
- [supabase/migrations/20251231_create_transactions.sql](supabase/migrations/20251231_create_transactions.sql)
