import "./polyfill.js";
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import cloudinary from "cloudinary";
import http from "http";
import { setupSocket } from "./socket.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = http.createServer(app);
setupSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
