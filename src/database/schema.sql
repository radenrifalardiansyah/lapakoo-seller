-- Seller Management System Database Schema (Multi-Tenant SaaS)

-- Create database
CREATE DATABASE IF NOT EXISTS seller_management;
USE seller_management;

-- ─── Packages (subscription plans) ──────────────────────────────────────────

CREATE TABLE packages (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    price       DECIMAL(15,2) DEFAULT 0,
    -- Feature flags
    feat_dashboard     BOOLEAN DEFAULT TRUE,
    feat_products      BOOLEAN DEFAULT TRUE,
    feat_orders        BOOLEAN DEFAULT TRUE,
    feat_analytics     BOOLEAN DEFAULT FALSE,
    feat_customers     BOOLEAN DEFAULT FALSE,
    feat_resellers     BOOLEAN DEFAULT FALSE,
    feat_marketing     BOOLEAN DEFAULT FALSE,
    feat_payments      BOOLEAN DEFAULT FALSE,
    feat_notifications BOOLEAN DEFAULT TRUE,
    feat_settings      BOOLEAN DEFAULT TRUE,
    feat_help          BOOLEAN DEFAULT TRUE,
    -- Limits (-1 = unlimited)
    max_products INT DEFAULT 50,
    max_orders   INT DEFAULT 100,
    max_users    INT DEFAULT 1,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO packages (id, name, description, price, feat_analytics, feat_customers, feat_marketing, feat_payments, max_products, max_orders, max_users) VALUES
('starter',  'Starter',  'Paket dasar untuk toko baru',         99000,  FALSE, FALSE, FALSE, FALSE, 50,   100,  1),
('pro',      'Pro',      'Fitur lengkap untuk toko berkembang',  299000, TRUE,  TRUE,  TRUE,  TRUE,  500,  -1,   5),
('business', 'Business', 'Semua fitur termasuk reseller',        599000, TRUE,  TRUE,  TRUE,  TRUE,  -1,   -1,  -1);

-- Update business package to include resellers
UPDATE packages SET feat_resellers = TRUE WHERE id = 'business';

-- ─── Tenants (clients / stores) ──────────────────────────────────────────────

CREATE TABLE tenants (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    subdomain     VARCHAR(100) UNIQUE NOT NULL,
    store_name    VARCHAR(255) NOT NULL,
    owner_name    VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    logo_url      VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    package_id    VARCHAR(50) NOT NULL DEFAULT 'starter',
    status        ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    trial_ends_at TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id),
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status)
);

INSERT INTO tenants (subdomain, store_name, owner_name, email, primary_color, package_id) VALUES
('demo',     'Toko Demo',          'Admin Demo',   'demo@seller.id',        '#6366f1', 'starter'),
('tokobudi', 'Toko Budi Jaya',     'Budi Santoso', 'budi@tokobudi.seller.id', '#0ea5e9', 'pro'),
('abcstore', 'ABC Store Official', 'Ahmad Rizki',  'admin@abcstore.seller.id','#10b981', 'business');

-- ─── Tenant users (staff per tenant) ─────────────────────────────────────────

CREATE TABLE tenant_users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id  INT NOT NULL,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('owner', 'admin', 'staff') DEFAULT 'staff',
    status     ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_email (tenant_id, email),
    INDEX idx_tenant_id (tenant_id)
);

-- Sellers table
CREATE TABLE sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    store_name VARCHAR(255),
    store_description TEXT,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    stock INT DEFAULT 0,
    weight DECIMAL(8,2) DEFAULT 0,
    dimensions VARCHAR(100),
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_sku (sku),
    INDEX idx_status (status)
);

-- Product images table
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
);

-- Customers table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Customer addresses table
CREATE TABLE customer_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    type ENUM('home', 'office', 'other') DEFAULT 'home',
    recipient_name VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Indonesia',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id)
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    seller_id INT NOT NULL,
    customer_id INT NOT NULL,
    customer_address_id INT,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    notes TEXT,
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_seller_id (seller_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- Order items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Inventory logs table
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_type ENUM('order', 'restock', 'adjustment', 'return') NOT NULL,
    reference_id INT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_type (type),
    INDEX idx_reference (reference_type, reference_id)
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    gateway_response TEXT,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_transaction_id (transaction_id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    type ENUM('order', 'payment', 'stock', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read') DEFAULT 'unread',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- Analytics tables
CREATE TABLE daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    date DATE NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_visitors INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    avg_order_value DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seller_date (seller_id, date),
    INDEX idx_seller_id (seller_id),
    INDEX idx_date (date)
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Fashion', 'Clothing, shoes, and accessories'),
('Home & Garden', 'Home appliances and garden tools'),
('Sports', 'Sports equipment and accessories'),
('Books', 'Books and educational materials'),
('Health & Beauty', 'Health and beauty products'),
('Automotive', 'Car parts and accessories'),
('Food & Beverages', 'Food and drink products');

-- Insert sample seller
INSERT INTO sellers (name, email, phone, address, store_name, store_description) VALUES
('Ahmad Rizki', 'ahmad@example.com', '+62 812-3456-7890', 'Jl. Sudirman No. 123, Jakarta', 
 'Toko Ahmad Electronics', 'Toko elektronik terpercaya dengan produk berkualitas tinggi');

-- Insert sample products
INSERT INTO products (seller_id, category_id, name, description, sku, price, stock, weight, status) VALUES
(1, 1, 'iPhone 14 Pro Max', 'Apple iPhone 14 Pro Max 256GB Space Gray', 'IPH14PM-256-SG', 15999000, 25, 240, 'active'),
(1, 1, 'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23 Ultra 512GB Black', 'SGS23U-512-BK', 18999000, 15, 235, 'active'),
(1, 1, 'MacBook Air M2', 'Apple MacBook Air M2 13-inch 256GB Space Gray', 'MBA-M2-256-SG', 18999000, 8, 1240, 'active'),
(1, 2, 'Nike Air Jordan 1', 'Nike Air Jordan 1 Retro High OG Size 42 Red', 'NAJ1-42-RED', 2499000, 3, 800, 'active'),
(1, 2, 'Adidas Ultraboost 22', 'Adidas Ultraboost 22 Running Shoes Size 43 White', 'AUB22-43-WHT', 2899000, 0, 350, 'out_of_stock');

-- Create indexes for better performance
CREATE INDEX idx_products_seller_status ON products(seller_id, status);
CREATE INDEX idx_orders_seller_date ON orders(seller_id, created_at);
CREATE INDEX idx_orders_status_date ON orders(status, created_at);

-- Create views for common queries
CREATE VIEW product_summary AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.price,
    p.stock,
    p.status,
    c.name as category_name,
    s.store_name,
    COALESCE(pi.image_url, '') as primary_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sellers s ON p.seller_id = s.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1;

CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.created_at,
    c.name as customer_name,
    c.email as customer_email,
    s.store_name,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN sellers s ON o.seller_id = s.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON seller_management.* TO 'seller_user'@'localhost' IDENTIFIED BY 'seller_password';
-- FLUSH PRIVILEGES;