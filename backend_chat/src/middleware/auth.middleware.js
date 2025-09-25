import jwt from "jsonwebtoken";
import User from "../models/User.js";
import JWT from "../models/JWT.js";

export const protectedRoute = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({
      locale: req.i18n.language,
      message: req.t("errors:middleware.unauthorized.emptyToken"),
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      await JWT.updateOne({ token }, { $set: { expire_at: new Date() } });
      return res.status(401).json({
        locale: req.i18n.language,
        message: req.t("errors:middleware.unauthorized.invalidToken"),
      });
    }
    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return res.status(401).json({
        locale: req.i18n.language,
        message: req.t("errors:middleware.unauthorized.userNotFound"),
      });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Error in protected route middleware:", error);
    return res.status(401).json({
      locale: req.i18n.language,
      message: req.t("errors:middleware.unauthorized.accessDenied"),
    });
  }
};
