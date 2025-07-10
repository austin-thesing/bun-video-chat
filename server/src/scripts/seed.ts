#!/usr/bin/env bun

import { db } from "../utils/database";

console.log("🌱 Seeding database with sample data...");

try {
  // Create sample users
  const users = [
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_j",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      password_hash: null,
      emailVerified: null,
      image: null,
    },
    {
      name: "Bob Smith",
      email: "bob@example.com",
      username: "bob_smith",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      password_hash: null,
      emailVerified: null,
      image: null,
    },
    {
      name: "Charlie Brown",
      email: "charlie@example.com",
      username: "charlie_b",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
      password_hash: null,
      emailVerified: null,
      image: null,
    },
  ];

  console.log("👥 Creating sample users...");
  const createdUsers = users.map(user => db.users.create(user));
  console.log(`✅ Created ${createdUsers.length} users`);

  // Create sample rooms
  console.log("🏠 Creating sample rooms...");
  const room1 = db.rooms.create({
    name: "General Discussion",
    type: "group",
    created_by: createdUsers[0].id,
  });

  const room2 = db.rooms.create({
    name: "Project Planning",
    type: "group",
    created_by: createdUsers[1].id,
  });

  // Create direct room between Alice and Bob
  const directRoom = db.rooms.createDirectRoom(createdUsers[0].id, createdUsers[1].id);

  console.log("✅ Created 3 rooms");

  // Add members to rooms
  console.log("👥 Adding members to rooms...");
  
  // Add all users to General Discussion
  for (const user of createdUsers) {
    db.roomMembers.addMember(room1.id, user.id, user.id === createdUsers[0].id ? 'admin' : 'member');
  }

  // Add Alice and Bob to Project Planning
  db.roomMembers.addMember(room2.id, createdUsers[0].id, 'member');
  db.roomMembers.addMember(room2.id, createdUsers[1].id, 'admin');

  // Add Alice and Bob to their direct room
  db.roomMembers.addMember(directRoom.id, createdUsers[0].id, 'member');
  db.roomMembers.addMember(directRoom.id, createdUsers[1].id, 'member');

  console.log("✅ Added room members");

  // Create sample messages
  console.log("💬 Creating sample messages...");
  
  const messages = [
    {
      room_id: room1.id,
      user_id: createdUsers[0].id,
      content: "Hello everyone! Welcome to our chat app!",
      type: "text",
    },
    {
      room_id: room1.id,
      user_id: createdUsers[1].id,
      content: "Hi Alice! This looks great 👍",
      type: "text",
    },
    {
      room_id: room1.id,
      user_id: createdUsers[2].id,
      content: "Hey team! Excited to be here!",
      type: "text",
    },
    {
      room_id: room2.id,
      user_id: createdUsers[1].id,
      content: "Let's discuss our project roadmap",
      type: "text",
    },
    {
      room_id: room2.id,
      user_id: createdUsers[0].id,
      content: "Sounds good! I've prepared some notes.",
      type: "text",
    },
    {
      room_id: directRoom.id,
      user_id: createdUsers[0].id,
      content: "Hey Bob, wanted to chat privately about the project",
      type: "text",
    },
    {
      room_id: directRoom.id,
      user_id: createdUsers[1].id,
      content: "Sure thing! What's on your mind?",
      type: "text",
    },
  ];

  for (const message of messages) {
    db.messages.create(message);
  }

  console.log(`✅ Created ${messages.length} messages`);

  // Show final stats
  const stats = db.getStats();
  console.log("\n📊 Final Database Stats:");
  console.log(`  Total Users: ${stats.totalUsers}`);
  console.log(`  Total Rooms: ${stats.totalRooms}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Active Rooms (24h): ${stats.activeRoomsLast24h}`);

  console.log("\n🎉 Database seeding completed successfully!");
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
} finally {
  db.close();
}