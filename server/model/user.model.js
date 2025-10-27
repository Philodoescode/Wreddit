const mongoose = require('mongoose');
// const bcrypt = require("bcryptjs");
const validator = require("validator");


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, validate:[ validator.isEmail , "Please Enter a Valid Email" ] },
    passwordHash: { type: String, required: true, minlength: 8 },
    firstName: { type: String, default: '', trim: true, maxlength: 50 },
    lastName: { type: String, default: '', trim: true, maxlength: 50 },
    bio: { type: String, default: '' , trim: true, maxlength: 320 },
    userPhotoUrl: { type: String, default: null},
}, { timestamps: true });


const User = mongoose.model("User", userSchema);
module.exports = User;