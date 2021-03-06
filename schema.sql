-- MySQL dump 10.13  Distrib 5.7.33, for Linux (x86_64)
--
-- Host: localhost    Database: kungfuchess
-- ------------------------------------------------------
-- Server version	5.7.33-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_log`
--

DROP TABLE IF EXISTS `chat_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_log` (
  `chat_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) DEFAULT NULL,
  `comment_text` text NOT NULL,
  `player_id` int(11) NOT NULL,
  `post_time` datetime NOT NULL,
  PRIMARY KEY (`chat_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forum_comment`
--

DROP TABLE IF EXISTS `forum_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_comment` (
  `forum_comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `forum_post_id` int(11) NOT NULL,
  `comment_text` text NOT NULL,
  `player_id` int(11) NOT NULL,
  `post_time` datetime NOT NULL,
  PRIMARY KEY (`forum_comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forum_post`
--

DROP TABLE IF EXISTS `forum_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_post` (
  `forum_post_id` int(11) NOT NULL AUTO_INCREMENT,
  `category` enum('chess','feedback','off-topic') NOT NULL,
  `post_title` varchar(255) NOT NULL,
  `post_text` text NOT NULL,
  `player_id` int(11) NOT NULL,
  `post_time` datetime NOT NULL,
  PRIMARY KEY (`forum_post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_log`
--

DROP TABLE IF EXISTS `game_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_log` (
  `game_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `opponent_id` int(11) NOT NULL,
  `game_type` enum('standard','lightning') NOT NULL,
  `result` enum('win','draw','loss') NOT NULL,
  `rating_before` int(11) DEFAULT NULL,
  `rating_after` int(11) DEFAULT NULL,
  `opponent_rating_before` int(11) DEFAULT NULL,
  `opponent_rating_after` int(11) DEFAULT NULL,
  `rated` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`game_log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `games` (
  `game_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_speed` enum('standard','lightning') NOT NULL DEFAULT 'standard',
  `game_type` enum('2way','4way') NOT NULL DEFAULT '2way',
  `time_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `time_ended` datetime DEFAULT NULL,
  `white_player` int(11) DEFAULT NULL,
  `black_player` int(11) DEFAULT NULL,
  `red_player` int(11) DEFAULT NULL,
  `green_player` int(11) DEFAULT NULL,
  `white_rating` int(11) DEFAULT NULL,
  `black_rating` int(11) DEFAULT NULL,
  `red_rating` int(11) DEFAULT NULL,
  `green_rating` int(11) DEFAULT NULL,
  `result` varchar(80) DEFAULT NULL,
  `score` varchar(40) DEFAULT NULL,
  `status` enum('waiting to begin','active','finished') NOT NULL DEFAULT 'waiting to begin',
  `rated` tinyint(4) DEFAULT '1',
  `white_anon_key` varchar(90) DEFAULT NULL,
  `black_anon_key` varchar(90) DEFAULT NULL,
  `red_anon_key` varchar(90) DEFAULT NULL,
  `green_anon_key` varchar(90) DEFAULT NULL,
  `final_position` text,
  `game_log` text,
  PRIMARY KEY (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=721 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger t_games_b_insert before insert on games
for each row begin
    IF(new.game_speed) = 'lightning' THEN 
        set @white_rating := ( SELECT rating_standard FROM players WHERE player_id = new.white_player ); 
        set @black_rating := ( SELECT rating_standard FROM players WHERE player_id = new.black_player ); 
    ELSE
        set @white_rating := ( SELECT rating_standard FROM players WHERE player_id = new.white_player ); 
        set @black_rating := ( SELECT rating_standard FROM players WHERE player_id = new.black_player ); 
    END IF;

    set new.white_rating= @white_rating;
    set new.black_rating= @black_rating;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger t_games_b_update before update on games
for each row begin
    IF(new.game_speed) = 'lightning' THEN 
        set @white_rating := ( SELECT rating_standard FROM players WHERE player_id = new.white_player ); 
        set @black_rating := ( SELECT rating_standard FROM players WHERE player_id = new.black_player ); 
    ELSE
        set @white_rating := ( SELECT rating_standard FROM players WHERE player_id = new.white_player ); 
        set @black_rating := ( SELECT rating_standard FROM players WHERE player_id = new.black_player ); 
    END IF;
    set new.white_rating= @white_rating;
    set new.black_rating= @black_rating;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `players` (
  `player_id` int(11) NOT NULL AUTO_INCREMENT,
  `screenname` varchar(30) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rating_standard` int(11) NOT NULL DEFAULT '0',
  `rating_lightning` int(11) NOT NULL DEFAULT '1600',
  `games_played_standard` int(11) NOT NULL DEFAULT '0',
  `games_played_lightning` int(11) NOT NULL DEFAULT '0',
  `games_won_standard` int(11) NOT NULL DEFAULT '0',
  `games_won_lightning` int(11) NOT NULL DEFAULT '0',
  `games_drawn_standard` int(11) NOT NULL DEFAULT '0',
  `games_drawn_lightning` int(11) NOT NULL DEFAULT '0',
  `games_lost_standard` int(11) NOT NULL DEFAULT '0',
  `games_lost_lightning` int(11) NOT NULL DEFAULT '0',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_seen` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `auth_token` varchar(255) DEFAULT NULL,
  `default_minimum_rating` int(11) DEFAULT '-200',
  `default_maximum_rating` int(11) DEFAULT '200',
  PRIMARY KEY (`player_id`),
  UNIQUE KEY `screenname` (`screenname`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pool`
--

DROP TABLE IF EXISTS `pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pool` (
  `player_id` int(11) NOT NULL,
  `rated` tinyint(4) NOT NULL DEFAULT '1',
  `entered_pool` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_ping` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `matched_game` int(11) DEFAULT NULL,
  `in_matching_pool` tinyint(4) NOT NULL DEFAULT '1',
  `open_to_public` tinyint(4) NOT NULL DEFAULT '1',
  `private_game_key` varchar(255) DEFAULT NULL,
  `game_speed` enum('standard','lightning') NOT NULL DEFAULT 'standard',
  `game_type` enum('2way','4way') NOT NULL DEFAULT '2way',
  `challenge_player_id` int(11) DEFAULT NULL,
  UNIQUE KEY `player_id` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-04-04 14:03:31
