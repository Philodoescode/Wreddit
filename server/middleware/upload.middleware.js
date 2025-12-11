const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("UPLOAD: req.userId =", req.userId); // ADD THIS
        console.log("UPLOAD ROUTE:", req.originalUrl);
        console.log("FILE RECEIVED:", file ? file.originalname : "NO FILE");
        let folder;

        if (req.originalUrl.includes("avatar")) {
            folder = "avatars";
        } else if (req.originalUrl.includes("banner")) {
            folder = "banners";
        } else if (req.originalUrl.includes("posts")) {
            folder = "posts";
        } else {
            return cb(new Error("Invalid upload route"), false);
        }

        cb(null, path.join(__dirname, "..", "uploads", folder));
    },
    filename: (req, file, cb) => {
        console.log("UPLOAD: req.userId =", req.userId); // ADD THIS
        const ext = path.extname(file.originalname);
        let prefix;

        if (req.originalUrl.includes("avatar")) {
            prefix = "user-avatar";
        } else if (req.originalUrl.includes("banner")) {
            prefix = "user-banner";
        } else if (req.originalUrl.includes("posts")) {
            prefix = "post-media";
        } else {
            return cb(new Error("Invalid upload route"), false);
        }

        cb(null, `${prefix}-${req.userId}-${Date.now()}${ext}`);
    },
});



const fileFilter = (req, file, cb) => {
    const fileType = file.mimetype.split("/")[0];
    // Allow both images and videos for post media uploads
    if(fileType === "image" || fileType === "video"){
        return cb(null, true);
    }
    cb(new Error("Only image and video files are allowed"), false);
}

// ============= upload function used in routing when uploading images =============
// upload function will be used with two types.... upload.single (when the user is only allowed to upload a single file)
//                                                 upload.array  (when the user is allowed to upload multiple files at once when posting)

const upload = multer({storage: storage, fileFilter: fileFilter, limits: { fileSize: 100 * 1024 * 1024 }}) // 100MB limit for video support

//============= error handling middleware for uploads errors ===========

const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError ||
      err.message === "Only image files are allowed" ||
      err.message === "Only image and video files are allowed" ||
      err.message === "Invalid upload route") {
    return res.status(400).json({ status: "fail", message: err.message });
  }

  // Pass other errors to the next error handler
  next(err);
};


module.exports = { upload, uploadErrorHandler };
