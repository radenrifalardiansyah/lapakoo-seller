<?php
// Mock data untuk dashboard
$sales_data = [
    'Jan' => ['sales' => 4000000, 'orders' => 20],
    'Feb' => ['sales' => 3000000, 'orders' => 18],
    'Mar' => ['sales' => 5000000, 'orders' => 25],
    'Apr' => ['sales' => 4500000, 'orders' => 22],
    'May' => ['sales' => 6000000, 'orders' => 30],
    'Jun' => ['sales' => 5500000, 'orders' => 28],
];

$recent_orders = [
    [
        'id' => 'ORD-001',
        'customer' => 'Ahmad Rizki',
        'product' => 'iPhone 14 Pro',
        'amount' => 15999000,
        'status' => 'pending',
        'date' => '2024-01-15'
    ],
    [
        'id' => 'ORD-002',
        'customer' => 'Siti Nurhaliza',
        'product' => 'Samsung Galaxy S23',
        'amount' => 12999000,
        'status' => 'shipped',
        'date' => '2024-01-15'
    ],
    [
        'id' => 'ORD-003',
        'customer' => 'Budi Santoso',
        'product' => 'MacBook Air M2',
        'amount' => 18999000,
        'status' => 'delivered',
        'date' => '2024-01-14'
    ],
    [
        'id' => 'ORD-004',
        'customer' => 'Dewi Lestari',
        'product' => 'iPad Air',
        'amount' => 8999000,
        'status' => 'processing',
        'date' => '2024-01-14'
    ],
];

function formatRupiah($amount) {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

function getStatusClass($status) {
    switch($status) {
        case 'pending': return 'status-pending';
        case 'processing': return 'status-processing';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        default: return 'status-pending';
    }
}

function getStatusText($status) {
    switch($status) {
        case 'pending': return 'Menunggu';
        case 'processing': return 'Diproses';
        case 'shipped': return 'Dikirim';
        case 'delivered': return 'Selesai';
        default: return 'Menunggu';
    }
}
?>

<div class="space-y-6">
    <!-- Header -->
    <div class="header-actions">
        <div class="page-header">
            <h1>Dashboard Overview</h1>
            <p>Selamat datang kembali! Berikut ringkasan toko Anda hari ini.</p>
        </div>
        <button class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Tambah Produk
        </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-dollar-sign"></i>
                    Total Penjualan
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo formatRupiah($dashboard_stats['total_sales']); ?></div>
                <p class="stat-change positive">
                    <i class="fas fa-arrow-up"></i>
                    +12% dari bulan lalu
                </p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-shopping-cart"></i>
                    Total Pesanan
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $dashboard_stats['total_orders']; ?></div>
                <p class="stat-change positive">
                    <i class="fas fa-arrow-up"></i>
                    +8% dari bulan lalu
                </p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-box"></i>
                    Total Produk
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $dashboard_stats['total_products']; ?></div>
                <p class="text-muted">
                    <?php echo $dashboard_stats['low_stock_products']; ?> produk stok rendah
                </p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-eye"></i>
                    Pengunjung
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo number_format($dashboard_stats['visitors']); ?></div>
                <p class="stat-change positive">
                    <i class="fas fa-arrow-up"></i>
                    +5% dari minggu lalu
                </p>
            </div>
        </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-header">
                <div class="card-title">Grafik Penjualan</div>
            </div>
            <div class="card-content">
                <div class="chart-container">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">Kategori Produk</div>
            </div>
            <div class="card-content">
                <div class="chart-container">
                    <canvas id="categoryChart"></canvas>
                </div>
                <div class="space-y-2" style="margin-top: 16px;">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div style="width: 12px; height: 12px; background-color: #8884d8; border-radius: 50%;"></div>
                            <span style="font-size: 12px;">Electronics (35%)</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div style="width: 12px; height: 12px; background-color: #82ca9d; border-radius: 50%;"></div>
                            <span style="font-size: 12px;">Fashion (25%)</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div style="width: 12px; height: 12px; background-color: #ffc658; border-radius: 50%;"></div>
                            <span style="font-size: 12px;">Home & Garden (20%)</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div style="width: 12px; height: 12px; background-color: #ff7300; border-radius: 50%;"></div>
                            <span style="font-size: 12px;">Sports (12%)</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div style="width: 12px; height: 12px; background-color: #00ff00; border-radius: 50%;"></div>
                            <span style="font-size: 12px;">Books (8%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Orders -->
    <div class="card">
        <div class="card-header">
            <div class="card-title">Pesanan Terbaru</div>
        </div>
        <div class="card-content">
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID Pesanan</th>
                            <th>Pelanggan</th>
                            <th>Produk</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($recent_orders as $order): ?>
                        <tr>
                            <td><?php echo $order['id']; ?></td>
                            <td><?php echo $order['customer']; ?></td>
                            <td><?php echo $order['product']; ?></td>
                            <td><?php echo formatRupiah($order['amount']); ?></td>
                            <td>
                                <span class="status-badge <?php echo getStatusClass($order['status']); ?>">
                                    <?php echo getStatusText($order['status']); ?>
                                </span>
                            </td>
                            <td><?php echo date('d M Y', strtotime($order['date'])); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
// Sales Chart
const salesCtx = document.getElementById('salesChart').getContext('2d');
new Chart(salesCtx, {
    type: 'bar',
    data: {
        labels: <?php echo json_encode(array_keys($sales_data)); ?>,
        datasets: [{
            label: 'Penjualan',
            data: <?php echo json_encode(array_column($sales_data, 'sales')); ?>,
            backgroundColor: '#8884d8',
            borderColor: '#8884d8',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'Rp ' + (value / 1000000) + 'jt';
                    }
                }
            }
        }
    }
});

// Category Chart
const categoryCtx = document.getElementById('categoryChart').getContext('2d');
new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
        labels: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books'],
        datasets: [{
            data: [35, 25, 20, 12, 8],
            backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    }
});
</script>