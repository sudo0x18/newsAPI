const { body } = require("express-validator");
const express = require("express");
const router = express.Router();

const feedController = require("../controller/feedController");
const Post = require("../models/postModel");

const isAuth = require("../middlewares/isAuth");

router.get("/posts", feedController.getPosts);

router.get("/post/:postId", feedController.getByIdPost);

router.post(
  "/post/create",
  [
    body("title")
      .isLength({ min: 5 })
      .withMessage("Title must be atleast 5 char long")
      .escape(),
    body("description")
      .isLength({ min: 120 })
      .withMessage("Description must be atleast 120 char long")
      .escape(),
    body("image").isEmpty().withMessage("Image is required"),
  ],
  isAuth,
  feedController.createPost
);

router.put(
  "/post/:postId",
  [
    body("title")
      .isLength({ min: 5 })
      .withMessage("Title must be atleast 5 char long")
      .escape(),
    body("description")
      .isLength({ min: 120 })
      .withMessage("Description must be atleast 120 char long")
      .escape(),
  ],
  isAuth,
  feedController.updatePost
);

//Like and dislike
router.patch("/post/:postId", isAuth, feedController.likeDislike);

//Add Comment
router.patch(
  "/post/comment/:postId",
  [body("comment").isLength({ min: 5 }).escape()],
  isAuth,
  feedController.addComment
);

//Deleting Post
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
