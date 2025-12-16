const Post = require('../model/post.model');
const Community = require('../model/community.model');
const Subscription = require('../model/subscription.model');
const mongoose = require('mongoose');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

/**
 * Helper function to clean up uploaded files on error
 * Prevents orphaned files when validation or DB operations fail
 */
const cleanupUploadedFiles = (files) => {
    if (!files || files.length === 0) return;

    files.forEach(file => {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`Cleaned up orphaned file: ${file.path}`);
            }
        } catch (err) {
            console.error(`Failed to cleanup file ${file.path}:`, err.message);
        }
    });
};

/**
 * Determine post type based on content
 * Priority: media > link > text
 */
const determinePostType = (hasMedia, hasLink, hasBody) => {
    if (hasMedia) return 'media';
    if (hasLink) return 'link';
    return 'text';
};

/**
 * Create a new post
 * POST /api/posts
 */
const createPost = async (req, res) => {
    const files = req.files || [];

    try {
        const { title, body, linkUrl, communityName } = req.body;
        const authorId = req.userId;

        // ============ Validation ============

        // Title is required
        if (!title || !title.trim()) {
            cleanupUploadedFiles(files);
            return res.status(400).json({
                status: 'fail',
                message: 'Title is required'
            });
        }

        // Title length check
        if (title.length > 300) {
            cleanupUploadedFiles(files);
            return res.status(400).json({
                status: 'fail',
                message: 'Title cannot exceed 300 characters'
            });
        }

        // Post must have content (body, link, or media)
        const hasBody = body && body.trim().length > 0;
        const hasLink = linkUrl && linkUrl.trim().length > 0;
        const hasMedia = files.length > 0;

        if (!hasBody && !hasLink && !hasMedia) {
            cleanupUploadedFiles(files);
            return res.status(400).json({
                status: 'fail',
                message: 'Post must have body text, a link, or media'
            });
        }

        // Validate link URL format if provided
        if (hasLink && !/^https?:\/\/.+/.test(linkUrl.trim())) {
            cleanupUploadedFiles(files);
            return res.status(400).json({
                status: 'fail',
                message: 'Link URL must start with http:// or https://'
            });
        }

        // Community name is required
        if (!communityName || !communityName.trim()) {
            cleanupUploadedFiles(files);
            return res.status(400).json({
                status: 'fail',
                message: 'Community name is required'
            });
        }

        // ============ Community Verification ============

        const community = await Community.findOne({ name: communityName.trim() });
        if (!community) {
            cleanupUploadedFiles(files);
            return res.status(404).json({
                status: 'fail',
                message: 'Community not found'
            });
        }

        // Check membership for restricted communities
        if (community.privacyType === 'restricted' || community.privacyType === 'private') {
            const subscription = await Subscription.findOne({
                user: authorId,
                community: community._id
            });

            if (!subscription) {
                cleanupUploadedFiles(files);
                return res.status(403).json({
                    status: 'fail',
                    message: `You must be a member of r/${communityName} to post`
                });
            }
        }

        // ============ Create Post ============

        // Build media URLs from uploaded files
        const mediaUrls = files.map(file => `/uploads/posts/${file.filename}`);

        // Determine post type
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

        // Increment community post count
        community.postCount = (community.postCount || 0) + 1;
        await community.save();

        // Populate author info for response
        await post.populate('author', 'username userPhotoUrl');
        await post.populate('community', 'name title iconImage');

        res.status(201).json({
            status: 'success',
            data: post
        });

    } catch (error) {
        // Clean up files on any unexpected error
        cleanupUploadedFiles(files);

        console.error('Post creation error:', error);
        res.status(500).json({
            status: 'fail',
            message: `Error creating post: ${error.message}`
        });
    }
};

// this function will get the posts for the feed where posts are selected based on latest posts from random communities the user is subscribed to...
// if the user selects a specific community then the community name will be passed as a query param and the posts that will be displayed will be from this community
const getPosts = async (req, res) => {
    try {
        const { community, feed, page = 1, limit = 10 } = req.query;
        const userId = req.userId;

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;

        let query = {};

        if (feed === 'home') {
            if (!userId) {
                // for not logged in users, show latest posts globally
                query = {};
            } else {
                const subs = await Subscription.find({ user: userId }).select('community -_id');

                if (subs.length > 0) {
                    const communityIds = subs.map(sub => sub.community);

                    const shuffled = communityIds.sort(() => Math.random() - 0.5)
                    const selectedCommunities = shuffled.slice(0, 10)

                    query.community = { $in: selectedCommunities }
                } else {
                    // for users with no subscription , show the latest posts globallly 
                    query = {};
                }
            }
        }

        if (community) {
            const comm = await Community.findOne({ name: community });
            if (!comm) {
                return res.status(404).json({ status: 'fail', message: 'Community not found' });
            }
            query.community = comm._id;
        }

        let posts = await Post.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum)
            .populate('author', 'username userPhotoUrl').populate('community', 'name title iconImage').lean()

        res.status(200).json({ status: 'success', data: posts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message })
    }
}

