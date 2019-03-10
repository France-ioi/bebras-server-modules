module.exports = {
    "up": "CREATE TABLE `graders` (\
        `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        `task_id` varchar(255) NOT NULL,\
        `data` text NOT NULL,\
        UNIQUE (task_id)\
      ) ENGINE='InnoDB';",
    "down": "DROP TABLE IF EXISTS `graders`"
}