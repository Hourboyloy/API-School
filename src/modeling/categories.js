const mongoose = require("mongoose");
const categoriesSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("categories", categoriesSchema);
