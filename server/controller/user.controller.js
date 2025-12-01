const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require("fs");
const path = require("path");


// ========= helper functions ==========

const signToken = (user) =>
    jwt.sign(
        { sub: user._id.toString(), username: user.username },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
    );


// function to be used to return the user data that will be displayed pblicly in the profile page (called when fetching user data)
const userData = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    userPhotoUrl: user.userPhotoUrl,
    userSocialLinks: user.userSocialLinks,
    profileBannerUrl: user.profileBannerUrl,
    userKarma: user.userKarma,
    userContributions: user.userContributions,
    userGold: user.userGold,
    userAge: calculateDate(user.userDate),
})

const calculateDate = (date) => {
    const today = new Date()
    const userAge = today.getFullYear() - date.getFullYear()
    return userAge;
}

// ============ Auth functions ============

const signup = async (req, res) => {

    try {
        // 1. Destructure only the fields sent from the simplified form
        let { username, email, password } = req.body;

        // 2. Validation for required details
        if (!username || !email || !password) {
            return res.status(400).json({ status: "fail", message: "Username, email, and password are required" });
        }

        console.log("User Controller - Signup Request For:", username, email);

        username = username.trim();
        email = email.toLowerCase().trim();

        const existingUserbyEmail = await User.findOne({ email: email });
        if (existingUserbyEmail) {
            return res.status(400).json({ status: "fail", message: "Email already in use" });
        }
        const existingUserbyUsername = await User.findOne({ username: username });
        if (existingUserbyUsername) {
            return res.status(400).json({ status: "fail", message: "Username already in use" });
        }

        if (password.length < 8) {
            return res.status(400).json({ status: "fail", message: "Password must be at least 8 characters long" });
        }

        // 3. Hash password and create user with only the essential fields
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            passwordHash,
            userPhotoUrl: null,
            profileBannerUrl: null,
        });

        const token = signToken(user);

        // The user object from the database will contain the default empty values for the other fields
        const safeUser = userData(user);

        console.log("New User Created:", safeUser);

        // Modification: Return the user object along with the token upon successful signup
        res.status(201).json({ status: "success", token: token, data: { user: safeUser } });
    } catch (error) {
        // Add more detailed server-side logging for easier debugging
        console.error("SIGNUP FAILED:", error);
        res.status(500).json({ status: "fail", message: `An unexpected error occurred: ${error.message}` });
    }
}

const login = async (req, res) => {
    try {

        const { identifierType, password } = req.body;

        if (!identifierType || !password) {
            return res.status(400).json({ status: "fail", message: "All fields are required" });
        }

        const useridentifier = identifierType.includes('@') ? { email: identifierType.toLowerCase().trim() } : { username: identifierType.trim() };

        const user = await User.findOne(useridentifier);
        if (!user) {
            return res.status(400).json({ status: "fail", message: "Invalid username/email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(400).json({ status: "fail", message: "Invalid username/email or password" });
        }

        const token = signToken(user);

        const safeUser = userData(user);

        console.log("User Logged In:", safeUser);
        return res.status(200).json({ status: "success", token: token, data: { user: safeUser } });

    } catch (error) {
        return res.status(500).json({ status: "fail", message: `Error in Login ${error.message}` });
    }
}

// ============ user pforile functions ============

const getMyProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        return res.status(200).json({ status: "success", data: { user: userData(user) } });

    } catch (error) {
        return res.status(500).json({ status: "fail", message: `Error in fetching YOUR profile data: ${error.message}` });
    }
}

const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        return res.status(200).json({ status: "success", data: { user: userData(user) } });

    } catch (error) {
        return res.status(500).json({ status: "fail", message: `Error in fetching user profile data by username: ${error.message}` });
    }
}


// update all text fields in the user profile (but for the images use separate functions to handle the file uploads correclty)
const updateUserProfile = async (req, res) => {
    let updated = false;
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        const { firstName, lastName, bio, userSocialLinks } = req.body;

        if (firstName !== user.firstName && firstName !== undefined) {
            user.firstName = firstName;
            updated = true;
        }

        if (lastName !== user.lastName && lastName !== undefined) {
            user.lastName = lastName;
            updated = true;
        }

        if (bio !== user.bio && bio !== undefined) {
            user.bio = bio;
            updated = true;
        }
        if (userSocialLinks !== user.userSocialLinks && userSocialLinks !== undefined) {
            user.userSocialLinks = userSocialLinks;
            updated = true;
        }

        if (!updated) {
            return res.status(200).json({ status: "success", message: "No updates detected in profile data" });
        } else {

            await user.save();
            return res.status(200).json({ status: "success", message: "Profile updated successfully", data: { user: userData(user) } });

        }

    } catch (error) {
        res.status(500).json({ status: "fail", message: `Error in updating my profile data: ${error.message}` });
    }
}

const updateAvatarImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "fail", message: "No file uploaded" });
        }

        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);// function to delete the already uploaded file from the disk storage (ALWAYS USED IN ERROR STATES WHEN FILE UPLOADING IS INVOLVED)
            }

            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        user.userPhotoUrl = `/uploads/avatars/${req.file.filename}`;
        await user.save();

        res.status(200).json({ status: "success", message: "Avatar image updated successfully", data: { user: userData(user) } });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ status: "fail", message: `Error in updating avatar image: ${error.message}` });
    }
}

const uploadBannerImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "fail", message: "No file uploaded" });
        }
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {

            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        user.profileBannerUrl = `/uploads/banners/${req.file.filename}`;
        await user.save();
        res.status(200).json({ status: "success", message: "Profile banner image updated successfully", data: { user: userData(user) } });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ status: "fail", message: `Error in updating profile banner image: ${error.message}` });
    }
}



module.exports = {
    signup, login, getMyProfile, getUserProfile, updateUserProfile, updateAvatarImage, uploadBannerImage
};