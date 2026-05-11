# Seller Management System

Sistem manajemen penjual yang komprehensif untuk mengelola toko online dengan fitur lengkap mulai dari manajemen produk, pesanan, analitik, hingga keuangan.

## Fitur Utama

### 🏪 Dashboard Overview
- Statistik penjualan real-time
- Grafik penjualan bulanan
- Analisis kategori produk
- Pesanan terbaru
- Quick stats sidebar

### 📦 Manajemen Produk
- CRUD produk lengkap
- Upload multiple gambar
- Manajemen kategori
- Tracking stok otomatis
- SKU management
- Status produk (aktif, nonaktif, habis stok)

### 🛒 Manajemen Pesanan
- Daftar pesanan dengan filter
- Detail pesanan lengkap
- Update status pesanan
- Tracking pengiriman
- Manajemen pembayaran
- Notifikasi pesanan baru

### 📊 Analytics & Reporting
- Laporan penjualan harian/bulanan
- Analisis performa produk
- Conversion rate tracking
- Customer behavior analysis
- Export laporan

### 👥 Manajemen Pelanggan
- Database pelanggan
- Segmentasi customer
- Customer lifetime value
- Riwayat pembelian

### 💰 Keuangan & Pembayaran
- Tracking pendapatan
- Saldo dan withdrawal
- Laporan keuangan
- Payment gateway integration

### 🔔 Sistem Notifikasi
- Notifikasi pesanan baru
- Alert stok rendah
- Update pembayaran
- Sistem peringatan

## Teknologi

- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Responsive**: Mobile-first design

## Instalasi

### Persyaratan Sistem
- PHP 7.4 atau lebih baru
- MySQL 5.7 atau lebih baru
- Web server (Apache/Nginx)
- Extension PHP: PDO, PDO_MySQL, GD

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/seller-management-system.git
   cd seller-management-system
   ```

2. **Setup Database**
   ```bash
   # Buat database MySQL
   mysql -u root -p -e "CREATE DATABASE seller_management;"
   
   # Import schema
   mysql -u root -p seller_management < database/schema.sql
   ```

3. **Konfigurasi Database**
   Edit file `config/database.php`:
   ```php
   private $host = 'localhost';
   private $db_name = 'seller_management';
   private $username = 'your_username';
   private $password = 'your_password';
   ```

4. **Set Permissions**
   ```bash
   # Berikan permission write untuk folder uploads
   chmod 755 assets/uploads/
   chmod 755 assets/images/
   ```

5. **Setup Virtual Host (Apache)**
   ```apache
   <VirtualHost *:80>
       DocumentRoot "/path/to/seller-management-system"
       ServerName seller.local
       <Directory "/path/to/seller-management-system">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

6. **Update hosts file**
   ```bash
   # Linux/Mac
   echo "127.0.0.1 seller.local" >> /etc/hosts
   
   # Windows
   # Add to C:\Windows\System32\drivers\etc\hosts
   # 127.0.0.1 seller.local
   ```

## Struktur Folder

```
seller-management-system/
├── api/                    # REST API endpoints
│   ├── products.php
│   ├── orders.php
│   └── analytics.php
├── assets/                 # Static assets
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── config/                 # Configuration files
│   └── database.php
├── database/              # Database files
│   └── schema.sql
├── pages/                 # Page components
│   ├── dashboard.php
│   ├── products.php
│   ├── orders.php
│   └── analytics.php
├── includes/              # Common includes
├── vendor/                # Third-party libraries
├── index.php             # Main entry point
└── README.md
```

## Penggunaan

### Dashboard
Akses `http://seller.local` untuk melihat dashboard utama dengan statistik dan overview bisnis.

### Manajemen Produk
- Tambah produk baru dengan form lengkap
- Upload gambar produk (multiple)
- Set kategori, harga, dan stok
- Monitor stok rendah otomatis

### Manajemen Pesanan
- View semua pesanan dengan filter status
- Update status pesanan (pending → processing → shipped → delivered)
- Print invoice dan label pengiriman
- Tracking integrasi dengan kurir

