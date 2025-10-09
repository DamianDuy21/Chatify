import jwt from "jsonwebtoken";
import User from "../models/User.js";
import JWT from "../models/JWT.js";

export const protectedRoute = async (req, res, next) => {
  try {
    // 1) Lấy token từ header Authorization: "Bearer <token>"
    const authHeader = req.headers.authorization || "";
    const isBearer = authHeader.toLowerCase().startsWith("bearer ");
    const token = isBearer ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        locale: req.i18n?.language,
        message: req.t?.("errors:middleware.unauthorized.emptyToken"),
      });
    }

    // 2) Xác thực JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      try {
        await JWT.updateOne({ token }, { $set: { expire_at: new Date() } });
      } catch (_) {}

      return res.status(401).json({
        locale: req.i18n?.language,
        message: req.t?.("errors:middleware.unauthorized.invalidToken"),
      });
    }

    // 3) Tìm User
    const userId = decoded?.userId;
    if (!userId) {
      return res.status(401).json({
        locale: req.i18n?.language,
        message: req.t?.("errors:middleware.unauthorized.invalidToken"),
      });
    }

    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
      return res.status(401).json({
        locale: req.i18n?.language,
        message: req.t?.("errors:middleware.unauthorized.userNotFound"),
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Error in protected route middleware:", error);
    return res.status(401).json({
      locale: req.i18n?.language,
      message: req.t?.("errors:middleware.unauthorized.accessDenied"),
    });
  }
};
