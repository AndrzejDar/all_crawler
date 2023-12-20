-- @block
CREATE TABLE productCategories(
    id INT PRIMARY KEY AUTO_INCREMENT,
    allegro_cat_id INT NOT NULL UNIQUE,
    allegro_cat_name VARCHAR(255),
    product_name VARCHAR(255),
    created_at VARCHAR(255),
    auto_scrape BOOLEAN
);

-- @block
CREATE TABLE prices(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at VARCHAR(255),
    lowest_price INT,
    median_price INT,
    items_count INT,
    price_type VARCHAR(255),
    productCategory_id INT,
    FOREIGN KEY (productCategory_id) REFERENCES productCategories(id)
        );
-- @block
CREATE TABLE offers(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at VARCHAR(255),
    title VARCHAR(255),
    allegro_prod_id INT,
    price INT,    
    state VARCHAR(255),
    cat_id INT,
    FOREIGN KEY (cat_id) REFERENCES productCategories(id)
        );

        -- @block
        DROP TABLE ProductCategories