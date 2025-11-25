const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        console.log("AUTH HEADER RECEIVED:", req.headers.authorization);

        let token = req.headers.authorization;
        if (token && token.startsWith("Bearer")) {
            token = token.split(" ")[1];
        }
        if (!token) {
            return res.status(400).json({ status: "fail", message: "Your are not logged in" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.sub
        next();
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Not Authorized.... Invalid token" });
    }

}

module.exports = { protect };