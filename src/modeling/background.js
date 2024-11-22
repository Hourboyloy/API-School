const mongoose = require("mongoose");
const bgSchema = new mongoose.Schema({
  bgurl: {
    type: String,
  },
  seted: {
    type: Boolean,
    default: false,
  },
  cloadinary_id: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("backgroundimgs", bgSchema);
