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
        } else {
            return cb(new Error("Invalid upload route"), false);
        }

        cb(null, `${prefix}-${req.userId}-${Date.now()}${ext}`);
    },
});



const fileFilter = (req, file, cb) => {
    const imageType = file.mimetype.split("/")[0];
    if(imageType === "image"){
        return cb(null, true);
    }
    cb(new Error("Only image files are allowed"), false);
}

// ============= upload function used in routing when uploading images =============
// upload function will be used with two types.... upload.single (when the user is only allowed to upload a single file)
//                                                 upload.array  (when the user is allowed to upload multiple files at once when posting)

const upload = multer({storage: storage, fileFilter: fileFilter, limits: { fileSize: 3 * 1024 * 1024 }})

//============= error handling middleware for uploads errors ===========

const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only image files are allowed") {
    return res.status(400).json({ status: "fail", message: err.message });
  }

  next();
};


module.exports = { upload, uploadErrorHandler };
