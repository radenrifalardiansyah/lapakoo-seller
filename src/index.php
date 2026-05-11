<?php
session_start();

// Simulasi data (dalam implementasi nyata, ini akan dari database)
$seller_info = [
    'name' => 'Toko Ahmad Electronics',
    'owner' => 'Ahmad Rizki',
    'phone' => '+62 812-3456-7890',
    'address' => 'Jl. Sudirman No. 123, Jakarta'
];

// Mock data untuk dashboard
$dashboard_stats = [
    'total_sales' => 125450000,
    'total_orders' => 143,
    'total_products' => 87,
    'visitors' => 2847,
    'low_stock_products' => 12,
    'pending_orders' => 5
];

// Ambil halaman aktif dari URL
$page = $_GET['page'] ?? 'dashboard';
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seller Management System - <?php echo $seller_info['name']; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/components.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <i class="fas fa-store"></i>
                    <div class="logo-text">
                        <h2>Seller Center</h2>
                        <p><?php echo $seller_info['owner']; ?></p>
                    </div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <a href="?page=dashboard" class="nav-item <?php echo $page == 'dashboard' ? 'active' : ''; ?>">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
                
                <a href="?page=products" class="nav-item <?php echo $page == 'products' ? 'active' : ''; ?>">
                    <i class="fas fa-box"></i>
                    <span>Produk</span>
                    <?php if ($dashboard_stats['low_stock_products'] > 0): ?>
                        <span class="badge badge-warning"><?php echo $dashboard_stats['low_stock_products']; ?></span>
                    <?php endif; ?>
                </a>
                
                <a href="?page=orders" class="nav-item <?php echo $page == 'orders' ? 'active' : ''; ?>">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Pesanan</span>
                    <?php if ($dashboard_stats['pending_orders'] > 0): ?>
                        <span class="badge badge-primary"><?php echo $dashboard_stats['pending_orders']; ?></span>
                    <?php endif; ?>
                </a>
                
                <a href="?page=analytics" class="nav-item <?php echo $page == 'analytics' ? 'active' : ''; ?>">
                    <i class="fas fa-chart-bar"></i>
                    <span>Analitik</span>
                </a>
                
                <a href="?page=customers" class="nav-item <?php echo $page == 'customers' ? 'active' : ''; ?>">
                    <i class="fas fa-users"></i>
                    <span>Pelanggan</span>
                </a>
                
                <a href="?page=payments" class="nav-item <?php echo $page == 'payments' ? 'active' : ''; ?>">
                    <i class="fas fa-credit-card"></i>
                    <span>Keuangan</span>
                </a>
            </nav>

            <!-- Quick Stats -->
            <div class="sidebar-stats">
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-label">Penjualan Hari Ini</span>
                        <span class="stat-value">Rp 2.5jt</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pesanan Baru</span>
                        <span class="stat-value">5</span>
                    </div>
                    <div class="stat-item warning">
                        <span class="stat-label">
                            <i class="fas fa-exclamation-triangle"></i>
                            Stok Rendah
                        </span>
                        <span class="stat-value">12</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Navigation -->
            <div class="sidebar-bottom">
                <a href="?page=notifications" class="nav-item <?php echo $page == 'notifications' ? 'active' : ''; ?>">
                    <i class="fas fa-bell"></i>
                    <span>Notifikasi</span>
                    <span class="badge badge-primary">3</span>
                </a>
                
                <a href="?page=settings" class="nav-item <?php echo $page == 'settings' ? 'active' : ''; ?>">
                    <i class="fas fa-cog"></i>
                    <span>Pengaturan</span>
                </a>
                
                <a href="?page=help" class="nav-item <?php echo $page == 'help' ? 'active' : ''; ?>">
                    <i class="fas fa-question-circle"></i>
                    <span>Bantuan</span>
                </a>
                
                <a href="logout.php" class="nav-item logout">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Keluar</span>
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-wrapper">
                <?php
                // Include halaman sesuai parameter
                switch($page) {
                    case 'dashboard':
                        include 'pages/dashboard.php';
                        break;
                    case 'products':
                        include 'pages/products.php';
                        break;
                    case 'orders':
                        include 'pages/orders.php';
                        break;
                    case 'analytics':
                        include 'pages/analytics.php';
                        break;
                    case 'customers':
                        include 'pages/customers.php';
                        break;
                    case 'payments':
                        include 'pages/payments.php';
                        break;
                    case 'notifications':
                        include 'pages/notifications.php';
                        break;
                    case 'settings':
                        include 'pages/settings.php';
                        break;
                    case 'help':
                        include 'pages/help.php';
                        break;
                    default:
                        include 'pages/dashboard.php';
                        break;
                }
                ?>
            </div>
        </main>
    </div>

    <script src="assets/js/main.js"></script>
</body>
</html>