import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('auth_id', 'text', (col) => col.unique())
    .addColumn('username', 'text', (col) => col.unique())
    .addColumn('email', 'text', (col) => col.unique())
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createTable('rooms')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('name', 'text')
    .addColumn('type', 'text')
    .addColumn('created_by', 'integer')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createTable('messages')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('room_id', 'integer')
    .addColumn('user_id', 'integer')
    .addColumn('content', 'text')
    .addColumn('type', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('edited_at', 'timestamp')
    .addColumn('deleted_at', 'timestamp')
    .execute();

  await db.schema
    .createTable('room_members')
    .addColumn('room_id', 'integer')
    .addColumn('user_id', 'integer')
    .addColumn('joined_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('role', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute();
  await db.schema.dropTable('rooms').execute();
  await db.schema.dropTable('messages').execute();
  await db.schema.dropTable('room_members').execute();
}
