package com.moodcast.chat.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureGroupChatSchema() {
        if (hasColumn("chat_room_member", "last_read_at")) {
            ensureColumn("chat_room_member", "last_read_message_id", "BIGINT NULL");
            return;
        }

        jdbcTemplate.execute("ALTER TABLE chat_room_member ADD COLUMN last_read_at DATETIME(6) NULL AFTER left_at");
        ensureColumn("chat_room_member", "last_read_message_id", "BIGINT NULL AFTER last_read_at");
    }

    private void ensureColumn(String tableName, String columnName, String ddlFragment) {
        if (hasColumn(tableName, columnName)) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + ddlFragment);
    }

    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );

        return count != null && count > 0;
    }
}
