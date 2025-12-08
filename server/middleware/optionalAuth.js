const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {id: decoded.id};
    } catch (error) {
        // Token is invalid or expired, proceed without user
    }
    next();
};

module.exports = optionalAuth;
