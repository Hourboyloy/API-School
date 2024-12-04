const mongoose = require("mongoose");
const newsmodel = require("../modeling/news");
const cload = require("../cload/cloadinary");

const deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = await newsmodel.findById(newsId);

    if (!news) {
      return res.status(404).json({ message: "News not found!" });
    }

    // Remove the associated images from Cloudinary
    if (news.photoCloudinaryId) {
      await cload.uploader.destroy(news.photoCloudinaryId); // Delete the photo from Cloudinary
    }

    // Remove the news from the database
    await newsmodel.findByIdAndDelete(newsId);
    res.status(200).json({
      message: "deleted successfully",
      success: true,
      status: 200,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateNews = async (req, res) => {
  try {
    let myAddPhoto = req.files["addPhoto"];
    let nullphotos = req.body.nullphotos || [];
    if (!Array.isArray(nullphotos)) {
      nullphotos = [nullphotos];
    }

    // If req.files["photos"] is not an array, make it one.
    if (!Array.isArray(myAddPhoto)) {
      myAddPhoto = [myAddPhoto];
    }
    nullphotos.forEach((i) => {
      myAddPhoto.splice(i, 0, {
        fieldname: "addPhoto",
        originalname: "",
        encoding: "",
        mimetype: "image/jpeg",
        destination: "",
        filename: "",
        path: "",
        size: 0,
      });
    });

    const newsId = req.params.id;
    const { title, updatedAt, category, updateDescription } = req.body;

    // Convert comma-separated strings to arrays if they exist
    const removeIndices = req.body.removeIndices
      ? req.body.removeIndices
          .split(",")
          .map(Number)
          .sort((a, b) => a - b)
      : [];
    const updateIndices = req.body.updateIndices
      ? req.body.updateIndices
          .split(",")
          .map(Number)
          .sort((a, b) => a - b)
      : [];
    const descriptionRemoveIndex = req.body.descriptionRemoveIndex
      ? req.body.descriptionRemoveIndex
          .split(",")
          .map(Number)
          .sort((a, b) => a - b)
      : [];
    const descriptionUpdateIndex = req.body.descriptionUpdateIndex
      ? req.body.descriptionUpdateIndex
          .split(",")
          .map(Number)
          .sort((a, b) => a - b)
      : [];
    const photoRemoveIndex = req.body.photoRemoveIndex
      ? req.body.photoRemoveIndex
          .split(",")
          .map(Number)
          .sort((a, b) => a - b)
      : [];
    const updateDescriptionArray = updateDescription || [];

    // Find the existing news by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News not found!", status: 404 });
    }

    const sanitizedTitle = news.title.replace(/[^a-zA-Z0-9-_]/g, "_"); // Replace invalid characters with '_'
    // Update the main fields of the news
    news.title = title || news.title;
    news.category = category || news.category;
    news.updatedAt = updatedAt || new Date();

    // 1. Remove photos at specified indices in photosDescription
    if (removeIndices.length > 0) {
      const indicesToRemove = removeIndices.sort((a, b) => b - a);
      for (const index of indicesToRemove) {
        if (news.photosDescription[index]?.photoCloudinaryId) {
          await cload.uploader.destroy(
            news.photosDescription[index].photoCloudinaryId
          );
        }
        news.photosDescription.splice(index, 1);
      }
    }

    // 2. Update photos at specified indices in photosDescription
    // console.log(req.files?.updatePhoto);
    for (let i = 0; i < updateIndices.length; i++) {
      const index = updateIndices[i];
      if (news.photosDescription[index] && req.files?.updatePhoto?.[i]) {
        // Remove old photo from Cloudinary
        if (news.photosDescription[index].photoCloudinaryId) {
          await cload.uploader.destroy(
            news.photosDescription[index].photoCloudinaryId
          );
        }

        // Upload new photo to Cloudinary
        const photoUpload = await cload.uploader.upload(
          req.files.updatePhoto[i].path,
          {
            folder: "photo_news_of_projectschool",
            public_id: `photo_news_of_projectschool_${sanitizedTitle}_photo_${Date.now()}`,
          }
        );

        // Update URL and Cloudinary ID at the specified index
        news.photosDescription[index].photo = photoUpload.secure_url;
        news.photosDescription[index].photoCloudinaryId = photoUpload.public_id;
      }
    }

    // 3. Remove descriptions at specified indices
    for (const index of descriptionRemoveIndex) {
      if (news.photosDescription[index]) {
        news.photosDescription[index].description = "";
      }
    }

    // 4. Update descriptions at specified indices
    if (
      Array.isArray(descriptionUpdateIndex) &&
      updateDescriptionArray.length > 0
    ) {
      descriptionUpdateIndex.forEach((index, i) => {
        // Ensure the index exists in photosDescription and the new description is non-empty
        if (
          news.photosDescription[index] &&
          updateDescriptionArray[i]?.trim() !== ("" && undefined)
        ) {
          news.photosDescription[index].description =
            updateDescriptionArray[i]?.trim();
        }
      });
    }

    // 5. Add new photos and/or descriptions from addDescription and addPhoto arrays
    const descriptions = Array.isArray(req.body.addDescription)
      ? req.body.addDescription
      : [req.body.addDescription || ""]; // Default to empty string if undefined

    if (req.files && req.files.addPhoto) {
      // Case 1: Add photos with or without descriptions
      for (let i = 0; i < myAddPhoto.length; i++) {
        const photo = myAddPhoto[i];
        const description = descriptions[i] ? descriptions[i] : ""; // Use description if available, else empty

        // Upload photo to Cloudinary
        const photoUpload =
          photo.filename !== ""
            ? await cload.uploader.upload(photo.path, {
                folder: "photo_news_of_projectschool",
                public_id: `photo_news_of_projectschool_${sanitizedTitle}_photo_${Date.now()}`,
              })
            : "";

        news.photosDescription.push({
          photo: photoUpload ? photoUpload.secure_url : "",
          photoCloudinaryId: photoUpload ? photoUpload.public_id : "",
          description: description,
        });
      }
    }

    // Case 2: Add descriptions only if addDescription exists without addPhoto
    if ((!req.files || !req.files.addPhoto) && req.body.addDescription) {
      for (let i = 0; i < descriptions.length; i++) {
        if (descriptions[i] && descriptions[i].trim() !== "") {
          news.photosDescription.push({
            photo: "", // No photo provided
            photoCloudinaryId: "", // No Cloudinary ID
            description: descriptions[i].trim(),
          });
        }
      }
    }

    // 6. Remove only the photo at specified indices (photoRemoveIndex)
    if (photoRemoveIndex.length > 0) {
      const indicesToRemove = photoRemoveIndex.sort((a, b) => b - a);
      for (const index of indicesToRemove) {
        if (news.photosDescription[index]?.photoCloudinaryId) {
          // Remove the photo from Cloudinary
          await cload.uploader.destroy(
            news.photosDescription[index].photoCloudinaryId
          );
        }
        // Remove only the photo (not the description)
        news.photosDescription[index].photo = "";
        news.photosDescription[index].photoCloudinaryId = "";
      }
    }

    // Save the updated news document
    const updatedNews = await news.save();
    res.status(200).json({
      message: "Update completed successfully",
      success: true,
      status: 200,
      updatedNews: updatedNews,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const usergetAll = async (req, res) => {
  try {
    const news = await newsmodel.find({ isVisible: 1 });
    res.json({
      message: "successfuly",
      success: true,
      status: 200,
      listNews: news,
    });
  } catch (error) {
    console.log(error);
  }
};

const admingetAll = async (req, res) => {
  try {
    const news = await newsmodel.find();
    res.json({
      message: "successfuly",
      success: true,
      status: 200,
      listNews: news,
    });
  } catch (error) {
    console.log(error);
  }
};

const getOne = async (req, res) => {
  try {
    const id = req.params.id;
    const news = await newsmodel.findById(id);
    if (news == null) {
      return res.json({
        message: "News not found",
        success: false,
        status: 404,
      });
    }
    res.json({
      message: "get successfuly",
      success: true,
      status: 200,
      news: news,
    });
  } catch (error) {
    console.log(error);
  }
};

const create = async (req, res) => {
  try {
    let myPhoto = req.files["photos"];
    let nullphotos = req.body.nullphotos || [];
    if (!Array.isArray(nullphotos)) {
      nullphotos = [nullphotos];
    }
    // If req.files["photos"] is not an array, make it one.
    if (!Array.isArray(myPhoto)) {
      myPhoto = [myPhoto];
    }
    nullphotos.forEach((i) => {
      myPhoto.splice(i, 0, {
        fieldname: "photos",
        originalname: "",
        encoding: "",
        mimetype: "image/jpeg",
        destination: "",
        filename: "",
        path: "",
        size: 0,
      });
    });

    const { title, category } = req.body;
    let description = req.body.description || []; // Array of descriptions, if provided

    if (typeof description === "string") {
      description = description.split(",").map((desc) => desc.trim());
    }

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required!" });
    }
    if (!category || category.trim() === "") {
      return res.status(400).json({ message: "Category is required!" });
    }
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_]/g, "_"); // Replace invalid characters with '_'

    // Initialize a new news model with non-photo fields
    const newNews = new newsmodel({
      title,
      category,
      viewer: 0, // Set viewer count to default 0 if not provided
    });

    // Check if photo files are uploaded
    if (req.files && req.files["photos"] && req.files["photos"].length > 0) {
      const photosDescription = [];

      // Loop through each file and upload to Cloudinary
      for (let i = 0; i < myPhoto.length; i++) {
        const file = myPhoto[i];
        const photoUpload =
          file.filename !== ""
            ? await cload.uploader.upload(file.path, {
                folder: "photo_news_of_projectschool",
                public_id: `photo_news_of_projectschool_${sanitizedTitle}_photo_${Date.now()}`, // Unique public_id
              })
            : "";

        // Add each photo with details to the `photosDescription` array
        photosDescription.push({
          public_id:
            photoUpload !== ""
              ? `photo_news_of_projectschool/${sanitizedTitle}_photo_${Date.now()}`
              : "",
          photo: photoUpload !== "" ? photoUpload.secure_url : "",
          description: description[i] || "", // Add corresponding description if provided
        });
      }

      // Assign the `photosDescription` array to the news model
      newNews.photosDescription = photosDescription;
    } else {
      return res.status(400).json({ message: "Photos are required!" });
    }

    // Save the news to the database
    const savedNews = await newNews.save();

    // Return the saved news as the response
    res.status(201).json({
      message: "Successfully created news",
      success: true,
      status: 201,
      data: savedNews,
    });
  } catch (error) {
    // Handle errors and return a 400 status with the error message
    console.error("Error creating news:", error);
    res.status(400).json({ message: error.message });
  }
};

async function updateIsVisible(req, res) {
  const { id } = req.params; // Get the news item ID from the request parameters
  const { isVisible } = req.body; // Get the updated visibility status from the request body
  try {
    // Validate if isVisible is provided and it's either 0 or 1
    if (isVisible !== 0 && isVisible !== 1) {
      return res
        .status(400)
        .json({ message: "Visibility status must be 0 or 1" });
    }

    // Find the news item by ID and update the isVisible field
    const updatedNews = await newsmodel.findByIdAndUpdate(
      id,
      { isVisible },
      { new: true } // Return the updated document
    );

    // Check if the news item exists
    if (!updatedNews) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Send the updated news item as a response
    res.status(200).json({
      message: "Visibility status updated successfully",
      result: updatedNews,
    });
  } catch (error) {
    // Handle errors and send an appropriate response
    console.error("Error updating visibility:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const increaseViewer = async (req, res) => {
  const newsId = req.params.id;

  try {
    // Increment the viewer count
    const updatedNews = await newsmodel.findByIdAndUpdate(
      newsId,
      { $inc: { viewer: 1 } }, // Increment viewer count by 1
      { new: true } // Return the updated document
    );

    if (!updatedNews) {
      return res.status(404).json({ message: "News article not found." });
    }

    return res
      .status(200)
      .json({ message: "Viewer count updated.", updatedNews });
  } catch (error) {
    console.error("Error increasing viewer count:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// handle work with commant
// const addComment = async (req, res) => {
//   try {
//     const { newsId } = req.params; // Extract news ID from URL params
//     const { userId, commentText, username } = req.body; // Extract userId and comment text from the request body
//     if (!username || !userId || !commentText) {
//       return;
//     }
//     // Find the news item by ID
//     const news = await newsmodel.findById(newsId);
//     if (!news) {
//       return res.status(404).json({ message: "News item not found" });
//     }
//     // Add the comment to the comments array in the news document
//     news.comments.push({
//       userid: userId,
//       username: username,
//       comment: commentText,
//       createdAt: new Date(),
//     });

//     // Save the updated news document
//     await news.save();

//     // Respond with success message
//     res.status(200).json({
//       message: "Comment added successfully",
//       comment: {
//         userid: userId,
//         username: username,
//         comment: commentText,
//         createdAt: new Date(),
//       },
//     });
//   } catch (error) {
//     console.error("Error adding comment:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const addComment = async (req, res) => {
  try {
    const { newsId } = req.params; // Extract news ID from URL params
    const { userId, commentText, username } = req.body; // Extract userId and comment text from the request body

    // Validate required fields
    if (!username || !userId || !commentText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Add the comment to the comments array in the news document
    news.comments.push({
      userid: userId,
      username: username,
      comment: commentText,
      createdAt: new Date(), // Set the comment's created date
    });

    // Save the updated news document
    await news.save();

    // Get the last inserted comment (the most recent one)
    const lastComment = news.comments[news.comments.length - 1];

    // Respond with success message and the last inserted comment
    res.status(200).json({
      message: "Comment added successfully",
      comment: lastComment, // Return only the last inserted comment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const replyToComment = async (req, res) => {
  try {
    const newsId = req.params.newsId; // ID of the news item
    const commentId = req.params.commentId; // ID of the comment to reply to
    const { userId, replyText, username, replyToUsername } = req.body; // User replying and the reply text

    // Validate required fields
    if (!username || !userId || !newsId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate the reply text
    if (!replyText || replyText.trim() === "") {
      return res.status(400).json({ message: "Reply text cannot be empty" });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment within the news item
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Add the reply to the comment
    const newReply = {
      userid: userId,
      username: username,
      replyToUsername: replyToUsername || "", // If no replyToUsername, it will be an empty string
      comment: replyText,
      createdAt: new Date(),
    };
    comment.replies.push(newReply);

    // Save the updated news document
    await news.save();

    // Find and return the updated comment with its replies
    const updatedComment = news.comments.id(commentId); // Retrieve the updated comment
    res.status(200).json({
      message: "Reply added successfully",
      comment: updatedComment, // Return the updated comment with replies
    });
  } catch (error) {
    console.error("Error replying to comment:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};


// const replyToComment = async (req, res) => {
//   try {
//     const newsId = req.params.newsId; // ID of the news item
//     const commentId = req.params.commentId; // ID of the comment to reply to
//     const { userId, replyText, username, replyToUsername } = req.body; // User replying and the reply text
//     // Validate the userId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     if (!username || !userId || !newsId) {
//       return;
//     }

//     // Validate the reply text
//     if (!replyText || replyText.trim() === "") {
//       return res.status(400).json({ message: "Reply text cannot be empty" });
//     }

//     // Find the news item by ID
//     const news = await newsmodel.findById(newsId);
//     if (!news) {
//       return res.status(404).json({ message: "News item not found" });
//     }

//     // Find the comment within the news item
//     const comment = news.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     // Add the reply to the comment
//     comment.replies.push({
//       userid: userId,
//       username: username,
//       replyToUsername: replyToUsername ? replyToUsername : "",
//       comment: replyText,
//       createdAt: new Date(),
//     });

//     // Save the updated news document
//     await news.save();

//     res.status(200).json({
//       message: "Reply added successfully",
//       comment: comment, // Return the updated comment with the new reply
//     });
//   } catch (error) {
//     console.error("Error replying to comment:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const likeOrDislikeComment = async (req, res) => {
  try {
    const newsId = req.params.newsId; // ID of the news item
    const commentId = req.params.commentId; // ID of the comment to like/dislike
    const { userId, action, username } = req.body; // Action can be "like", "dislike", "clearLike", "clearDislike"

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate the action
    if (!["like", "dislike", "clearLike", "clearDislike"].includes(action)) {
      return res.status(400).json({
        message:
          "Invalid action. Use 'like', 'dislike', 'clearLike', or 'clearDislike'.",
      });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment within the news item by ID
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user has already liked or disliked the comment
    const alreadyLiked = comment.like.some(
      (like) => like.userid.toString() === userId
    );
    const alreadyDisliked = comment.dislike.some(
      (dislike) => dislike.userid.toString() === userId
    );

    if (action === "like") {
      // Remove dislike if the user had previously disliked
      if (alreadyDisliked) {
        comment.dislike.pull({ userid: userId });
      }
      // Add the user's like if not already liked
      if (!alreadyLiked) {
        comment.like.push({ userid: userId, username, createdAt: new Date() });
      }
    } else if (action === "dislike") {
      // Remove like if the user had previously liked
      if (alreadyLiked) {
        comment.like.pull({ userid: userId });
      }
      // Add the user's dislike if not already disliked
      if (!alreadyDisliked) {
        comment.dislike.push({
          userid: userId,
          username,
          createdAt: new Date(),
        });
      }
    } else if (action === "clearLike") {
      // Only clear the like if the user previously liked
      if (alreadyLiked) {
        comment.like.pull({ userid: userId });
      }
    } else if (action === "clearDislike") {
      // Only clear the dislike if the user previously disliked
      if (alreadyDisliked) {
        comment.dislike.pull({ userid: userId });
      }
    }

    // Save the updated news document
    const result = await news.save();
    if (result) {
      // Respond with the updated comment and success message
      const data = await newsmodel.findById(newsId);
      res.status(200).json({
        message: "The comment was successfully updated",
        comments: data.comments,
      });
    }
  } catch (error) {
    console.error("Error liking/disliking comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const likeOrDislikeReply = async (req, res) => {
  try {
    const { newsId, commentId, replyId } = req.params;
    const { userId, action, username } = req.body; // `action` can be "like", "dislike", "clearLike", "clearDislike"

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Validate that the action is either "like", "dislike", "clearLike", or "clearDislike"
    if (!["like", "dislike", "clearLike", "clearDislike"].includes(action)) {
      return res.status(400).json({
        message:
          "Invalid action. Use 'like', 'dislike', 'clearLike', or 'clearDislike'.",
      });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment in the news item
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Find the reply in the comment
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check if the user has already liked or disliked
    const alreadyLiked = reply.like.some(
      (like) => like.userid.toString() === userId
    );
    const alreadyDisliked = reply.dislike.some(
      (dislike) => dislike.userid.toString() === userId
    );

    if (action === "like") {
      // If the user has previously disliked, remove from dislikes
      if (alreadyDisliked) {
        reply.dislike.pull({ userid: userId });
      }
      // Add the user to likes if not already liked
      if (!alreadyLiked) {
        reply.like.push({ userid: userId, username });
      }
    } else if (action === "dislike") {
      // If the user has previously liked, remove from likes
      if (alreadyLiked) {
        reply.like.pull({ userid: userId });
      }
      // Add the user to dislikes if not already disliked
      if (!alreadyDisliked) {
        reply.dislike.push({ userid: userId, username });
      }
    } else if (action === "clearLike") {
      // Only clear the like
      if (alreadyLiked) {
        reply.like.pull({ userid: userId });
      }
    } else if (action === "clearDislike") {
      // Only clear the dislike
      if (alreadyDisliked) {
        reply.dislike.pull({ userid: userId });
      }
    }

    const result = await news.save();
    if (result) {
      const data = await newsmodel.findById(newsId);
      res.status(200).json({
        message: `Action '${action}' successfully applied to the reply`,
        comments: data.comments,
      });
    }
  } catch (error) {
    console.error("Error processing reaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeComment = async (req, res) => {
  try {
    const newsId = req.params.newsId; // ID of the news item
    const commentId = req.params.commentId; // ID of the comment to be removed

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Remove the comment by ID
    news.comments = news.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );

    // Save the updated news document
    await news.save();

    res.status(200).json({
      message: "Comment removed successfully",
      news: news,
    });
  } catch (error) {
    console.error("Error removing comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeReply = async (req, res) => {
  try {
    const { newsId, commentId, replyId } = req.params; // IDs for news item, comment, and reply

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment within the news item by ID
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Remove the reply by ID
    comment.replies = comment.replies.filter(
      (reply) => reply._id.toString() !== replyId
    );

    // Save the updated news document
    await news.save();

    res.status(200).json({
      message: "Reply removed successfully",
      news: news,
    });
  } catch (error) {
    console.error("Error removing reply:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editComment = async (req, res) => {
  try {
    const { newsId, commentId } = req.params; // Extract news ID and comment ID from URL params
    const { userId, newCommentText } = req.body; // Extract user ID and the new comment text

    // Validate input
    if (!newCommentText || newCommentText.trim() === "") {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment within the news item
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is authorized to edit the comment
    if (comment.userid !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this comment" });
    }

    // Update the comment text
    comment.comment = newCommentText;
    comment.updatedAt = new Date();

    // Save the updated news document
    await news.save();

    res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editReply = async (req, res) => {
  try {
    const { newsId, commentId, replyId } = req.params; // Extract news ID, comment ID, and reply ID from URL params
    const { userId, newReplyText } = req.body; // Extract user ID and the new reply text

    // Validate input
    if (!newReplyText || newReplyText.trim() === "") {
      return res.status(400).json({ message: "Reply text cannot be empty" });
    }

    // Find the news item by ID
    const news = await newsmodel.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Find the comment within the news item
    const comment = news.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Find the reply within the comment
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check if the user is authorized to edit the reply
    if (reply.userid !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this reply" });
    }

    // Update the reply text
    reply.comment = newReplyText;
    reply.updatedAt = new Date();

    // Save the updated news document
    await news.save();

    res.status(200).json({
      message: "Reply updated successfully",
      reply,
    });
  } catch (error) {
    console.error("Error editing reply:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
  increaseViewer,
  deleteNews,
  updateNews,
  admingetAll,
  getOne,
  create,
  updateIsVisible,
  usergetAll,
  // commant
  addComment,
  likeOrDislikeComment,
  replyToComment,
  likeOrDislikeReply,
  removeComment,
  removeReply,
  editComment,
  editReply,
};
