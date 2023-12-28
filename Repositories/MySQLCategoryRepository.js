import promisePool from "../nodejs/db.js";

const GetCategoryByAllegroId = async (allegro_cat_id) => {
  const query = `SELECT * FROM \`productCategories\`
        JOIN \`prices\` ON productCategories.id=prices.productCategory_id
        WHERE productCategories.allegro_cat_id=${allegro_cat_id} AND prices.price_type='best_price'`;
  const [rows] = await promisePool.query(query);
  return rows[0];
};

const AddCategory = async (data) => {
  console.log(
    "[-]adding new category to DB. Allegro_cat_id: ",
    data.allegro_cat_id
  );
  const insertQuery =
    "INSERT INTO `productCategories` (allegro_cat_id, allegro_cat_name, product_name, created_at) VALUES(?,?,?,?)";
  const insertValues = [
    data.allegro_cat_id,
    data.allegro_cat_name,
    data.product_name,
    data.created_at,
  ];
  const [res] = await promisePool.query(insertQuery, insertValues);
  console.log("Created cat id:", res.insertId);
  return res.insertId;
};

const AddPriceToCategory = async (data) => {
  console.log("adding new price to db");
  const insertQuery =
    "INSERT INTO `prices` (created_at,lowest_price,items_count,median_price,price_type,productCategory_id) VALUES(?,?,?,?,?,?)";
  const insertValues = [
    data.created_at,
    data.lowest_price,
    data.items_count,
    data.median_price,
    data.type,
    data.category_id,
  ];
  const res = await promisePool.query(insertQuery, insertValues);
};

const AddPriceToHistory = async (id) => {
  console.log(`[-] Adding price id: ${id} to history`);
  const updateQuery = `UPDATE \`prices\` SET price_type=CONCAT(price_type, '_history') WHERE id=${id}`;
  const res = await promisePool.execute(updateQuery);
};

const SelectCurrentPrices = async (data) => {
  console.log(`[-] Checking if old prices exists`, data);
  const query = `SELECT id FROM \`prices\` WHERE productCategory_id=${data.category_id} AND price_type='${data.type}'`;
  const [rows] = await promisePool.query(query);
  console.log(rows);
  return rows;
};

const SelectCategoryIdByAllegroId = async (id) => {
  console.log(`[-] Selecting category of id: ${id}`);
  const query = `SELECT * FROM \`productCategories\` WHERE allegro_cat_id=${id}`;
  const [rows] = await promisePool.query(query);
  if (rows[0]?.id) return rows[0].id;
  else return;
};

const AddProductListings = async (data) => {
  console.log(`[-] Addig multiple product listings`);
  const insertQuery = `INSERT INTO \`offers\` (created_at, title, price ,allegro_prod_id, state, cat_id,allegro_direct_link,allegro_lokalnie) VALUES ?`;
  const res = await promisePool.query(insertQuery, [data]);

  // this.created_at = new Date();
  // this.allegro_prod_id = allegro_prod_id;
  // this.price = price;
  // this.title = title;
  // this.allegro_cat_id = allegro_cat_id; //foreign key - CategorItem.allegro_cat_id id
  // this.state = state; //'Nowy' | 'Używany'
};

const GetAllAllegroCategoriesToScrape = async () => {
  console.log(`[-] Getting all allegor categories to scrape`);
  const upToDate = new Date().toISOString().slice(0, 10);
  console.log(upToDate);
  const query = `
  SELECT allegro_cat_id, id 
  FROM \`productCategories\` 
  WHERE auto_scrape=1 AND last_scrape != ?;`;
  const [rows] = await promisePool.query(query, [upToDate]);
  return rows;
};

const MarkCategoryScrapeDate = async (id) => {
  console.log(`[-] Marking Categor scrape date`);
  const query = `UPDATE \`productCategories\` SET last_scrape= '${new Date()
    .toISOString()
    .slice(0, 10)}' WHERE id=${id}`;
  await promisePool.query(query);
  return;
};

export {
  GetCategoryByAllegroId,
  AddCategory,
  AddPriceToCategory,
  AddPriceToHistory,
  SelectCurrentPrices,
  SelectCategoryIdByAllegroId,
  AddProductListings,
  GetAllAllegroCategoriesToScrape,
  MarkCategoryScrapeDate,
};
