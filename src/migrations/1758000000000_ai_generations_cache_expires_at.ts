module.exports = {
    "up": "ALTER TABLE `ai_generations_cache` ADD `expires_at` DATETIME NULL DEFAULT NULL",
    "down": "ALTER TABLE `ai_generations_cache` DROP `expires_at`",
}
