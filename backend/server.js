import app from "./app.js";
import { connectDB } from "./config/db.js";
import "dotenv/config";
import http from "http";

const PORT = process.env.PORT || 3001;

// const corsOptions=['http://localhost:3000']
connectDB();
const server = http.createServer(app);

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
