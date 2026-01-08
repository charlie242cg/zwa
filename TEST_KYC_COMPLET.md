# ✅ TEST SYSTÈME KYC COMPLET - VENDEUR → ADMIN

**Date:** 05/01/2026
**Status:** Prêt à tester de bout en bout

---

## 🎯 CE QUI A ÉTÉ IMPLÉMENTÉ

### ✅ Côté Vendeur
- Badge vérifié automatique (trigger SQL)
- Card KYC dans le dashboard
- Modal de soumission avec upload de 2 photos
- États visuels: pending, rejected, approved
- Re-soumission si rejeté

### ✅ Côté Admin
- Nouvel onglet "Demandes KYC" dans Modération
- Filtres: Tous / En attente / Approuvés / Rejetés
- Affichage des documents avec lightbox
- Boutons Approuver / Rejeter
- Notes admin

---

## 📋 MIGRATIONS SQL À EXÉCUTER

### 1. Table kyc_requests (déjà fait ✅)
```sql
-- Déjà exécuté
```

### 2. Bucket Storage documents

**Dans Supabase → Storage**, exécutez :

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
```

Ou créez manuellement dans l'interface :
- Nom: `documents`
- Public: ✅ Coché

---

## 🧪 SCÉNARIO DE TEST COMPLET

### 🔹 PARTIE 1: VENDEUR SOUMET UNE DEMANDE

#### Étape 1: Créer un compte vendeur

1. **Déconnectez-vous** de l'admin
2. **Créez un nouveau compte** ou connectez-vous comme vendeur
3. **Complétez votre profil:**
   - Nom de boutique: "Test Boutique"
   - Téléphone: "+243 81 234 5678"
   - Photo de profil: (n'importe quelle image)

#### Étape 2: Vérifier le badge automatique

1. **Allez dans Dashboard Vendeur**
2. **Vérifiez** la card "Vérification"
3. **Vous devriez voir:**
   ```
   ┌─────────────────────────────────────┐
   │ 📄 Vérification     [Vérifié ✓]    │
   │                                     │
   │ Pour retirer vos gains, vous devez │
   │ vérifier votre identité.            │
   │                                     │
   │ [📄 Demander vérification KYC]     │
   └─────────────────────────────────────┘
   ```

#### Étape 3: Soumettre la demande KYC

1. **Cliquez "📄 Demander vérification KYC"**
2. **Le modal s'ouvre**
3. **Remplissez:**
   - Photo carte d'identité: (n'importe quelle image)
   - Selfie avec pièce: (n'importe quelle image)
   - WhatsApp: "+243 81 999 8888"
   - Notes: "Ceci est un test KYC"
4. **Cliquez "✅ Soumettre ma demande"**
5. **Alert:** "✅ Demande KYC soumise avec succès !"

#### Étape 4: Vérifier l'état "pending"

1. **La card affiche maintenant:**
   ```
   ┌─────────────────────────────────────┐
   │ 📄 Vérification     [Vérifié ✓]    │
   │                                     │
   │ ⏳ Votre demande KYC est en cours   │
   │    de validation...                 │
   │                                     │
   │ Vous recevrez une notification une  │
   │ fois validée.                       │
   └─────────────────────────────────────┘
   ```

---

### 🔹 PARTIE 2: ADMIN EXAMINE LA DEMANDE

#### Étape 5: Se connecter comme admin

1. **Déconnectez-vous** du compte vendeur
2. **Connectez-vous** avec un compte admin
3. **Allez dans Admin Dashboard → Modération**

#### Étape 6: Voir la demande KYC

1. **Cliquez sur l'onglet "Demandes KYC"**
2. **Vous devriez voir la card:**
   ```
   ┌──────────────────────────────────────────────────┐
   │ Test Boutique                    ⏳ En attente   │
   │ +243 81 234 5678 • WhatsApp: +243 81 999 8888   │
   │                                                  │
   │ [IMAGE: Carte d'identité]  [IMAGE: Selfie]      │
   │                                                  │
   │ Notes vendeur: Ceci est un test KYC              │
   │                                                  │
   │           [❌ Rejeter]  [✅ Approuver KYC]       │
   │                                                  │
   │ Soumis le 5 janvier 2026 à 14:23                 │
   └──────────────────────────────────────────────────┘
   ```

#### Étape 7: Examiner les documents

1. **Cliquez sur l'image "Carte d'identité"**
2. **Lightbox s'ouvre en plein écran**
3. **Examinez le document**
4. **Cliquez à l'extérieur pour fermer**
5. **Répétez pour le selfie**

---

### 🔹 PARTIE 3: ADMIN APPROUVE LE KYC

#### Étape 8: Approuver la demande

1. **Cliquez "✅ Approuver KYC"**
2. **Popup demande:** "Notes de validation (optionnel):"
3. **Tapez:** "KYC validé après vérification des documents"
4. **Cliquez OK**
5. **Alert:** "✅ KYC approuvé ! Le vendeur peut maintenant retirer ses fonds."

#### Étape 9: Vérifier le changement d'état

1. **Cliquez sur le filtre "Approuvés"**
2. **La demande apparaît avec badge vert:**
   ```
   ┌──────────────────────────────────────────────────┐
   │ Test Boutique                    ✅ Approuvé     │
   │ +243 81 234 5678 • WhatsApp: +243 81 999 8888   │
   │                                                  │
   │ [IMAGE: Carte d'identité]  [IMAGE: Selfie]      │
   │                                                  │
   │ Notes vendeur: Ceci est un test KYC              │
   │ Notes admin: KYC validé après vérification...    │
   │                                                  │
   │ Soumis le 5 janvier 2026 à 14:23                 │
   └──────────────────────────────────────────────────┘
   ```

---

### 🔹 PARTIE 4: VENDEUR VOIT L'APPROBATION

#### Étape 10: Retour côté vendeur

1. **Déconnectez-vous de l'admin**
2. **Reconnectez-vous comme vendeur**
3. **Allez dans Dashboard Vendeur**

#### Étape 11: Vérifier l'état KYC approuvé

**La card affiche:**
```
┌─────────────────────────────────────┐
│ 📄 Vérification  [Vérifié ✓][KYC OK]│
│                                     │
│ ✅ KYC vérifié - Vous pouvez retirer│
│    vos fonds                        │
└─────────────────────────────────────┘
```

#### Étape 12: Vérifier dans l'onglet Modération (Admin)

1. **Retournez à l'admin**
2. **Modération → Vendeurs**
3. **Trouvez "Test Boutique"**
4. **Vous devriez voir les DEUX badges:**
   - [🛡️ Vérifié] (vert) - avec icône Shield remplie
   - [📄 KYC OK] (doré) - avec icône FileCheck remplie

---

## 🧪 TEST SCÉNARIO 2: REJET DE DEMANDE

### Étape 13: Créer une deuxième demande

1. **Connectez-vous avec un autre compte vendeur**
2. **Soumettez une demande KYC**

### Étape 14: Rejeter la demande (Admin)

1. **Admin Dashboard → Modération → Demandes KYC**
2. **Cliquez "❌ Rejeter"**
3. **Popup:** "Raison du rejet (sera envoyée au vendeur):"
4. **Tapez:** "Photo de la carte d'identité floue, veuillez re-soumettre une photo claire"
5. **Cliquez OK**
6. **Alert:** "❌ Demande KYC rejetée. Le vendeur sera notifié."

### Étape 15: Vendeur voit le rejet

1. **Reconnectez-vous comme vendeur**
2. **Dashboard Vendeur**
3. **La card affiche:**
   ```
   ┌─────────────────────────────────────┐
   │ 📄 Vérification     [Vérifié ✓]    │
   │                                     │
   │ ❌ Demande rejetée: Photo de la     │
   │    carte d'identité floue, veuillez │
   │    re-soumettre une photo claire    │
   │                                     │
   │ [🔄 Re-soumettre]                   │
   └─────────────────────────────────────┘
   ```

### Étape 16: Re-soumettre

1. **Cliquez "🔄 Re-soumettre"**
2. **Le modal s'ouvre avec les anciennes valeurs**
3. **Changez la photo de la carte**
4. **Soumettez à nouveau**
5. **Statut redevient "pending"**

---

## ✅ POINTS DE VÉRIFICATION

### Base de données:

**Table `kyc_requests`:**
```sql
SELECT
    kr.id,
    p.store_name,
    kr.status,
    kr.whatsapp_number,
    kr.notes,
    kr.admin_notes,
    kr.created_at
FROM kyc_requests kr
JOIN profiles p ON p.id = kr.seller_id
ORDER BY kr.created_at DESC;
```

**Table `profiles` (vérifier kyc_verified):**
```sql
SELECT
    id,
    store_name,
    is_verified_seller,
    kyc_verified
FROM profiles
WHERE role = 'seller';
```

### Storage:

**Supabase → Storage → documents → kyc/**

Vous devriez voir:
```
kyc/
  ├── {seller_id}_id_card_{timestamp}.jpg
  ├── {seller_id}_selfie_{timestamp}.jpg
  ├── {seller_id}_id_card_{timestamp2}.jpg  (re-soumission)
  └── {seller_id}_selfie_{timestamp2}.jpg  (re-soumission)
```

---

## 🎨 ÉTATS COMPLETS - RÉCAPITULATIF

### Côté Vendeur

| État | Badge Vérifié | KYC | Bouton | Peut retirer |
|------|---------------|-----|--------|--------------|
| Profil incomplet | ❌ | ❌ | Aucun | ❌ |
| Profil complet | ✅ | ❌ | Demander KYC | ❌ |
| KYC pending | ✅ | ⏳ | Aucun (attente) | ❌ |
| KYC rejected | ✅ | ❌ | Re-soumettre | ❌ |
| KYC approved | ✅ | ✅ | Aucun | ✅ |

### Côté Admin

| Filtre | Affichage |
|--------|-----------|
| Tous | Toutes les demandes |
| En attente | Demandes pending (boutons Approuver/Rejeter) |
| Approuvés | Demandes approved (lecture seule) |
| Rejetés | Demandes rejected (lecture seule) |

---

## 🐛 PROBLÈMES POSSIBLES

### 1. "Cannot upload file" ou "Policy violation"

**Solution:** Exécutez le script `create_storage_buckets.sql` complet:

```sql
-- Dans Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Puis vérifiez les policies Storage
```

### 2. Badge vérifié ne s'affiche pas automatiquement

**Solution:** Vérifiez que le trigger est installé:

```sql
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trigger_auto_verify_seller_badge';
```

Si absent, exécutez à nouveau le script `create_kyc_requests_table.sql`.

### 3. Lightbox ne s'ouvre pas

**Solution:** Vérifiez la console navigateur (F12) pour erreurs.

### 4. "Aucune demande KYC"

**Solution:**
- Vérifiez que vous êtes connecté comme admin
- Vérifiez dans Supabase que la demande existe dans `kyc_requests`
- Vérifiez les RLS policies

---

## 📊 INTÉGRATION AVEC RETRAITS

### Comment ça marche ensemble:

1. **Vendeur fait une vente** → Gains ajoutés au solde
2. **Vendeur demande un retrait**
3. **Admin voit la demande** dans "Retraits d'argent"
4. **Admin vérifie:**
   - ✅ KYC du vendeur est validé ?
   - ✅ Solde suffisant ?
5. **Admin approuve** → Argent envoyé via Mobile Money

### Code de vérification (déjà dans WithdrawalTab):

```typescript
const handleApproveWithdrawal = async (withdrawalId, sellerId) => {
    // Vérifier KYC
    const { data: seller } = await supabase
        .from('profiles')
        .select('kyc_verified')
        .eq('id', sellerId)
        .single();

    if (!seller.kyc_verified) {
        alert('❌ Ce vendeur n\'a pas de KYC validé. Impossible d\'approuver le retrait.');
        return;
    }

    // Continuer avec l'approbation...
};
```

---

## ✅ CHECKLIST FINALE

### Avant le test:
- [ ] Migration `create_kyc_requests_table.sql` exécutée
- [ ] Migration `create_storage_buckets.sql` exécutée (ou bucket créé manuellement)
- [ ] Trigger `trigger_auto_verify_seller_badge` installé
- [ ] Bucket `documents` existe et est public

### Pendant le test:
- [ ] Badge vérifié apparaît quand profil complet
- [ ] Modal KYC s'ouvre correctement
- [ ] Upload de fichiers fonctionne
- [ ] Demande soumise avec succès
- [ ] Admin voit la demande dans "Demandes KYC"
- [ ] Lightbox fonctionne pour voir les images
- [ ] Approbation met à jour `kyc_verified` dans profiles
- [ ] Vendeur voit le badge [KYC OK]
- [ ] Rejet permet la re-soumission
- [ ] Filtres fonctionnent (Tous / Pending / Approved / Rejected)

---

## 🚀 PROCHAINES ÉTAPES (OPTIONNEL)

### Améliorations possibles:

1. **Notifications:**
   - Email au vendeur quand KYC approuvé/rejeté
   - SMS via Twilio

2. **Historique:**
   - Voir toutes les soumissions d'un vendeur
   - Tracer qui a approuvé/rejeté

3. **Documents multiples:**
   - Permettre recto ET verso de la carte
   - Documents supplémentaires (justificatif domicile)

4. **Expiration KYC:**
   - KYC valide 1 an
   - Demander re-vérification après expiration

5. **Dashboard analytics:**
   - Nombre de demandes en attente
   - Taux d'approbation
   - Temps moyen de validation

---

**Document créé le:** 05/01/2026
**Système KYC complet:** ✅ Prêt pour test
**Test de bout en bout:** ✅ Prêt
