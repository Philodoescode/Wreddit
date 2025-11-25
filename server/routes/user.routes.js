// server/routes/user.routes.js
const express = require('express');
const router = express.Router();

const { signup, login, getMyProfile, getUserProfile, updateUserProfile, updateAvatarImage, uploadBannerImage } = require('../controller/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload, uploadErrorHandler } = require('../middleware/upload.middleware');


router.post('/signup', signup);
router.post('/login', login);

router.get('/user/me', protect, getMyProfile);
router.get('/user/:username', getUserProfile);
router.patch('/user/me', protect, updateUserProfile);

router.patch('/user/me/avatar', protect, upload.single('avatar'), uploadErrorHandler,  updateAvatarImage);
router.patch('/user/me/banner', protect, upload.single('banner'), uploadErrorHandler, uploadBannerImage);

module.exports = router;
