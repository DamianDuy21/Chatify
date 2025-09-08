import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có quyền truy cập - Không có mã xác thực" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return res.status(401).json({
        message: "Không có quyền truy cập - Mã xác thực không hợp lệ",
      });
    }
    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return res.status(401).json({
        message: "Không có quyền truy cập - Người dùng không tồn tại",
      });
    }
    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    console.error("Error in protected route middleware:", error);
    return res
      .status(401)
      .json({ message: "Không có quyền truy cập - Truy cập bị từ chối" });
  }
};
