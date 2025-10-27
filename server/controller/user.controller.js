const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signToken = (user) =>
    jwt.sign(
        { sub: user._id.toString(), username: user.username },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
    );

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
        });

        const token = signToken(user);

        // The user object from the database will contain the default empty values for the other fields
        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            userPhotoUrl: user.userPhotoUrl,
        };

        console.log("New User Created:", safeUser);

        res.status(201).json({ status: "success", token: token, data: { user: safeUser } });
    } catch (error) {
        // Add more detailed server-side logging for easier debugging
        console.error("SIGNUP FAILED:", error);
        res.status(500).json({ status: "fail", message: `An unexpected error occurred: ${error.message}` });
    }
}

const login = async (req, res) => {
    try {

        const {identifierType, password} =  req.body;

        if (!identifierType || !password) {
            return  res.status(400).json({ status: "fail", message: "All fields are required" });
        }

        const useridentifier = identifierType.includes('@') ? { email: identifierType.toLowerCase().trim() } : { username: identifierType.trim() };
        
        const user = await User.findOne(useridentifier);
        if (!user) {
            return res.status(400).json({ status: "fail", message: "Invalid username/email or password" });
        }

        const passwordMatch =  await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(400).json({ status: "fail", message: "Invalid username/email or password" });
        }

        const token = signToken(user);

        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            userPhotoUrl: user.userPhotoUrl,
        };

        console.log("User Logged In:", safeUser);
        return res.status(200).json({ status: "success", token: token, data: { user: safeUser } });
        
    } catch (error) {
        return res.status(500).json({ status: "fail", message: `Error in Login ${error.message}` });
    }
}


module.exports = {
    signup, login
};