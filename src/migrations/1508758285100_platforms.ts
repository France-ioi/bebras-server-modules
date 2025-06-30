export default {
    "up": "CREATE TABLE `platforms` (\
        `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        `name` varchar(255) NOT NULL,\
        `public_key` text NOT NULL\
      ) ENGINE='InnoDB';",
    "down": "DROP TABLE IF EXISTS `platforms`"
}