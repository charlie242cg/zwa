# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Projet :** Zwa (Nom de code)
**Version :** 2.0 (Finale MVP)
**Date :** 26 Décembre 2025
**Cible :** Congo (Mobile Only)

---

## 1. VISION & OBJECTIFS
Créer une marketplace locale de type "Social Commerce" adaptée aux réalités du Congo.
* **Concept :** Hybride entre Alibaba (B2B/B2C, Négociation) et l'Affiliation Virale.
* **Objectif :** Permettre aux vendeurs d'écouler leurs stocks via le Chat et aux jeunes (affiliés) de monétiser leur audience sociale.
* **Contrainte Majeure :** Expérience "Mobile Only", optimisée pour les connexions instables (3G) et l'économie de data.

---

## 2. ACTEURS & RÔLES

| Rôle | Description & Privilèges |
| :--- | :--- |
| **Acheteur** | Recherche produits, négocie via Chat, paie, valide réception (OTP). |
| **Vendeur Standard** | Poste produits, gère commandes, chat basique. |
| **Vendeur Vérifié 🛡️** | **Badge Confiance.** Validé par CNI. Accès prioritaire recherche. Inspire confiance. |
| **Affilié Standard** | Partage liens, gagne commission par défaut. |
| **Affilié VIP (Influenceur) ⭐** | **Badge Star.** Validé sur audience. **Droit de négocier ses commissions** avec les vendeurs. |
| **Super Admin** | Valide les badges (KYC), gère les litiges, valide les retraits d'argent. |

---

## 3. FONCTIONNALITÉS CLÉS (USER STORIES)

### A. Boutique & Confiance (Style Alibaba)
* **MOQ (Minimum Order Quantity) :** Le vendeur peut imposer une quantité min. (ex: "Vente par lot de 5").
* **Favoris :** L'acheteur peut "Suivre ce fournisseur".
* **Design :** Thème Sombre (Dark Mode) par défaut. Couleurs : Noir & Violet.

### B. Chat & Négociation (Cœur du système)
1.  **Start :** L'acheteur lance un chat depuis le produit.
2.  **Deal :** Accord sur un prix/quantité.
3.  **Offre :** Le vendeur génère une "Offre Personnalisée" dans le chat (Prix spécial + Qté).
4.  **Paiement :** L'acheteur clique sur "Payer" directement dans la bulle de discussion.

### C. Affiliation Avancée & Tracking
* **Tracking Persistant :** L'ID de l'affilié suit l'acheteur jusque dans le Chat. Même si la vente se fait 3 jours plus tard via une offre négociée, l'affilié touche sa part.
* **Système VIP :**
    * L'Affilié VIP voit un bouton "Demander Partenariat".
    * Il propose un taux (ex: 15%).
    * Si accepté par le vendeur, ce taux s'applique automatiquement à ses ventes.

### D. Sécurité Livraison (Système OTP)
*Pour protéger les fonds (Escrow).*
1.  **Expédition :** Vendeur marque "Expédié".
2.  **Code :** Le système envoie un **OTP 4 chiffres** à l'Acheteur (SMS/App).
3.  **Livraison :** L'acheteur donne le code au livreur/vendeur à la réception.
4.  **Déblocage :** Le vendeur entre le code $\rightarrow$ Fonds libérés.

---

## 4. ARCHITECTURE TECHNIQUE

### La Stack (Gratuite & Scalable)
* **Frontend :** Framework JS (Vue.js / React) en mode **PWA** (Progressive Web App).
* **Hébergement :** Netlify.
* **Backend / DB :** **Supabase** (PostgreSQL + Auth + Realtime).
* **Média :** **Cloudinary** (Optimisation auto des images).
* **Paiement :** Redirection vers agrégateurs locaux (Airtel Money / MTN).

### Schéma de Données (Supabase - Tables Clés)

**1. `users`**
* `id`, `role`
* `is_verified_seller` (bool)
* `is_vip_influencer` (bool)
* `wallet_balance`

**2. `products`**
* `id`, `seller_id`
* `min_order_quantity` (int)
* `default_commission` (%)

**3. `partnerships` (Pour les VIP)**
* `id`, `seller_id`, `affiliate_id`
* `product_id`
* `negotiated_rate` (%)
* `status` (accepted/rejected)

**4. `conversations`**
* `id`, `buyer_id`, `seller_id`
* `source_affiliate_id` (CRITIQUE pour ne pas perdre l'affilié)

**5. `orders`**
* `id`, `status`
* `delivery_otp_hash`
* `commission_amount`

---

## 5. DASHBOARD ADMIN

L'interface pour le propriétaire (Toi) :
1.  **Modération :** Voir les photos CNI $\rightarrow$ Valider Vendeur. Voir les réseaux sociaux $\rightarrow$ Valider Influenceur VIP.
2.  **Finances :** Liste des demandes de retrait. Validation manuelle des envois Mobile Money.
3.  **Litiges :** Arbitrage si le code OTP n'est pas validé ou si plainte client.

---

## 6. DESIGN GUIDELINES (UI/UX)
* **Approche :** Mobile First absolue. Navigation par le bas (Thumb zone).
* **Palette :**
    * Background: `#121212` (Noir)
    * Primary: `#8A2BE2` (Violet)
    * Text: `#FFFFFF`
* **Performance :** Chargement paresseux (Lazy loading) des images.