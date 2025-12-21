const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    last_message: {
      type: String,
      default: "",
    },
    last_message_sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Compound index for efficient inbox queries
ConversationSchema.index({ participants: 1, updated_at: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
