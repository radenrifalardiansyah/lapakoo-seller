<?php
// Mock data untuk pesanan
$orders = [
    [
        'id' => 'ORD-001',
        'customer' => [
            'name' => 'Ahmad Rizki',
            'email' => 'ahmad.rizki@email.com',
            'phone' => '+62 812-3456-7890'
        ],
        'items' => [
            ['name' => 'iPhone 14 Pro Max', 'quantity' => 1, 'price' => 15999000]
        ],
        'total' => 15999000,
        'status' => 'pending',
        'payment_status' => 'waiting',
        'shipping_address' => 'Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190',
        'order_date' => '2024-01-15 10:30:00',
        'estimated_delivery' => '2024-01-20'
    ],
    [
        'id' => 'ORD-002',
        'customer' => [
            'name' => 'Siti Nurhaliza',
            'email' => 'siti.nurhaliza@email.com',
            'phone' => '+62 813-2468-1357'
        ],
        'items' => [
            ['name' => 'Samsung Galaxy S23 Ultra', 'quantity' => 1, 'price' => 18999000],
            ['name' => 'Samsung Galaxy Buds2 Pro', 'quantity' => 1, 'price' => 3299000]
        ],
        'total' => 22298000,
        'status' => 'shipped',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Gatot Subroto No. 456, Bandung, Jawa Barat 40123',
        'order_date' => '2024-01-14 14:20:00',
        'estimated_delivery' => '2024-01-19',
        'tracking_number' => 'JNE123456789'
    ],
    [
        'id' => 'ORD-003',
        'customer' => [
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@email.com',
            'phone' => '+62 814-9876-5432'
        ],
        'items' => [
            ['name' => 'MacBook Air M2', 'quantity' => 1, 'price' => 18999000],
            ['name' => 'Magic Mouse', 'quantity' => 1, 'price' => 1299000]
        ],
        'total' => 20298000,
        'status' => 'delivered',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Malioboro No. 789, Yogyakarta, DIY 55271',
        'order_date' => '2024-01-12 09:15:00',
        'estimated_delivery' => '2024-01-17',
        'tracking_number' => 'SICEPAT987654321',
        'delivery_date' => '2024-01-16 15:30:00'
    ],
    [
        'id' => 'ORD-004',
        'customer' => [
            'name' => 'Dewi Lestari',
            'email' => 'dewi.lestari@email.com',
            'phone' => '+62 815-1357-2468'
        ],
        'items' => [
            ['name' => 'Nike Air Jordan 1', 'quantity' => 2, 'price' => 2499000]
        ],
        'total' => 4998000,
        'status' => 'processing',
        'payment_status' => 'paid',
        'shipping_address' => 'Jl. Diponegoro No. 321, Surabaya, Jawa Timur 60265',
        'order_date' => '2024-01-13 16:45:00',
        'estimated_delivery' => '2024-01-18'
    ],
    [
        'id' => 'ORD-005',
        'customer' => [
            'name' => 'Eko Prasetyo',
            'email' => 'eko.prasetyo@email.com',
            'phone' => '+62 816-8642-9753'
        ],
        'items' => [
            ['name' => 'iPad Air 5th Gen', 'quantity' => 1, 'price' => 8999000]
        ],
        'total' => 8999000,
        'status' => 'cancelled',
        'payment_status' => 'refunded',
        'shipping_address' => 'Jl. Ahmad Yani No. 654, Medan, Sumatera Utara 20111',
        'order_date' => '2024-01-11 11:20:00',
        'cancel_reason' => 'Customer requested cancellation'
    ]
];

