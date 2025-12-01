const Community = require('../model/community.model');
const Subscription = require("../model/subscription.model");

const createCommunity = async (req, res) => {
    try {
        const {name, title, description, iconImage, bannerImage, privacyType, rules, flairs} = req.body;

        if (!name || !title) {
            return res.status(400).json({status: "fail", message: "Name and title are required"});
        }

        const existingCommunity = await Community.findOne({name});
        if (existingCommunity) {
            return res.status(400).json({status: "fail", message: "Community name already in use"});
        }

        // --- MODIFIED: Transaction logic removed for standalone MongoDB ---
        const community = await Community.create({
            name,
            title,
            description,
            iconImage,
            bannerImage,
            creator: req.user.id,
            privacyType,
            rules,
            flairs,
        });

        await Subscription.create({
            user: req.user.id,
            community: community._id,
        });

        res.status(201).json({status: "success", data: community});
    } catch (error) {
        res.status(500).json({status: "fail", message: `Error in creating community: ${error.message}`});
    }
}

const getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.find().select('name title iconImage memberCount');
        res.status(200).json({status: "success", data: communities});
    } catch (error) {
        res.status(500).json({status: "fail", message: error.message});
    }
};

module.exports = {
    createCommunity,
    getAllCommunities,
}