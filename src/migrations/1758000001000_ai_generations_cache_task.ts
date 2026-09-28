module.exports = {
    "up": `ALTER TABLE \`ai_generations_cache\`
        ADD \`task_id\`         VARCHAR(255) NULL DEFAULT NULL,
        ADD \`user_id\`         BIGINT       NULL DEFAULT NULL,
        ADD \`platform_id\`     BIGINT       NULL DEFAULT NULL,
        ADD \`prompt\`          MEDIUMTEXT   NULL DEFAULT NULL,
        ADD \`model\`           VARCHAR(255) NULL DEFAULT NULL,
        ADD \`generation_type\` VARCHAR(16)  NULL DEFAULT NULL,
        ADD \`created_at\`      DATETIME     NULL DEFAULT NULL,
        ADD INDEX ai_generations_cache_task_id_index (\`task_id\`)`,
    "down": `ALTER TABLE \`ai_generations_cache\`
        DROP INDEX ai_generations_cache_task_id_index,
        DROP \`task_id\`,
        DROP \`user_id\`,
        DROP \`platform_id\`,
        DROP \`prompt\`,
        DROP \`model\`,
        DROP \`generation_type\`,
        DROP \`created_at\``,
}
