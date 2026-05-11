<?php
// Database configuration
class Database {
    private $host = 'localhost';
    private $db_name = 'seller_management';
    private $username = 'root';
    private $password = '';
    private $connection = null;

    public function getConnection() {
        if ($this->connection == null) {
            try {
                $this->connection = new PDO(
                    "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                    $this->username,
                    $this->password,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
                    ]
                );
            } catch(PDOException $exception) {
                echo "Connection error: " . $exception->getMessage();
            }
        }
        return $this->connection;
    }

    public function closeConnection() {
        $this->connection = null;
    }
}

// Database helper functions
function getDB() {
    $database = new Database();
    return $database->getConnection();
}

function executeQuery($sql, $params = []) {
    try {
        $db = getDB();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

function fetchOne($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt ? $stmt->fetch() : false;
}

function fetchAll($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt ? $stmt->fetchAll() : false;
}

function insertRecord($table, $data) {
    $columns = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));
    $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
    
    $stmt = executeQuery($sql, $data);
    return $stmt ? getDB()->lastInsertId() : false;
}

function updateRecord($table, $data, $where, $whereParams = []) {
    $setClause = [];
    foreach (array_keys($data) as $column) {
        $setClause[] = "{$column} = :{$column}";
    }
    $setClause = implode(', ', $setClause);
    
    $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
    $params = array_merge($data, $whereParams);
    
    return executeQuery($sql, $params) !== false;
}

function deleteRecord($table, $where, $params = []) {
    $sql = "DELETE FROM {$table} WHERE {$where}";
    return executeQuery($sql, $params) !== false;
}

// Example usage:
/*
// Get all products
$products = fetchAll("SELECT * FROM products WHERE seller_id = ?", [$seller_id]);

// Get single product
$product = fetchOne("SELECT * FROM products WHERE id = ?", [$product_id]);

// Insert new product
$product_data = [
    'name' => 'iPhone 14 Pro',
    'price' => 15999000,
    'stock' => 10,
    'seller_id' => $seller_id
];
$product_id = insertRecord('products', $product_data);

// Update product
$update_data = ['stock' => 15];
$updated = updateRecord('products', $update_data, 'id = ?', [$product_id]);

// Delete product
$deleted = deleteRecord('products', 'id = ?', [$product_id]);
*/
?>