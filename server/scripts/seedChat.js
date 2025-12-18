require("dotenv").config({ path: "../.env" }); // Adjust path if running from server/scripts
const mongoose = require("mongoose");
const User = require("../model/user.model");
const Conversation = require("../model/conversation.model");
const Message = require("../model/message.model");

// Use 27018 for host access (as defined in docker-compose)
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27018/wreddit";

const seedChat = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing chat data
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    // detailed logging
    console.log("Cleared existing conversations and messages");

    // we also need to ensure we have users.
    // Clean up test users first to avoid duplicates if re-running
    await User.deleteMany({ email: { $in: ["test1@example.com", "test2@example.com"] } });

    // Create 2 test users
    const user1 = await User.create({
      username: "chatUser1",
      email: "test1@example.com",
      passwordHash: "password123", // Dummy hash
    });

    const user2 = await User.create({
      username: "chatUser2",
      email: "test2@example.com",
      passwordHash: "password123", // Dummy hash
    });

    console.log(`Created users: ${user1.username}, ${user2.username}`);

    // Create a conversation
    const conversation = await Conversation.create({
      participants: [user1._id, user2._id],
      last_message: "Hello there!",
    });

    console.log(`Created conversation: ${conversation._id}`);

    // Create a message
    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: user1._id,
      text: "Hello there!",
    });

    console.log(`Created message: ${message._id}`);
    console.log("Database seeded successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedChat();
