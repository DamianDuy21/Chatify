import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import Profile from "../models/Profile.js";
import SeenBy from "../models/SeenBy.js";
import User from "../models/User.js";

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const {
      conversationName = null,
      conversationId = null,
      conversationType = null,
    } = req.query || {};

    let conversations;

    if (conversationType == "chatbot") {
      const myConversationIds = await ConversationMember.find({
        userId: currentUserId,
      }).distinct("conversationId");
      conversations = await Conversation.find({
        type: "chatbot",
        _id: { $in: myConversationIds },
      });
    } else {
      if (conversationId) {
        conversations = await Conversation.find({
          _id: conversationId,
        });
      } else {
        const nameRegex = conversationName
          ? new RegExp(conversationName, "i")
          : null;

        const conversationIds = await ConversationMember.find({
          userId: currentUserId,
        }).distinct("conversationId");

        if (!nameRegex) {
          const allConversations = await Conversation.find({
            _id: { $in: conversationIds },
          });

          const lastMessages = await Message.aggregate([
            {
              $match: {
                conversationId: { $in: allConversations.map((c) => c._id) },
              },
            },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$$ROOT" },
              },
            },
          ]);

          const conversationIdsWithMsg = new Set(
            lastMessages.map((m) => m._id.toString())
          );
          const noMsgConversations = allConversations.filter(
            (c) => !conversationIdsWithMsg.has(c._id.toString())
          );

          const conversationsWithMsg = lastMessages.map((m) => ({
            _id: m._id,
            sortAt: m.lastMessage.createdAt,
          }));
          const conversationsNoMsg = noMsgConversations.map((c) => ({
            _id: c._id,
            sortAt: c.updatedAt,
          }));

          const merged = [...conversationsWithMsg, ...conversationsNoMsg].sort(
            (a, b) => b.sortAt - a.sortAt
          );

          const limitedIds = merged.map((x) => x._id);

          const unsortedConversations = await Conversation.find({
            _id: { $in: limitedIds },
          });
          conversations = limitedIds.map((id) =>
            unsortedConversations.find((c) => c._id.equals(id))
          );
        } else {
          const nonPrivateConversations = await Conversation.find({
            _id: { $in: conversationIds },
            type: { $ne: "private" },
            name: { $regex: nameRegex },
          });

          const privateConversationIds = await Conversation.distinct("_id", {
            _id: { $in: conversationIds },
            type: "private",
          });

          let privateConversations = [];
          if (privateConversationIds.length) {
            const matchedUserIds = await User.distinct("_id", {
              fullName: { $regex: nameRegex },
            });

            let matchedPrivateConversationIds = [];
            if (matchedUserIds.length) {
              matchedPrivateConversationIds = await ConversationMember.distinct(
                "conversationId",
                {
                  conversationId: { $in: privateConversationIds },
                  userId: { $in: matchedUserIds, $ne: currentUserId },
                }
              );
            }

            privateConversations = matchedPrivateConversationIds.length
              ? await Conversation.find({
                  _id: { $in: matchedPrivateConversationIds },
                })
              : [];
          }

          const merged = [
            ...nonPrivateConversations,
            ...privateConversations,
          ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

          conversations = merged;
        }
      }
    }

    const fullDataConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const notMyRecentMessage = await Message.find({
          conversationId: { $in: conversation._id },
          senderId: { $ne: currentUserId },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("-__v -createdAt -updatedAt");

        const unSeenMessages = notMyRecentMessage.map(async (msg) => {
          const isSeen = await SeenBy.findOne({
            messageId: msg._id,
            userId: currentUserId,
          });
          return isSeen ? 0 : 1;
        });
        const unSeenMessageQuantity = (
          await Promise.all(unSeenMessages)
        ).reduce((acc, curr) => acc + curr, 0);

        const memberIds = await ConversationMember.find({
          conversationId: conversation._id,
          userId:
            conversation.type == "group"
              ? { $ne: null }
              : { $ne: currentUserId },
        }).select("userId");

        let keyMemberId;
        if (conversation.type === "group") {
          keyMemberId = await ConversationMember.find({
            conversationId: conversation._id,
            isKeyMember: true,
          }).select("userId");
        }

        const users = await Promise.all(
          memberIds.map(async (member) => {
            const profile = await Profile.findOne({
              userId: member.userId,
            }).select("-userId -_id -createdAt -updatedAt -__v");
            if (!profile) return null;

            const user = await User.findById(member.userId).select(
              "-password -createdAt -updatedAt -__v"
            );
            if (!user) return null;

            let isFriend;
            let isSendFriendRequest;

            if (conversation.type === "group") {
              isFriend = await Friend.findOne({
                $or: [
                  { firstId: currentUserId, secondId: member.userId },
                  { firstId: member.userId, secondId: currentUserId },
                ],
              });
              isSendFriendRequest = await FriendRequest.findOne({
                $or: [
                  { senderId: currentUserId, recipientId: member.userId },
                  { senderId: member.userId, recipientId: currentUserId },
                ],
                status: "pending",
              });

              if (keyMemberId) {
                return {
                  user: {
                    ...user.toObject(),
                    profile: {
                      ...profile.toObject(),
                    },
                  },
                  isKeyMember: keyMemberId.some(
                    (km) => km.userId.toString() == member.userId.toString()
                  ),
                  isFriend: Boolean(isFriend),
                  isSendFriendRequest: Boolean(isSendFriendRequest),
                };
              }
            }

            return {
              user: {
                ...user.toObject(),
                profile: {
                  ...profile.toObject(),
                },
              },
            };
          })
        );

        const limitMessage = 16;
        const totalMessageCount = await Message.countDocuments({
          conversationId: { $in: conversation._id },
        });
        const totalMessagePages = Math.max(
          1,
          Math.ceil(totalMessageCount / limitMessage)
        );

        const recentMessages = await Message.find({
          conversationId: { $in: conversation._id },
        })
          .sort({ createdAt: -1 })
          .limit(limitMessage)
          .select("-__v ");

        const sortedMessages = [...recentMessages].reverse();

        const fullDataMessages = await Promise.all(
          sortedMessages.map(async (message) => {
            const sender = await User.findById(message.senderId).select(
              "-password -createdAt -updatedAt -__v"
            );
            const profileSender = await Profile.findOne({
              userId: message.senderId,
            }).select("-userId -_id -createdAt -updatedAt -__v");

            const attachments = await MessageAttachment.find({
              messageId: message._id,
            });
            const imageAttachments = attachments.filter(
              (attachment) => attachment.type === "image"
            );
            const videoAttachments = attachments.filter(
              (attachment) => attachment.type === "video"
            );
            const fileAttachments = attachments.filter(
              (attachment) => attachment.type === "file"
            );
            const seenBy = await SeenBy.find({ messageId: message._id });
            const fullDataSeenBy = await Promise.all(
              seenBy.map(async (seen) => {
                const user = await User.findById(seen.userId).select(
                  "-password -createdAt -updatedAt -__v"
                );
                if (!user) return null;
                const profile = await Profile.findOne({
                  userId: seen.userId,
                }).select("-userId -_id -createdAt -updatedAt -__v");
                return {
                  user: {
                    ...user.toObject(),
                    profile: {
                      ...profile.toObject(),
                    },
                  },
                };
              })
            );
            if (!sender) {
              return {
                sender: null,
                message: {
                  ...message.toObject(),
                  attachments: {
                    images: imageAttachments,
                    videos: videoAttachments,
                    files: fileAttachments,
                  },
                },
                seenBy: fullDataSeenBy,
              };
            }
            return {
              sender: {
                ...sender.toObject(),
                profile: {
                  ...profileSender.toObject(),
                },
              },
              message: {
                ...message.toObject(),
                attachments: {
                  images: imageAttachments,
                  videos: videoAttachments,
                  files: fileAttachments,
                },
              },
              seenBy: fullDataSeenBy,
            };
          })
        );

        const lastMessage = sortedMessages[sortedMessages.length - 1];

        const settings = await ConversationSetting.findOne({
          conversationId: conversation._id,
          userId: currentUserId,
        });

        return {
          conversation: {
            ...conversation.toObject(),
            lastMessage: lastMessage || null,
            settings,
            updatedAt: lastMessage
              ? lastMessage.createdAt
              : conversation.updatedAt,
          },
          messages: fullDataMessages,
          users,
          unSeenMessageQuantity,
          currentMessagePage: 1,
          totalMessagePageQuantity: totalMessagePages,
        };
      })
    );

    const resConversations = fullDataConversations.filter(Boolean);

    const total = resConversations.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = resConversations.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        conversations: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      message: "Lấy danh sách cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const getTotalConversationQuantityAboveFilter = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const quantity = await ConversationMember.countDocuments({
      userId: currentUserId,
    });

    res.status(200).json({
      success: true,
      data: {
        total: {
          conversations: quantity,
        },
      },
      message: "Lấy tổng số lượng cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("Error fetching total conversation quantity:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
