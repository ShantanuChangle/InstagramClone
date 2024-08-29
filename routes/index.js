var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post')
const commentModel = require('./comment')
const passport = require('passport');
const upload = require('./multer')

const localStrategy = require("passport-local");
const multer = require('multer');

passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('login')
});
router.get('/register', function (req, res, next) {
  res.render('register')
});

router.post('/register', upload.single('image'), function (req, res, next) {
  var newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    image: req.file.filename,
  })

  userModel.register(newUser, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/feed');
      })
    })
});

router.get("/login", function (req, res, next) {
  res.render('login');
})

router.post('/login', passport.authenticate("local", {
  successRedirect: '/feed',
  failureRedirect: '/login'
}), function (req, res, next) { });

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
}

router.get("/feed", isLoggedIn, async function (req, res, next) {
  var currentUser = await userModel.findOne({ username: req.session.passport.user });
  var allpost = await postModel.find().populate('owner').populate('comments').populate({ path: 'comments', populate: 'user' });
  // res.render('feed', { user: currentUser, allpost: allpost });
  res.render('feed', { allpost: allpost, user: currentUser })
})

router.get("/createPost", isLoggedIn, function (req, res, next) {
  res.render("createPost");
});

//for uploading multiple files using multer use upload.array("image instead of upload.single("image").
router.post("/createPost", isLoggedIn, upload.single('image'), function (req, res, next) {

  userModel.findOne({ username: req.session.passport.user }).then(loggedInUser => {

    postModel.create({
      owner: loggedInUser._id,
      image: req.file.filename,
      caption: req.body.caption
    }).then(newPost => {
      res.redirect('/feed');
    })

  })

});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  var currentUser = await userModel.findOne({ username: req.session.passport.user });
  res.render('profile', { user: currentUser });
})

router.get("/profile/:id", isLoggedIn, async function (req, res, next) {
  var askedUserDetails = await userModel.findOne({ _id: req.params.id }).then(function (askedUserDetails) {
    res.render('profile', { user: askedUserDetails });
  })
})

router.get('/edit/:id', isLoggedIn, async function (req, res, next) {

  userModel.findOne({
    username: req.session.passport.user
  }).then((loggedInUser) => {
    userModel.findOne({
      _id: req.params.id
    }).then((findUser) => {
      if (loggedInUser.username == findUser.username) {
        userModel.findOne({ _id: req.params.id }).then(editUserInfo => {
          res.render('edit', { userDetails: editUserInfo })
        })
      }
      else {
        res.send("Error : You cannot edit others information!")
      }
    })
  })
})

router.post('/update/:id', isLoggedIn, upload.single('image'), async function (req, res, next) {
  var editInfoUser = await userModel.findOneAndUpdate({ _id: req.params.id }, { username: req.body.username, name: req.body.name, email: req.body.email, image: req.file.filename });
  res.redirect('/profile');
})

router.get("/delete/:id", isLoggedIn, function (req, res, next) {

  userModel.findOne({
    username: req.session.passport.user
  }).then((loggedInUser) => {
    userModel.findOne({
      _id: req.params.id
    }).then((findUser) => {
      if (loggedInUser.username == findUser.username) {
        userModel.findOneAndDelete({ _id: req.params.id }).then(() => {
          res.redirect('/register');
        })
      }
      else {
        res.send("Error : This is not your account!")
      }
    })
  })
});

router.get("/postLikes/:userId", isLoggedIn, async function (req, res, next) {
  // postModel.findOne({ _id: req.params.postId }).then(post => {
  //   userModel.findOne({ username: req.session.passport.user }).then(loggedInUser => {
  //     var indexOfLoggedInUser = post.likes.indexOf(loggedInUser._id)

  //     if (indexOfLoggedInUser == -1) {
  //       post.likes.push(loggedInUser._id)
  //       post.save().then(post => {
  //         res.redirect('back');
  //       })
  //     }
  //     else {
  //       post.likes.splice(loggedInUser, 1);
  //       post.save().then(post => {
  //         res.redirect('back');
  //       })
  //     }
  //   })
  // })

  var loggedInUser = await userModel.findOne({
    username: req.session.passport.user
  })

  var currentLikedpost = await postModel.findOne({
    _id: req.params.userId
  })

  currentLikedpost.likes.push(loggedInUser._id)

  var likesCount = currentLikedpost.likes.length

  res.json({
    status: "liked",
    likesCount
  })

})

router.post('/addComment/:post_id', isLoggedIn, async function (req, res, next) {
  var currentPost = await postModel.findOne({
    _id: req.params.post_id
  })

  // console.log(currentPost);

  var loggedInUser = await userModel.findOne({
    username: req.session.passport.user
  })

  // console.log(loggedInUser);

  var newComment = await commentModel.create({
    user: loggedInUser._id,
    data: req.body.comment,
    time: `${Date.now()}`,
    post: currentPost._id,
  })

  currentPost.comments.push(newComment._id)
  await currentPost.save()
  res.redirect('back')
})

router.get('/deleteComment/:commentId', isLoggedIn, async function (req, res, next) {

  var loggedInUser = await userModel.findOne({
    username: req.session.passport.user
  });

  //Finding comment to be deleted
  var currentComment = await commentModel.findOne({ _id: req.params.commentId }).populate('user');

  //Kis Post Ka Comment delete krna hai usko dhoondo ooper wale currentComment ki help se.
  var currentPost = await postModel.findOne({ _id: currentComment.post }).populate('owner');

  if (currentComment.user.username == loggedInUser.username || currentPost.owner.username == loggedInUser.username) {
    await commentModel.findOneAndDelete({
      _id: currentComment._id
    })

    var indexOfCurrentComment = currentPost.comments.indexOf(currentComment._id);

    currentPost.comments.splice(indexOfCurrentComment, 1);
    await currentPost.save();
    res.redirect('back');
  }

  else {
    res.redirect('back');
  }

})

router.get('/search', isLoggedIn, function (req, res, next) {
  res.render('search');
})

router.post('/search', async (req, res, next) => {
  // console.log(req.body.data)/
  var findUsers = await userModel.find({
    username: { $regex: req.body.data }
  })

  // console.log(findUsers)
  res.json({
    users: findUsers
  })
})

router.post('/findUser', async function (req, res, next) {
  var user = await userModel.findOne({ username: req.body.data })
  if (user) {
    res.json({
      status: false
    })
  } else {
    res.json({
      status: true
    })
  }
})

router.get('/messages', isLoggedIn, async (req, res, next) => {
  var findAllUsers = await userModel.find()
  res.render('messages', { users: findAllUsers });
})

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


module.exports = router;


// repeat lecture 58 and 59 for json functionality and likes in instagram functionality.