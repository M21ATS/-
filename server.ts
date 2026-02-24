import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from 'url';

// إعدادات المسارات لتعمل بشكل صحيح في السيرفر
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تهيئة قاعدة البيانات - التأكد من استخدام القرص الثابت في Render
const getDatabasePath = () => {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (process.env.NODE_ENV === "production") return "/data/hroof.db";
  return path.join(process.cwd(), "hroof.db");
};

const dbPath = getDatabasePath();

// التأكد من وجود المجلد إذا كان المسار في /data
if (dbPath.startsWith("/data/")) {
  const fs = await import("fs");
  if (!fs.existsSync("/data")) {
    try {
      fs.mkdirSync("/data", { recursive: true });
    } catch (err) {
      console.error("Warning: Could not create /data directory, falling back to local storage");
    }
  }
}

const db = new Database(dbPath);
console.log(`قاعدة البيانات تعمل على المسار: ${dbPath}`);

// إنشاء الجداول إذا لم تكن موجودة
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    data TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // --- روابط الـ API (تسجيل الدخول والأسئلة) ---

  app.post("/api/auth/signup", (req, res) => {
    const { username, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      const result = stmt.run(username, password);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ success: false, error: "اسم المستخدم موجود مسبقاً" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ success: true, userId: user.id, username: user.username });
    } else {
      res.status(401).json({ success: false, error: "خطأ في البيانات" });
    }
  });

  app.post("/api/banks/save", (req, res) => {
    const { userId, name, data } = req.body;
    try {
      const existing = db.prepare("SELECT id FROM banks WHERE user_id = ? AND name = ?").get(userId, name) as any;
      if (existing) {
        db.prepare("UPDATE banks SET data = ? WHERE id = ?").run(JSON.stringify(data), existing.id);
      } else {
        db.prepare("INSERT INTO banks (user_id, name, data) VALUES (?, ?, ?)").run(userId, name, JSON.stringify(data));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  });

  app.get("/api/banks/:userId", (req, res) => {
    const { userId } = req.params;
    const rows = db.prepare("SELECT name, data FROM banks WHERE user_id = ?").all(userId) as any[];
    const banks = rows.reduce((acc, row) => {
      acc[row.name] = JSON.parse(row.data);
      return acc;
    }, {});
    res.json({ success: true, banks });
  });

  // --- نظام الغرف (Socket.io) ---

  const rooms = new Map<string, any>();

  io.on("connection", (socket) => {
    socket.on("create-room", ({ roomCode, playerName }) => {
      socket.join(roomCode);
      rooms.set(roomCode, {
        tiles: Array(25).fill("neutral"),
        letters: [],
        selectedIdx: -1,
        timeLeft: 30,
        players: [{ id: socket.id, name: playerName }],
        hostId: socket.id
      });
      io.to(roomCode).emit("player-list", rooms.get(roomCode).players);
    });

    socket.on("join-room", ({ roomCode, playerName }) => {
      const room = rooms.get(roomCode);
      if (room) {
        socket.join(roomCode);
        if (!room.players.find((p: any) => p.id === socket.id)) {
          room.players.push({ id: socket.id, name: playerName });
        }
        io.to(roomCode).emit("player-list", room.players);
        socket.emit("room-state", room);
      }
    });

    socket.on("update-state", ({ roomCode, state }) => {
      const room = rooms.get(roomCode);
      if (room) {
        Object.assign(room, state);
        socket.to(roomCode).emit("room-state", room);
      }
    });
  });

  // تشغيل الملفات في الإنتاج (Render)
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`سيرفر اللعبة شغال على بورت: ${PORT}`);
  });
}

startServer();