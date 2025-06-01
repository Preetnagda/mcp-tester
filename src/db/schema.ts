import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const mcpServers = pgTable('mcp_servers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  headers: jsonb('headers').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert; 