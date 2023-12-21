import {
  AddProductListings,
  GetAllAllegroCategoriesToScrape,
  GetCategoryByAllegroId,
  MarkCategoryScrapeDate,
  SelectCategoryIdByAllegroId,
} from "../Repositories/MySQLCategoryRepository.js";
import {
  CategoryItem,
  Price,
  ProductListing,
} from "../models/CategoryItem.mjs";
import { PuppeteerManager } from "./puppeterUtils.js";
// const { Addresses } = require("../models/Addresses");
// const { Transaction } = require("../models/Wallet");

const scrapeAllegroCategory = async (catId) => {
  const pm = new PuppeteerManager();
  await pm.init();

  const result = await scrapePage(
    catId,
    "?order=p&offerTypeBuyNow=1&stan=nowe",
    pm
  );
  if (!result || !result.bestPrice || !result.categoryData) return null;
  const { bestPrice, categoryData } = result;
  bestPrice.type = "bestPrice";
  console.log(bestPrice, categoryData);
  const result2 = await scrapePage(
    catId,
    "?order=d&offerTypeBuyNow=1&stan=nowe",
    pm
  );
  if (!result2 || !result2.bestPrice) return;
  const { bestPrice: bestPriceWShipping } = result2;
  bestPriceWShipping.type = "bestPriceWShipping";

  const catItem = new CategoryItem(
    bestPrice,
    bestPriceWShipping,
    categoryData.name,
    categoryData.alias,
    categoryData.id,
    result.productsList,
    result.productsListDataJson
  );

  await pm.release();
  return catItem;
};
const scrapeAllegroCategoryAll = async (allegro_cat_id, usedProduct = true) => {
  let pageCounter = 1;
  let savedProductListings = [];
  const cat_id = await SelectCategoryIdByAllegroId(allegro_cat_id);
  if (!cat_id) {
    throw new Error("Unknown allegro category - try adding it before");
  }
  const pm = new PuppeteerManager();
  await pm.init();

  const firstPage = await scrapePage(
    allegro_cat_id,
    `?order=p&offerTypeBuyNow=1&stan=${
      usedProduct ? "używane" : "nowe"
    }&p=${pageCounter}`,
    pm
  );
  if (!firstPage) {
    console.log("failed scraping first page");
    return null;
  }

  const pages =
    firstPage.productsListDataJson.items.searchMeta.lastAvailablePage;
  const productsList = firstPage.productsList;

  const productListingsArray = [];
  if (productsList && productsList.length > 0) {
    // console.log("productsList", productsList);
    productsList.forEach((p) => {
      // console.log(p.parameters.find((param) => param.name === "Stan")); //s
      const productListing = new ProductListing(
        p.title.text,
        parseInt(p.price.normal.amount),
        parseInt(p.id),
        usedProduct ? "używane" : "nowe", //
        cat_id
      ).toArray();
      productListingsArray.push(productListing);
    });

    await AddProductListings(productListingsArray);
    savedProductListings.push(...productListingsArray);
  } else {
    console.log("failed scraping list");
  }
  pageCounter++;
  while (pages > 1 && pageCounter <= pages) {
    const page = await scrapePage(
      allegro_cat_id,
      `?order=p&offerTypeBuyNow=1&stan=${
        usedProduct ? "używane" : "nowe"
      }&p=${pageCounter}`,
      pm
    );
    if (!page) {
      console.log(
        `failed scraping page ${pageCounter} for allegro_cat_id: ${allegro_cat_id}`
      );
      pageCounter++;
    } else {
      const productsList = page.productsList;

      const productListingsArray = [];
      productsList.forEach((p) => {
        const productListing = new ProductListing(
          p.title.text,
          parseInt(p.price.normal.amount),
          parseInt(p.id),
          usedProduct ? "używane" : "nowe", //
          cat_id
        ).toArray();
        productListingsArray.push(productListing);
      });

      await AddProductListings(productListingsArray);
      pageCounter++;
      savedProductListings.push(...productListingsArray);
    }
  }
  await pm.release();
  return { pagesFound: pages, savedProductListings: savedProductListings };
};

const scrapePage = async (catId, query, pm) => {
  let page = null;
  try {
    page = await pm.createPageFromUrl(
      // "https://wp.pl"
      `https://allegro.pl/kategoria/${catId}` + query
    );
  } catch (e) {
    throw new Error("failed createing page from URL");
    return;
  }
  if (page === null) {
    console.log("page is empty in scrapePage");
    return;
  }
  if (!page.isClosed()) {
    await page.screenshot({ path: "image.png" });
  }
  const productsListDataJson = await extractProudctsListJson(page);
  // console.log(productsListDataJson);
  if (productsListDataJson === null) {
    console.log("Failed scraping page - no json data retrieved");
    return;
  }
  const productsList = productsListDataJson.items.elements.filter((el) => {
    return el.type != "label";
  });
  const productsInCatCount =
    productsListDataJson.items.searchMeta.availableCount;
  const catData =
    productsListDataJson.items.categoryData[
      productsListDataJson.items.categoryData.length - 1
    ];
  return {
    bestPrice: new Price(
      productsList[0].price.normal.amount,
      0,
      productsInCatCount,
      productsList[0].id
    ),
    categoryData: catData,
    productsList: productsList,
    productsListDataJson: productsListDataJson,
  };
  // } catch (error) {
  //   console.log(error);
  // }
};

const extractProudctsListJson = async (page) => {
  const jsonsData = await page.evaluate(() => {
    const scriptElements = document.querySelectorAll(
      'script[type="application/json"]'
    );
    if (scriptElements) {
      return Array.from(scriptElements).map((scriptElement) =>
        JSON.parse(scriptElement.textContent.trim())
      );
    }
    return null;
  });

  if (jsonsData != null && jsonsData.length > 0) {
    const productsJsonData = jsonsData.filter((el) => {
      return (
        (el.listingType === "base-mobile" || el.listingType === "base") &&
        el.__listing_StoreState
      );
    })[0];
    return JSON.parse(productsJsonData.__listing_StoreState);
  } else {
    console.log("no valid list of products in scraped data");
    return null;
  }
};

const scrapeAllAllegroCategories = async () => {
  const startTime = new Date();
  console.log(
    "INITIALIZING SCHEDULED ACTION - scrape all allegro categories",
    startTime
  );

  const categoriesArray = await GetAllAllegroCategoriesToScrape();

  for (let i = 0; i < categoriesArray.length; i++) {
    const category = categoriesArray[i];
    const res = await scrapeAllegroCategoryAll(category.allegro_cat_id);
    console.log(
      `!!! scrpaped ${res?.savedProductListings?.length} products for categorry ${category.allegro_cat_id}`
    );
    if (res?.savedProductListings && res?.savedProductListings?.length > 0) {
      await MarkCategoryScrapeDate(category.id);
    }
  }
  const finishTime = new Date();
  console.log(
    `FINISHED SCRAPING ${categoriesArray.length} CATEGORIES at: `,
    finishTime,
    ", duration: ",
    (finishTime - startTime) / 1000,
    "s"
  );
};

export {
  scrapeAllegroCategory,
  scrapeAllegroCategoryAll,
  scrapeAllAllegroCategories,
};
