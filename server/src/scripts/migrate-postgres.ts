#!/usr/bin/env bun

import { dbService } from '../services/database.ts';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runPostgreSQLMigrations() {
  try {
    console.log('🚀 Running PostgreSQL migrations...');

    // Read and execute the initial schema
    const schemaPath = join(
      import.meta.dir,
      '../migrations/postgresql/001_initial_schema.sql'
    );
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      try {
        await dbService.query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Migration error:', error);
          throw error;
        }
      }
    }

    console.log('✅ PostgreSQL migrations completed successfully!');

    // Get database stats
    const userCount = await dbService.query(
      'SELECT COUNT(*) as count FROM users'
    );
    const roomCount = await dbService.query(
      'SELECT COUNT(*) as count FROM rooms'
    );
    const messageCount = await dbService.query(
      'SELECT COUNT(*) as count FROM messages'
    );

    console.log('\n📊 Database Stats:');
    console.log(`  Total Users: ${userCount[0].count}`);
    console.log(`  Total Rooms: ${roomCount[0].count}`);
    console.log(`  Total Messages: ${messageCount[0].count}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Run migrations if this script is executed directly
if (import.meta.main) {
  runPostgreSQLMigrations();
}
