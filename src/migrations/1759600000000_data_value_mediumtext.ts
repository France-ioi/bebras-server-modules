module.exports = {
    "up": "ALTER TABLE `data` MODIFY `value` MEDIUMTEXT NOT NULL",
    "down": "ALTER TABLE `data` MODIFY `value` TEXT NOT NULL",
}
