module.exports = {
    "up": "CREATE TABLE `data` (\
        `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        `task_id` int unsigned NOT NULL,\
        `random_seed` int unsigned NOT NULL,\
        `key` varchar(255) NOT NULL,\
        `value` text NOT NULL,\
        `duration` int unsigned NOT NULL DEFAULT '0',\
        `updated_at` timestamp NOT NULL,\
        INDEX data_task_id_index (`task_id`),\
        UNIQUE data_task_id_random_seed_key_unique (`task_id`, `random_seed`, `key`)\
      ) ENGINE='InnoDB'",
    "down": "DROP TABLE IF EXISTS `data`"
}