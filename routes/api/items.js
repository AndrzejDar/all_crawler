import {
  scrapeAllAllegroCategories,
  scrapeAllegroCategory,
  scrapeAllegroCategoryAll,
} from "../../nodejs/scrape.mjs";
import express from "express";
import promisePool from "../../nodejs/db.js";
import {
  AddCategory,
  AddPriceToCategory,
  AddPriceToHistory,
  GetCategoryByAllegroId,
  SelectCategoryIdByAllegroId,
  SelectCurrentPrices,
} from "../../Repositories/MySQLCategoryRepository.js";
// const express = require("express");
const router = express.Router();
// const auth = require("../../middleware/auth");

//Item Model
// const Item = require("../../models/Item");

// @route   GET api/items/
// @desc    Get All Items
// @access  Public
router.get("/", (req, res) => {
  res.json({ id: 1, name: "test" });
  // Item.find()
  //   .sort({ date: -1 })
  //   .then((items) => res.json(items));
});

// @route   POST api/items
// @desc    Request scraping category (first page, from cheapest)
// @access  Public
router.post("/", async (req, res) => {
  const scrapedData = await scrapeAllegroCategory(req.body.id);
  console.log("scrapedData:", scrapedData);

  if (scrapedData != null) {
    let productCategory_id = await SelectCategoryIdByAllegroId(req.body.id);
    if (!productCategory_id) {
      const created_cat_id = await AddCategory(scrapedData);
      productCategory_id = created_cat_id;
    }

    const bestPrice = scrapedData?.best_price;
    if (bestPrice) {
      bestPrice.category_id = productCategory_id;
      const curr = await SelectCurrentPrices(bestPrice);
      console.log(curr);
      if (curr.length > 0) {
        curr.forEach(async (p) => {
          await AddPriceToHistory(p.id);
        });
      }
      await AddPriceToCategory(bestPrice);
    }
    const bestPriceWShipping = scrapedData?.best_price_w_shipping;
    if (bestPriceWShipping) {
      bestPriceWShipping.category_id = productCategory_id;
      const curr = await SelectCurrentPrices(bestPriceWShipping);
      console.log(curr);
      if (curr.length > 0) {
        curr.forEach(async (p) => {
          await AddPriceToHistory(p.id);
        });
      }
      await AddPriceToCategory(bestPriceWShipping);
    }

    res.json({ scraped: scrapedData });
  } else {
    const category = await GetCategoryByAllegroId(req.body.id);
    res.json(category);
  }
});

// @route   POST api/items/:allegro_cat_id/all
// @desc    Request scraping all product from category list (all pages, from chepest)
// @access  Public
router.post("/:allegro_cat_id/all", async (req, res) => {
  //req ={
  //    id // allegro_cat_id,
  //    usedProduct // true|false
  //    }
  console.log("POST SAVE ALL", req.params.allegro_cat_id);
  try {
    const scrapedData = await scrapeAllegroCategoryAll(
      req.params.allegro_cat_id
    );
    res.json(scrapedData);
  } catch (e) {
    console.log(e);
    res.status(400).json(e.message ? { error: e.message } : { error: e });
  }
});

// @route   POST api/items/:allegro_cat_id/all
// @desc    Request scraping all product from category list (all pages, from chepest)
// @access  Public
router.post("/all", async (req, res) => {
  //req ={
  //    id // allegro_cat_id,
  //    usedProduct // true|false
  //    }
  try {
    const scrapedData = await scrapeAllAllegroCategories();
    res.json("succes");
  } catch (e) {
    console.log(e);
    res.status(400).json(e.message ? { error: e.message } : { error: e });
  }
});

// @route   DELETE api/items/:id
// @desc    Delete an Item
// @access  Private
// router.delete("/:id", auth, (req, res) => {
//   Item.findById(req.params.id)
//     .then((item) => item.remove().then(() => res.json({ success: true })))
//     .catch((err) => {
//       console.log(err);
//       res.status(404).json({ success: false });
//     });
// });

export default router;

// module.exports = router; //not IE6 JS
