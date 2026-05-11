<?php
// Mock data untuk produk
$products = [
    [
        'id' => 1,
        'name' => 'iPhone 14 Pro Max',
        'category' => 'Electronics',
        'price' => 15999000,
        'stock' => 25,
        'status' => 'active',
        'image' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
        'sku' => 'IPH14PM-256-SG'
    ],
    [
        'id' => 2,
        'name' => 'Samsung Galaxy S23 Ultra',
        'category' => 'Electronics',
        'price' => 18999000,
        'stock' => 15,
        'status' => 'active',
        'image' => 'https://images.unsplash.com/photo-1610792516307-ea5aabac2b31?w=200&h=200&fit=crop',
        'sku' => 'SGS23U-512-BK'
    ],
    [
        'id' => 3,
        'name' => 'MacBook Air M2',
        'category' => 'Electronics',
        'price' => 18999000,
        'stock' => 8,
        'status' => 'active',
        'image' => 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&h=200&fit=crop',
        'sku' => 'MBA-M2-256-SG'
    ],
    [
        'id' => 4,
        'name' => 'Nike Air Jordan 1',
        'category' => 'Fashion',
        'price' => 2499000,
        'stock' => 3,
        'status' => 'low_stock',
        'image' => 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop',
        'sku' => 'NAJ1-42-RED'
    ],
    [
        'id' => 5,
        'name' => 'Adidas Ultraboost 22',
        'category' => 'Fashion',
        'price' => 2899000,
        'stock' => 0,
        'status' => 'out_of_stock',
        'image' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
        'sku' => 'AUB22-43-WHT'
    ]
];