function formatRupiah($amount) {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

function formatDate($date) {
    return date('d M Y H:i', strtotime($date));
}

function getStatusBadge($status) {
    $statusConfig = [
        'pending' => ['label' => 'Menunggu', 'class' => 'status-pending', 'icon' => 'fas fa-clock'],
        'processing' => ['label' => 'Diproses', 'class' => 'status-processing', 'icon' => 'fas fa-cog'],
        'shipped' => ['label' => 'Dikirim', 'class' => 'status-shipped', 'icon' => 'fas fa-truck'],
        'delivered' => ['label' => 'Selesai', 'class' => 'status-delivered', 'icon' => 'fas fa-check-circle'],
        'cancelled' => ['label' => 'Dibatalkan', 'class' => 'status-cancelled', 'icon' => 'fas fa-times-circle']
    ];
    
    $config = $statusConfig[$status] ?? $statusConfig['pending'];
    return '<span class="status-badge ' . $config['class'] . '"><i class="' . $config['icon'] . '"></i> ' . $config['label'] . '</span>';
}

function getPaymentStatusBadge($status) {
    $statusConfig = [
        'waiting' => ['label' => 'Menunggu Pembayaran', 'class' => 'status-pending'],
        'paid' => ['label' => 'Dibayar', 'class' => 'status-delivered'],
        'failed' => ['label' => 'Gagal', 'class' => 'status-cancelled'],
        'refunded' => ['label' => 'Dikembalikan', 'class' => 'status-processing']
    ];
    
    $config = $statusConfig[$status] ?? $statusConfig['waiting'];
    return '<span class="status-badge ' . $config['class'] . '">' . $config['label'] . '</span>';
}

// Hitung statistik
$total_orders = count($orders);
$pending_orders = count(array_filter($orders, function($o) { return $o['status'] === 'pending'; }));
$processing_orders = count(array_filter($orders, function($o) { return $o['status'] === 'processing'; }));
$shipped_orders = count(array_filter($orders, function($o) { return $o['status'] === 'shipped'; }));
$delivered_orders = count(array_filter($orders, function($o) { return $o['status'] === 'delivered'; }));
$cancelled_orders = count(array_filter($orders, function($o) { return $o['status'] === 'cancelled'; }));
$total_sales = array_sum(array_column($orders, 'total'));
?>

<div class="space-y-6">
    <!-- Header -->
    <div class="page-header">
        <h1>Manajemen Pesanan</h1>
        <p>Kelola dan pantau semua pesanan yang masuk dari pelanggan</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-shopping-cart"></i>
                    Total Pesanan
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $total_orders; ?></div>
                <p class="text-muted">semua pesanan</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    Menunggu Proses
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $pending_orders + $processing_orders; ?></div>
                <p class="text-muted">perlu diproses</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-truck" style="color: #3b82f6;"></i>
                    Sedang Dikirim
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo $shipped_orders; ?></div>
                <p class="text-muted">dalam perjalanan</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-dollar-sign" style="color: #10b981;"></i>
                    Total Penjualan
                </div>
            </div>
            <div class="card-content">
                <div class="stat-value"><?php echo formatRupiah($total_sales); ?></div>
                <p class="text-muted">dari semua pesanan</p>
            </div>
        </div>
    </div>

    <!-- Orders Table -->
    <div class="card">
        <div class="card-header">
            <div class="flex items-center justify-between">
                <div class="card-title">Daftar Pesanan</div>
                <div class="flex items-center gap-12">
                    <div class="search-input">
                        <input type="text" class="form-input" placeholder="Cari nomor pesanan atau nama pelanggan..." id="searchInput">
                    </div>
                    <select class="form-select" id="statusFilter" style="width: 180px;">
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="processing">Diproses</option>
                        <option value="shipped">Dikirim</option>
                        <option value="delivered">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Pesanan</th>
                            <th>Pelanggan</th>
                            <th>Total</th>
                            <th>Status Pesanan</th>
                            <th>Pembayaran</th>
                            <th>Tanggal</th>
                            <th class="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="ordersTableBody">
                        <?php foreach($orders as $order): ?>
                        <tr data-status="<?php echo $order['status']; ?>">
                            <td>
                                <div>
                                    <h4><?php echo $order['id']; ?></h4>
                                    <p class="text-muted"><?php echo count($order['items']); ?> item<?php echo count($order['items']) > 1 ? 's' : ''; ?></p>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <h4><?php echo $order['customer']['name']; ?></h4>
                                    <p class="text-muted"><?php echo $order['customer']['email']; ?></p>
                                </div>
                            </td>
                            <td><?php echo formatRupiah($order['total']); ?></td>
                            <td><?php echo getStatusBadge($order['status']); ?></td>
                            <td><?php echo getPaymentStatusBadge($order['payment_status']); ?></td>
                            <td>
                                <div>
                                    <p><?php echo formatDate($order['order_date']); ?></p>
                                </div>
                            </td>
                            <td class="text-right">
                                <button class="action-btn" onclick="viewOrderDetail('<?php echo $order['id']; ?>')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Order Detail Modal -->
<div id="orderDetailModal" class="modal">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h3>Detail Pesanan <span id="orderDetailId"></span></h3>
            <button class="modal-close" onclick="closeModal('orderDetailModal')">&times;</button>
        </div>
        <div id="orderDetailContent">
            <!-- Content will be loaded dynamically -->
        </div>
    </div>
</div>

<script>
// Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    filterOrders();
});

