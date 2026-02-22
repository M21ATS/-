import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

// Initialize Database
const db = new Database("hroof.db");

// Create tables
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
  app.use(express.json()); // Enable JSON body parsing

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // --- API ROUTES ---

  // Auth: Signup
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

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ success: true, userId: user.id, username: user.username });
    } else {
      res.status(401).json({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
  });

  // Banks: Save
  app.post("/api/banks/save", (req, res) => {
    const { userId, name, data } = req.body;
    try {
      // Check if bank with same name exists for this user
      const existing = db.prepare("SELECT id FROM banks WHERE user_id = ? AND name = ?").get(userId, name) as any;
      if (existing) {
        db.prepare("UPDATE banks SET data = ? WHERE id = ?").run(JSON.stringify(data), existing.id);
      } else {
        db.prepare("INSERT INTO banks (user_id, name, data) VALUES (?, ?, ?)").run(userId, name, JSON.stringify(data));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: "فشل حفظ البنك" });
    }
  });

  // Banks: Load
  app.get("/api/banks/:userId", (req, res) => {
    const { userId } = req.params;
    const rows = db.prepare("SELECT name, data FROM banks WHERE user_id = ?").all(userId) as any[];
    const banks = rows.reduce((acc, row) => {
      acc[row.name] = JSON.parse(row.data);
      return acc;
    }, {});
    res.json({ success: true, banks });
  });

  // Banks: Delete
  app.delete("/api/banks/:userId/:name", (req, res) => {
    const { userId, name } = req.params;
    db.prepare("DELETE FROM banks WHERE user_id = ? AND name = ?").run(userId, name);
    res.json({ success: true });
  });

  // --- SOCKET LOGIC ---

  // Store room state in memory
  const rooms = new Map<string, {
    tiles: string[];
    letters: string[];
    selectedIdx: number;
    timeLeft: number;
    timerDuration: number;
    timerRunning: false;
    hostId: string;
    questions?: any;
    hideQuestionsFromGuest: boolean;
    players: { id: string; name: string }[];
  }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", ({ roomCode, playerName }) => {
      socket.join(roomCode);
      rooms.set(roomCode, {
        tiles: Array(25).fill("neutral"),
        letters: [],
        selectedIdx: -1,
        timeLeft: 30,
        timerDuration: 30,
        timerRunning: false,
        hostId: socket.id,
        hideQuestionsFromGuest: false,
        players: [{ id: socket.id, name: playerName }],
      });
      console.log(`Room created: ${roomCode} by ${playerName}`);
      io.to(roomCode).emit("player-list", rooms.get(roomCode)?.players);
    });

    socket.on("join-room", ({ roomCode, playerName }) => {
      const room = rooms.get(roomCode);
      if (room) {
        socket.join(roomCode);
        // Add player if not already in
        if (!room.players.find(p => p.id === socket.id)) {
          room.players.push({ id: socket.id, name: playerName });
        }
        socket.emit("room-state", room);
        io.to(roomCode).emit("player-list", room.players);
        console.log(`User ${playerName} (${socket.id}) joined room: ${roomCode}`);
      } else {
        socket.emit("error", "الغرفة غير موجودة أو انتهت صلاحيتها");
      }
    });

    socket.on("update-state", ({ roomCode, state }) => {
      const room = rooms.get(roomCode);
      if (room) {
        Object.assign(room, state);
        socket.to(roomCode).emit("room-state", room);
      }
    });

    socket.on("disconnecting", () => {
      for (const roomCode of socket.rooms) {
        const room = rooms.get(roomCode);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (empty)`);
          } else {
            io.to(roomCode).emit("player-list", room.players);
            // If host left, assign new host or close? For now, just notify
            if (room.hostId === socket.id) {
              room.hostId = room.players[0].id;
              io.to(roomCode).emit("new-host", room.hostId);
            }
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