### Analytics
- Dashboard analytics dengan berbagai chart
- Filter berdasarkan periode waktu
- Export laporan ke PDF/Excel
- Key performance indicators (KPI)

## API Documentation

### Products API

**GET /api/products.php**
```php
// Get all products
GET /api/products.php?page=1&limit=10&search=iphone&category=Electronics

// Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

**POST /api/products.php**
```php
// Create new product
POST /api/products.php
Content-Type: application/json

{
  "name": "iPhone 14 Pro",
  "sku": "IPH14P-128-BL",
  "price": 15999000,
  "stock": 10,
  "category_id": 1,
  "description": "Latest iPhone with pro features"
}
```

**PUT /api/products.php?id=1**
```php
// Update product
PUT /api/products.php?id=1
Content-Type: application/json

{
  "stock": 15,
  "price": 14999000
}
```

**DELETE /api/products.php?id=1**
```php
// Delete product
DELETE /api/products.php?id=1
```

## Database Schema

### Core Tables

**sellers** - Data toko/penjual
```sql
id, name, email, phone, address, store_name, status, created_at
```

**products** - Data produk
```sql
id, seller_id, category_id, name, description, sku, price, stock, status, created_at
```

**orders** - Data pesanan
```sql
id, order_number, seller_id, customer_id, status, payment_status, total_amount, created_at
```

**customers** - Data pelanggan
```sql
id, name, email, phone, status, created_at
```

## Kustomisasi

### Theme Colors
Edit `assets/css/style.css` untuk mengubah color scheme:
```css
:root {
  --primary-color: #030213;
  --secondary-color: #ececf0;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #dc2626;
}
```

### Logo & Branding
- Ganti logo di `assets/images/logo.png`
- Update nama toko di `index.php`
- Kustomisasi sidebar di `components/sidebar.php`

### Menu Navigation
Edit array `$navigation_items` di `index.php` untuk menambah/menghapus menu.

## Deployment

### Production Setup

1. **Environment Configuration**
   ```php
   // config/environment.php
   define('ENVIRONMENT', 'production');
   define('DEBUG_MODE', false);
   define('DISPLAY_ERRORS', false);
   ```

2. **Security Headers**
   ```apache
   # .htaccess
   Header always set X-Content-Type-Options nosniff
   Header always set X-Frame-Options DENY
   Header always set X-XSS-Protection "1; mode=block"
   ```

3. **SSL Certificate**
   - Setup SSL certificate
   - Force HTTPS redirect
   - Update database URLs

4. **Performance Optimization**
   - Enable Gzip compression
   - Minify CSS/JS files
   - Setup caching headers
   - Optimize database queries

### Backup Strategy

```bash
# Database backup
mysqldump -u username -p seller_management > backup_$(date +%Y%m%d).sql

# File backup
tar -czf backup_files_$(date +%Y%m%d).tar.gz assets/uploads/
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Check database credentials in `config/database.php`
- Verify MySQL service is running
- Check database permissions

**Permission Denied on Upload**
- Set proper permissions: `chmod 755 assets/uploads/`
- Check web server user ownership

**Charts Not Loading**
- Verify Chart.js CDN is accessible
- Check JavaScript console for errors
- Ensure data format is correct

**Mobile Menu Not Working**
- Check JavaScript is enabled
- Verify responsive CSS is loaded
- Test on different screen sizes

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Support

Untuk bantuan dan support:
- Email: support@example.com
- Documentation: [Wiki](https://github.com/yourusername/seller-management-system/wiki)
- Issues: [GitHub Issues](https://github.com/yourusername/seller-management-system/issues)

## Roadmap

### Version 2.0
- [ ] Multi-seller marketplace
- [ ] Advanced analytics with AI
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Inventory management automation

### Version 2.1
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Customer loyalty program
- [ ] Marketing automation
- [ ] API rate limiting

---

Made with ❤️ for Indonesian sellers