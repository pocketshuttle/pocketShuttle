import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const userSchema = new Schema({
  name: { type: String, default: null },
  email: { type: String, unique: true, default: null },
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "parent", "teacher"],
    default: "admin",
  },
  emailVerified: { type: Date, default: null },
  image: { type: String, default: null },
  accounts: [{ type: Schema.Types.ObjectId, ref: "Account" }],
  sessions: [{ type: Schema.Types.ObjectId, ref: "Session" }],
  Authenticators: [{ type: Schema.Types.ObjectId, ref: "Authenticator" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
// console.log("models", mongoose.models); // Debugging line
// console.log("new schema", NewUserSchema); // Debugging line
const User = models?.User || model("User", userSchema);

export default User;
