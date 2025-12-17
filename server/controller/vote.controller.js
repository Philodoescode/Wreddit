const Vote = require('../model/vote.model');
const Post = require('../model/post.model');

const votePost = async (req, res) => {
  try {
    const { postId, value } = req.body;
    const userId = req.userId;

    if (!postId || ![1, -1].includes(value)) {
      return res.status(400).json({
        status: 'fail',
        message: 'postId and valid vote value are required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found'
      });
    }

    const existingVote = await Vote.findOne({ userId, postId });

    // 1️⃣ No previous vote → create new vote
    if (!existingVote) {
      await Vote.create({ userId, postId, value });

      if (value === 1) post.upvotes += 1;
      else post.downvotes += 1;

      await post.save();

      return res.status(201).json({
        status: 'success',
        message: 'Vote added'
      });
    }

    // 2️⃣ Same vote clicked again → remove vote
    if (existingVote.value === value) {
      await existingVote.deleteOne();

      if (value === 1) post.upvotes -= 1;
      else post.downvotes -= 1;

      await post.save();

      return res.status(200).json({
        status: 'success',
        message: 'Vote removed'
      });
    }

    // 3️⃣ Switch vote
    if (existingVote.value === 1 && value === -1) {
      post.upvotes -= 1;
      post.downvotes += 1;
    } else if (existingVote.value === -1 && value === 1) {
      post.downvotes -= 1;
      post.upvotes += 1;
    }

    existingVote.value = value;
    await existingVote.save();
    await post.save();

    res.status(200).json({
      status: 'success',
      message: 'Vote updated'
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = { votePost };
