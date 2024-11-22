const handle = require("../controller/background.controller");
const multer_cloudinary = require("../middleware/multer_cloudinary");
const protect_route_admin = require("../security/protect_route_admin");

const background_route = (app) => {
  app.post(
    "/upload-bg",
    protect_route_admin,
    multer_cloudinary.single("bgurl"),
    handle.uploadBGImage
  );

  app.put("/set-bg/:id", protect_route_admin, handle.updateSetedField);

  app.delete(
    "/background-remove/:id",
    protect_route_admin,
    handle.deleteBGImage
  );

   app.get("/background-getAll", handle.getAllBGImages);
   app.get("/background-get/:id", handle.getBGImageById);
   app.get("/background-seted", handle.getSetedDocument);
};

module.exports = background_route;
