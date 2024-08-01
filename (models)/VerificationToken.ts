import mongoose, { model } from "mongoose";
const { Schema, models } = mongoose;

const VerificationTokenSchema = new Schema({
  customId: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  token: {
    type: String,
    unique: true,
    required: true,
  },
  expires: {
    type: Date,
  },
});

const VerificationToken =
  models?.VerificationToken ||
  model("VerificationToken", VerificationTokenSchema);

export default VerificationToken;
