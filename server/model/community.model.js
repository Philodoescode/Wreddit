const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 21,
            index: true,
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9_-]+$/.test(v);
                },
                message: 'Community name can only contain letters, numbers, underscores, and hyphens'
            }
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            default: '',
            maxlength: 500,
        },
        iconImage: {
            type: String,
            default: null,
        },
        bannerImage: {
            type: String,
            default: null,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        memberCount: {
            type: Number,
            default: 1,
        },
        postCount: {
            type: Number,
            default: 0,
        },
        privacyType: {
            type: String,
            enum: ['public', 'restricted', 'private'],
            default: 'public',
        },
        // Rules specific to this community
        rules: [
            {
                title: {type: String, required: true},
                description: String,
                createdAt: {type: Date, default: Date.now},
            },
        ],
        moderators: [
            {
                user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
                joinedAt: {type: Date, default: Date.now},
            },
        ],
        // Flairs available for posts in this community
        flairs: [
            {
                text: String,
                backgroundColor: String,
                textColor: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Community = mongoose.model('Community', communitySchema);
module.exports = Community;