// Status filter
document.getElementById('statusFilter').addEventListener('change', function(e) {
    filterOrders();
});

function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const orderId = row.querySelector('td:first-child h4').textContent.toLowerCase();
        const customerName = row.querySelector('td:nth-child(2) h4').textContent.toLowerCase();
        const orderStatus = row.dataset.status;
        
        const matchesSearch = orderId.includes(searchTerm) || customerName.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// View order detail
function viewOrderDetail(orderId) {
    // Find order data
    const orders = <?php echo json_encode($orders); ?>;
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    document.getElementById('orderDetailId').textContent = orderId;
    
    const content = `
        <div class="grid grid-cols-2" style="gap: 24px; margin: 24px 0;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Informasi Pelanggan</div>
                </div>
                <div class="card-content space-y-2">
                    <p><strong>Nama:</strong> ${order.customer.name}</p>
                    <p><strong>Email:</strong> ${order.customer.email}</p>
                    <p><strong>Telepon:</strong> ${order.customer.phone}</p>
                    <p><strong>Alamat:</strong> ${order.shipping_address}</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Status Pesanan</div>
                </div>
                <div class="card-content space-y-2">
                    <p><strong>Status:</strong> ${getStatusBadgeJS(order.status)}</p>
                    <p><strong>Pembayaran:</strong> ${getPaymentStatusBadgeJS(order.payment_status)}</p>
                    <p><strong>Tanggal Pesan:</strong> ${formatDateJS(order.order_date)}</p>
                    <p><strong>Estimasi Kirim:</strong> ${new Date(order.estimated_delivery).toLocaleDateString('id-ID')}</p>
                    ${order.tracking_number ? `<p><strong>No. Resi:</strong> ${order.tracking_number}</p>` : ''}
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">Item Pesanan</div>
            </div>
            <div class="card-content">
                <div class="space-y-4">
                    ${order.items.map(item => `
                        <div class="flex justify-between items-center" style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                            <div>
                                <p>${item.name}</p>
                                <p class="text-muted">Qty: ${item.quantity}</p>
                            </div>
                            <p>${formatRupiahJS(item.price * item.quantity)}</p>
                        </div>
                    `).join('')}
                    <div class="flex justify-between items-center" style="padding: 16px 0; border-top: 2px solid rgba(0,0,0,0.1); font-weight: 500;">
                        <p>Total</p>
                        <p>${formatRupiahJS(order.total)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-12" style="margin-top: 24px;">
            <button class="btn btn-outline">Cetak Invoice</button>
            <button class="btn btn-outline">Update Status</button>
            <button class="btn btn-primary">Hubungi Pelanggan</button>
        </div>
    `;
    
    document.getElementById('orderDetailContent').innerHTML = content;
    openModal('orderDetailModal');
}

// Helper functions for JavaScript
function getStatusBadgeJS(status) {
    const statusConfig = {
        'pending': { label: 'Menunggu', class: 'status-pending', icon: 'fas fa-clock' },
        'processing': { label: 'Diproses', class: 'status-processing', icon: 'fas fa-cog' },
        'shipped': { label: 'Dikirim', class: 'status-shipped', icon: 'fas fa-truck' },
        'delivered': { label: 'Selesai', class: 'status-delivered', icon: 'fas fa-check-circle' },
        'cancelled': { label: 'Dibatalkan', class: 'status-cancelled', icon: 'fas fa-times-circle' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return `<span class="status-badge ${config.class}"><i class="${config.icon}"></i> ${config.label}</span>`;
}

function getPaymentStatusBadgeJS(status) {
    const statusConfig = {
        'waiting': { label: 'Menunggu Pembayaran', class: 'status-pending' },
        'paid': { label: 'Dibayar', class: 'status-delivered' },
        'failed': { label: 'Gagal', class: 'status-cancelled' },
        'refunded': { label: 'Dikembalikan', class: 'status-processing' }
    };
    
    const config = statusConfig[status] || statusConfig['waiting'];
    return `<span class="status-badge ${config.class}">${config.label}</span>`;
}

function formatRupiahJS(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function formatDateJS(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>