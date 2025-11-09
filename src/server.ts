/**
 * ===============================================================
 *  Server Entry — Intelligenter Project (Kafka integrated)
 * ===============================================================
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./db";
import { runScheduler } from "./scheduler";
import { initKafkaConsumer } from "./kafkaConsumer";
import { handlePostDomain, handleGetDomain, handleGetAllDomains } from "./controllers/domainCoontroller";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
// Serve all static files from the "public" folder
app.use(express.static("public"));

// API endpoints
app.get("/domains", handleGetDomain);
app.post("/domains", handlePostDomain);
app.get("/domains/all", handleGetAllDomains);

async function startServer() {
  await initDB();
  await initKafkaConsumer();
  runScheduler();

  app.listen(3000, () => {
    console.log(" Server running on http://localhost:3000");
  });
}

startServer().catch((err) => {
  console.error(" Server startup failed:", err);
  process.exit(1);
});
