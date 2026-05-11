<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

// Mock seller ID (in real app, get from session/auth)
$seller_id = 1;

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetProducts($seller_id);
        break;
    case 'POST':
        handleCreateProduct($seller_id);
        break;
    case 'PUT':
        handleUpdateProduct($seller_id);
        break;
    case 'DELETE':
        handleDeleteProduct($seller_id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGetProducts($seller_id) {
    try {
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 10);
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT 
                p.id, p.name, p.sku, p.price, p.stock, p.status, p.created_at,
                c.name as category_name,
                COALESCE(pi.image_url, '') as image_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
            WHERE p.seller_id = ?
        ";
        
        $params = [$seller_id];

        if ($search) {
            $sql .= " AND (p.name LIKE ? OR p.sku LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($category) {
            $sql .= " AND c.name = ?";
            $params[] = $category;
        }

        if ($status) {
            $sql .= " AND p.status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $products = fetchAll($sql, $params);

        // Get total count for pagination
        $countSql = "
            SELECT COUNT(*) as total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.seller_id = ?
        ";
        
        $countParams = [$seller_id];
        
        if ($search) {
            $countSql .= " AND (p.name LIKE ? OR p.sku LIKE ?)";
            $countParams[] = "%$search%";
            $countParams[] = "%$search%";
        }

        if ($category) {
            $countSql .= " AND c.name = ?";
            $countParams[] = $category;
        }

        if ($status) {
            $countSql .= " AND p.status = ?";
            $countParams[] = $status;
        }

        $totalResult = fetchOne($countSql, $countParams);
        $total = $totalResult['total'];

        echo json_encode([
            'success' => true,
            'data' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error fetching products: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
}

function handleCreateProduct($seller_id) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['name', 'sku', 'price', 'category_id'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field $field is required"]);
                return;
            }
        }

        // Check if SKU already exists
        $existingSku = fetchOne("SELECT id FROM products WHERE sku = ?", [$input['sku']]);
        if ($existingSku) {
            http_response_code(400);
            echo json_encode(['error' => 'SKU already exists']);
            return;
        }

        $productData = [
            'seller_id' => $seller_id,
            'category_id' => $input['category_id'],
            'name' => $input['name'],
            'description' => $input['description'] ?? '',
            'sku' => $input['sku'],
            'price' => $input['price'],
            'stock' => $input['stock'] ?? 0,
            'weight' => $input['weight'] ?? 0,
            'status' => 'active'
        ];

        $productId = insertRecord('products', $productData);

        if ($productId) {
            // Handle image uploads if provided
            if (isset($input['images']) && is_array($input['images'])) {
                foreach ($input['images'] as $index => $imageUrl) {
                    $imageData = [
                        'product_id' => $productId,
                        'image_url' => $imageUrl,
                        'is_primary' => $index === 0 ? 1 : 0,
                        'sort_order' => $index
                    ];
                    insertRecord('product_images', $imageData);
                }
            }

            // Log inventory
            if ($input['stock'] > 0) {
                $inventoryData = [
                    'product_id' => $productId,
                    'type' => 'in',
                    'quantity' => $input['stock'],
                    'previous_stock' => 0,
                    'new_stock' => $input['stock'],
                    'reference_type' => 'restock',
                    'notes' => 'Initial stock'
                ];
                insertRecord('inventory_logs', $inventoryData);
            }

            echo json_encode([
                'success' => true,
                'data' => ['id' => $productId],
                'message' => 'Product created successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create product']);
        }

    } catch (Exception $e) {
        error_log("Error creating product: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
}

function handleUpdateProduct($seller_id) {
    try {
        $productId = $_GET['id'] ?? null;
        if (!$productId) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            return;
        }

        // Check if product belongs to seller
        $product = fetchOne("SELECT id, stock FROM products WHERE id = ? AND seller_id = ?", [$productId, $seller_id]);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [];
        $allowedFields = ['name', 'description', 'price', 'stock', 'weight', 'status', 'category_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = $input[$field];
            }
        }

        if (empty($updateData)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }

        $updated = updateRecord('products', $updateData, 'id = ? AND seller_id = ?', [$productId, $seller_id]);

        if ($updated) {
            // Log inventory change if stock was updated
            if (isset($input['stock']) && $input['stock'] != $product['stock']) {
                $inventoryData = [
                    'product_id' => $productId,
                    'type' => $input['stock'] > $product['stock'] ? 'in' : 'out',
                    'quantity' => abs($input['stock'] - $product['stock']),
                    'previous_stock' => $product['stock'],
                    'new_stock' => $input['stock'],
                    'reference_type' => 'adjustment',
                    'notes' => 'Stock adjustment via admin'
                ];
                insertRecord('inventory_logs', $inventoryData);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Product updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product']);
        }

    } catch (Exception $e) {
        error_log("Error updating product: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
}

function handleDeleteProduct($seller_id) {
    try {
        $productId = $_GET['id'] ?? null;
        if (!$productId) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            return;
        }

        // Check if product belongs to seller
        $product = fetchOne("SELECT id FROM products WHERE id = ? AND seller_id = ?", [$productId, $seller_id]);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            return;
        }

        // Check if product has orders
        $hasOrders = fetchOne("SELECT id FROM order_items WHERE product_id = ?", [$productId]);
        if ($hasOrders) {
            // Don't actually delete, just deactivate
            $updated = updateRecord('products', ['status' => 'inactive'], 'id = ?', [$productId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Product deactivated (has order history)'
            ]);
        } else {
            // Safe to delete
            $deleted = deleteRecord('products', 'id = ? AND seller_id = ?', [$productId, $seller_id]);
            
            if ($deleted) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Product deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete product']);
            }
        }

    } catch (Exception $e) {
        error_log("Error deleting product: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
}
?>