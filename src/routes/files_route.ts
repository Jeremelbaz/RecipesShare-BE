import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";

const base = process.env.DOMAIN_BASE + "/";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/users");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname
      .split(".")
      .filter(Boolean)
      .slice(1)
      .join(".");
    cb(null, Date.now() + "." + ext);
  },
});
const upload = multer({ storage: storage });

router.post("/", upload.single("file"), function (req, res) {
  const filePath = path.posix.join("users", req.file?.filename || "");
  const fileUrl = `${base}${filePath}`;
  console.log("router.post(/file: " + fileUrl);
  res.status(200).send({ url: fileUrl });
});

export = router;
