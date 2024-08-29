const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://0.0.0.0/InstagramClone");

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
