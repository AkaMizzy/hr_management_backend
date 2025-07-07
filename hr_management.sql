-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 02, 2025 at 06:24 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hr_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `absence_validations`
--

CREATE TABLE `absence_validations` (
  `id` int(11) NOT NULL,
  `id_demande_absence` int(11) DEFAULT NULL,
  `validator_role` enum('manager','responsable_rh') DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT NULL,
  `annulable` tinyint(1) DEFAULT 1,
  `justifier` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `absence_validations`
--

INSERT INTO `absence_validations` (`id`, `id_demande_absence`, `validator_role`, `is_approved`, `annulable`, `justifier`) VALUES
(1, 1, 'manager', 1, 0, NULL),
(2, 2, 'manager', 0, 0, 'la la mabghitch'),
(3, 1, 'responsable_rh', 1, 0, 'yes yes '),
(4, 3, 'manager', 1, 0, NULL),
(5, 3, 'responsable_rh', 0, 0, 'i don\'t want to '),
(12, 11, 'manager', 1, 0, NULL),
(13, 13, 'manager', 1, 0, NULL),
(15, 19, 'manager', 0, 0, 'Mmmmmm');

-- --------------------------------------------------------

--
-- Table structure for table `action`
--

CREATE TABLE `action` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) DEFAULT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `tache_employe_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `action`
--

INSERT INTO `action` (`id`, `intitule`, `detail`, `photo`, `tache_employe_id`) VALUES
(1, 'Set up local files', 'Set up local files to start the products asap', 'D:\\hamza\\Documents\\Muntadaa\\hr_managament\\hr_backend\\uploads\\actions\\action-1749412650750-534357011.png', 7);

-- --------------------------------------------------------

--
-- Table structure for table `attestation_documents`
--

CREATE TABLE `attestation_documents` (
  `id` int(11) NOT NULL,
  `id_attestation` int(11) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attestation_documents`
--

INSERT INTO `attestation_documents` (`id`, `id_attestation`, `file_path`, `created_at`) VALUES
(3, 2, 'uploads\\attestations\\attestation_2_1751055675542.pdf', '2025-06-27 21:21:16'),
(4, 1, 'uploads\\attestations\\attestation_1_1751056251746.pdf', '2025-06-27 21:30:52'),
(5, 4, 'uploads\\attestations\\attestation_4_1751472403626.pdf', '2025-07-02 17:06:44');

-- --------------------------------------------------------

--
-- Table structure for table `attestation_validations`
--

