const Post = require('../model/post.model');
const Community = require('../model/community.model');
const Subscription = require('../model/subscription.model');
const fs = require('fs');

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

module.exports = {
    createPost
};
