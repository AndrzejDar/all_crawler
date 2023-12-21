-- @block
CREATE TABLE ProductCategories(
    id INT PRIMARY KEY AUTO_INCREMENT,
    allegro_cat_id INT NOT NULL UNIQUE,
    allegro_cat_name VARCHAR(255),
    product_name VARCHAR(255),
    created_at VARCHAR(255),
    auto_scrape BOOLEAN(),
);

-- @block
CREATE TABLE Prices(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at VARCHAR(255),
    lowest_price INT,
    median_price INT,
    items_count INT,
    price_type VARCHAR(255),
    productCategory_id INT,
    FOREIGN KEY (productCategory_id) REFERENCES ProductCategories(id)
        );
-- @block
CREATE TABLE Offers(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at VARCHAR(255),
    title VARCHAR(255),
    allegro_prod_id INT,
    price INT,    
    state VARCHAR(255),
    cat_id INT,
    FOREIGN KEY (cat_id) REFERENCES ProductCategories(id)
        );
-- @block

-- @block
INSERT INTO prices (lowest_price, median_price, items_count)
VALUES
    (12.12 , 13.40, 32),
    (11.11 , 13.48, 33)

-- @block
INSERT INTO  ProductCategories (best_price, allegro_cat_id)
VALUES
    (NULL , 113)


-- @block
INSERT INTO ProductCategories (id, allegro_cat_id)
VALUES
    (...)

-- @block
SELECT 
    ProductCategories.id,
    Prices.id AS price_id
 FROM ProductCategories
RIGHT JOIN Prices
ON ProductCategories.best_price = Prices.id;

-- @block
DROP TABLE prices

-- @block
INSERT INTO `Offers` (created_at, title, price ,allegro_prod_id, state, cat_id) 
VALUES 
 ('2023-12-16 15:10:16.065', 'OKAZJA APPLE IPHONE XR 128GB - BRAK FUNKCJI FACE ID', '799.99', 14616375160, 'używane', 11), 
 ('2023-12-16 15:10:16.065', 'Iphone XR 64GB Black - Jak nowy!', '800.00', 1069431445, 'używane', 11);


-- @block
ALTER TABLE `Offers`
MODIFY COLUMN `allegro_prod_id` BIGINT;
-- @block
ALTER TABLE `ProductCategories`
ADD COLUMN `last_scrape`;