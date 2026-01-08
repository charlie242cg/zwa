# PRD - Interface d'Administration Zwa Congo (La Tour de Contrôle)

## 1. Vision du Produit
L'interface d'administration est le centre névralgique de la plateforme Zwa Congo. Elle permet aux "Super Admins" de superviser, modérer et piloter l'activité économique de la marketplace de manière autonome et sécurisée.

## 2. Objectifs Stratégiques
- **Autonomie** : Modifier les taux de commission et limites sans intervention technique.
- **Transparence Financière** : Valider manuellement les retraits et visualiser les flux.
- **Modération** : Assainir le catalogue produits et vérifier l'identité des vendeurs.
- **Résolution de Conflits** : Arbitrer les problèmes liés au système OTP.

## 3. Architecture de l'Interface (Dashboard PC Optimized)
L'interface est structurée en une interface mono-page (SPA) avec une barre latérale de navigation.

### Modules de Gestion :

#### A. Aperçu (Overview)
- **Métriques Clés** : GMV (Volume d'affaires), Revenus Commissions (Net Zwa), Nombre total d'utilisateurs par rôle.
- **Alertes** : Nombre de retraits en attente, nouveaux litiges.

#### B. Gestion des Catalogues
- **Catégories** : Création, édition, suppression et ordonnancement des catégories de produits.
- **Villes & Zones** : Gestion des localisations pour permettre le filtrage géographique des produits sur la marketplace.

#### C. Finances & Paramètres Globaux
- **Gestion des Retraits** : Liste des demandes Mobile Money (Airtel/MTN) avec actions "Valider" ou "Rejeter".
- **Paramètres Plateforme** : 
    - **Taux Aggregateur** (%) : Frais de service des opérateurs.
    - **Commission Plateforme** (%) : Pourcentage prélevé par Zwa.
    - **Limites de Retrait** : Montant minimum et maximum par transaction.

#### D. Modération & Utilisateurs
- **Vendeurs (KYC)** : Vérification des boutiques et des documents d'identité (Badge vérifié).
- **Produits** : Suppression des produits non conformes ou frauduleux.
- **Affiliés (VIP)** : Validation du statut VIP pour les influenceurs.

#### E. Litiges & Arbitrage (OTP)
- **Arbitrage OTP** : Interface permettant de voir le code OTP d'une commande "bloquée" si l'acheteur ne peut pas le fournir (oubli, problème SMS), afin de libérer les fonds pour le vendeur après confirmation manuelle de la réception.

## 4. Spécifications Techniques

### Backend & Données (Supabase)
- **Table `global_settings`** : Stockage des taux (commission_rate, aggregator_rate, withdrawal_min, withdrawal_max).
- **Table `cities`** : Entités liées aux profils et produits (`city_id`).
- **Table `transactions`** : Statut étendu (`pending`, `completed`, `rejected`) pour les retraits.

### Sécurité & Accès
- **Gating par Rôle** : Seuls les profils ayant `role = 'admin'` ont accès aux routes `/admin/*`.
- **Politiques RLS** : Sécurisation des accès en écriture sur les tables sensibles par l'UID de l'admin.

### Design (Aesthetics)
- Style **Premium Dark** (Violet/Or/Noir).
- Optimisation PC pour le travail de bureau, avec compatibilité mobile pour les actions urgentes.

## 5. Flux Financier (Money Split)
Le système doit calculer la répartition comme suit :
1.  **Montant Client** (100%)
2.  **Part Aggregateur** (Taux réglable dans settings)
3.  **Part Zwa** (Taux réglable dans settings)
4.  **Commission Affilié** (Fixée par le vendeur, déduite de la part globale ou prix)
5.  **Reste Vendeur** (Montant final crédité sur son wallet après livraison).

---
*Dernière mise à jour : 05 Janvier 2026*
