// const express = require("express");
// const res = require("express/lib/response");
// const router = express.Router();
// const config = require("config");
// const jwt = require("jsonwebtoken");

// const bcrypt = require("bcryptjs");

// //Item Model
// const User = require("../../models/User");

// // @route   POST api/users
// // @desc    Register new user
// // @access  Public
// router.post("/", (req, res) => {
//   const { name, email, password } = req.body;

//   //validation - TODO improve
//   if (!name || !email || !password) {
//     return res.status(400).json({ msg: "Please enter all login data" });
//   }
//   User.findOne({ email }).then((user) => {
//     if (user) return res.status(400).json({ msg: "user already exists" });
//     const newUser = new User({
//       name,
//       email,
//       password,
//     });

//     bcrypt.genSalt(10, (err, salt) => {
//       bcrypt.hash(newUser.password, salt, (err, hash) => {
//         if (err) throw err;
//         newUser.password = hash;
//         newUser.save().then((user) => {
//           jwt.sign(
//             { id: user.id },
//             config.get("jwtSecret"),
//             { expiresIn: 3600 },
//             (err, token) => {
//               if (err) throw err;
//               res.json({
//                 token,
//                 user: {
//                   id: user.id,
//                   name: user.name,
//                   email: user.email,
//                 },
//               });
//             }
//           );
//         });
//       });
//     });
//   });
// });

// //export default router;
// module.exports = router; //not IE6 JS
