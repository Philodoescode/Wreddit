const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
            user: {type: mongoose.Schema.Types.ObjectId, 
                ref: 'User',
                 index: true, 
                 required: true},
                 
            community: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Community',
                index: true,
                required: true,
            },
            joinedAt: {type: Date, default: Date.now},
            isMuted: {type: Boolean, default: false},
        },
        {
            timestamps: true
        }
    )
;

// user can only join a community once
subscriptionSchema.index({user: 1, community: 1}, {unique: true});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;