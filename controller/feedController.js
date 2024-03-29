const { validationResult } = require("express-validator");
const Post = require("../models/postModel");
const path = require("path");
const fs = require("fs");
const User = require("../models/userModel");

const throwError = (errCode, message, data) => {
  const err = new Error(message);
  err.statusCode = errCode;
  err.data = data;
  return err;
};

//Serving Posts
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await (
      await Post.find()
        .populate("postBy", "firstname email")
        .populate("comments.user", "firstname email")
    ).reverse();
    res.status(200).json({
      status: true,
      posts: posts,
    });
  } catch (err) {
    return next(throwError(500, "Something went wrong", {}));
  }
};

//Get post by id
exports.getByIdPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
      .populate("postBy", "firstname email")
      .populate("comments.user", "firstname email");
    if (!post) {
      return next(throwError(422, "No post found", null));
    }
    return res.status(200).json({
      status: true,
      post: post,
    });
  } catch (err) {
    return next(throwError(422, "Invalid PostId", {}));
  }
};

//Creating post
exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(throwError(400, "Validation failed", errors.array()));
  }
  if (!req.file) {
    return next(
      throwError(422, "Image is required or invalid file extension", null)
    );
  }
  const title = req.body.title;
  const description = req.body.description;
  const imageFile = req.file;
  const image = imageFile.path;

  try {
    const newPost = await new Post({
      title: title,
      description: description,
      image: image,
      postBy: req.userId,
    }).save();

    const user = await User.findOne({ _id: req.userId });
    id = newPost._id;
    user.posts.push(id);
    await user.save();
    res.status(201).json({
      status: true,
      message: "Created successfully",
      post: newPost,
    });
  } catch (err) {
    return next(500, "Something went wrong", err);
  }
};

//Updating Post
exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(throwError(400, "Validation failed", errors.array()));
  }
  const title = req.body.title;
  const description = req.body.description;
  const imageFile = req.file;
  const postId = req.params.postId;
  let image;
  try {
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return next(throwError(422, "No post found", null));
    }
    if (req.file) {
      image = imageFile.path;
      filePath = post.image;
      clearImage(filePath, next);
    }
    image = post.image;

    post.title = title;
    post.description = description;
    post.image = image;

    await post.save();

    res.status(201).json({
      status: true,
      message: "Updated successfully",
      post: post,
    });
  } catch (err) {
    return next(throwError(500, "Something went wrong", err));
  }
};

//Delete Post
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return next(throwError(422, "No post found", null));
    }
    filePath = path.join(__dirname, "..", post.image);
    await clearImage(filePath, next);
    await Post.findByIdAndDelete(postId);
    const user = await User.findOne({ _id: req.userId });
    user.posts.pull(postId);
    await user.save();
    return res.status(200).json({
      status: true,
      message: "Deleted Successfully",
    });
  } catch (err) {
    return next(throwError(500, "Something went wrong", err));
  }
};

//Like Dislike
exports.likeDislike = async (req, res, next) => {
  let message = "";
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(throwError(422, "No post found", null));
    }
    const isLiked = await post.likedBy.map((u) => {
      return u.toString() === req.userId.toString();
    });
    if (isLiked.length > 0) {
      post.likeCount -= 1;
      post.likedBy.pull(req.userId);
      message = "Disliked Successfully";
    } else {
      post.likeCount += 1;
      post.likedBy.push(req.userId);
      message = "Liked Successfully";
    }
    const updatedPost = await post.save();
    res.status(200).json({
      status: true,
      message: message,
      post: updatedPost,
    });
  } catch (err) {
    return next(throwError(500, "Something went wrong", err.message));
  }
};

//Adding Comment
exports.addComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(throwError(400, "Validation failed", errors.array()));
  }
  const postId = req.params.postId;
  const comment = req.body.comment;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(throwError(422, "No post found", null));
    }
    post.comments.push({
      user: req.userId,
      comment: comment,
    });
    const updatedPost = await post.save();
    res.status(200).json({
      status: true,
      message: "Commented",
      post: updatedPost,
    });
  } catch (err) {
    return next(throwError(500, "Something went wrong", err));
  }
};

//Deleting Iage
clearImage = (filePath, next) => {
  fs.unlink(filePath, (err) => {
    if (err) next(err);
  });
};
