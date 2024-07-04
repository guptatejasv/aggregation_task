import express from "express";

import {
  getPropertyType,
  getFilteredData,
  searchProperty,
} from "./../controllers/AirBnbController.js";
const router = express.Router();

router.get("/propertyType", getPropertyType);
router.get("/searchType", searchProperty);
router.get("/getFilteredData", getFilteredData);

export default router;
