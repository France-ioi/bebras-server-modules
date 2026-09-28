module.exports = {
    "up": "ALTER TABLE `graders` ADD `task_dir` VARCHAR(500) NULL DEFAULT NULL",
    "down": "ALTER TABLE `graders` DROP `task_dir`",
}
