const mongoose = require("mongoose");

const newsmodel = mongoose.Schema({
  title: {
    type: String,
    trim: true,
    unique: true,
    default: null,
  },

  photosDescription: [
    {
      photoCloudinaryId: { type: String, default: "" }, // Cloudinary public_id for photo
      photo: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        maxlength: [5000, "Text cannot be more than 500 characters long"],
        default: "",
      },
    },
  ],
  category: {
    type: String,
    trim: true,
  },
  viewer: {
    type: Number,
    trim: true,
    default: 0,
  },
  comments: [
    {
      userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Reference to users collection
      username: { type: String, trim: true, required: true }, // Username of the commenter
      comment: { type: String, trim: true, default: "" },
      like: [
        {
          userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          username: { type: String, trim: true, required: true }, // Username of the user who liked
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      dislike: [
        {
          userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          username: { type: String, trim: true, required: true }, // Username of the user who disliked
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      replies: [
        {
          userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Reference to users collection
          username: { type: String, trim: true, required: true }, // Username of the replier
          replyToUsername: { type: String, trim: true, default: "" }, // Username of the user being replied to
          comment: { type: String, trim: true },
          like: [
            {
              userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
              username: { type: String, trim: true, required: true }, // Username of the user who liked the reply
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          dislike: [
            {
              userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
              username: { type: String, trim: true, required: true }, // Username of the user who disliked the reply
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          createdAt: { type: Date, default: Date.now },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isVisible: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("news", newsmodel);

// const mongoose = require("mongoose");

// const newsmodel = mongoose.Schema({
//   title: {
//     type: String,
//     trim: true,
//     unique: true,
//     default: null,
//   },
//   photoCloudinaryIds: { type: [String], default: [] }, // Cloudinary public_id for photo
//   photos: {
//     type: [String],
//     required: true,
//     trim: true,
//   },
//   description: {
//     type: String,
//     trim: true,
//     maxlength: [400, "Text cannot be more than 500 characters long"],
//   },
//   category: {
//     type: String,
//     trim: true,
//   },
//   viewer: {
//     type: Number,
//     trim: true,
//     default: 0,
//   },
//   // comments: [
//   //   {
//   //     userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Reference to users collection
//   //     comment: { type: String, trim: true },
//   //     like: { type: Number, default: 0 },
//   //     dislike: { type: Number, default: 0 },
//   //     replies: [
//   //       {
//   //         userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Reference to users collection
//   //         comment: { type: String, trim: true },
//   //         like: { type: Number, default: 0 },
//   //         dislike: { type: Number, default: 0 },
//   //         createdAt: { type: Date, default: Date.now },
//   //       },
//   //     ],
//   //     createdAt: { type: Date, default: Date.now },
//   //   },
//   // ],
//   isVisible: {
//     type: Number,
//     default: 1,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("news", newsmodel);
