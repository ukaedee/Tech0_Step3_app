-- MySQL dump 10.13  Distrib 9.2.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: employee_database
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `icon_url` text,
  `department` text,
  `role` enum('admin','employee') DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `temp_password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `ix_employees_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'123','テスト従業員','test@example.com','$2b$12$kz5KDqkyXN3H3nXHWhRnM.vTQLZ1B1SXEcz/hZpZk1pd2gIRxD662',NULL,NULL,'employee','2025-02-01 14:44:52','2025-02-01 14:44:52',NULL),(3,'124356','テスト','test+1@example.com','$2b$12$vve8VMb2Seo4W71CfsntRuBadU0sCo/SPgCkyjivTRYg5MG42YO8O',NULL,NULL,'employee','2025-02-01 14:50:11','2025-02-01 14:50:11',NULL),(4,'1234','テスト従業員','test@gmail.com','$2b$12$qZ1z3Lh2n4fL1gLUmLl2te8ngQmbEInk1I.1OmCecj2hU5/528kje',NULL,NULL,'employee','2025-02-01 14:51:52','2025-02-01 14:51:52',NULL),(6,'75893','テストくん','test+294@gmail.com','$2b$12$4JRKcQH9/yC/.3kGCnY.x.s2Z1fxNt9YHBU8VAKq590/oCQI4TO9W',NULL,NULL,'employee','2025-02-01 14:55:40','2025-02-01 14:55:40',NULL),(7,'1031','上江田','kaede@gmali.com','$2b$12$ZQ/5nTIYy.irzC12J/UMsec6gmdr3RKP3Sk8OX58uIWeuURpOSxEi',NULL,NULL,'employee','2025-02-01 15:00:48','2025-02-01 15:00:48',NULL),(8,'1948','テストちゃん','test@company.com','$2b$12$n4TLBUh8I16/mVABT4/Up.ITpySDud5Dz/SKvF2lKN551k/OE3FcC','http://localhost:8001/uploads/1948_20250201_154652.jpg','','employee','2025-02-01 15:23:32','2025-02-01 15:46:52','qdpoCLSlEa0'),(9,'146','adminさん','admin@test.com','0000',NULL,NULL,'admin',NULL,NULL,'0000'),(13,'admin','管理者','admin@example.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFX.gtkv4iXTEga','','管理部','admin','2025-02-01 16:25:11','2025-02-01 16:29:32','temp123');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-02 15:49:42
