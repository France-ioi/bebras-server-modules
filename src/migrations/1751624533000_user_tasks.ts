module.exports = {
    "up": `CREATE TABLE \`ai_generations\`
       (
           \`id\`                int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
           \`task_id\`           varchar(255) NOT NULL,
           \`user_id\`           BIGINT   NOT NULL,
           \`platform_id\`       BIGINT   NOT NULL,
           \`generations\`          INT      NOT NULL,
           \`last_generation_date\` DATETIME NOT NULL,
           \`last_generation_id\`  BIGINT NOT NULL,
           \`last_generation_result\` varchar(500) DEFAULT NULL,
           UNIQUE data_task_id_user_id_platform_id (\`task_id\`, \`user_id\`, \`platform_id\`),
           INDEX data_task_id_index (\`task_id\`),
           INDEX data_platform_id_index (\`platform_id\`)
         ) ENGINE = InnoDB;`,
    "down": "DROP TABLE IF EXISTS \`ai_generations\`",
}