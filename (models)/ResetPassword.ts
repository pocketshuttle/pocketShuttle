import mongoose, { model } from "mongoose";
const { Schema, models } = mongoose;

const ResetPasswordSchema = new Schema({
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
ResetPasswordSchema.index({ email: 1, token: 1 }, { unique: true });

const ResetPasswordToken =
  models?.ResetPasswordToken ||
  model("ResetPasswordToken", ResetPasswordSchema);

export default ResetPasswordToken;
