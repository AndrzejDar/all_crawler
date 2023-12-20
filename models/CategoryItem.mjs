// const mongoose = require("mongoose");
// const { Wallet } = require("./Wallet");
// const Schema = mongoose.Schema;

class Price {
  constructor(lowest_price, median_price, items_count, allegro_prod_id) {
    this.created_at = new Date();
    this.lowest_price = lowest_price;
    this.median_price = median_price;
    this.items_count = items_count;
    this.allegro_prod_id = allegro_prod_id;
  }
}

class ProductListing {
  constructor(title, price, allegro_prod_id, state, cat_id) {
    this.created_at = new Date();
    this.allegro_prod_id = allegro_prod_id;
    this.price = price;
    this.title = title;
    this.cat_id = cat_id; //foreign key - CategorItem.allegro_cat_id id
    this.state = state; //'Nowy' | 'Używany'
  }

  toArray() {
    return [
      this.created_at,
      this.title,
      this.price,
      this.allegro_prod_id,
      this.state,
      this.cat_id,
    ];
  }
}

class CategoryItem {
  constructor(
    best_price,
    best_price_w_shipping,
    product_name,
    allegro_cat_name,
    allegro_cat_id,
    best_price_prod_list,
    best_price_w_shipping_prod_list
  ) {
    this.id = Math.random() * 1000; //
    this.created_at = new Date();
    this.product_name = product_name;
    this.allegro_cat_name = allegro_cat_name;
    this.allegro_cat_id = allegro_cat_id;
    this.best_price = best_price;
    this.best_price_history = [];
    this.best_price_w_shipping = best_price_w_shipping;
    this.best_price_w_shipping_history = [];
    this.best_price_prod_list = best_price_prod_list;
    this.best_price_w_shipping_prod_list = best_price_w_shipping_prod_list;
  }

  addBestPrice() {}
  addBestPriceWShipping() {}
}
export { CategoryItem, Price, ProductListing };
