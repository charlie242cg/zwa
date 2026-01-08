# 🔐 SYSTÈME KYC SIMPLE - ZWA MARKETPLACE

**Date:** 05 Janvier 2026
**Objectif:** Système de vérification KYC simple et automatisé

---

## 🎯 DEUX NIVEAUX DE VÉRIFICATION

### ✅ Niveau 1 : Badge Vérifié (AUTOMATIQUE)
**Icône:** Shield vert 🛡️
**Visibilité:** PUBLIC - Visible par tous les acheteurs
**Objectif:** Rassurer les clients

#### Critères (tous requis) :
- ✅ Nom de boutique renseigné (`store_name`)
- ✅ Numéro de téléphone renseigné (`phone_number`)
- ✅ Photo de profil ajoutée (`avatar_url`)

#### Comment ça marche ?
**AUTOMATIQUE** - Dès que le vendeur complète son profil, il obtient le badge.

```sql
-- Trigger automatique déjà créé dans la migration
-- Si profil complet → is_verified_seller = true
```

**Avantage :**
- 🚀 Aucune action admin requise
- 🚀 Encourage les vendeurs à compléter leur profil
- 🚀 Les acheteurs voient un badge de confiance

---

### 🔒 Niveau 2 : KYC Vérifié (MANUEL PAR ADMIN)
**Icône:** FileCheck doré 📄
**Visibilité:** INTERNE - Pas visible publiquement
**Objectif:** Sécurité financière

#### Critères (tous requis) :
- 📄 Photo de la carte d'identité / Passeport
- 📄 Selfie du vendeur tenant sa pièce d'identité
- 📄 Numéro WhatsApp vérifié
- ✅ Validation manuelle par un admin

#### Comment ça marche ?
**MANUEL** - Le vendeur soumet une demande, l'admin examine et valide.

**Conséquence :**
- ❌ Sans KYC → **Pas de retrait d'argent possible**
- ✅ Avec KYC → **Peut retirer ses gains**

---

## 📊 WORKFLOW COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: INSCRIPTION VENDEUR                                │
└─────────────────────────────────────────────────────────────┘
Vendeur crée son compte
   ↓
Badge: AUCUN
KYC: ❌


┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: PROFIL COMPLET (automatique)                       │
└─────────────────────────────────────────────────────────────┘
Vendeur remplit:
✅ Nom boutique: "Joe Boutique"
✅ Téléphone: "06 981 12 33"
✅ Photo de profil
   ↓
Badge: ✅ Vérifié (automatique via trigger SQL)
KYC: ❌
État: Peut vendre MAIS ne peut PAS retirer


┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: DEMANDE KYC                                         │
└─────────────────────────────────────────────────────────────┘
Vendeur clique "Demander vérification KYC"
   ↓
Interface de soumission:
📤 Upload photo carte d'identité
📤 Upload selfie avec pièce
📝 Numéro WhatsApp
📝 Notes (optionnel)
   ↓
Soumission → Statut: "pending"


┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4: VALIDATION ADMIN                                    │
└─────────────────────────────────────────────────────────────┘
Admin voit la demande dans "Modération"
   ↓
Examine:
- Photo pièce identité claire ?
- Selfie correspond ?
- WhatsApp valide ?
   ↓
[Option A] APPROUVER
   └→ kyc_verified = true
   └→ Vendeur peut maintenant retirer

[Option B] REJETER
   └→ kyc_verified = false
   └→ Message de rejet avec raison
   └→ Vendeur peut re-soumettre après correction


┌─────────────────────────────────────────────────────────────┐
│ RÉSULTAT FINAL                                               │
└─────────────────────────────────────────────────────────────┘
Badge: ✅ Vérifié (public)
KYC: ✅ OK (interne)
État: Peut vendre ET retirer de l'argent 💰
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Table `kyc_requests`

```sql
CREATE TABLE public.kyc_requests (
    id UUID PRIMARY KEY,
    seller_id UUID → profiles(id),
    status TEXT ('pending', 'approved', 'rejected'),

    -- Documents soumis
    id_card_url TEXT,           -- Photo carte identité
    selfie_with_id_url TEXT,    -- Selfie avec pièce
    whatsapp_number TEXT,
    notes TEXT,                 -- Notes du vendeur

    -- Admin review
    admin_notes TEXT,           -- Raison rejet, etc.
    reviewed_by UUID,           -- Quel admin a validé
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
);
```

