#!/usr/bin/env bun

import { db } from "../utils/database";

console.log("🚀 Running database migrations...");

try {
  await db.runMigrations();
  console.log("✅ All migrations completed successfully!");
  
  // Show database stats
  const stats = db.getStats();
  console.log("\n📊 Database Stats:");
  console.log(`  Total Users: ${stats.totalUsers}`);
  console.log(`  Total Rooms: ${stats.totalRooms}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Active Rooms (24h): ${stats.activeRoomsLast24h}`);
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}