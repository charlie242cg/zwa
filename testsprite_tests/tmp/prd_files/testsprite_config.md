# TestSprite Configuration - Zwa Marketplace MVP

## Configuration Générale

```yaml
project: Zwa Marketplace
environment: Development
base_url: http://localhost:5173
framework: React + Vite
database: Supabase
```

## Scopes de Test

### 1. Buyer Journey (Client/Acheteur)
**Base Path:** `/`

#### Test Suite: T1 - Buyer Core Features

**T1.1 - Navigation et Découverte**
```
GIVEN je suis sur la page d'accueil
WHEN je charge la page
THEN je dois voir la liste des produits disponibles

WHEN je clique sur la barre de recherche
AND je tape "chaussures"
THEN les résultats doivent se filtrer en temps réel

WHEN j'applique un filtre de prix
THEN seuls les produits dans la fourchette doivent s'afficher

WHEN je clique sur un produit
THEN je dois accéder à la page de détails avec images, prix, MOQ et description
```

**T1.2 - Système de Chat et Négociation**
```
GIVEN je suis sur la page détails d'un produit
WHEN je clique sur "Contacter le vendeur"
THEN une fenêtre de chat doit s'ouvrir

WHEN j'envoie un message "Quel est votre meilleur prix pour 50 unités?"
THEN le message doit apparaître dans l'historique du chat
AND une notification doit être envoyée au vendeur

WHEN le vendeur répond avec une offre personnalisée
THEN je dois voir l'offre avec le prix négocié et la quantité
AND un bouton "Accepter l'offre" doit être visible

WHEN je clique sur "Accepter l'offre"
THEN l'offre doit être ajoutée à mon panier avec les paramètres négociés
```

**T1.3 - Processus d'Achat**
```
GIVEN j'ai un produit dans mon panier
WHEN je consulte mon panier
THEN je dois voir le produit, la quantité, le prix unitaire et le total

WHEN la quantité est inférieure au MOQ
THEN un message d'avertissement doit s'afficher
AND le bouton "Commander" doit être désactivé

WHEN j'augmente la quantité au-dessus du MOQ
THEN le bouton "Commander" doit devenir actif

WHEN je clique sur "Commander"
THEN je dois accéder à la page de paiement
AND voir un récapitulatif de ma commande
```

**T1.4 - Suivi de Commande et OTP**
```
GIVEN j'ai passé une commande
WHEN je vais sur "Mes Commandes"
THEN je dois voir la liste de mes commandes avec leurs statuts

WHEN une commande est marquée "Expédié" par le vendeur
THEN je dois recevoir un code OTP à 4 chiffres
AND le statut doit être "En livraison - OTP: XXXX"

WHEN je reçois le produit et donne l'OTP au livreur
AND le vendeur entre le bon code OTP
THEN le statut doit passer à "Livrée"
AND les fonds doivent être libérés au vendeur
```

**T1.5 - Avis et Évaluations**
```
GIVEN ma commande est livrée
WHEN je clique sur "Laisser un avis"
THEN un formulaire d'évaluation doit s'afficher

WHEN je note le produit (1-5 étoiles)
AND j'écris un commentaire
AND je soumets l'avis
THEN l'avis doit apparaître sur la page du produit
AND la note moyenne du produit doit être mise à jour
```

---

### 2. Seller Journey (Vendeur)
**Base Path:** `/seller/dashboard`

#### Test Suite: T2 - Seller Core Features

**T2.1 - Gestion des Produits**
```
GIVEN je suis connecté comme vendeur
WHEN je vais sur "Mes Produits"
THEN je dois voir la liste de mes produits avec stock et statut

WHEN je clique sur "Ajouter un produit"
THEN un formulaire doit s'afficher avec les champs:
  - Nom du produit
  - Description
  - Prix unitaire
  - Stock disponible
  - MOQ (Quantité minimale)
  - Commission affilié par défaut (%)
  - Upload d'images (3 minimum)

WHEN je remplis tous les champs obligatoires
AND j'uploade 3 images
AND je clique sur "Publier"
THEN le produit doit être créé
AND apparaître dans ma liste de produits
AND être visible sur la marketplace

WHEN je clique sur "Modifier" un produit existant
THEN je dois pouvoir éditer tous les champs
AND sauvegarder les changements
```