**Statuts possibles:**
- `pending` - En attente de review admin
- `approved` - Approuvé (→ `kyc_verified = true`)
- `rejected` - Rejeté (vendeur peut re-soumettre)

---

## 🎨 INTERFACE VENDEUR

### Bouton dans SellerDashboard

```tsx
// Si PAS de KYC et PAS de demande en cours
<button onClick={openKYCModal}>
  📄 Demander vérification KYC
</button>

// Si demande en cours (pending)
<div style={styles.pendingBadge}>
  ⏳ Demande KYC en cours de validation...
</div>

// Si KYC approuvé
<div style={styles.kycOkBadge}>
  ✅ KYC Vérifié - Vous pouvez retirer vos fonds
</div>

// Si demande rejetée
<div style={styles.rejectedBadge}>
  ❌ KYC rejeté: {raison}
  <button onClick={openKYCModal}>Re-soumettre</button>
</div>
```

### Modal de soumission KYC

```tsx
<Modal title="Demande de vérification KYC">
  <p>Pour pouvoir retirer vos gains, nous devons vérifier votre identité.</p>

  <FileUpload
    label="Photo de votre carte d'identité (recto/verso)"
    accept="image/*"
    onChange={handleIDUpload}
  />

  <FileUpload
    label="Selfie de vous tenant votre pièce d'identité"
    accept="image/*"
    onChange={handleSelfieUpload}
  />

  <Input
    label="Numéro WhatsApp"
    placeholder="+243 81..."
    value={whatsapp}
  />

  <TextArea
    label="Notes (optionnel)"
    placeholder="Informations complémentaires..."
  />

  <Button onClick={submitKYC}>
    Soumettre ma demande
  </Button>
</Modal>
```

---

## 🛡️ INTERFACE ADMIN (Modération Tab)

### Nouvel onglet: "Demandes KYC"

```tsx
<Tabs>
  <Tab>Vendeurs</Tab>
  <Tab>Produits</Tab>
  <Tab>Demandes KYC</Tab>  ← NOUVEAU
</Tabs>
```

### Affichage des demandes

```tsx
{kycRequests.map(request => (
  <Card>
    <Header>
      <Avatar src={request.seller.avatar_url} />
      <div>
        <Name>{request.seller.store_name}</Name>
        <Phone>{request.seller.phone_number}</Phone>
        <WhatsApp>WhatsApp: {request.whatsapp_number}</WhatsApp>
      </div>
      <StatusBadge status={request.status} />
    </Header>

    <Documents>
      <ImagePreview
        label="Carte d'identité"
        src={request.id_card_url}
        onClick={() => openLightbox(request.id_card_url)}
      />
      <ImagePreview
        label="Selfie avec pièce"
        src={request.selfie_with_id_url}
        onClick={() => openLightbox(request.selfie_with_id_url)}
      />
    </Documents>

    {request.notes && (
      <Notes>Notes vendeur: {request.notes}</Notes>
    )}

    <Actions>
      <Button
        variant="danger"
        onClick={() => rejectKYC(request.id)}
      >
        ❌ Rejeter
      </Button>
      <Button
        variant="success"
        onClick={() => approveKYC(request.id)}
      >
        ✅ Approuver KYC
      </Button>
    </Actions>
  </Card>
))}
```

### Actions admin

```typescript
const approveKYC = async (requestId: string) => {
  const notes = window.prompt('Notes de validation (optionnel):');

  // 1. Mettre à jour la demande
  await supabase
    .from('kyc_requests')
    .update({
      status: 'approved',
      admin_notes: notes,
      reviewed_by: adminId,
      reviewed_at: new Date()
    })
    .eq('id', requestId);

  // 2. Activer KYC sur le profil vendeur
  await supabase
    .from('profiles')
    .update({ kyc_verified: true })
    .eq('id', sellerId);

  alert('✅ KYC approuvé ! Le vendeur peut maintenant retirer ses fonds.');
};

const rejectKYC = async (requestId: string) => {
  const reason = window.prompt('Raison du rejet (sera envoyée au vendeur):');
  if (!reason) return;

  await supabase
    .from('kyc_requests')
    .update({
      status: 'rejected',
      admin_notes: reason,
      reviewed_by: adminId,
      reviewed_at: new Date()
    })
    .eq('id', requestId);

  alert('❌ Demande KYC rejetée.');
};
```

