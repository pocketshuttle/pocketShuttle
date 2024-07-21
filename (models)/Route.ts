import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const routeSchema = new Schema({
  school_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  route_name: { type: String },
  route_description: { type: String },
});
// console.log("models", mongoose.models); // Debugging line
// console.log("new schema", NewUserSchema); // Debugging line
const Route = models?.Route || model("Route", routeSchema);

export default Route;
