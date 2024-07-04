import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/airbnbRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

mongoose
  .connect("mongodb://127.0.0.1:27017/aggregation", {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to the database.");
  });

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running made on port ${PORT}`);
});
