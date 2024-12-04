const handle = require('../controller/ViewsAnalysis.controller')
const ViewsAnalysis = (app) => {
  app.post("/views/create-or-update", handle.createOrUpdateViews);
  app.get("/views/total-per-12-months", handle.getTotalViewsForLast12Months);
};

module.exports = ViewsAnalysis;
