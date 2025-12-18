const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    console.log("AUTH HEADER RECEIVED:", header);

    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ status: "fail", message: "Not logged in" });
    }

    // Always split safely
    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The ACTUAL fix:
    req.userId = decoded.sub || decoded.id || decoded.userId;

    console.log("Decoded userId:", req.userId);

    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
};

module.exports = { protect };
