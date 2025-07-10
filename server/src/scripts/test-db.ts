#!/usr/bin/env bun

import { db } from "../utils/database";

console.log("🧪 Testing database layer...");

async function testDatabase() {
  try {
    // Test database health
    const isHealthy = db.checkHealth();
    console.log(`Database health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    
    if (!isHealthy) {
      throw new Error("Database is not healthy");
    }

    // Test user creation
    console.log("\n👤 Testing user operations...");
    const timestamp = Date.now();
    const testUser = db.users.create({
      name: "Test User",
      email: `test-${timestamp}@example.com`,
      username: `testuser-${timestamp}`,
      avatar_url: "https://example.com/avatar.jpg",
      password_hash: null,
      emailVerified: null,
      image: null,
    });
    console.log("✅ User created:", testUser.username);

    // Test user retrieval
    const foundUser = db.users.findByEmail(`test-${timestamp}@example.com`);
    console.log("✅ User found by email:", foundUser?.username);

    // Test room creation
    console.log("\n🏠 Testing room operations...");
    const testRoom = db.rooms.create({
      name: "Test Room",
      type: "group",
      created_by: testUser.id,
    });
    console.log("✅ Room created:", testRoom.name);

    // Test room membership
    console.log("\n👥 Testing room membership...");
    db.roomMembers.addMember(testRoom.id, testUser.id, "admin");
    const isMember = db.roomMembers.isMember(testRoom.id, testUser.id);
    console.log("✅ User is member:", isMember);

    // Test message creation
    console.log("\n💬 Testing message operations...");
    const testMessage = db.messages.create({
      room_id: testRoom.id,
      user_id: testUser.id,
      content: "Hello, this is a test message!",
      type: "text",
    });
    console.log("✅ Message created:", testMessage.content);

    // Test message retrieval
    const roomMessages = db.messages.findByRoom(testRoom.id);
    console.log("✅ Messages in room:", roomMessages.length);

    // Test stats
    console.log("\n📊 Database stats:");
    const stats = db.getStats();
    console.log(`  Users: ${stats.totalUsers}`);
    console.log(`  Rooms: ${stats.totalRooms}`);
    console.log(`  Messages: ${stats.totalMessages}`);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    db.messages.delete(testMessage.id);
    db.roomMembers.removeMember(testRoom.id, testUser.id);
    db.rooms.delete(testRoom.id);
    db.users.delete(testUser.id);
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    throw error;
  }
}

// Run the test
testDatabase()
  .then(() => {
    console.log("✅ Database layer test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database layer test failed:", error);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });