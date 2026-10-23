import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),secret:text('secret').notNull(),data:text('data').notNull(),version:integer('version').notNull().default(0)});
export const sessions=sqliteTable('sessions',{token:text('token').primaryKey(),room:text('room').notNull(),role:text('role').notNull(),studentId:text('student_id'),expires:integer('expires').notNull()});