---

## 🔄 INTÉGRATION AVEC SYSTÈME EXISTANT

### 1. WithdrawalTab (Retraits)

**Vérification avant retrait :**
```typescript
const handleApproveWithdrawal = async (withdrawalId: string) => {
  // Vérifier que le vendeur a KYC
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

### 2. SellerDashboard

**Afficher statut KYC :**
```tsx
<StatsCard>
  <Icon><FileCheck /></Icon>
  <Title>Statut KYC</Title>
  {kycVerified ? (
    <Badge variant="success">✅ Vérifié</Badge>
  ) : kycPending ? (
    <Badge variant="warning">⏳ En cours...</Badge>
  ) : (
    <Button onClick={openKYCModal}>
      Demander KYC
    </Button>
  )}
</StatsCard>
```

### 3. ProfileSettings

**Section KYC :**
```tsx
<Section title="Vérification KYC">
  <Info>
    La vérification KYC est requise pour retirer vos gains.
  </Info>

  {!kycVerified && !hasPendingRequest && (
    <Button onClick={submitKYCRequest}>
      📄 Soumettre demande KYC
    </Button>
  )}

  {hasPendingRequest && (
    <Alert variant="info">
      ⏳ Votre demande est en cours de validation
    </Alert>
  )}

  {kycRejected && (
    <Alert variant="danger">
      ❌ Demande rejetée: {rejectionReason}
      <Button onClick={submitKYCRequest}>
        Re-soumettre
      </Button>
    </Alert>
  )}
</Section>
```

---

## 📝 CHECKLIST D'IMPLÉMENTATION

### Phase 1: Base de données ✅
- [x] Créer table `kyc_requests`
- [x] Créer trigger auto-vérification badge
- [x] Configurer RLS policies
- [ ] Exécuter migration dans Supabase

### Phase 2: Interface Vendeur
- [ ] Ajouter bouton "Demander KYC" dans SellerDashboard
- [ ] Créer modal de soumission KYC
- [ ] Intégrer upload de fichiers (Supabase Storage)
- [ ] Afficher statut demande (pending/approved/rejected)

### Phase 3: Interface Admin
- [ ] Ajouter onglet "Demandes KYC" dans ModerationTab
- [ ] Afficher liste des demandes
- [ ] Lightbox pour voir les photos en grand
- [ ] Boutons Approuver/Rejeter
- [ ] Champ notes admin

### Phase 4: Intégration
- [ ] Vérifier KYC avant approuver retrait (WithdrawalTab)
- [ ] Afficher statut KYC dans profil vendeur
- [ ] Notifications (optionnel)

---

## 🎯 AVANTAGES DE CE SYSTÈME

### ✅ Simple pour le vendeur
1. Remplit son profil → Badge vérifié automatique
2. Soumet 2 photos + WhatsApp → Demande KYC
3. Attend validation (1-24h)
4. Peut retirer ses fonds

### ✅ Simple pour l'admin
1. Voit les demandes dans un onglet dédié
2. Examine les photos
3. Clic "Approuver" ou "Rejeter"
4. Fini !

### ✅ Sécurisé
- 🔒 Audit trail complet (qui a validé, quand)
- 🔒 Photos stockées de manière permanente
- 🔒 Impossible de retirer sans KYC
- 🔒 Conformité anti-blanchiment

### ✅ Flexible
- Le vendeur peut re-soumettre si rejeté
- L'admin peut révoquer un KYC (toggle dans ModerationTab)
- Notes admin pour historique

---

## 🚀 PROCHAINES ÉTAPES

1. **Exécuter la migration SQL** dans Supabase
2. **Créer le service KYC** (`kycService.ts`)
3. **Créer le composant modal** (`KYCRequestModal.tsx`)
4. **Ajouter l'onglet dans ModerationTab**
5. **Tester le workflow complet**

---

**Document créé le:** 05/01/2026
**Système prêt à implémenter** ✅
