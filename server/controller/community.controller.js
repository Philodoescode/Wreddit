const mongoose = require('mongoose');
const Community = require('../model/community.model');
const Subscription = require("../model/subscription.model");

const createCommunity = async (req, res) => {
    try {
        const {name, title, description, iconImage, bannerImage, privacyType, rules, flairs} = req.body;

        if (!name || !title) {
            return res.status(400).json({status: "fail", message: "Name and title are required"});
        }

        const existingCommunity = await Community.findOne({name: name});
        if (existingCommunity) {
            return res.status(400).json({status: "fail", message: "Community name already in use"});
        }


        // Create community and subscription in a transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const community = await Community.create([{
                name,
                title,
                description,
                iconImage,
                bannerImage,
                creator: req.user.id,
                privacyType,
                rules,
                flairs,
            }], {session});

            await Subscription.create([{
                user: req.user.id,
                community: community[0]._id,
            }], {session});

            await session.commitTransaction();
            res.status(201).json({status: "success", data: community[0]});
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({status: "fail", message: `Error in creating community: ${error.message}`});
        } finally {
            await session.endSession();
        }

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