import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import items from "./routes/api/items.js";
import scheduleOperation from "./nodejs/scheduleOperations.js";
import scheduleOperations from "./nodejs/scheduleOperations.js";
import { scrapeAllAllegroCategories } from "./nodejs/scrape.mjs";

dotenv.config();

const app = express();

//Bodyparser Middleware
app.use(express.json());

// USE routes
app.use(cors());
app.use("/api/items/", items); //returns last scraped data from db

//we need to have library of phones (models) and variants with coresponding allegro search pages and olx items
//allegro ones can be added by searching in navbar then scraping list from left, category by category to the bottom then adding some params like '?stan=nowe'
//categories on allegro have name + id f.e. iphone 5s is: https://allegro.pl/kategoria/apple-iphone-5s-145923?stan=nowe
// then need for color and memory params: ...+&kolor=srebrny&wbudowana-pamiec=32%20GB

//Run server
if (!process.env.PORT) console.log("[-] missing env variables");
const port = process.env.PORT || 5000; //variable from host or 5000

scheduleOperations();

//start scraping on startup
scrapeAllAllegroCategories();

app.listen(port, () => console.log(`server started on port: ${port}`));