**T2.2 - Profil et Boutique**
```
GIVEN je suis sur mon dashboard vendeur
WHEN je clique sur "Ma Boutique"
THEN je dois voir ma page boutique publique

WHEN je clique sur "Paramètres de la boutique"
THEN je dois pouvoir modifier:
  - Nom de la boutique
  - Description
  - Logo
  - Bannière
  - Numéro de téléphone
  - Adresse

WHEN je sauvegarde les modifications
THEN ma page boutique doit refléter les changements
```

**T2.3 - Gestion des Commandes**
```
GIVEN j'ai reçu une nouvelle commande
WHEN je vais sur "Commandes"
THEN je dois voir la commande avec statut "Payée - En attente"
AND une notification badge sur l'icône

WHEN je clique sur la commande
THEN je dois voir:
  - Détails du client
  - Produits commandés
  - Montant total
  - Montant ma commission (après déduction affilié si applicable)

WHEN je prépare la commande et clique sur "Marquer comme Expédié"
THEN un code OTP à 4 chiffres doit être généré
AND envoyé au client
AND le statut doit passer à "Expédié"

WHEN le livreur me donne le code OTP du client
AND je l'entre dans le système
AND le code est correct
THEN le statut doit passer à "Livrée"
AND les fonds doivent être débloqués dans mon portefeuille
```

**T2.4 - Chat et Négociation**
```
GIVEN j'ai reçu un message d'un acheteur
WHEN je vais sur "Messages"
THEN je dois voir la liste des conversations avec badge de notification

WHEN j'ouvre une conversation
THEN je dois voir l'historique complet des messages

WHEN l'acheteur demande un prix pour 100 unités
AND je veux créer une offre personnalisée
THEN je clique sur "Créer une offre"
AND j'entre le prix unitaire négocié
AND j'entre la quantité
AND je clique sur "Envoyer l'offre"
THEN l'offre doit apparaître dans le chat côté acheteur
AND l'acheteur doit pouvoir l'accepter en un clic
```

**T2.5 - Tableau de Bord Vendeur**
```
GIVEN je suis sur mon dashboard
WHEN la page charge
THEN je dois voir:
  - Solde portefeuille actuel
  - Ventes du mois en cours
  - Nombre de commandes en attente
  - Graphique des ventes (7 derniers jours)
  - Top 5 produits les plus vendus
  - Total commissions versées aux affiliés

WHEN je clique sur "Demander un retrait"
AND j'entre le montant souhaité
AND je confirme mon numéro Mobile Money
THEN une demande de retrait doit être créée
AND soumise à validation admin
```

---

### 3. Affiliate Journey (Affilié)
**Base Path:** `/affiliate`

#### Test Suite: T3 - Affiliate Core Features

**T3.1 - Génération de Liens**
```
GIVEN je suis connecté comme affilié
WHEN je vais sur "Produits à Promouvoir"
THEN je dois voir tous les produits de la marketplace

WHEN je clique sur "Générer un lien" pour un produit
THEN un lien unique doit être créé avec format:
  https://zwa.com/product/[id]?ref=[mon_affiliate_id]

WHEN je copie le lien
THEN il doit être copié dans mon presse-papier
AND apparaître dans "Mes Liens Actifs"
```

**T3.2 - Tracking et Conversions**
```
GIVEN j'ai partagé mon lien affilié
WHEN quelqu'un clique sur mon lien
THEN mon ID affilié doit être stocké dans sessionStorage

WHEN l'utilisateur navigue sur d'autres pages
THEN mon ID affilié doit persister dans la session

WHEN l'utilisateur négocie un prix avec le vendeur
AND accepte une offre personnalisée
AND finalise l'achat
THEN je dois être crédité de la commission
AND la vente doit apparaître dans mes conversions

WHEN je vais sur "Mes Conversions"
THEN je dois voir:
  - Date de la vente
  - Produit vendu
  - Montant de la commande
  - Ma commission (%)
  - Montant de ma commission
  - Statut (En attente / Validée)
```

**T3.3 - Système de Commissions**
```
GIVEN j'ai généré des ventes
WHEN je consulte mon dashboard
THEN je dois voir:
  - Commissions en attente (commandes non livrées)
  - Commissions validées (commandes livrées)
  - Solde total disponible

WHEN une commande parrainée est livrée (OTP validé)
THEN ma commission doit passer de "En attente" à "Validée"
AND s'ajouter à mon solde disponible

WHEN je demande un retrait
THEN une demande doit être créée pour validation admin
```

