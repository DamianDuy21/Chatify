import mongoose from "mongoose";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import PendingAccount from "../models/PendingAccount.js";
import Profile from "../models/Profile.js";
import jwt from "jsonwebtoken";
import { sendOtpMail } from "../utils/mailer.js";
import { generateOtp } from "../utils/auth.js";
import bcrypt from "bcryptjs";
import JWT from "../models/JWT.js";
import Language from "../models/Language.js";
import { upsertStreamUser } from "../lib/stream.js";

export const signup = async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.signUp.validation.allFieldsRequired"),
      });
    }

    // validate password

    // validate email

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.signUp.validation.userAlreadyExists"),
      });
    }

    // Bọc trong transaction để đồng bộ
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();

      let pa = await PendingAccount.findOne({
        email: email,
        status: "pending",
        expire_at: { $gt: now },
      }).session(session);

      if (!pa) {
        // 1) Expire mọi pendingAccount cùng email còn pending
        await PendingAccount.updateMany(
          { email: email, status: "pending" },
          { $set: { status: "expired" } },
          { session }
        );

        // 2) Tạo pendingAccount mới, hết hạn sau 2 phút
        const expireAt = new Date(Date.now() + 2 * 60 * 1000);
        const [newPa] = await PendingAccount.create(
          [
            {
              email: email,
              fullName: fullName,
              password: password,
              status: "pending",
              expire_at: expireAt,
            },
          ],
          { session }
        );
        pa = newPa;
      }

      // 3) Expire tất cả OTP type=signup của pendingAccount này
      await OTP.updateMany(
        { pendingAccountId: pa._id, type: "signup", status: "pending" },
        { $set: { status: "expired" } },
        { session }
      );

      // 4) Tạo OTP mới cho pendingAccount
      const expireAt = new Date(Date.now() + 2 * 60 * 1000); // OTP 2 phút
      const otp = await OTP.create({
        pendingAccountId: pa._id,
        type: "signup",
        code: generateOtp(),
        status: "pending",
        expire_at: expireAt,
      });

      // Gửi email
      await sendOtpMail({
        to: email,
        code: otp.code,
        type: "signup",
        expiresInMin: 2,
      });

      await session.commitTransaction();
      session.endSession();

      // 5) Không tạo User ngay bây giờ. Chờ verify OTP xong mới tạo.
      return res.status(201).json({
        message: "",
        data: {
          email: email,
          expiresAt: expireAt,
        },
        success: true,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.signUp.error"),
    });
  }
};

export const verifySignUpOtp = async (req, res) => {
  try {
    const { email, fullName, password, code } = req.body;
    if (!email || !fullName || !password || !code) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifySignUpOtp.validation.allFieldsRequired"
        ),
      });
    }
    // Lấy pendingAccount mới nhất còn pending của email này
    const pa = await PendingAccount.findOne({
      email: email,
      status: "pending",
      expire_at: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!pa) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifySignUpOtp.validation.emailNotFound"
        ),
      });
    }
    // Lấy OTP signup mới nhất còn pending & còn hạn
    const otp = await OTP.findOne({
      pendingAccountId: pa._id,
      type: "signup",
      status: "pending",
      expire_at: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifySignUpOtp.validation.invalidToken"
        ),
      });
    }

    if (otp.code !== code) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifySignUpOtp.validation.invalidToken"
        ),
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // OTP -> verified
      await OTP.updateOne(
        { _id: otp._id },
        { $set: { status: "verified" } },
        { session }
      );

      // pendingAccount -> verified
      await PendingAccount.updateOne(
        { _id: pa._id },
        { $set: { status: "verified", verifiedAt: new Date() } },
        { session }
      );

      // Tạo user
      await User.create({
        email,
        fullName,
        password,
        isOnboarded: false,
      });

      // Invalidate các OTP còn pending khác nếu có
      await OTP.updateMany(
        { pendingAccountId: pa._id, type: "signup", status: "pending" },
        { $set: { status: "expired" } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        data: {},
        message: "",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.log("Error in verify signup OTP controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.verifySignUpOtp.error"),
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.login.validation.allFieldsRequired"),
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.login.validation.incorrectData"),
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.login.validation.incorrectData"),
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    await JWT.create({
      userId: user._id,
      token,
      expire_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    });

    // res.cookie("jwt", token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });

    let resUser = user.toObject();
    delete resUser.password;

    return res.status(200).json({
      success: true,
      data: { user: resUser, token },
      message: "",
    });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.login.error"),
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.token;
    await JWT.updateOne({ token }, { $set: { expire_at: new Date() } });
    // res.clearCookie("jwt");

    res.status(200).json({ success: true, message: "", data: {} });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.logout.error"),
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.resetPassword.validation.allFieldsRequired"
        ),
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.resetPassword.validation.userNotFound"
        ),
      });
    }

    // Bọc trong transaction để đồng bộ
    const session = await mongoose.startSession();
    session.startTransaction();

    const expireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút
    try {
      // 1) Expire tất cả OTP type=forgot_password liên quan đến email này
      await OTP.updateMany(
        {
          userId: user._id,
          type: "forgot_password",
          status: "pending",
        },
        { $set: { status: "expired" } },
        { session }
      );

      // 2) Tạo OTP mới
      const otp = await OTP.create({
        userId: user._id,
        type: "forgot_password",
        code: generateOtp(),
        status: "pending",
        expire_at: expireAt,
      });

      // 3) Gửi email
      await sendOtpMail({
        to: email,
        code: otp.code,
        type: "forgot_password",
        expiresInMin: 2,
      });

      await session.commitTransaction();
      session.endSession();

      // 5) Không tạo User ngay bây giờ. Chờ verify OTP xong mới tạo.
      return res.status(201).json({
        success: true,
        message: "",
        data: {
          email: email,
          expiresAt: expireAt,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.log("Error in reset password controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.resetPassword.error"),
    });
  }
};

