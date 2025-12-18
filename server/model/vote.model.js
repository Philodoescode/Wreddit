const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  value: {
    type: Number,
    enum: [1, -1], // 1 = upvote, -1 = downvote
    required: true
  }
}, {
  timestamps: true
});

// Ensure user can vote only once per post
voteSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;
