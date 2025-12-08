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

        community.memberCount = 1;
        await community.save();

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

const getCommunityByName = async (req, res) => {
  const { name } = req.params;
  try {
    const community = await Community.findOne({ name })
      .populate("creator", "username")
      .select("-__v");
      
    if (!community) return res.status(404).json({ message: "Not found" });
    
    let isSubscribed = false;
    if (req.user.id) {  
      const subscription = await Subscription.findOne({ user: req.user.id, community: community._id });
      isSubscribed = !!subscription;
    }

    const enhancedData = {
      ...community.toObject(),
      isSubscribed,
    };

    res.json({ status: "success", data: enhancedData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinCommunity = async (req, res) => {
    try {
        const { name } = req.params;
        const community = await Community.findOne({ name });
        if (!community) {
            return res.status(404).json({ status: "fail", message: "Community not found" });
        }

        const existingSubscription = await Subscription.findOne({ user: req.user.id, community: community._id });
        if (existingSubscription) {
            return res.status(400).json({ status: "fail", message: "Already subscribed to this community" });
        }

        const newSubscription = await Subscription.create({
            user: req.user.id,
            community: community._id,
        });

        community.memberCount += 1;
        await community.save();

        res.status(201).json({ status: "success", message: "Joined community successfully", data: newSubscription });
    } catch (error) {
        res.status(500).json({ status: "fail", message: `Error joining community: ${error.message}` });
    }
};

// New: Leave Community
const leaveCommunity = async (req, res) => {
    try {
        const { name } = req.params;
        const community = await Community.findOne({ name });
        if (!community) {
            return res.status(404).json({ status: "fail", message: "Community not found" });
        }

        const subscription = await Subscription.findOneAndDelete({ user: req.user.id, community: community._id });
        if (!subscription) {
            return res.status(400).json({ status: "fail", message: "Not subscribed to this community" });
        }

        if (community.memberCount > 0) {
            community.memberCount -= 1;
            await community.save();
        }

        res.status(200).json({ status: "success", message: "Left community successfully" });
    } catch (error) {
        res.status(500).json({ status: "fail", message: `Error leaving community: ${error.message}` });
    }
};

module.exports = {
    createCommunity,
    getAllCommunities,
    getCommunityByName,
    joinCommunity,
    leaveCommunity
}