CREATE TABLE `mc_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(45) DEFAULT NULL,
  `checksum` varchar(72) DEFAULT NULL,
  `timestamp` varchar(45) DEFAULT NULL,
  `dataset` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
