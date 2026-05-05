const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// 🔥 STATIC FILES (PLAYER + PANEL)
app.use("/", express.static(path.join(__dirname, "../player")));
app.use("/panel", express.static(path.join(__dirname, "../panel")));

// ===== CLOUDINARY =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// ===== MULTER =====
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// ===== DATA FILE =====
const DATA_FILE = path.join(__dirname, "data.json");

// INIT FILE
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    main: [],
    sidebar: []
  }, null, 2));
}

// ===== HELPERS =====
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    return { main: [], sidebar: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== GET DATA =====
app.get("/data", (req, res) => {
  res.json(readData());
});

// ===== UPLOAD MAIN (MULTI) =====
app.post("/upload/main", upload.array("files"), async (req, res) => {
  try {
    const data = readData();

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto",
        folder: "tgoo/main"
      });

      fs.unlinkSync(file.path);

      data.main.push({
        type: result.resource_type === "video" ? "video" : "image",
        src: result.secure_url
      });
    }

    writeData(data);
    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error upload main");
  }
});

// ===== UPLOAD SIDEBAR (MULTI) =====
app.post("/upload/sidebar", upload.array("files"), async (req, res) => {
  try {
    const data = readData();

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto",
        folder: "tgoo/sidebar"
      });

      fs.unlinkSync(file.path);

      data.sidebar.push({
        type: result.resource_type === "video" ? "video" : "image",
        src: result.secure_url
      });
    }

    writeData(data);
    res.json({ success: true });

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

  const data = readData();
  const item = { type, src: url };

  if (target === "sidebar") {
    data.sidebar.push(item);
  } else {
    data.main.push(item);
  }

  writeData(data);
  res.send("URL añadida");
});

// ===== CLEAR =====
app.delete("/clear/main", (req, res) => {
  const data = readData();
  data.main = [];
  writeData(data);
  res.send("MAIN limpiado");
});

app.delete("/clear/sidebar", (req, res) => {
  const data = readData();
  data.sidebar = [];
  writeData(data);
  res.send("SIDEBAR limpiado");
});

// ===== START SERVER (RENDER READY) =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Backend corriendo en puerto ${PORT}`);
});