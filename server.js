import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI, { toFile } from "openai";

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "https://karodisambi.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin tidak diizinkan oleh CORS."));
  },
}));

app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 24 * 1024 * 1024 },
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "Clipper Overlay Engine Backend",
    version: "1.1.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "OPENAI_API_KEY belum dikonfigurasi di server.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Tidak ada file. Gunakan field multipart bernama 'file'.",
      });
    }

    const uploadedFile = await toFile(
      req.file.buffer,
      req.file.originalname || "clip.mp4",
      { type: req.file.mimetype || "application/octet-stream" }
    );

    const transcription = await openai.audio.transcriptions.create({
      file: uploadedFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      language: "id",
      prompt:
        "Transkripsikan secara akurat. Pertahankan nama, istilah teknis, angka, dan kata bahasa Indonesia sebagaimana diucapkan.",
    });

    return res.json({
      ok: true,
      model: "gpt-4o-mini-transcribe",
      filename: req.file.originalname,
      text: transcription.text || "",
    });
  } catch (error) {
    console.error(error);

    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        ok: false,
        error: "File terlalu besar. Untuk V1.1 gunakan video di bawah 24 MB.",
      });
    }

    return res.status(error?.status || 500).json({
      ok: false,
      error:
        error?.error?.message ||
        error?.message ||
        "Terjadi kesalahan saat melakukan transkripsi.",
    });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      ok: false,
      error: "File terlalu besar. Untuk V1.1 gunakan video di bawah 24 MB.",
    });
  }

  return res.status(500).json({
    ok: false,
    error: err?.message || "Server error.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clipper Backend berjalan di port ${PORT}`);
});
