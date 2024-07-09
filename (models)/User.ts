import mongoose from "mongoose";
const { Schema, models } = mongoose;

const userSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true, sparse: true },
    emailVerified: Date,
    image: String,
    password: String,
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }],
  },
  { collection: "users" }
);

const User = models.User || mongoose.model("User", userSchema);
module.exports = User;
