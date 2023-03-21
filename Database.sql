-- --------------------------------------------------------
-- Hostitel:                     127.0.0.1
-- Verze serveru:                8.0.32 - MySQL Community Server - GPL
-- OS serveru:                   Win64
-- HeidiSQL Verze:               11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Exportování struktury databáze pro
CREATE DATABASE IF NOT EXISTS `signalserver` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `signalserver`;

-- Exportování struktury pro tabulka signalserver.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Message` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Sended` tinyint(1) NOT NULL DEFAULT '0',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `MUI_Subject` (`Subject`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportování dat pro tabulku signalserver.messages: ~0 rows (přibližně)
DELETE FROM `messages`;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` (`Id`, `Subject`, `Message`, `Sended`, `Timestamp`) VALUES
	(1, 'test ', 'zpráva ěšččřžýáíéů', 0, '2023-03-14 14:06:59');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;

-- Exportování struktury pro tabulka signalserver.recipientphones
CREATE TABLE IF NOT EXISTS `recipientphones` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PhoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Unavailable` tinyint(1) DEFAULT NULL,
  `Unsubscribed` tinyint(1) DEFAULT NULL,
  `Timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `RPUI_PhoneNumber` (`PhoneNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportování dat pro tabulku signalserver.recipientphones: ~1 rows (přibližně)
DELETE FROM `recipientphones`;
/*!40000 ALTER TABLE `recipientphones` DISABLE KEYS */;
INSERT INTO `recipientphones` (`Id`, `PhoneNumber`, `Unavailable`, `Unsubscribed`, `Timestamp`) VALUES
	(1, 'bnmbnmbnm', NULL, NULL, '2023-03-14 19:10:15');
/*!40000 ALTER TABLE `recipientphones` ENABLE KEYS */;

-- Exportování struktury pro tabulka signalserver.senderphones
CREATE TABLE IF NOT EXISTS `senderphones` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PhoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `UserName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Password` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Token` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `FailCount` int NOT NULL DEFAULT '0',
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `SPUI_PhoneNumber` (`PhoneNumber`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportování dat pro tabulku signalserver.senderphones: ~0 rows (přibližně)
DELETE FROM `senderphones`;
/*!40000 ALTER TABLE `senderphones` DISABLE KEYS */;
INSERT INTO `senderphones` (`Id`, `PhoneNumber`, `UserName`, `Password`, `Token`, `FailCount`, `Active`, `Timestamp`) VALUES
	(1, '724986873', 'libor', 'heslo', NULL, 0, 1, '2023-03-14 14:00:05');
/*!40000 ALTER TABLE `senderphones` ENABLE KEYS */;

-- Exportování struktury pro tabulka signalserver.sendingstatuses
CREATE TABLE IF NOT EXISTS `sendingstatuses` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `MessageId` int NOT NULL,
  `SenderId` int NOT NULL,
  `RecipientId` int NOT NULL,
  `Sended` tinyint(1) NOT NULL DEFAULT '0',
  `ErrorMessage` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `SSUI_TaskKey` (`RecipientId`,`MessageId`,`SenderId`) USING BTREE,
  KEY `SSI_RecipipentId` (`RecipientId`),
  KEY `SSI_MessageId` (`MessageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportování dat pro tabulku signalserver.sendingstatuses: ~0 rows (přibližně)
DELETE FROM `sendingstatuses`;
/*!40000 ALTER TABLE `sendingstatuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `sendingstatuses` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
