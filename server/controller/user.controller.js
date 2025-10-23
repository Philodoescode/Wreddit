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

        let { username, email, password, firstName, lastName, bio } = req.body;

        //validation for user reqired details ------------------------------------------------

        if (!username || !email || !password ) {
            return res.status(400).json({ status: "fail", message: "All fields are required" });
        }

        console.log("User Controller - Signup: ", username, email);

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

        // 7mdallah 3la elsalama -----------------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);
        const uploadedPhoto = req.file ? req.file.filename : 'default-user.png';

        const user = await User.create({
            username, email, passwordHash,
            firstName: firstName?.trim() || '',
            lastName: lastName?.trim() || '',
            bio: bio?.trim() || '',
            userPhotoUrl: uploadedPhoto,
        });

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

        console.log("New User:", safeUser);


        res.status(201).json({ status: "success", token: token, data: { user: safeUser } });
    } catch (error) {
        res.status(500).json({ status: "fail", message: `Error in Sign up ${error.message}` });
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