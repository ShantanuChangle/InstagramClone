const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    data: String,
    time: String,
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }
});

module.exports = mongoose.model('comment', commentSchema);