const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;

        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid post ID' });
        }

        const post = await Post.findById(postId).populate('author', 'username userPhotoUrl')
            .populate('community', 'name title iconImage').lean();

        if (!post) {
            return res.status(404).json({ status: 'fail', message: 'Post not found' });
        }

        return res.status(200).json({ status: 'success', data: post });

    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message })
    }
}

/**
 * Get existing AI summary for a post (without generating)
 * GET /api/posts/:id/summary
 */
const getSummary = async (req, res) => {
    try {
        const postId = req.params.id;

        // Validate post ID
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid post ID'
            });
        }

        // Fetch the post
        const post = await Post.findById(postId).select('aiSummary').lean();

        if (!post) {
            return res.status(404).json({
                status: 'fail',
                message: 'Post not found'
            });
        }

        // Check if summary exists
        if (!post.aiSummary?.text) {
            return res.status(404).json({
                status: 'fail',
                message: 'No summary found for this post'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                summary: post.aiSummary.text,
                postId: postId,
                generatedAt: post.aiSummary.generatedAt?.toISOString() || null,
                fromCache: true
            }
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            status: 'fail',
            message: 'Failed to fetch summary'
        });
    }
};

/**
 * Generate AI summary for a post
 * POST /api/posts/:id/summarize
 * Query params:
 *   - regenerate=true: Force regeneration of summary even if one exists
 */
const summarizePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const regenerate = req.query.regenerate === 'true';

        // Validate post ID
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid post ID'
            });
        }

        // Fetch the post (not lean, we need to save it)
        const post = await Post.findById(postId)
            .populate('author', 'username')
            .populate('community', 'name');

        if (!post) {
            return res.status(404).json({
                status: 'fail',
                message: 'Post not found'
            });
        }

        // Check if summary already exists (unless regenerating)
        if (!regenerate && post.aiSummary?.text) {
            return res.status(200).json({
                status: 'success',
                data: {
                    summary: post.aiSummary.text,
                    postId: post._id,
                    generatedAt: post.aiSummary.generatedAt?.toISOString() || null,
                    fromCache: true
                }
            });
        }

        // Check if there's content to summarize
        const contentToSummarize = post.body?.trim();
        if (!contentToSummarize || contentToSummarize.length < 50) {
            return res.status(400).json({
                status: 'fail',
                message: 'Post content is too short to summarize (minimum 50 characters)'
            });
        }

        // Initialize Google GenAI
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({
                status: 'fail',
                message: 'AI service is not configured'
            });
        }

        // Prepare the prompt
        const prompt = `You are a helpful assistant that summarizes Reddit posts. Please provide a concise, informative summary of the following post.

Title: ${post.title}

Content:
${contentToSummarize}

Please provide a summary that:
1. Captures the main points and key information
2. Is concise (2-4 sentences)
3. Is objective and neutral in tone
4. Highlights any important details or conclusions

Summary:`;

        const config = {
            thinkingConfig: {
                thinkingBudget: 0,
            },
        };

        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ];

        // Generate summary with timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
        });

        const summaryPromise = (async () => {
            const response = await ai.models.generateContent({
                model,
                config,
                contents,
            });

            // Extract the summary text
            const summary = response.text || '';

            if (!summary) {
                throw new Error('No summary generated');
            }

            return summary;
        })();

        const summary = await Promise.race([summaryPromise, timeoutPromise]);
        const trimmedSummary = summary.trim();
        const generatedAt = new Date();

        // Save summary to the post document
        post.aiSummary = {
            text: trimmedSummary,
            generatedAt: generatedAt
        };
        await post.save();

        // Return the summary
        res.status(200).json({
            status: 'success',
            data: {
                summary: trimmedSummary,
                postId: post._id,
                generatedAt: generatedAt.toISOString(),
                fromCache: false
            }
        });

    } catch (error) {
        console.error('AI summarization error:', error);

        // Handle specific error types
        if (error.message === 'Request timeout') {
            return res.status(504).json({
                status: 'fail',
                message: 'AI service timeout. Please try again.'
            });
        }

        if (error.message?.includes('API key')) {
            return res.status(500).json({
                status: 'fail',
                message: 'AI service configuration error'
            });
        }

        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return res.status(429).json({
                status: 'fail',
                message: 'AI service rate limit reached. Please try again later.'
            });
        }

        // Generic error response
        res.status(500).json({
            status: 'fail',
            message: 'Failed to generate summary. Please try again.'
        });
    }
};

module.exports = {
    createPost, getPosts, getPostById, summarizePost, getSummary
};