function formatRupiah($amount) {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

function getProductStatusBadge($status, $stock) {
    if ($status === 'out_of_stock' || $stock === 0) {
        return '<span class="status-badge status-out-of-stock"><i class="fas fa-exclamation-triangle"></i> Habis</span>';
    }
    if ($status === 'low_stock' || $stock <= 5) {
        return '<span class="status-badge status-low-stock"><i class="fas fa-exclamation-triangle"></i> Stok Rendah</span>';
    }
    return '<span class="status-badge status-active">Aktif</span>';
}

$total_products = count($products);
$active_products = count(array_filter($products, function($p) { return $p['stock'] > 5; }));
$low_stock_products = count(array_filter($products, function($p) { return $p['stock'] <= 5 && $p['stock'] > 0; }));
$out_of_stock_products = count(array_filter($products, function($p) { return $p['stock'] === 0; }));
?>

<div class="space-y-6">
    <!-- Header -->
    <div class="header-actions">
        <div class="page-header">
            <h1>Manajemen Produk</h1>
            <p>Kelola semua produk yang Anda jual di toko online Anda</p>
        </div>
        <button class="btn btn-primary" onclick="openModal('addProductModal')">
            <i class="fas fa-plus"></i>
            Tambah Produk
        </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-box"></i>
                    Total Produk
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $total_products; ?></div>
                <p class="text-muted">produk terdaftar</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-box" style="color: #166534;"></i>
                    Produk Aktif
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $active_products; ?></div>
                <p class="text-muted">dengan stok cukup</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                    Stok Rendah
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $low_stock_products; ?></div>
                <p class="text-muted">perlu restock</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                    Habis Stok
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $out_of_stock_products; ?></div>
                <p class="text-muted">segera restock</p>
            </div>
        </div>
    </div>

    <!-- Products Table -->
    <div class="card">
        <div class="card-header">
            <div class="flex items-center justify-between">
                <div class="card-title">Daftar Produk</div>
                <div class="flex items-center gap-12">
                    <div class="search-input">
                        <input type="text" class="form-input" placeholder="Cari nama produk atau SKU..." id="searchInput">
                    </div>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Produk</th>
                            <th>Kategori</th>
                            <th>Harga</th>
                            <th>Stok</th>
                            <th>Status</th>
                            <th class="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="productsTableBody">
                        <?php foreach($products as $product): ?>
                        <tr>
                            <td>
                                <div class="product-info">
                                    <img src="<?php echo $product['image']; ?>" alt="<?php echo $product['name']; ?>" class="product-image">
                                    <div class="product-details">
                                        <h4><?php echo $product['name']; ?></h4>
                                        <p>SKU: <?php echo $product['sku']; ?></p>
                                    </div>
                                </div>
                            </td>
                            <td><?php echo $product['category']; ?></td>
                            <td><?php echo formatRupiah($product['price']); ?></td>
                            <td>
                                <span class="<?php echo $product['stock'] <= 5 ? 'text-warning' : ''; ?> <?php echo $product['stock'] === 0 ? 'text-danger' : ''; ?>">
                                    <?php echo $product['stock']; ?>
                                </span>
                            </td>
                            <td>
                                <?php echo getProductStatusBadge($product['status'], $product['stock']); ?>
                            </td>
                            <td class="text-right">
                                <div class="action-buttons">
                                    <button class="action-btn" onclick="viewProduct(<?php echo $product['id']; ?>)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn" onclick="editProduct(<?php echo $product['id']; ?>)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn danger" onclick="deleteProduct(<?php echo $product['id']; ?>)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Add Product Modal -->
<div id="addProductModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Tambah Produk Baru</h3>
            <button class="modal-close" onclick="closeModal('addProductModal')">&times;</button>
        </div>
        <form id="addProductForm">
            <div class="grid grid-cols-2" style="gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label" for="productName">Nama Produk</label>
                    <input type="text" class="form-input" id="productName" placeholder="Masukkan nama produk" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="productSku">SKU</label>
                    <input type="text" class="form-input" id="productSku" placeholder="Kode produk" required>
                </div>
            </div>
            
            <div class="grid grid-cols-2" style="gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label" for="productCategory">Kategori</label>
                    <select class="form-select" id="productCategory" required>
                        <option value="">Pilih kategori</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home & Garden">Home & Garden</option>
                        <option value="Sports">Sports</option>
                        <option value="Books">Books</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="productPrice">Harga</label>
                    <input type="number" class="form-input" id="productPrice" placeholder="0" required>
                </div>
            </div>

            <div class="grid grid-cols-2" style="gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label" for="productStock">Stok</label>
                    <input type="number" class="form-input" id="productStock" placeholder="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="productWeight">Berat (gram)</label>
                    <input type="number" class="form-input" id="productWeight" placeholder="0">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label" for="productDescription">Deskripsi</label>
                <textarea class="form-textarea" id="productDescription" placeholder="Deskripsi produk..." rows="4"></textarea>
            </div>

            <div class="form-group">
                <label class="form-label" for="productImages">Gambar Produk</label>
                <input type="file" class="form-input" id="productImages" multiple accept="image/*">
            </div>

            <div class="flex justify-between gap-12" style="margin-top: 24px;">
                <button type="button" class="btn btn-outline" onclick="closeModal('addProductModal')">
                    Batal
                </button>
                <button type="submit" class="btn btn-primary">
                    Simpan Produk
                </button>
            </div>
        </form>
    </div>
</div>

<script>
// Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const productName = row.querySelector('.product-details h4').textContent.toLowerCase();
        const sku = row.querySelector('.product-details p').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || sku.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Product actions
function viewProduct(id) {
    alert('View product: ' + id);
}

function editProduct(id) {
    alert('Edit product: ' + id);
}

function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        alert('Delete product: ' + id);
    }
}

// Form submission
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        stock: document.getElementById('productStock').value,
        weight: document.getElementById('productWeight').value,
        description: document.getElementById('productDescription').value
    };
    
    console.log('Product data:', formData);
    
    // In real application, send data to server
    alert('Produk berhasil ditambahkan!');
    closeModal('addProductModal');
    
    // Reset form
    this.reset();
});
</script>