CREATE TABLE `attestation_validations` (
  `id` int(11) NOT NULL,
  `attestation_id` int(11) DEFAULT NULL,
  `validator_role` enum('manager','responsable_rh') DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT NULL,
  `justification` varchar(255) DEFAULT NULL,
  `date_validation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attestation_validations`
--

INSERT INTO `attestation_validations` (`id`, `attestation_id`, `validator_role`, `is_approved`, `justification`, `date_validation`) VALUES
(1, 1, 'manager', 1, NULL, '2025-06-24 22:56:51'),
(2, 1, 'responsable_rh', 1, NULL, '2025-06-24 22:57:55'),
(3, 2, 'manager', 1, NULL, '2025-06-27 21:09:18'),
(4, 2, 'responsable_rh', 1, NULL, '2025-06-27 21:09:41'),
(5, 4, 'manager', 1, NULL, '2025-07-01 13:46:04'),
(6, 4, 'responsable_rh', 1, NULL, '2025-07-01 23:24:57');

-- --------------------------------------------------------

--
-- Table structure for table `conge_validations`
--

CREATE TABLE `conge_validations` (
  `id` int(11) NOT NULL,
  `id_demande_conge` int(11) DEFAULT NULL,
  `validator_role` enum('manager','responsable_rh') DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT NULL,
  `annulable` tinyint(1) DEFAULT 1,
  `justifier` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conge_validations`
--

INSERT INTO `conge_validations` (`id`, `id_demande_conge`, `validator_role`, `is_approved`, `annulable`, `justifier`) VALUES
(3, 4, 'manager', 1, 1, NULL),
(7, 4, 'responsable_rh', 1, 0, NULL),
(19, 22, 'manager', 1, 0, NULL),
(21, 31, 'manager', 1, 1, NULL),
(22, 31, 'responsable_rh', 1, 0, NULL),
(23, 32, 'manager', 1, 1, NULL),
(24, 32, 'responsable_rh', 0, 0, 'the period is too long');

-- --------------------------------------------------------

--
-- Table structure for table `demande_absence`
--

CREATE TABLE `demande_absence` (
  `id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `id_employe` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `demande_absence`
--

INSERT INTO `demande_absence` (`id`, `date`, `heure_debut`, `heure_fin`, `motif`, `status`, `id_employe`) VALUES
(1, '2025-06-17', '18:12:20', '22:00:00', 'Maladie soudaine', 'approved', 12),
(2, '2025-06-04', NULL, '02:00:00', 'Rendez-vous médical', 'rejected', 12),
(3, '2025-06-04', '19:02:09', '02:00:00', 'Problème familial urgent', 'rejected', 12),
(11, '2025-06-05', '04:00:00', '04:00:00', 'Panne de transport', 'pending', 12),
(13, '2025-06-06', '21:49:57', '03:00:00', 'Décès d’un proche', 'pending', 12),
(19, '2025-07-31', NULL, NULL, 'Congé exceptionnel', 'rejected', 12);

-- --------------------------------------------------------

--
-- Table structure for table `demande_attestation`
--

CREATE TABLE `demande_attestation` (
  `id` int(11) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_demande` datetime DEFAULT current_timestamp(),
  `employe_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `type_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `demande_attestation`
--

INSERT INTO `demande_attestation` (`id`, `code`, `description`, `date_demande`, `employe_id`, `status`, `type_id`) VALUES
(1, NULL, 'Attestation de travail pour prêt bancaire', '2025-06-24 22:56:13', 12, 'approved', 1),
(2, NULL, 'Demande de visa', '2025-06-27 19:35:13', 12, 'approved', 2),
(3, NULL, 'Demande personnelle', '2025-06-27 20:48:22', 12, 'pending', 3),
(4, NULL, 'Attestation de travail pour prêt bancaire', '2025-07-01 13:44:02', 13, 'approved', 4);

-- --------------------------------------------------------

--
-- Table structure for table `demande_conge`
--

CREATE TABLE `demande_conge` (
  `id` int(11) NOT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `nombre_jours` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `id_employe` int(11) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `demande_conge`
--

INSERT INTO `demande_conge` (`id`, `date_debut`, `date_fin`, `nombre_jours`, `status`, `id_employe`, `type_id`) VALUES
(4, '2025-06-18', '2025-07-31', 44, 'approved', 12, 1),
(22, '2025-06-02', '2025-06-04', 3, 'pending', 12, 2),
(27, '2025-06-02', '2025-06-07', 6, 'pending', 12, 2),
(29, '2025-06-02', '2025-07-01', 30, 'pending', 12, 4),
(30, '2025-06-03', '2025-06-14', 12, 'pending', 12, 2),
(31, '2025-06-05', '2025-07-02', 28, 'approved', 12, 1),
(32, '2025-06-05', '2025-07-01', 27, 'rejected', 12, 3);

-- --------------------------------------------------------

--
-- Table structure for table `demande_note_frais`
--

CREATE TABLE `demande_note_frais` (
  `id` int(11) NOT NULL,
  `date_frais` date DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `id_employe` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `demande_note_frais`
--

INSERT INTO `demande_note_frais` (`id`, `date_frais`, `type_id`, `description`, `montant`, `status`, `id_employe`) VALUES
(1, '2025-06-24', 2, 'Achat de matériel pour mission terrain', 1000.00, 'approved', 12),
(2, '2025-06-04', 1, 'Déplacement professionnel hors site', 100.00, 'pending', 12);

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `employe_id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `type_fichier` varchar(50) DEFAULT NULL,
  `date_upload` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `employe_id`, `description`, `nom_fichier`, `chemin_fichier`, `type_fichier`, `date_upload`) VALUES
(1, 3, 'l\'acte de marriage', 'Demande de validation du sujet PFE 2024-2025.pdf', 'D:\\hamza\\Documents\\Muntadaa\\hr_managament\\hr_backend\\uploads\\3\\Demande de validation du sujet PFE 2024-2025-1745329201805-959336324.pdf', 'PDF', '2025-04-22 14:40:01'),
(6, 3, 'chatgptimage', 'ChatGPT Image Mar 29, 2025, 09_27_09 PM.png', 'D:\\hamza\\Documents\\Muntadaa\\hr_managament\\hr_backend\\uploads\\3\\ChatGPT Image Mar 29, 2025, 09_27_09 PM-1745926024390-848979116.png', 'PNG', '2025-04-29 12:27:04'),
(7, 12, 'photo de profile', 'GhibliStyle.png', 'D:\\hamza\\Documents\\Muntadaa\\hr_managament\\hr_backend\\uploads\\12\\GhibliStyle-1749409849719-457876233.png', 'PNG', '2025-06-08 20:10:50'),
(8, 12, 'lettre de motivation', 'Lettre de motivation.docx', 'D:\\hamza\\Documents\\Muntadaa\\hr_managament\\hr_backend\\uploads\\12\\Lettre de motivation-1749409872182-166530898.docx', 'DOCX', '2025-06-08 20:11:12');

-- --------------------------------------------------------

--
-- Table structure for table `employes`
--

CREATE TABLE `employes` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `genre` enum('homme','femme') DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `entite_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employes`
--

INSERT INTO `employes` (`id`, `nom`, `prenom`, `genre`, `date_naissance`, `email`, `adresse`, `telephone`, `manager_id`, `entite_id`) VALUES
(3, 'zily', 'hamza', 'homme', '2025-04-06', 'hamza@gmail.com', 'sqdnjkbjksqddqs', '064126589', 20, 1),
(12, 'Ez-zouek', 'Hamza', 'homme', '2003-06-28', 'zawak@gmail.com', 'BD BD CASABLANCA', '1122334455', 20, 4),
(13, 'khadraoui', 'khalil', 'homme', '2001-01-01', 'khalil@gmail.com', 'oulfa casablanca', '9988776655', 21, NULL),
(18, 'test', 'test2', 'homme', '2025-04-30', 'test@gmail.com', 'testtest', '0641258976', NULL, 3),
(20, 'muntaada', 'com', NULL, '2004-09-01', 'muntaadacom@gmail.com', 'Café SPLANDIDA, H9G8+872, Casablanca', '0511478596', NULL, 3),
(21, 'zineb', 'elhlou', 'femme', '1999-11-18', 'zinebelhlou@gmail.com', 'Ain harouda, Rue 151 N 19 ', '+212 641587462', NULL, 4);

-- --------------------------------------------------------

--
-- Table structure for table `employe_info`
--

CREATE TABLE `employe_info` (
  `id` int(11) NOT NULL,
  `employe_id` int(11) NOT NULL,
  `intitule` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 0,
  `valeur` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employe_info`
--

INSERT INTO `employe_info` (`id`, `employe_id`, `intitule`, `type`, `obligatoire`, `valeur`) VALUES
(1, 13, 'hamza', 'date', 0, '2025-04-30'),
(2, 13, 'date', 'date', 0, '2025-04-17'),
(3, 3, 'salaire', 'number', 1, '15151515'),
(4, 13, 'salaire', 'number', 1, '4445684');

-- --------------------------------------------------------

--
-- Table structure for table `entites`
--

CREATE TABLE `entites` (
  `id` int(11) NOT NULL,
  `tituler` varchar(255) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `status` enum('active','non active') DEFAULT 'active',
  `parent_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `entites`
--

INSERT INTO `entites` (`id`, `tituler`, `type_id`, `status`, `parent_id`) VALUES
(1, 'Direction globale', 1, 'active', NULL),
(2, 'RH', 2, 'active', 1),
(3, 'Recretement', 3, 'non active', 2),
(4, 'Développement', 3, 'active', 1);

-- --------------------------------------------------------

--
-- Table structure for table `info_employes`
--

CREATE TABLE `info_employes` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `info_employes`
--

INSERT INTO `info_employes` (`id`, `intitule`, `type`, `obligatoire`) VALUES
(1, 'salaire', 'number', 1),
(2, 'localisation', 'gps', 1),
(11, 'acte de mariage', 'document', 1),
(12, 'date', 'date', 0),
(13, 'etre marié', 'boolean', 0);

-- --------------------------------------------------------

--
-- Table structure for table `note_frais_validations`
--

CREATE TABLE `note_frais_validations` (
  `id` int(11) NOT NULL,
  `id_note_frais` int(11) DEFAULT NULL,
  `validator_role` enum('manager','responsable_rh') DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT NULL,
  `justification` varchar(255) DEFAULT NULL,
  `date_validation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `note_frais_validations`
--

INSERT INTO `note_frais_validations` (`id`, `id_note_frais`, `validator_role`, `is_approved`, `justification`, `date_validation`) VALUES
(1, 1, 'manager', 1, NULL, '2025-06-23 20:36:34'),
(2, 1, 'responsable_rh', 1, NULL, '2025-06-23 20:42:02'),
(3, 2, 'manager', 1, NULL, '2025-07-02 16:47:06');

-- --------------------------------------------------------

--
-- Table structure for table `ressource`
--

CREATE TABLE `ressource` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tache`
--

CREATE TABLE `tache` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `ddr` datetime DEFAULT NULL,
  `dfr` datetime DEFAULT NULL,
  `status` enum('pending','done','forwarded','cancel') DEFAULT 'pending',
  `valide_manager` tinyint(1) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tache`
--

INSERT INTO `tache` (`id`, `intitule`, `description`, `ddr`, `dfr`, `status`, `valide_manager`, `manager_id`) VALUES
(4, 'Front-end Dev', 'create a front-end UI interface ', '2025-06-07 08:00:00', '2025-06-30 06:06:00', 'pending', NULL, 20),
(5, 'Back-end dev', 'Implement API Calls', '2025-06-27 00:00:00', '2025-06-30 07:07:00', 'pending', NULL, 20),
(7, 'Ui interface', 'create a ui interface using figma to have an initial idea ', '2025-06-09 00:00:00', '2025-06-13 00:00:00', 'pending', NULL, 20);

-- --------------------------------------------------------

--
-- Table structure for table `tache_employe`
--

CREATE TABLE `tache_employe` (
  `id` int(11) NOT NULL,
  `tache_id` int(11) DEFAULT NULL,
  `employe_id` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tache_employe`
--

INSERT INTO `tache_employe` (`id`, `tache_id`, `employe_id`, `assigned_at`) VALUES
(7, 5, 12, '2025-06-08 17:53:48'),
(8, 4, 12, '2025-06-08 20:36:50');

-- --------------------------------------------------------

--
-- Table structure for table `types`
--

CREATE TABLE `types` (
  `id` int(11) NOT NULL,
  `designation` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `types`
--

INSERT INTO `types` (`id`, `designation`) VALUES
(1, 'direction'),
(2, 'département'),
(3, 'service');

-- --------------------------------------------------------

--
-- Table structure for table `type_attestation`
--

CREATE TABLE `type_attestation` (
  `id` int(11) NOT NULL,
  `intitule` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `type_attestation`
--

INSERT INTO `type_attestation` (`id`, `intitule`) VALUES
(1, 'Attestation de travail'),
(2, 'Certificat de travail'),
(3, 'Attestation de congé'),
(4, 'Attestation de salaire');

-- --------------------------------------------------------

--
-- Table structure for table `type_conge`
--

CREATE TABLE `type_conge` (
  `id` int(11) NOT NULL,
  `intitule` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `type_conge`
--

INSERT INTO `type_conge` (`id`, `intitule`) VALUES
(1, 'Congé annuel payé'),
(2, 'Congé maladie'),
(3, 'Congé maternité'),
(4, 'Congé social');

-- --------------------------------------------------------

--
-- Table structure for table `type_note_frais`
--

CREATE TABLE `type_note_frais` (
  `id` int(11) NOT NULL,
  `intitule` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `type_note_frais`
--

INSERT INTO `type_note_frais` (`id`, `intitule`) VALUES
(1, 'Transport'),
(2, 'Repas'),
(3, 'Hébergement'),
(4, 'Frais divers'),
(5, 'avance');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('employe','manager','responsable_rh') DEFAULT NULL,
  `employe_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `employe_id`) VALUES
(15, 'Hamza', 'hamzazily@gmail.com', '$2b$10$ZpuxFVeyhPXXKmGc5fs7kOVemYvK34DB/O8A.rhbAf9l7DeztJbyK', 'employe', 3),
(16, 'Ez-zouek 	Hamza', 'zawak@gmail.com', '$2b$10$dw.3dxdK3VplwxEkRvFequ4MkKN41djaiagFXm.8UQBMkJw7BB.Km', 'employe', 12),
(17, 'Hamza', 'Admin@admin.com', '$2b$10$d8h03MzUgifM8PWrYmAfzO1B62gvHnC5u/dOUEqwTOWS3dl9HkOTK', 'manager', 20),
(18, 'khadraoui khalil', 'khalil@gmail.com', '$2b$10$EpwNHTJhQ6xV5Fz2WqWHd.0jTGtT5OibQxG0aWAz6BUlLrnmoqFnS', 'employe', 13),
(19, 'muntaadacom', 'muntaadacom@gmail.com', '$2b$10$Y4Km4XGs0XexmazlMqB1C.OFkoCOAgem5qD4OJUKBV.8ju4eCMgqu', 'manager', 20),
(23, 'Responsable RH', 'responsable_rh@gmail.com', '$2b$10$Z7yprR1HWbeRToCQOsirYuoZ0kPkIBowDXQSX6mXOM4ACxuK5Zxru', 'responsable_rh', NULL),
(24, 'zineb elhlou', 'zinebelhlou@gmail.com', '$2b$10$OxYLzVwxGIkQ3ioc1ZC87u1Sof8IC/Fnw4Ho.9lqEEnOxzOa.fYh.', 'manager', 21);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absence_validations`
--
ALTER TABLE `absence_validations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_demande_absence` (`id_demande_absence`);

--
-- Indexes for table `action`
--
ALTER TABLE `action`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tache_employe_id` (`tache_employe_id`);

--
-- Indexes for table `attestation_documents`
--
ALTER TABLE `attestation_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_attestation` (`id_attestation`);

--
-- Indexes for table `attestation_validations`
--
ALTER TABLE `attestation_validations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attestation_id` (`attestation_id`,`validator_role`);

--
-- Indexes for table `conge_validations`
--
ALTER TABLE `conge_validations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_demande_conge` (`id_demande_conge`);

--
-- Indexes for table `demande_absence`
--
ALTER TABLE `demande_absence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_employe` (`id_employe`);

--
-- Indexes for table `demande_attestation`
--
ALTER TABLE `demande_attestation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employe_id` (`employe_id`),
  ADD KEY `type_id` (`type_id`);

--
-- Indexes for table `demande_conge`
--
ALTER TABLE `demande_conge`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_employe` (`id_employe`),
  ADD KEY `type_id` (`type_id`);

--
-- Indexes for table `demande_note_frais`
--
ALTER TABLE `demande_note_frais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `type_id` (`type_id`),
  ADD KEY `id_employe` (`id_employe`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employe_id` (`employe_id`);

--
-- Indexes for table `employes`
--
ALTER TABLE `employes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `responsable_id` (`manager_id`),
  ADD KEY `entite_id` (`entite_id`);

--
-- Indexes for table `employe_info`
--
ALTER TABLE `employe_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employe_id` (`employe_id`);

--
-- Indexes for table `entites`
--
ALTER TABLE `entites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `type_id` (`type_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `info_employes`
--
ALTER TABLE `info_employes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `intitule` (`intitule`);

--
-- Indexes for table `note_frais_validations`
--
ALTER TABLE `note_frais_validations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_note_frais` (`id_note_frais`);

--
-- Indexes for table `ressource`
--
ALTER TABLE `ressource`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tache`
--
ALTER TABLE `tache`
  ADD PRIMARY KEY (`id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indexes for table `tache_employe`
--
ALTER TABLE `tache_employe`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tache_id` (`tache_id`,`employe_id`),
  ADD KEY `employe_id` (`employe_id`);

--
-- Indexes for table `types`
--
ALTER TABLE `types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `type_attestation`
--
ALTER TABLE `type_attestation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `type_conge`
--
ALTER TABLE `type_conge`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `type_note_frais`
--
ALTER TABLE `type_note_frais`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employe_id` (`employe_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absence_validations`
--
ALTER TABLE `absence_validations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `action`
--
ALTER TABLE `action`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attestation_documents`
--
ALTER TABLE `attestation_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `attestation_validations`
--
ALTER TABLE `attestation_validations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `conge_validations`
--
ALTER TABLE `conge_validations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `demande_absence`
--
ALTER TABLE `demande_absence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `demande_attestation`
--
ALTER TABLE `demande_attestation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `demande_conge`
--
ALTER TABLE `demande_conge`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `demande_note_frais`
--
ALTER TABLE `demande_note_frais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `employes`
--
ALTER TABLE `employes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `employe_info`
--
ALTER TABLE `employe_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `entites`
--
ALTER TABLE `entites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `info_employes`
--
ALTER TABLE `info_employes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `note_frais_validations`
--
ALTER TABLE `note_frais_validations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ressource`
--
ALTER TABLE `ressource`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tache`
--
ALTER TABLE `tache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tache_employe`
--
ALTER TABLE `tache_employe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `types`
--
ALTER TABLE `types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `type_attestation`
--
ALTER TABLE `type_attestation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `type_conge`
--
ALTER TABLE `type_conge`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `type_note_frais`
--
ALTER TABLE `type_note_frais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absence_validations`
--
ALTER TABLE `absence_validations`
  ADD CONSTRAINT `absence_validations_ibfk_1` FOREIGN KEY (`id_demande_absence`) REFERENCES `demande_absence` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `action`
--
ALTER TABLE `action`
  ADD CONSTRAINT `action_ibfk_1` FOREIGN KEY (`tache_employe_id`) REFERENCES `tache_employe` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attestation_documents`
--
ALTER TABLE `attestation_documents`
  ADD CONSTRAINT `attestation_documents_ibfk_1` FOREIGN KEY (`id_attestation`) REFERENCES `demande_attestation` (`id`);

--
-- Constraints for table `attestation_validations`
--
ALTER TABLE `attestation_validations`
  ADD CONSTRAINT `attestation_validations_ibfk_1` FOREIGN KEY (`attestation_id`) REFERENCES `demande_attestation` (`id`);

--
-- Constraints for table `conge_validations`
--
ALTER TABLE `conge_validations`
  ADD CONSTRAINT `conge_validations_ibfk_1` FOREIGN KEY (`id_demande_conge`) REFERENCES `demande_conge` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `demande_absence`
--
ALTER TABLE `demande_absence`
  ADD CONSTRAINT `demande_absence_ibfk_1` FOREIGN KEY (`id_employe`) REFERENCES `employes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `demande_attestation`
--
ALTER TABLE `demande_attestation`
  ADD CONSTRAINT `demande_attestation_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`),
  ADD CONSTRAINT `demande_attestation_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `type_attestation` (`id`);

--
-- Constraints for table `demande_conge`
--
ALTER TABLE `demande_conge`
  ADD CONSTRAINT `demande_conge_ibfk_1` FOREIGN KEY (`id_employe`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demande_conge_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `type_conge` (`id`);

--
-- Constraints for table `demande_note_frais`
--
ALTER TABLE `demande_note_frais`
  ADD CONSTRAINT `demande_note_frais_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `type_note_frais` (`id`),
  ADD CONSTRAINT `demande_note_frais_ibfk_2` FOREIGN KEY (`id_employe`) REFERENCES `employes` (`id`);

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employes`
--
ALTER TABLE `employes`
  ADD CONSTRAINT `employes_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `employes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employes_ibfk_2` FOREIGN KEY (`entite_id`) REFERENCES `entites` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employe_info`
--
ALTER TABLE `employe_info`
  ADD CONSTRAINT `employe_info_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `entites`
--
ALTER TABLE `entites`
  ADD CONSTRAINT `entites_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `types` (`id`),
  ADD CONSTRAINT `entites_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `entites` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `note_frais_validations`
--
ALTER TABLE `note_frais_validations`
  ADD CONSTRAINT `note_frais_validations_ibfk_1` FOREIGN KEY (`id_note_frais`) REFERENCES `demande_note_frais` (`id`);

--
-- Constraints for table `tache`
--
ALTER TABLE `tache`
  ADD CONSTRAINT `tache_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `employes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tache_employe`
--
ALTER TABLE `tache_employe`
  ADD CONSTRAINT `tache_employe_ibfk_1` FOREIGN KEY (`tache_id`) REFERENCES `tache` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tache_employe_ibfk_2` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
