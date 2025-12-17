const Post = require('../model/post.model');
const Community = require('../model/community.model');
const Subscription = require('../model/subscription.model');
const Vote = require("../model/vote.model");
const mongoose = require('mongoose');
const fs = require('fs');

// Cleanup uploaded files if error
const cleanupUploadedFiles = (files) => {
    if (!files || files.length === 0) return;
    files.forEach(file => {
        try {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {
            console.error(`Failed to cleanup file ${file.path}:`, err.message);
        }
    });
};

// Determine post type
const determinePostType = (hasMedia, hasLink, hasBody) => {
    if (hasMedia) return 'media';
    if (hasLink) return 'link';
    return 'text';
};

// Create a post
const createPost = async (req, res) => {
    const files = req.files || [];
    try {
        const { title, body, linkUrl, communityName } = req.body;
        const authorId = req.userId;

        if (!title || !title.trim()) {
            cleanupUploadedFiles(files);
            return res.status(400).json({ status: 'fail', message: 'Title is required' });
        }
        if (title.length > 300) {
            cleanupUploadedFiles(files);
            return res.status(400).json({ status: 'fail', message: 'Title cannot exceed 300 characters' });
        }

        const hasBody = body && body.trim().length > 0;
        const hasLink = linkUrl && linkUrl.trim().length > 0;
        const hasMedia = files.length > 0;
        if (!hasBody && !hasLink && !hasMedia) {
            cleanupUploadedFiles(files);
            return res.status(400).json({ status: 'fail', message: 'Post must have body text, a link, or media' });
        }

        if (hasLink && !/^https?:\/\/.+/.test(linkUrl.trim())) {
            cleanupUploadedFiles(files);
            return res.status(400).json({ status: 'fail', message: 'Link URL must start with http:// or https://' });
        }

        if (!communityName || !communityName.trim()) {
            cleanupUploadedFiles(files);
            return res.status(400).json({ status: 'fail', message: 'Community name is required' });
        }

        const community = await Community.findOne({ name: communityName.trim() });
        if (!community) {
            cleanupUploadedFiles(files);
            return res.status(404).json({ status: 'fail', message: 'Community not found' });
        }

        if (community.privacyType === 'restricted' || community.privacyType === 'private') {
            const subscription = await Subscription.findOne({ user: authorId, community: community._id });
            if (!subscription) {
                cleanupUploadedFiles(files);
                return res.status(403).json({ status: 'fail', message: `You must be a member of r/${communityName} to post` });
            }
        }

        const mediaUrls = files.map(file => `/uploads/posts/${file.filename}`);
        const postType = determinePostType(hasMedia, hasLink, hasBody);

        const post = await Post.create({
            title: title.trim(),
            type: postType,
            body: hasBody ? body.trim() : '',
            linkUrl: hasLink ? linkUrl.trim() : null,
            mediaUrls,
            author: authorId,
            community: community._id,
        });

        community.postCount = (community.postCount || 0) + 1;
        await community.save();

        await post.populate('author', 'username userPhotoUrl');
        await post.populate('community', 'name title iconImage');

        res.status(201).json({ status: 'success', data: post });
    } catch (error) {
        cleanupUploadedFiles(files);
        console.error('Post creation error:', error);
        res.status(500).json({ status: 'fail', message: `Error creating post: ${error.message}` });
    }
};

// Get posts for feed / community
const getPosts = async (req, res) => {
    try {
        const { community, feed, page = 1, limit = 10 } = req.query;
        const userId = req.userId;

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;

        let query = {};

        if (feed === 'home' && userId) {
            const subs = await Subscription.find({ user: userId }).select('community -_id');
            if (subs.length > 0) {
                const communityIds = subs.map(sub => sub.community).sort(() => Math.random() - 0.5).slice(0, 10);
                query.community = { $in: communityIds };
            }
        }

        if (community) {
            const comm = await Community.findOne({ name: community });
            if (!comm) return res.status(404).json({ status: 'fail', message: 'Community not found' });
            query.community = comm._id;
        }

        let posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('author', 'username userPhotoUrl')
            .populate('community', 'name title iconImage')
            .lean();

        // ✅ Attach currentUserVote for frontend
        if (userId) {
            const postIds = posts.map(p => p._id);
            const votes = await Vote.find({ postId: { $in: postIds }, userId });
            const votesMap = {};
            votes.forEach(v => { votesMap[v.postId.toString()] = v.value; });
            posts = posts.map(p => ({ ...p, currentUserVote: votesMap[p._id.toString()] ?? null }));
        } else {
            posts = posts.map(p => ({ ...p, currentUserVote: null }));
        }

        res.status(200).json({ status: 'success', data: posts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get single post
const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        if (!postId || !mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ status: 'fail', message: 'Invalid post ID' });

        let post = await Post.findById(postId)
            .populate('author', 'username userPhotoUrl')
            .populate('community', 'name title iconImage')
            .lean();

        if (!post) return res.status(404).json({ status: 'fail', message: 'Post not found' });

        // ✅ Add currentUserVote
        if (userId) {
            const vote = await Vote.findOne({ postId: post._id, userId });
            post.currentUserVote = vote ? vote.value : null;
        } else {
            post.currentUserVote = null;
        }

        res.status(200).json({ status: 'success', data: post });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { createPost, getPosts, getPostById };