export const verifyResetPasswordOtp = async (req, res) => {
  try {
    const { email, newPassword, code } = req.body;

    if (!newPassword || !code) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifyResetPasswordOtp.validation.allFieldsRequired"
        ),
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifyResetPasswordOtp.validation.userNotFound"
        ),
      });
    }

    // Lấy OTP mới nhất còn pending & còn hạn
    const otp = await OTP.findOne({
      userId: user._id,
      type: "forgot_password",
      status: "pending",
      expire_at: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifyResetPasswordOtp.validation.invalidToken"
        ),
      });
    }

    if (otp.code !== code) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:authRoute.verifyResetPasswordOtp.validation.invalidToken"
        ),
      });
    }

    // Nếu OTP hợp lệ, cho phép người dùng đặt lại mật khẩu
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Cập nhật mật khẩu mới cho người dùng
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      await User.updateOne({ email: email }, { password: hash }, { session });

      await OTP.updateOne(
        { userId: user._id, type: "forgot_password", status: "pending" },
        { $set: { status: "verified" } },
        { session }
      );

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        data: {},
        message: "",
      });
    } catch (error) {
      await session.abortTransaction();
      console.log("Error in verify reset password OTP controller", error);
      res.status(500).json({
        success: false,
        locale: req.i18n.language,
        message: req.t("errors:authRoute.verifyResetPasswordOtp.error"),
      });
    }
  } catch (error) {
    console.log("Error in verify reset password OTP controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.verifyResetPasswordOtp.error"),
    });
  }
};

export const onboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bio, nativeLanguage, learningLanguage, location, profilePic } =
      req.body;

    if (
      !nativeLanguage ||
      !learningLanguage ||
      !location ||
      !bio ||
      !profilePic
    ) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t("errors:authRoute.onboard.validation.allFieldsRequired"),
      });
    }

    const newProfile = await Profile.create({
      userId,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      profilePic,
    });

    const nativeLanguageF = await Language.findById(newProfile.nativeLanguage)
      .select("-__v -createdAt -updatedAt -_id")
      .lean();

    const learningLanguageF = await Language.findById(
      newProfile.learningLanguage
    )
      .select("-__v -createdAt -updatedAt -_id")
      .lean();

    const profilePublic = {
      bio: newProfile.bio,
      nativeLanguage: nativeLanguageF?.locale ?? newProfile.nativeLanguage,
      learningLanguage:
        learningLanguageF?.locale ?? newProfile.learningLanguage,
      location: newProfile.location,
      profilePic: newProfile.profilePic,
    };

    // 3) Cập nhật user và chỉ định bỏ các field không muốn trả về
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isOnboarded: true },
      { new: true }
    )
      .select("-password -createdAt -updatedAt -__v")
      .lean();

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: newProfile.profilePic || "",
      });
      console.log(
        `Stream user updated after onboarding for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.log(
        "Error updating Stream user during onboarding:",
        streamError.message
      );
    }

    res.status(200).json({
      success: true,
      message: "",
      data: {
        user: {
          ...updatedUser,
          profile: profilePublic,
        },
      },
    });
  } catch (error) {
    console.log("Error in onboarding controller", error);
    res.status(500).json({
      success: false,
      locale: req.i18n.language,
      message: req.t("errors:authRoute.onboard.error"),
    });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "-password -__v -createdAt -updatedAt"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        locale: req.i18n.language,
        message: req.t("errors:authRoute.me.validation.userNotFound"),
      });
    }

    if (user.isOnboarded) {
      const profile = await Profile.findOne({ userId }).select(
        "-userId -_id -createdAt -updatedAt -__v"
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            ...user.toObject(),
            profile: {
              ...profile.toObject(),
            },
          },
        },
        message: "",
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          user: { ...user.toObject() },
        },
        message: "",
      });
    }
  } catch (error) {
    console.log("Error in getMe controller", error);
    res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:authRoute.me.error"),
    });
  }
};
