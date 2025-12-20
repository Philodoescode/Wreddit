// server/controller/comment.controller.js
const Comment = require('../model/comment.model');
const Post = require('../model/post.model');

// Helper: Build nested comment tree
const buildCommentTree = (comments) => {
  const commentMap = {};
  const roots = [];

  // Map by id and initialize children array
  comments.forEach(comment => {
    comment.replies = [];
    commentMap[comment._id] = comment;
  });

  comments.forEach(comment => {
    if (comment.parentId) {
      if (commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(comment);
      }
      // If parent not found (e.g. deleted), treat as root? Or filter out?
    } else {
      roots.push(comment);
    }
  });

  return roots;
};

const createComment = async (req, res) => {
  try {
    const { postId, content, parentId } = req.body;
    const userId = req.userId;

    if (!postId || !content) {
      return res.status(400).json({ status: 'fail', message: 'postId and content are required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ status: 'fail', message: 'Post not found' });
    }

    // If parentId is provided, validate it belongs to the same post
    if (parentId) {
      const parentComment = await Comment.findOne({ _id: parentId, postId });
      if (!parentComment) {
        return res.status(400).json({ status: 'fail', message: 'Invalid parent comment' });
      }
    }

    const comment = await Comment.create({
      postId,
      userId,
      content,
      parentId: parentId || null
    });

    // Increment comment count
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Populate only for response
    await comment.populate('userId', 'username userPhotoUrl');

    res.status(201).json({ status: 'success', data: comment });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.id;

    if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid post ID' });
    }

    // Optional: add pagination later
    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .populate('userId', 'username userPhotoUrl')
      .lean();

    const nestedComments = buildCommentTree(comments);

    res.status(200).json({
      status: 'success',
      results: nestedComments.length,
      data: nestedComments
    });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getCommentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ status: 'fail', message: 'User ID is required' });
    }

    const comments = await Comment.find({ userId })
      .sort({ createdAt: -1 })
      .populate('postId', 'title community')
      .lean();

    // We might want to populate community from the post, but postId population gives us the post object.
    // Let's populate deeply if needed or just minimal. 
    // Post structure: title, community (ref). 
    // We probably want community name too.

    // Better populate:
    const commentsWithDetails = await Comment.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'postId',
        select: 'title community',
        populate: { path: 'community', select: 'name iconImage' }
      })
      .lean();

    res.status(200).json({
      status: 'success',
      results: commentsWithDetails.length,
      data: commentsWithDetails
    });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

module.exports = { createComment, getCommentsByPost, getCommentsByUser };