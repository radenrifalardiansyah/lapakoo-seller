import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  MessageCircle, X, Send, Minimize2, ChevronDown, ChevronUp,
  RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  time: Date
}

// ─── Auto-reply Rules ─────────────────────────────────────────────────────────

const RULES: { test: (s: string) => boolean; reply: string }[] = [
  {
    test: s => /produk|barang|stok|kategori|sku|import|katalog/i.test(s),
    reply: 'Untuk kelola produk, buka menu **Produk** di sidebar. Anda bisa:\n• Tambah produk satu per satu\n• Import massal via Excel (gunakan tombol "Import Excel")\n• Kelola kategori produk\n\nStok rendah (≤5 unit) otomatis memunculkan badge merah di sidebar.',
  },
  {
    test: s => /pesanan|order|retur|pengiriman massal|resi|kirim/i.test(s),
    reply: 'Semua pesanan dikelola di menu **Pesanan**. Alur status:\n**Menunggu → Diproses → Dikirim → Terkirim**\n\nFitur tersedia:\n• Kirim massal (centang beberapa pesanan sekaligus)\n• Input nomor resi per kurir\n• Tab Retur untuk proses pengembalian barang',
  },
  {
    test: s => /keuangan|pembayaran|laporan|omzet|penghasilan|biaya admin|net income/i.test(s),
    reply: 'Laporan keuangan lengkap ada di menu **Keuangan** → tab Laporan Penghasilan.\n\nFilter tersedia: Bulanan & Tahunan. Data ditampilkan berupa:\n• Omzet\n• Biaya admin platform 2%\n• Refund\n• Net income\n\nBisa di-export ke Excel.',
  },
  {
    test: s => /reseller|komisi|tier|bronze|silver|gold|platinum|referral/i.test(s),
    reply: 'Sistem reseller tersedia di menu **Reseller**.\n\nTier & komisi default:\n• **Bronze** — 5% (0–10jt)\n• **Silver** — 8% (10–50jt)\n• **Gold** — 12% (50–150jt)\n• **Platinum** — 15% (>150jt)\n\nKlik **"Pengaturan Tier"** untuk ubah persentase komisi sesuai kebutuhan.',
  },
  {
    test: s => /voucher|kupon|kode diskon|promo|flash sale|diskon/i.test(s),
    reply: 'Fitur promosi ada di menu **Pemasaran & Promosi**.\n\n• **Voucher** — buat kode diskon (persentase atau nominal), atur kuota, masa berlaku\n• **Flash Sale** — promo waktu terbatas dengan countdown real-time, pilih produk & harga flash\n\nVoucher bisa diaktifkan/nonaktifkan kapan saja.',
  },
  {
    test: s => /password|kata sandi|keamanan|2fa|sesi login|akun|verifikasi/i.test(s),
    reply: 'Pengaturan keamanan ada di menu **Pengaturan** → seksi **Keamanan & Akun**:\n\n• Ganti kata sandi (dengan indikator kekuatan)\n• Aktifkan Verifikasi 2 Langkah (2FA)\n• Lihat & cabut sesi login aktif\n• Notifikasi login perangkat baru',
  },
  {
    test: s => /dekorasi|banner|tema|warna|slogan|tagline|tampilan toko/i.test(s),
    reply: 'Tampilan toko bisa diatur di **Pengaturan** → **Dekorasi Toko**:\n\n• Pilih warna tema (10 preset + color picker kustom)\n• Upload banner toko\n• Atur slogan/tagline\n• Toggle tampilan ulasan & produk terlaris',
  },
  {
    test: s => /pengiriman|kurir|jne|j&t|sicepat|ongkir|kemasan|proses/i.test(s),
    reply: 'Layanan pengiriman diatur di **Pengaturan** → **Layanan Pengiriman**.\n\nKurir tersedia: JNE, J&T, SiCepat, Anteraja, Pos Indonesia, GoSend, Grab Express, TIKI.\n\nAnda juga bisa atur:\n• Min. belanja untuk gratis ongkir\n• Biaya kemasan\n• Waktu proses pesanan (hari kerja)',
  },
  {
    test: s => /analitik|statistik|performa|grafik|tren|revenue/i.test(s),
    reply: 'Data analitik tersedia di menu **Analitik**. Tersedia grafik interaktif untuk:\n• Tren penjualan harian/bulanan\n• Performa produk terlaris\n• Segmen & pertumbuhan pelanggan\n• Perbandingan periode',
  },
  {
    test: s => /pelanggan|customer|pembeli|segmen|vip/i.test(s),
    reply: 'Data pelanggan ada di menu **Pelanggan**. Terdapat segmentasi otomatis:\n• **VIP** — pelanggan dengan transaksi terbesar\n• **Reguler** — pelanggan aktif\n• **Baru** — bergabung bulan ini\n\nBisa filter, cari, dan export ke Excel.',
  },
  {
    test: s => /manusia|agen|agent|operator|escalate|hubungi|telepon|call/i.test(s),
    reply: 'Saya akan hubungkan Anda dengan agen manusia kami.\n\n⏳ Estimasi waktu tunggu: **3–5 menit**\n\nSementara menunggu, Anda juga bisa menghubungi:\n📧 seller-support@eleven.id\n📱 WhatsApp: +62 811-2345-6789\n⏰ Senin–Jumat, 09.00–18.00 WIB',
  },
  {
    test: s => /halo|hai|hi|hello|selamat|pagi|siang|sore|malam/i.test(s),
    reply: 'Halo! Senang bertemu dengan Anda 😊\n\nAda yang bisa saya bantu? Anda bisa tanya tentang:\n• Produk & pesanan\n• Keuangan & laporan\n• Voucher & flash sale\n• Reseller & komisi\n• Pengaturan toko\n\nAtau ketik topik yang ingin Anda tanyakan.',
  },
]

