import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

// $2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri = Bogamedithi123!

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await Conversation.updateMany(
      { $or: [{ sortTimestamp: { $exists: false } }, { sortTimestamp: null }] },
      [
        {
          $set: {
            sortTimestamp: { $ifNull: ["$updatedAt", "$$NOW"] },
          },
        },
      ]
    );

    await Conversation.collection.createIndex({ sortTimestamp: 1 });

    console.log("Updated conversations:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged,
    });

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
})();
