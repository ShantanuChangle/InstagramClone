const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb+srv://shantanuchangle2:Shantanuchangle2@instagramclone.t4cme.mongodb.net/?retryWrites=true&w=majority&appName=InstagramClone");

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  image: String,
  like:{
    type:Number,
    default:0
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
