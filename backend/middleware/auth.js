import jwt from "jsonwebtoken";

const auth = async (req, res) => {
  const authheader = req.header.authorization;
  if (!authheader) {
    return res.status(401).json({
      message: "no token provider",
    });
  }
  const token = authheader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "invalid token",
    });
  }
};

export default auth;
