// server/model/comment.model.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true // important for nested queries
  }
}, {
  timestamps: true
});

// Remove the pre-find hook — it's dangerous and unnecessary
// We'll populate explicitly where needed

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;