const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 STATIC FILES
app.use(express.static(path.join(__dirname, "../player")));
app.use("/panel", express.static(path.join(__dirname, "../panel")));

// ===== CLOUDINARY =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// ===== MULTER =====
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ===== DATA FILE =====
const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    main: [],
    sidebar: []
  }, null, 2));
}

// ===== GET DATA =====
app.get("/data", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  } catch {
    res.json({ main: [], sidebar: [] });
  }
});

// ===== UPLOAD MAIN =====
app.post("/upload/main", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "tgoo/main"
    });

    fs.unlinkSync(req.file.path);

    let data = JSON.parse(fs.readFileSync(DATA_FILE));

    data.main.push({
      type: result.resource_type === "video" ? "video" : "image",
      src: result.secure_url
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error upload main");
  }
});

// ===== UPLOAD SIDEBAR =====
app.post("/upload/sidebar", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "tgoo/sidebar"
    });

    fs.unlinkSync(req.file.path);

    let data = JSON.parse(fs.readFileSync(DATA_FILE));

    data.sidebar.push({
      type: result.resource_type === "video" ? "video" : "image",
      src: result.secure_url
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error upload sidebar");
  }
});

// ===== ADD URL =====
app.post("/upload/url", (req, res) => {
  const { url, target } = req.body;

  let type = "image";

  if (url.includes("youtube") || url.includes("youtu.be")) {
    type = "youtube";
  } else if (url.includes("vimeo")) {
    type = "vimeo";
  } else if (url.includes(".mp4")) {
    type = "video";
  }

  let data = JSON.parse(fs.readFileSync(DATA_FILE));

  const item = { type, src: url };

  if (target === "sidebar") {
    data.sidebar.push(item);
  } else {
    data.main.push(item);
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  res.send("URL añadida");
});

// ===== CLEAR =====
app.delete("/clear/main", (req, res) => {
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  data.main = [];
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.send("MAIN limpiado");
});

app.delete("/clear/sidebar", (req, res) => {
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  data.sidebar = [];
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.send("SIDEBAR limpiado");
});

// ===== START =====
app.listen(3000, () => {
  console.log("🔥 Backend corriendo en http://localhost:3000");
});