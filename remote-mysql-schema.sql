-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 05, 2026 at 03:59 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `navis_localdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `query1`
--

CREATE TABLE `query1` (
  `id` int(10) NOT NULL,
  `vessel_id` varchar(255) DEFAULT NULL,
  `vessel_name` varchar(255) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `loa_cm` double DEFAULT 0,
  `loa_meters` double DEFAULT 0,
  `ata` datetime DEFAULT NULL,
  `atd` datetime DEFAULT NULL,
  `etd` datetime DEFAULT NULL,
  `discharged` double DEFAULT 0,
  `discharged_moves_per_hour` double DEFAULT NULL,
  `discharged_ec_in` double DEFAULT 0,
  `loaded` double DEFAULT 0,
  `loaded_moves_per_hour` double DEFAULT NULL,
  `total_discharge` double DEFAULT 0,
  `total_load` double DEFAULT 0,
  `total_moves` double DEFAULT NULL,
  `restow` double DEFAULT NULL,
  `shob` double DEFAULT NULL,
  `time_range` varchar(100) DEFAULT NULL,
  `berth` varchar(100) DEFAULT NULL,
  `graph_path` varchar(255) DEFAULT NULL,
  `extraction_time` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
