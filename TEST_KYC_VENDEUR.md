# ✅ TEST SYSTÈME KYC - CÔTÉ VENDEUR

**Date:** 05/01/2026
**Status:** Prêt à tester

---

## 🎯 CE QUI A ÉTÉ IMPLÉMENTÉ

### ✅ Base de données
- Table `kyc_requests` créée
- Trigger auto-vérification badge installé
- Storage bucket `documents` créé
- RLS policies configurées

### ✅ Code vendeur
- Service `kycService.ts` ✅
- Composant `KYCRequestModal.tsx` ✅
- Intégration dans `SellerDashboard.tsx` ✅

---

## 📋 MIGRATIONS À EXÉCUTER

### 1. Créer le bucket Storage (si pas encore fait)

Allez dans **Supabase → Storage** et exécutez:

```sql
-- migrations/create_storage_buckets.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
```

Ou créez manuellement:
- Nom: `documents`
- Public: ✅ Coché

---

## 🧪 COMMENT TESTER

### Étape 1: Badge vérifié automatique

1. **Connectez-vous comme vendeur** (pas admin)
2. **Complétez votre profil:**
   - Allez dans Paramètres/Profil
   - Ajoutez un nom de boutique
   - Ajoutez un numéro de téléphone
   - Uploadez une photo de profil
3. **Rafraîchissez la page**
4. **Vérifiez:** Vous devriez voir le badge "Vérifié ✓" (vert) dans la card KYC

**Résultat attendu:**
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

---

### Étape 2: Soumettre une demande KYC

1. **Cliquez sur "📄 Demander vérification KYC"**
2. **Modal s'ouvre** avec formulaire
3. **Remplissez:**
   - Photo carte d'identité (image quelconque pour test)
   - Selfie avec pièce (image quelconque pour test)
   - Numéro WhatsApp: +243 81 234 5678
   - Notes (optionnel): "Test KYC"
4. **Cliquez "✅ Soumettre ma demande"**

**Résultat attendu:**
- Alert: "✅ Demande KYC soumise avec succès !"
- Modal se ferme
- Card KYC affiche maintenant:

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

### Étape 3: Vérifier dans la base de données

Allez dans **Supabase → Table Editor → kyc_requests**

**Vous devriez voir:**
```
| id  | seller_id | status  | whatsapp_number  | id_card_url | selfie_url | created_at |
|-----|-----------|---------|------------------|-------------|------------|------------|
| ... | your-id   | pending | +243 81 234 5678 | https://... | https://...|  now       |
```

---

### Étape 4: Vérifier les fichiers uploadés

Allez dans **Supabase → Storage → documents → kyc**

**Vous devriez voir:**
```
kyc/
  ├── {your-id}_id_card_{timestamp}.jpg
  └── {your-id}_selfie_{timestamp}.jpg
```

---

## 🎨 ÉTATS POSSIBLES DE LA CARD KYC

### 1️⃣ Profil incomplet (pas de badge)
```
┌─────────────────────────────────────┐
│ 📄 Vérification                     │
│                                     │
│ Complétez votre profil pour obtenir│
│ le badge vérifié.                   │
└─────────────────────────────────────┘
```

### 2️⃣ Badge vérifié, pas de KYC
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

### 3️⃣ Demande KYC en attente
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

### 4️⃣ Demande KYC rejetée
```
┌─────────────────────────────────────┐
│ 📄 Vérification     [Vérifié ✓]    │
│                                     │
│ ❌ Demande rejetée: Photo floue,    │
│    veuillez re-soumettre une photo  │
│    claire de votre pièce d'identité │
│                                     │
│ [🔄 Re-soumettre]                   │
└─────────────────────────────────────┘
```

### 5️⃣ KYC approuvé ✅
```
┌─────────────────────────────────────┐
│ 📄 Vérification  [Vérifié ✓][KYC OK]│
│                                     │
│ ✅ KYC vérifié - Vous pouvez retirer│
│    vos fonds                        │
└─────────────────────────────────────┘
```

---

## 🐛 PROBLÈMES POSSIBLES

### Erreur: "Error uploading file"
**Solution:** Vérifiez que le bucket `documents` existe dans Storage

### Erreur: "Policy violation"
**Solution:** Exécutez le script `create_storage_buckets.sql` complet

### Badge ne s'affiche pas
**Solution:** Vérifiez que le trigger `trigger_auto_verify_seller_badge` est installé

### Modal ne s'ouvre pas
**Solution:** Vérifiez la console navigateur (F12) pour erreurs

---

## ✅ CHECKLIST AVANT TEST

- [ ] Migration `create_kyc_requests_table.sql` exécutée
- [ ] Migration `create_storage_buckets.sql` exécutée
- [ ] Bucket `documents` existe dans Supabase Storage
- [ ] Connecté comme vendeur (pas admin)
- [ ] Profil complété (nom boutique + téléphone + photo)

---

## 📞 PROCHAINE ÉTAPE

Une fois le côté vendeur testé et fonctionnel, nous allons créer **l'interface admin** pour:
- Voir toutes les demandes KYC
- Examiner les photos uploadées
- Approuver ou rejeter les demandes
- Ajouter des notes admin

**Fichier à créer ensuite:**
- Nouvel onglet dans `ModerationTab.tsx`
- Affichage des demandes avec photos
- Boutons Approuver/Rejeter

---

**Créé le:** 05/01/2026
**Prêt pour test** ✅