const DEFAULT_REPLY =
  'Terima kasih atas pertanyaannya! 🙏\n\nUntuk informasi lebih lengkap, cek menu **Pusat Bantuan** di sidebar bawah, atau hubungi kami:\n📧 seller-support@eleven.id\n📱 WhatsApp: +62 811-2345-6789\n\nAda pertanyaan lain yang bisa saya bantu?'

const QUICK_REPLIES = [
  'Cara tambah produk',
  'Cara proses pesanan',
  'Cara buat voucher',
  'Info komisi reseller',
  'Ganti kata sandi',
  'Hubungi agen manusia',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAutoReply(text: string): string {
  return RULES.find(r => r.test(text))?.reply ?? DEFAULT_REPLY
}

function timeStr(d: Date) {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// Render **bold** markers as <strong>
function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  )
}

let _id = 0
const uid = () => String(++_id)

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveChat() {
  const [open, setOpen]         = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [unread, setUnread]     = useState(0)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const sentWelcome = useRef(false)

  // Send welcome message after 2.5 s
  useEffect(() => {
    const t = setTimeout(() => {
      if (sentWelcome.current) return
      sentWelcome.current = true
      setMessages([{
        id: uid(), role: 'agent',
        text: 'Halo! Saya **Reza** dari tim support Eleven Seller Center. Ada yang bisa saya bantu hari ini? 😊',
        time: new Date(),
      }])
      setUnread(1)
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Focus input & clear unread on open
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setUnread(0)
    }
  }, [open, minimized])

  const pushAgentReply = useCallback((text: string) => {
    setTyping(true)
    const delay = 900 + text.length * 8
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { id: uid(), role: 'agent', text, time: new Date() }])
    }, Math.min(delay, 2800))
  }, [])

  const handleSend = useCallback((text: string) => {
    const t = text.trim()
    if (!t) return
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: t, time: new Date() }])
    setInput('')
    pushAgentReply(getAutoReply(t))
  }, [pushAgentReply])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setMinimized(false)
    setUnread(0)
  }, [])

  // Listen for external open trigger (e.g. Help page button)
  useEffect(() => {
    window.addEventListener('open-live-chat', handleOpen)
    return () => window.removeEventListener('open-live-chat', handleOpen)
  }, [handleOpen])

  const handleReset = () => {
    setMessages([{
      id: uid(), role: 'agent',
      text: 'Percakapan dimulai ulang. Ada yang bisa saya bantu? 😊',
      time: new Date(),
    }])
    setTyping(false)
    setInput('')
  }

  const showQuickReplies = messages.length > 0 && messages.length <= 2 && !typing

  return (
    <>
      {/* ── Chat Panel ── */}
      {open && (
        <div
          className={`fixed bottom-[calc(10rem+env(safe-area-inset-bottom))] md:bottom-24 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] max-w-[340px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-[height] duration-300 ease-in-out ${
            minimized ? 'h-[60px]' : 'h-[510px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0 cursor-pointer select-none"
            onClick={() => minimized && setMinimized(false)}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                R
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Reza — Support Eleven</p>
              <p className="text-xs opacity-75 mt-0.5">● Online sekarang</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setMinimized(v => !v) }}
              className="p-1 rounded-md hover:bg-white/15 transition-colors"
              title={minimized ? 'Buka' : 'Kecilkan'}
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setOpen(false) }}
              className="p-1 rounded-md hover:bg-white/15 transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — hidden when minimized */}
          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-muted/20">

                {/* Date separator */}
                {messages.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex-1 border-t" />
                    <span>Hari ini</span>
                    <div className="flex-1 border-t" />
                  </div>
                )}

                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Agent avatar */}
                    {m.role === 'agent' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0 mb-4">
                        R
                      </div>
                    )}

                    <div className={`max-w-[76%] flex flex-col gap-0.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-background border rounded-bl-none shadow-sm'
                        }`}
                      >
                        {renderText(m.text)}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">{timeStr(m.time)}</span>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0 mb-4">
                      R
                    </div>
                    <div className="px-4 py-3 bg-background border rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 160}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {showQuickReplies && (
                <div className="px-3 py-2.5 border-t bg-background shrink-0">
                  <p className="text-[10px] text-muted-foreground mb-2">Pertanyaan cepat:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REPLIES.map(q => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input bar */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-t bg-background shrink-0">
                <button
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Reset percakapan"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) }
                  }}
                  placeholder="Ketik pesan..."
                  className="flex-1 h-9 text-sm border-0 bg-muted/50 focus-visible:ring-1"
                />
                <Button
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || typing}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Footer */}
              <div className="px-3 py-1.5 border-t bg-muted/30 shrink-0 text-center">
                <p className="text-[10px] text-muted-foreground">Eleven Seller Center · Support 24/7</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={open ? () => { setOpen(false) } : handleOpen}
        className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${
          !open && unread > 0 ? 'ring-4 ring-primary/30 ring-offset-2' : ''
        }`}
        title={open ? 'Tutup chat' : 'Buka live chat'}
      >
        <div className="relative">
          {open
            ? <ChevronDown className="w-6 h-6" />
            : <MessageCircle className="w-6 h-6" />
          }
          {!open && unread > 0 && (
            <span className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unread}
            </span>
          )}
        </div>
      </button>
    </>
  )
}
