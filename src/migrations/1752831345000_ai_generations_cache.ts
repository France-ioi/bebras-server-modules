module.exports = {
    "up": `CREATE TABLE \`ai_generations_cache\`
           (
               \`id\`                INT    NOT NULL AUTO_INCREMENT,
               \`generation_id\`     BIGINT NOT NULL,
               \`generation_result\` TEXT   NOT NULL,
               PRIMARY KEY (\`id\`),
               UNIQUE generation_id_unique (\`generation_id\`)
           ) ENGINE = InnoDB`,
    "down": "DROP TABLE IF EXISTS \`ai_generations_cache\`",
}