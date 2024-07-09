// models/Account.js
import  mongoose from 'mongoose';
const { Schema, models } = mongoose;

const accountSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  provider: String,
  providerAccountId: String,
  refresh_token: String,
  access_token: String,
  expires_at: Number,
  token_type: String,
  scope: String,
  id_token: String,
  session_state: String,
}, { collection: 'accounts' });

accountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

const Account =models.Account || mongoose.model('Account', accountSchema);
module.exports = Account;
