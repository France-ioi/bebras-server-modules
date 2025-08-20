module.exports = {
    "up": `CREATE TABLE \`task_advancement\`
           (
               \`id\`          INT          NOT NULL AUTO_INCREMENT,
               \`user_id\`     BIGINT       NOT NULL,
               \`platform_id\` BIGINT       NOT NULL,
               \`key\`         VARCHAR(255) NOT NULL,
               \`value\`       TEXT         NOT NULL,
               \`duration\`    INT          NOT NULL DEFAULT '0',
               \`updated_at\`  DATETIME     NOT NULL,
               PRIMARY KEY (\`id\`),
               UNIQUE data_user_id_platform_id_key_unique (\`user_id\`, \`platform_id\`, \`key\`)
           ) ENGINE = InnoDB;`,
    "down": "DROP TABLE IF EXISTS \`task_advancement\`",
}