import mongoose from "mongoose";

const { models, model, Schema } = mongoose;

const parentSchema = new Schema({
  school_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  image: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  students: [
    {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: [],
    },
  ],
  password: {
    type: String,
    required: true,
  },
});

const Parent = models.Parent || model("Parent", parentSchema);
export default Parent;
