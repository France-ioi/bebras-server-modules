module.exports = {
    "up": `ALTER TABLE \`ai_generations\` DROP \`last_generation_result\`; `,
    "down": "ALTER TABLE `ai_generations` ADD `last_generation_result` VARCHAR(255) NULL AFTER `last_generation_id`;",
}