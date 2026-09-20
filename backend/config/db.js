import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.DB_URL;
    await mongoose.connect(MONGO_URI);
    //   insertData()
    console.log("Mongo Active");
  } catch (e) {
    console.log("Mongo Error:", e);
  }
};
