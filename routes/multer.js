const multer  = require('multer')
var path = require('path')
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
    //   const filename = 'random' + path.extname(file.originalname)
    const filename = crypto.randomBytes(20).toString('hex') + path.extname(file.originalname)
      cb(null, filename)
    }
  })
  
const upload = multer({ storage: storage })

module.exports = upload;