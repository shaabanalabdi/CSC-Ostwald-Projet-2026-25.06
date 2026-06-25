-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le : lun. 01 juin 2026 à 12:29
-- Version du serveur : 9.6.0
-- Version de PHP : 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `csc_ostwald`
--

-- --------------------------------------------------------

--
-- Structure de la table `contact_settings`
--

CREATE TABLE `contact_settings` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '09.78.80.96.29',
  `email_accueil` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contact@csc-ostwald.fr',
  `email_familles` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'familles@csc-ostwald.fr',
  `email_jeunesse` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'jeunesse@csc-ostwald.fr',
  `email_projets` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'projets@csc-ostwald.fr',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1, place de la Bruyère, 67540 Ostwald',
  `days_lv` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Lundi – Vendredi',
  `hours_lv` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '09h30 – 17h00',
  `days_we` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Samedi – Dimanche',
  `hours_we` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fermé',
  `exceptional_day` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exceptional_occasion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contact_settings` (`phone`, `email_accueil`, `email_familles`, `email_jeunesse`, `email_projets`, `address`) VALUES
('09.78.80.96.29', 'contact@csc-ostwald.fr', 'familles@csc-ostwald.fr', 'jeunesse@csc-ostwald.fr', 'projets@csc-ostwald.fr', '1, place de la Bruyère, 67540 Ostwald');

-- --------------------------------------------------------

--
-- Structure de la table `activity`
--

CREATE TABLE `activity` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` enum('famille','jeunesse','reguliere') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int UNSIGNED DEFAULT NULL,
  `categorie_label` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lieu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jour` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horaire` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `frequence` enum('HEBDO','MENSUEL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cout` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacite` int UNSIGNED DEFAULT NULL,
  `tag` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `activity`
--

INSERT INTO `activity` (`id`, `title`, `description`, `activity_type`, `category_id`, `categorie_label`, `lieu`, `jour`, `horaire`, `frequence`, `cout`, `capacite`, `tag`, `image_url`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'Escapades en famille', 'Un jour par semaine, on quitte le quartier pour explorer d\'autres horizons : forêt, musée, ferme, plage... Ensemble, partageons de nouvelles découvertes.', 'famille', NULL, 'SORTIE EN TRIBU', 'Centre CSC Ostwald', 'Chaque semaine', NULL, 'HEBDO', 'Gratuit', 20, 'famille', '/assets/activities/event-enfants.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(2, 'Les petites mains créatives', 'Peinture, argile, collage... Un moment complice pour explorer la matière et créer à quatre mains, dès 3 ans.', 'famille', NULL, 'ATELIER PARENT - ENFANT', 'Centre CSC Ostwald', 'Chaque mois', NULL, 'MENSUEL', 'Gratuit', 15, 'séance', '/assets/activities/event-enfants.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(3, 'Les fourneaux partagés', 'On cuisine ensemble des recettes du monde, on partage le repas. Grand-parents, parents, enfants : tous aux marmites.', 'famille', NULL, 'CUISINE TOUS ÂGES', 'Centre CSC Ostwald', 'Chaque semaine', NULL, 'HEBDO', 'Gratuit', 20, 'famille', '/assets/activities/event-enfants.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(4, 'Le café des parents', 'Échangez astuces et rires autour d\'un café ! Un moment de détente entre voisins, sans jugement et en toute simplicité. Pour une question ou juste pour souffler, la porte est grande ouverte !', 'famille', NULL, 'CAFÉ - ÉCOUTE & ÉCHANGE', 'Centre CSC Ostwald', 'Chaque mois', NULL, 'MENSUEL', 'Gratuit', 25, 'famille', '/assets/activities/event-enfants.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(5, 'Atelier Rap & Beatbox', 'Viens explorer l\'univers du rap, du beatbox et de l\'écriture créative. Exprime-toi, compose tes textes et partage ta musique avec les autres.', 'jeunesse', NULL, 'MUSIQUE & EXPRESSION', 'Centre CSC Ostwald', 'Chaque semaine', NULL, 'HEBDO', 'Gratuit', 15, 'jeune', '/assets/activities/event-jeunes.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(6, 'Tournoi Gaming & E-Sport', 'Un tournoi mensuel de jeux vidéo pour se mesurer, s\'amuser et rencontrer d\'autres joueurs du quartier dans une ambiance fun et bienveillante.', 'jeunesse', NULL, 'GAMING & NUMÉRIQUE', 'Centre CSC Ostwald', 'Chaque mois', NULL, 'MENSUEL', 'Gratuit', 20, 'jeune', '/uploads/16ed5fb87586f102.png', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(7, 'Sorties & Découvertes', 'Cinéma, paintball, accrobranche, escape game... Chaque mois une nouvelle sortie pour créer des souvenirs et découvrir la région autrement.', 'jeunesse', NULL, 'SORTIES & AVENTURES', 'Variable', 'Chaque mois', NULL, 'MENSUEL', 'Gratuit', 25, 'jeune', '/assets/activities/event-jeunes.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33'),
(8, 'Studio Podcast & Vidéo', 'Apprends à créer ton propre podcast, ta chaîne YouTube ou tes vidéos. Le centre met à ta disposition le matériel et t\'accompagne dans ton projet.', 'jeunesse', NULL, 'CRÉATION NUMÉRIQUE', 'Centre CSC Ostwald', 'Chaque semaine', NULL, 'HEBDO', 'Gratuit', 10, 'jeune', '/assets/activities/event-jeunes.webp', 1, '2026-05-19 01:58:33', '2026-05-19 01:58:33');

-- --------------------------------------------------------

--
-- Structure de la table `benevole_application`
--

CREATE TABLE `benevole_application` (
  `id` int UNSIGNED NOT NULL,
  `nom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domaines` json NOT NULL,
  `competences` json NOT NULL,
  `jours` json NOT NULL,
  `plages` json NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('new','contacted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `category`
--

CREATE TABLE `category` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `event`
--

CREATE TABLE `event` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_event` datetime NOT NULL,
  `lieu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cout` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacite` int UNSIGNED DEFAULT NULL,
  `category_id` int UNSIGNED DEFAULT NULL,
  `category_label` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `show_in_agenda` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `event`
--

INSERT INTO `event` (`id`, `title`, `description`, `date_event`, `lieu`, `cout`, `capacite`, `category_id`, `category_label`, `category_color`, `image_url`, `show_in_agenda`, `created_at`) VALUES
(1, 'Atelier Peinture & Créativité', NULL, '2026-11-15 14:00:00', 'Centre CSC Ostwald', 'Gratuit', 30, NULL, 'Atelier pour enfants', '#ee961b', '/assets/events/event-enfants.webp', 1, '2026-05-19 01:58:32'),
(2, 'Lab Numérique & Création', NULL, '2026-11-16 14:00:00', 'Centre CSC Ostwald', 'Gratuit', 38, NULL, 'Atelier pour les jeunes', '#0132cc', '/assets/events/event-jeunes.webp', 1, '2026-05-19 01:58:32'),
(3, 'Journée Famille & Nature', NULL, '2026-11-16 14:00:00', 'Centre CSC Ostwald', 'Gratuit', 30, NULL, 'Atelier pour les familles', '#ee961b', '/assets/events/event-enfants.webp', 1, '2026-05-19 01:58:32'),
(4, 'Théâtre & Expression', NULL, '2026-11-22 14:00:00', 'Centre CSC Ostwald', 'Gratuit', 20, NULL, 'Atelier pour enfants', '#ee961b', '/assets/events/event-jeunes.webp', 1, '2026-05-19 01:58:32');

-- --------------------------------------------------------

--
-- Structure de la table `hero_slide`
--

CREATE TABLE `hero_slide` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `media_type` enum('none','image','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `hero_slide`
--

INSERT INTO `hero_slide` (`id`, `title`, `subtitle`, `media_type`, `media_url`, `display_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'Centre Social et Culturel d’Ostwald', 'Un lieu ouvert à tout.e.s les habitant.e.s', 'none', NULL, 0, 1, '2026-05-21 01:24:37', '2026-05-21 01:29:39'),
(2, 'Activités, événements & projets', 'Participez à la vie de votre quartier', 'none', NULL, 1, 1, '2026-05-21 01:24:37', '2026-05-21 01:29:39');

-- --------------------------------------------------------

--
-- Structure de la table `message`
--

CREATE TABLE `message` (
  `id` int UNSIGNED NOT NULL,
  `prenom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sujet` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `news`
--

CREATE TABLE `news` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_published` date NOT NULL,
  `social_platform` enum('instagram','facebook','none') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `social_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `news`
--

INSERT INTO `news` (`id`, `title`, `excerpt`, `image_url`, `date_published`, `social_platform`, `social_url`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'Fête des voisins : un succès retentissant !', 'Plus de 200 habitants ont participé à notre fête annuelle des voisins. Une belle journée de rencontres et de partage dans une ambiance festive et solidaire.', NULL, '2026-07-10', 'instagram', 'https://www.instagram.com/csc_ostwald', 1, '2026-05-19 19:45:01', '2026-05-19 19:45:01'),
(2, 'Nouveau : espace numérique pour tous', 'Notre centre dispose désormais d\'un espace numérique équipé de 10 ordinateurs pour aider les habitants à se former et accéder aux services en ligne.', NULL, '2026-07-05', 'facebook', 'https://www.facebook.com/cscostwald/', 1, '2026-05-19 19:45:01', '2026-05-19 19:45:01');

-- --------------------------------------------------------

--
-- Structure de la table `newsletter_subscriber`
--

CREATE TABLE `newsletter_subscriber` (
  `id` int UNSIGNED NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `confirmation_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `partner`
--

CREATE TABLE `partner` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` enum('institutionnel','associatif') COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `partner`
--

INSERT INTO `partner` (`id`, `name`, `logo_url`, `website_url`, `category`, `display_order`, `created_at`) VALUES
(1, 'CAF du Bas-Rhin', '/assets/logos/logo-caf-671.png', 'https://www.caf.fr/allocataires/caf-du-bas-rhin', 'institutionnel', 1, '2026-05-19 01:57:58'),
(2, 'Ville d\'Ostwald', '/assets/logos/ostwald-ville.png', 'https://www.ville-ostwald.fr', 'institutionnel', 2, '2026-05-19 01:57:58'),
(3, 'Collectivité européenne d\'Alsace', '/assets/logos/Collectivite-europeenne-dAlsace.jpeg', 'https://www.alsace.eu/', 'institutionnel', 3, '2026-05-19 01:57:58'),
(4, 'Eurométropole de Strasbourg', '/assets/logos/strasbourg-eu.webp', 'https://www.strasbourg.eu/', 'institutionnel', 4, '2026-05-19 01:57:58'),
(5, 'Région Grand Est', '/assets/logos/REGION-grandest.png', 'https://www.grandest.fr/', 'institutionnel', 5, '2026-05-19 01:57:58'),
(6, 'Préfecture du Bas-Rhin', '/assets/logos/logo-etat.png', 'https://www.bas-rhin.gouv.fr', 'institutionnel', 6, '2026-05-19 01:57:58'),
(7, 'Centres Sociaux', '/assets/logos/logo-centre-sociaux.png', NULL, 'associatif', 10, '2026-05-19 01:57:58'),
(8, 'Maison des Jeux', '/assets/logos/logo-maison-des-jeux.png', NULL, 'associatif', 11, '2026-05-19 01:57:58'),
(9, 'Repair Café', '/assets/logos/logo-repair-cafe.jpg', NULL, 'associatif', 12, '2026-05-19 01:57:58'),
(10, 'Tot ou Tart', '/assets/logos/logo-tot-ou-tart.png', NULL, 'associatif', 13, '2026-05-19 01:57:58'),
(11, 'UnisCité', '/assets/logos/logo-unisCite.png', NULL, 'associatif', 14, '2026-05-19 01:57:59'),
(12, 'Action Prévention Alsace', '/assets/logos/logo-action-prevention-alsace.png', NULL, 'associatif', 15, '2026-05-19 01:57:59'),
(13, 'ARSEA', '/assets/logos/logo-arsea.png', NULL, 'associatif', 16, '2026-05-19 01:57:59'),
(14, 'CSF Ostwald', '/assets/logos/logo-csf-ostwald.png', NULL, 'associatif', 17, '2026-05-19 01:57:59'),
(15, 'Horizon', '/assets/logos/logo-horizon.png', NULL, 'associatif', 18, '2026-05-19 01:57:59'),
(16, 'Relais Petite Enfance', '/assets/logos/logo-relais-petite-enfance.png', NULL, 'associatif', 19, '2026-05-19 01:57:59'),
(17, 'Soualiga', '/assets/logos/logo-soualiga.png', NULL, 'associatif', 20, '2026-05-19 01:57:59'),
(18, 'Bretzselle', '/assets/logos/logo-bretzselle.png', NULL, 'associatif', 21, '2026-05-19 01:57:59');

-- --------------------------------------------------------

--
-- Structure de la table `projet_social_document`
--

CREATE TABLE `projet_social_document` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_label` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PDF',
  `color` enum('orange','blue','green') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `projet_social_document`
--

INSERT INTO `projet_social_document` (`id`, `title`, `description`, `file_url`, `badge_label`, `color`, `display_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'Dossier d\'inscription', 'Téléchargez le dossier complet d\'inscription pour rejoindre nos activités et ateliers.', '/documents/formulaire-inscription.pdf', 'PDF', 'blue', 4, 1, '2026-05-19 15:18:07', '2026-05-19 15:31:16'),
(2, 'Fiche sanitaire', 'Document médical modifiable à télécharger et à remettre lors de l\'inscription à certaines activités.', '/documents/Fiche-sanitaire-de-liaison.pdf', 'PDF', 'blue', 2, 1, '2026-05-19 15:18:07', '2026-05-19 15:31:16'),
(3, 'Reçu de dons', 'Document officiel attestant votre don au CSC Ostwald, valable pour une déduction fiscale.', '/documents/Cerfa-don-entreprises.pdf', 'CERFA', 'orange', 3, 1, '2026-05-19 15:18:07', '2026-05-19 15:31:16'),
(4, 'Rapport d\'activité', 'Notre bilan annuel présentant les actions, projets et résultats de l\'année écoulée.', '/documents/rapport-activites-2025.pdf', 'RAPPORT', 'green', 1, 1, '2026-05-19 15:18:07', '2026-05-19 15:31:16'),
(5, 'Projet Social 2026-2029', 'Le projet social du CSC Ostwald pour la période 2026-2029, présentant nos orientations et engagements.', '/documents/Projet-social-CSCDOSTWALD2026-2029.pdf', 'PROJET', 'green', 0, 1, '2026-05-19 15:18:07', '2026-05-19 15:31:16');

-- --------------------------------------------------------

--
-- Structure de la table `registration`
--

CREATE TABLE `registration` (
  `id` int UNSIGNED NOT NULL,
  `activity_id` int UNSIGNED NOT NULL,
  `prenom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `helloasso_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_cents` int UNSIGNED NOT NULL,
  `status` enum('pending','paid','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `team_member`
--

CREATE TABLE `team_member` (
  `id` int UNSIGNED NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `team_member`
--

INSERT INTO `team_member` (`id`, `nom`, `prenom`, `role`, `email`, `phone`, `photo_url`, `display_order`, `created_at`) VALUES
(1, 'ENETTE', 'Etienne', 'Directeur', 'direction@csc-ostwald.fr', NULL, '/uploads/2289a00db20a0445.png', 1, '2026-05-19 01:57:51'),
(2, 'BAUER', 'Charline', 'Référente familles', 'familles@csc-ostwald.fr', '07.45.09.96.02', '/uploads/b9e2ebd5a12844cf.png', 2, '2026-05-19 01:57:51'),
(3, 'VERNIER', 'Aurélie', 'Animatrice jeunesse', 'jeunesse@csc-ostwald.fr', '07.67.18.17.78', '/uploads/3bb49406f218ff2b.png', 3, '2026-05-19 01:57:51'),
(4, 'WALTER', 'Pierrot', 'Coordinateur de projets', 'projets@csc-ostwald.fr', '07.45.05.68.20', '/uploads/6f46c7334245f9dd.png', 4, '2026-05-19 01:57:51'),
(5, 'GOSSET', 'Sandrine', 'Chargée d\'accueil et d\'animation', 'contact@csc-ostwald.fr', '09.78.80.96.29', '/uploads/e4b95ceeeb7eb395.png', 5, '2026-05-19 01:57:51');

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` int UNSIGNED NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','editor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'admin@csc-ostwald.fr', '$2b$12$BkZV1RPkB4zprAgKYix43.IWkr4uIs6gd/xwEFhhHJHOUn0mjukje', 'admin', '2026-05-19 01:57:42');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activity`
--
ALTER TABLE `activity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_activity_published` (`is_published`);

--
-- Index pour la table `benevole_application`
--
ALTER TABLE `benevole_application`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_benevole_status` (`status`);

--
-- Index pour la table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_event_date` (`date_event`);

--
-- Index pour la table `hero_slide`
--
ALTER TABLE `hero_slide`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hero_slide_published` (`is_published`,`display_order`);

--
-- Index pour la table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_message_read` (`is_read`);

--
-- Index pour la table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_news_published` (`is_published`,`date_published`);

--
-- Index pour la table `newsletter_subscriber`
--
ALTER TABLE `newsletter_subscriber`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_newsletter_confirmed` (`is_confirmed`);

--
-- Index pour la table `partner`
--
ALTER TABLE `partner`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `projet_social_document`
--
ALTER TABLE `projet_social_document`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_projet_social_doc_published` (`is_published`);

--
-- Index pour la table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `helloasso_transaction_id` (`helloasso_transaction_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `idx_registration_status` (`status`);

--
-- Index pour la table `team_member`
--
ALTER TABLE `team_member`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `activity`
--
ALTER TABLE `activity`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `benevole_application`
--
ALTER TABLE `benevole_application`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `category`
--
ALTER TABLE `category`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `event`
--
ALTER TABLE `event`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `hero_slide`
--
ALTER TABLE `hero_slide`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `message`
--
ALTER TABLE `message`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `news`
--
ALTER TABLE `news`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `newsletter_subscriber`
--
ALTER TABLE `newsletter_subscriber`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `partner`
--
ALTER TABLE `partner`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `projet_social_document`
--
ALTER TABLE `projet_social_document`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `registration`
--
ALTER TABLE `registration`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `team_member`
--
ALTER TABLE `team_member`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activity`
--
ALTER TABLE `activity`
  ADD CONSTRAINT `activity_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `event_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `registration`
--
ALTER TABLE `registration`
  ADD CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
