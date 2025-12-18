const mongoose = require('mongoose');

/**
 * Helper function to generate a URL-friendly slug from a title
 */
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .substring(0, 100);       // Limit slug length
};

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: {
        type: String,
        index: true,
    },
    type: {
        type: String,
        enum: ['text', 'media', 'link'],
        default: 'text',
    },
    body: {
        type: String,
        default: '',
        maxlength: [40000, 'Body cannot exceed 40000 characters'],
    },
    linkUrl: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                if (!v) return true;
                // Basic URL validation
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Link URL must be a valid URL starting with http:// or https://'
        }
    },
    mediaUrls: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) {
                return v.length <= 20;
            },
            message: 'Cannot have more than 20 media items'
        }
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
        index: true,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    downvotes: {
        type: Number,
        default: 0,
    },
    commentCount: {
        type: Number,
        default: 0,
    },
    // AI-generated summary stored directly on the post
    aiSummary: {
        text: {
            type: String,
            default: null,
        },
        generatedAt: {
            type: Date,
            default: null,
        },
        includesComments: {
            type: Boolean,
            default: false,
        },
        commentsAnalyzed: {
            type: Number,
            default: 0,
        },
    },
}, {
    timestamps: true,
});

// Index for feed sorting (newest first)
postSchema.index({ createdAt: -1 });

// Compound index for community feeds
postSchema.index({ community: 1, createdAt: -1 });

// Auto-generate slug before saving
postSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('title')) {
        const baseSlug = generateSlug(this.title);
        // Add timestamp suffix for uniqueness
        this.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }
    next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
