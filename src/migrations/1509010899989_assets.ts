export default {
    "up": "CREATE TABLE `assets` (\
        `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        `task_id` varchar(255) NOT NULL,\
        `random_seed` int unsigned NOT NULL,\
        `key` varchar(255) NOT NULL,\
        `path` varchar(255) NOT NULL,\
        INDEX data_task_id_index (`task_id`),\
        UNIQUE data_task_id_random_seed_key_unique (`task_id`, `random_seed`, `key`)\
      ) ENGINE='InnoDB'",
    "down": "DROP TABLE IF EXISTS `assets`"
}