const mongoose = require("mongoose");

const viewsAnalysisSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: String,
    required: true, 
  },
  totalViews: {
    type: Number,
    required: true,
    default: 0, // Initialize total views to 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ViewsAnalysis = mongoose.model("viewsanalysis", viewsAnalysisSchema);

module.exports = ViewsAnalysis;