**T3.4 - Tableau de Bord Affilié**
```
GIVEN je suis sur mon dashboard affilié
THEN je dois voir:
  - Nombre total de clics sur mes liens
  - Nombre de conversions (achats)
  - Taux de conversion (conversions/clics)
  - Gains totaux ce mois
  - Gains totaux historique
  - Top 3 produits les plus performants
  - Graphique d'évolution des gains
```

**T3.5 - Partenariats VIP (Optionnel)**
```
GIVEN je suis un affilié avec badge VIP
WHEN je vais sur "Partenariats"
THEN je dois voir la liste des vendeurs

WHEN je sélectionne un vendeur
AND je clique sur "Demander un partenariat"
AND je propose un taux de commission personnalisé (ex: 15%)
AND j'envoie la demande
THEN le vendeur doit recevoir ma demande
AND je dois voir le statut "En attente"

WHEN le vendeur accepte
THEN le partenariat doit être actif
AND mes liens pour les produits de ce vendeur doivent avoir la commission personnalisée
```

---

## Tests Critiques Inter-Rôles

### T4 - Integration Tests

**T4.1 - Flux Complet avec Affilié**
```
GIVEN un affilié partage un lien produit
WHEN un acheteur clique sur le lien
AND négocie avec le vendeur
AND accepte une offre personnalisée
AND passe commande
AND le vendeur expédie
AND l'acheteur valide avec OTP
THEN:
  - Le vendeur doit recevoir le paiement (moins commission affilié + plateforme)
  - L'affilié doit recevoir sa commission
  - L'acheteur doit pouvoir laisser un avis
  - Tous les soldes doivent être corrects
```

**T4.2 - Gestion du MOQ**
```
GIVEN un produit avec MOQ = 10
WHEN un acheteur essaie d'acheter 5 unités
THEN l'achat doit être bloqué

WHEN le vendeur crée une offre personnalisée pour 5 unités
THEN l'acheteur doit pouvoir accepter (exception au MOQ)
```

**T4.3 - Persistance du Tracking Affilié**
```
GIVEN un utilisateur clique sur un lien affilié
WHEN il ferme le navigateur
AND revient plus tard dans la même session
AND passe commande
THEN l'affilié doit toujours être crédité
```

---

## Checklist Pré-Test

- [ ] Base de données Supabase est accessible
- [ ] Variables d'environnement configurées
- [ ] Serveur de développement lancé (port 5173)
- [ ] Au moins 3 comptes de test créés:
  - 1 Buyer
  - 1 Seller (avec 5+ produits)
  - 1 Affiliate
- [ ] Images de test disponibles pour upload produits
- [ ] sessionStorage activé dans le navigateur

---

## Métriques de Succès

| Catégorie | Objectif |
|-----------|----------|
| Taux de réussite global | > 95% |
| Bugs critiques (P0) | 0 |
| Bugs majeurs (P1) | < 3 |
| Temps de chargement pages | < 3s |
| Responsive mobile | 100% |

---

## Commandes TestSprite

### Lancer les tests Buyer
```bash
testsprite test --path / --suite T1
```

### Lancer les tests Seller
```bash
testsprite test --path /seller/dashboard --suite T2
```

### Lancer les tests Affiliate
```bash
testsprite test --path /affiliate --suite T3
```

### Lancer tous les tests
```bash
testsprite test --all
```

---

## Notes Importantes

> **⚠️ Tests Manuels Requis:**
> - Réception SMS OTP (nécessite vrai numéro)
> - Upload de documents CNI
> - Paiements Mobile Money réels

> **📝 À Documenter:**
> - Captures d'écran de chaque bug trouvé
> - Logs console pour erreurs JavaScript
> - Requêtes réseau échouées (Network tab)

---

## Prochaines Étapes Après Tests

1. ✅ Analyser les résultats TestSprite
2. ✅ Créer tickets pour chaque bug trouvé
3. ✅ Prioriser les corrections (P0 > P1 > P2)
4. ✅ Corriger et re-tester
5. ✅ Valider la conformité au PRD
6. 🚀 Passer à l'implémentation Admin Dashboard