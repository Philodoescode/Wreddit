const User = require("../model/user.model");
const Community = require("../model/community.model");

const searchAll = async (req, res) => {
    try {
        const query = req.query.q?.trim();
        const userId = req.userId;

        console.log("SEARCH REQUEST:", {
            q: req.query.q,
            userId: req.userId
        });


        if (!query || query.length === 0) {

            if (!userId) {

                return res.status(200).json({ status: "success", recent: [], data: { users: [], communities: [] } });
            }

            const currentUser = await User.findById(userId).select("recentSearches");

            return res.status(200).json({ status: "success", recent: currentUser?.recentSearches || [], data: { users: [], communities: [] } });
        }

        const regex = new RegExp(query, 'i')

        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { firstName: { $regex: regex } },
                { lastName: { $regex: regex } }
            ]
        }).select("username userPhotoUrl").sort({ userKarma: -1 });

        const communities = await Community.find({
            $or: [
                { name: { $regex: regex } },
                { description: { $regex: regex } }
            ]
        }).select("name iconImage").sort({ memberCount: -1 })

        if (userId) {
            await User.findByIdAndUpdate(userId, { $addToSet: { recentSearches: query } })

            const currentUser = await User.findById(userId);
            if (currentUser.recentSearches.length > 5) {
                currentUser.recentSearches = currentUser.recentSearches.slice(-5);
                await currentUser.save();
            }
        }

        res.status(200).json({ status: "success", data: { users, communities } });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

const removeRecentSearch = async (req, res) => {
    try {
        const userId = req.userId;
        const term = req.params.term;

        await User.findByIdAndUpdate(
            userId,
            { $pull: { recentSearches: term } }
        );

        res.status(200).json({ status: "success", removed: term });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

module.exports = { searchAll, removeRecentSearch };
