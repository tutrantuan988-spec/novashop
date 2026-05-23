import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Headset, 
  ArrowRight, 
  Heart, 
  Star, 
  Facebook, 
  Instagram, 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  Menu, 
  X,
  Compass,
  Zap,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function HelloKittyShopPage() {
  // States for interactive UI
  const [cartCount, setCartCount] = useState(3);
  const [wishlist, setWishlist] = useState({});
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [isMobileMenuOpen, setIsMenuOpen] = useState(false);
  
  // Flash sale countdown timer (Hours:Minutes:Seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset countdown once it hits zero to keep demo active
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown number to always show 2 digits
  const formatNum = (num) => String(num).padStart(2, '0');

  // Handle wishlist heart click
  const toggleWishlist = (productId) => {
    setWishlist(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Handle add to cart click (with animation trigger)
  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  // Categories data
  const categories = [
    { id: 'fashion', icon: '👗', name: 'Thời trang', sub: 'Váy, áo, quần, phụ kiện', count: '2,430 sản phẩm', bg: '#fff0f8' },
    { id: 'electronics', icon: '📱', name: 'Điện tử', sub: 'Tai nghe, điện thoại, máy tính', count: '1,280 sản phẩm', bg: '#f0f9ff' },
    { id: 'home', icon: '🏠', name: 'Gia dụng', sub: 'Bếp, phòng khách, phòng ngủ', count: '890 sản phẩm', bg: '#f0fff4' },
    { id: 'beauty', icon: '💄', name: 'Làm đẹp', sub: 'Skincare, makeup, nước hoa', count: '1,650 sản phẩm', bg: '#fdf4ff' },
    { id: 'sports', icon: '⭐', name: 'Thể thao', sub: 'Giày, đồ thể thao, yoga', count: '560 sản phẩm', bg: '#fffbeb' },
    { id: 'books', icon: '📚', name: 'Sách & Văn phòng', sub: 'Sách, bút, dụng cụ học tập', count: '340 sản phẩm', bg: '#f0fdf4' }
  ];

  // Flash Sale products
  const flashSaleProducts = [
    {
      id: 'fs1',
      name: 'Váy Công Chúa Hồng Pastel Thêu Hoa',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
      price: '350.000đ',
      oldPrice: '700.000đ',
      discount: '-50%',
      rating: 5,
      reviews: 128
    },
    {
      id: 'fs2',
      name: 'Tai Nghe Chụp Tai Bluetooth Kitty Pink',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80',
      price: '550.000đ',
      oldPrice: '1.100.000đ',
      discount: '-50%',
      rating: 5,
      reviews: 95
    },
    {
      id: 'fs3',
      name: 'Túi Xách Da Mini Quai Ngọc Trai',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
      price: '280.000đ',
      oldPrice: '560.000đ',
      discount: '-50%',
      rating: 4,
      reviews: 64
    },
    {
      id: 'fs4',
      name: 'Son Kem Lì Mịn Như Nhung Tone Cam Đất',
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80',
      price: '190.000đ',
      oldPrice: '380.000đ',
      discount: '-50%',
      rating: 5,
      reviews: 152
    }
  ];

  // All other products categorized
  const allProducts = [
    // Fashion
    {
      id: 'np1',
      name: 'Váy Tweed Caro Hồng Đính Nơ Đá',
      category: 'Thời trang',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
      price: '420.000đ',
      oldPrice: '520.000đ',
      rating: 5,
      reviews: 42,
      discount: '-19%'
    },
    {
      id: 'np2',
      name: 'Mũ Len Phủ Tai Gắn Nơ Hello Kitty',
      category: 'Thời trang',
      image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=400&q=80',
      price: '150.000đ',
      oldPrice: '200.000đ',
      rating: 4,
      reviews: 19,
      discount: '-25%'
    },
    // Electronics
    {
      id: 'np3',
      name: 'Bàn Phím Cơ Đèn Led Trắng Hồng Candy',
      category: 'Điện tử',
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80',
      price: '890.000đ',
      oldPrice: '1.200.000đ',
      rating: 5,
      reviews: 83,
      discount: '-25%'
    },
    {
      id: 'np4',
      name: 'Loa Bluetooth Quả Cầu Pha Lê Hồng',
      category: 'Điện tử',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80',
      price: '380.000đ',
      oldPrice: '450.000đ',
      rating: 4,
      reviews: 31,
      discount: '-15%'
    },
    // Beauty
    {
      id: 'np5',
      name: 'Bộ Cọ Trang Điểm 12 Món Màu Hồng Pastel',
      category: 'Làm đẹp',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
      price: '290.000đ',
      oldPrice: '390.000đ',
      rating: 5,
      reviews: 112,
      discount: '-25%'
    },
    {
      id: 'np6',
      name: 'Nước Hoa Pháp Hương Hoa Anh Đào Dịu Ngọt',
      category: 'Làm đẹp',
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
      price: '650.000đ',
      oldPrice: '780.000đ',
      rating: 5,
      reviews: 74,
      discount: '-16%'
    },
    // Home
    {
      id: 'np7',
      name: 'Ly Giữ Nhiệt Lúa Mạch Màu Hồng Pastel 500ml',
      category: 'Gia dụng',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      price: '180.000đ',
      oldPrice: '250.000đ',
      rating: 4,
      reviews: 55,
      discount: '-28%'
    },
    {
      id: 'np8',
      name: 'Máy Pha Cà Phê Mini Tone Hồng Băng Cao Cấp',
      category: 'Gia dụng',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
      price: '1.250.000đ',
      oldPrice: '1.500.000đ',
      rating: 5,
      reviews: 26,
      discount: '-17%'
    }
  ];

  // Filter products by tab
  const filteredProducts = activeTab === 'Tất cả'
    ? allProducts
    : allProducts.filter(p => p.category === activeTab);

  return (
    <div className="min-h-screen bg-[#FFF0F8] text-[#2D1B3D] antialiased selection:bg-[#FFADD2] selection:text-[#BE185D]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Dynamic Font Import inside component to guarantee Google Fonts are loaded */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Pacifico&display=swap');
        
        .font-pacifico {
          font-family: 'Pacifico', cursive;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        .animate-float {
          animation: float-slow 4s ease-in-out infinite;
        }
        
        /* Glassmorphism utility */
        .glass-pink {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 214, 231, 0.5);
        }
      `}} />

      {/* HEADER (Sticky) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b-2 border-[#FFD6E7] shadow-sm shadow-pink-200/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <a href="#home" className="font-pacifico text-2xl text-[#E91E8C] flex items-center gap-2 hover:scale-105 transition-transform shrink-0">
              <span className="text-3xl filter drop-shadow">🎀</span>
              KittyShop
            </a>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-lg relative">
              <div className="w-full flex items-center bg-[#FFF0F5] border-2 border-[#FFADD2] rounded-full px-5 py-2 gap-3 focus-within:border-[#E91E8C] focus-within:bg-white transition-all shadow-inner">
                <Search size={18} className="text-[#F06292]" />
                <input 
                  type="text" 
                  placeholder="Tìm váy, phụ kiện, mỹ phẩm..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-[#2D1B3D] placeholder-[#B07AAA] font-semibold"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* VIP Gradient Button */}
              <button className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#F9A8D4] via-[#E91E8C] to-[#C084FC] hover:shadow-lg hover:shadow-pink-300/40 hover:-translate-y-0.5 transition-all">
                <span className="text-sm">👑</span> VIP
              </button>

              {/* Login Button */}
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-extrabold text-white bg-[#E91E8C] hover:bg-[#C2185B] rounded-full hover:shadow-md hover:shadow-pink-500/20 active:scale-95 transition-all">
                <User size={16} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>

              {/* Cart Button with animated badge */}
              <button className="flex items-center gap-2 px-3.5 py-2 text-sm font-extrabold text-[#C2185B] bg-[#FFF0F5] border-2 border-[#FFD6E7] hover:border-[#E91E8C] rounded-full relative group active:scale-95 transition-all">
                <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Giỏ hàng</span>
                <span className="absolute -top-2 -right-1 bg-[#E91E8C] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white scale-100 group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              </button>

              {/* Mobile menu toggle */}
              <button 
                className="md:hidden p-2 text-[#C2185B] bg-[#FFF0F5] border border-[#FFD6E7] rounded-full"
                onClick={() => setIsMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="hidden md:flex items-center justify-between py-2 border-t border-[#FFF0F5]">
            <nav className="flex items-center gap-1">
              <button className="px-4 py-1.5 text-sm font-extrabold rounded-full bg-[#E91E8C] text-white">Trang chủ</button>
              
              {/* Mega Dropdown Triggers */}
              <div className="relative group">
                <button className="px-4 py-1.5 text-sm font-extrabold text-[#6B3A5E] hover:bg-[#FFD6E7]/50 hover:text-[#C2185B] rounded-full flex items-center gap-1 transition-all">
                  Danh mục <ChevronDown size={14} />
                </button>
                
                {/* MEGA DROPDOWN PANEL */}
                <div className="absolute left-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                  <div className="w-[580px] p-4 bg-white border-2 border-[#FFD6E7] rounded-2xl shadow-xl shadow-pink-200/40 grid grid-cols-2 gap-2">
                    {categories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF0F5] transition-colors cursor-pointer group/item border border-transparent hover:border-[#FFD6E7]">
                        <div className="text-2xl w-11 h-11 rounded-lg flex items-center justify-center shadow-inner shrink-0 group-hover/item:scale-110 transition-transform" style={{ backgroundColor: cat.bg }}>
                          {cat.icon}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-[#2D1B3D]">{cat.name}</div>
                          <div className="text-[10px] text-[#B07AAA] font-semibold">{cat.sub}</div>
                          <div className="text-[9px] text-[#E91E8C] font-bold mt-0.5">{cat.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="px-4 py-1.5 text-sm font-extrabold text-[#6B3A5E] hover:bg-[#FFD6E7]/50 hover:text-[#C2185B] rounded-full transition-all">Flash Sale 🔥</button>
              <button className="px-4 py-1.5 text-sm font-extrabold text-[#6B3A5E] hover:bg-[#FFD6E7]/50 hover:text-[#C2185B] rounded-full transition-all">Blog</button>
              <button className="px-4 py-1.5 text-sm font-extrabold text-[#6B3A5E] hover:bg-[#FFD6E7]/50 hover:text-[#C2185B] rounded-full transition-all">Đánh giá</button>
              <button className="px-4 py-1.5 text-sm font-extrabold text-[#6B3A5E] hover:bg-[#FFD6E7]/50 hover:text-[#C2185B] rounded-full transition-all">Hỗ trợ</button>
            </nav>
            <div className="flex gap-2 text-xs font-black text-[#B07AAA]">
              <span className="hover:text-[#E91E8C] cursor-pointer">CHÍNH HÃNG</span>
              <span>•</span>
              <span className="hover:text-[#E91E8C] cursor-pointer">FREESHIP 299K</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#FFD6E7] bg-white px-4 py-3 flex flex-col gap-2 shadow-lg animate-fadeIn">
            <button className="w-full text-left px-4 py-2.5 rounded-xl font-extrabold bg-[#E91E8C] text-white">Trang chủ</button>
            <div className="border-b border-[#FFF0F8] my-1" />
            <div className="px-4 py-1.5 text-[11px] font-black text-[#B07AAA]">DANH MỤC SẢN PHẨM</div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat, idx) => (
                <button key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#FFF0F8] hover:bg-[#FFF0F5] border border-[#FFD6E7] text-left">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-extrabold text-[11px] text-[#2D1B3D] truncate">{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="border-b border-[#FFF0F8] my-1" />
            <button className="w-full text-left px-4 py-2 rounded-xl font-extrabold text-[#6B3A5E] hover:bg-[#FFF0F5]">Flash Sale 🔥</button>
            <button className="w-full text-left px-4 py-2 rounded-xl font-extrabold text-[#6B3A5E] hover:bg-[#FFF0F5]">Blog</button>
            <button className="w-full text-left px-4 py-2 rounded-xl font-extrabold text-[#6B3A5E] hover:bg-[#FFF0F5]">Đánh giá</button>
            <button className="w-full text-left px-4 py-2 rounded-xl font-extrabold text-[#6B3A5E] hover:bg-[#FFF0F5]">Hỗ trợ</button>
          </div>
        )}
      </header>

      {/* PROMO BAR (Marquee Effect) */}
      <div className="w-full bg-gradient-to-r from-[#F9A8D4] via-[#E91E8C] to-[#C084FC] overflow-hidden py-2 border-b border-[#FFD6E7]/30">
        <div className="animate-marquee">
          {/* First set */}
          <div className="flex gap-16 items-center px-4">
            <span className="text-xs font-black text-white flex items-center gap-2">🎀 FREESHIP TỪ 299K</span>
            <span className="text-xs font-black text-white flex items-center gap-2">✨ ĐỔI TRẢ 7 NGÀY MIỄN PHÍ</span>
            <span className="text-xs font-black text-white flex items-center gap-2">💖 CHÍNH HÃNG 100% CAM KẾT</span>
            <span className="text-xs font-black text-white flex items-center gap-2">⚡ GIAO HỎA TỐC NỘI THÀNH</span>
            <span className="text-xs font-black text-white flex items-center gap-2">🛡️ THANH TOÁN AN TOÀN TUYỆT ĐỐI</span>
          </div>
          {/* Second set (duplicate for infinite loop) */}
          <div className="flex gap-16 items-center px-4">
            <span className="text-xs font-black text-white flex items-center gap-2">🎀 FREESHIP TỪ 299K</span>
            <span className="text-xs font-black text-white flex items-center gap-2">✨ ĐỔI TRẢ 7 NGÀY MIỄN PHÍ</span>
            <span className="text-xs font-black text-white flex items-center gap-2">💖 CHÍNH HÃNG 100% CAM KẾT</span>
            <span className="text-xs font-black text-white flex items-center gap-2">⚡ GIAO HỎA TỐC NỘI THÀNH</span>
            <span className="text-xs font-black text-white flex items-center gap-2">🛡️ THANH TOÁN AN TOÀN TUYỆT ĐỐI</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section id="home" className="relative w-full bg-gradient-to-br from-[#FFF0F8] via-[#FCE7F3] to-[#FBCFE8] px-4 md:px-8 py-16 overflow-hidden">
        {/* Background Decorative Ribbons */}
        <div className="absolute top-8 left-6 text-6xl opacity-10 pointer-events-none select-none">🎀</div>
        <div className="absolute bottom-12 right-12 text-7xl opacity-10 pointer-events-none select-none animate-bounce">🎀</div>
        <div className="absolute top-24 right-1/4 text-5xl opacity-5 pointer-events-none select-none">🎀</div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-10">
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-[#FFD6E7] text-[#BE185D] border border-[#FFADD2] mb-6">
              <span>🎀</span> KITTYSHOP — FASHION & LIFESTYLE
            </div>
            
            <h1 className="font-pacifico text-4xl sm:text-5xl lg:text-6xl text-[#BE185D] leading-tight mb-4 filter drop-shadow-sm">
              Mua sắm <span className="text-[#EC4899] block sm:inline">dễ thương</span><br className="hidden sm:inline" /> như Hello Kitty!
            </h1>
            
            <p className="text-[#6B3A5E] font-semibold text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
              Thời trang thời thượng, phụ kiện tinh xảo, mỹ phẩm cao cấp & phong cách sống ngọt ngào — mọi sản phẩm đều được tuyển chọn để mang tới niềm vui dễ thương nhất cho bạn! 💕
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="flex items-center gap-2 px-8 py-4 text-base font-black text-white bg-[#E91E8C] hover:bg-[#C2185B] rounded-full shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-1 transition-all">
                <Sparkles size={18} /> Khám phá ngay
              </button>
              <button className="flex items-center gap-2 px-8 py-4 text-base font-black text-[#E91E8C] bg-white border-2 border-[#FFD6E7] hover:border-[#E91E8C] rounded-full hover:shadow-md hover:-translate-y-1 transition-all">
                Xem Flash Sale 🔥
              </button>
            </div>

            {/* Micro Stats */}
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl px-5 py-3 border border-[#FFD6E7] text-center min-w-[100px] shadow-sm">
                <div className="font-black text-xl text-[#E91E8C]">12K+</div>
                <div className="text-[10px] text-[#B07AAA] font-black uppercase tracking-wider">Đơn hàng</div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl px-5 py-3 border border-[#FFD6E7] text-center min-w-[100px] shadow-sm">
                <div className="font-black text-xl text-[#E91E8C]">5K+</div>
                <div className="text-[10px] text-[#B07AAA] font-black uppercase tracking-wider">Khách hàng</div>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl px-5 py-3 border border-[#FFD6E7] text-center min-w-[100px] shadow-sm">
                <div className="font-black text-xl text-[#E91E8C]">4.9⭐</div>
                <div className="text-[10px] text-[#B07AAA] font-black uppercase tracking-wider">Đánh giá</div>
              </div>
            </div>
          </div>

          {/* Right Floating Promo Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="animate-float w-72 sm:w-80 bg-white border-2 border-[#FFD6E7] rounded-3xl p-6 text-center shadow-2xl shadow-pink-400/20 relative">
              {/* Bow Top Decoration */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl filter drop-shadow">🎀</div>
              
              <span className="text-8xl block mt-2 select-none mb-3">🐱</span>
              
              <h2 className="font-pacifico text-2xl text-[#E91E8C] mb-2">Hello Kitty!</h2>
              
              <div className="flex justify-center gap-1.5 mb-6 text-pink-400">
                <span>💕</span><span>💕</span><span>💕</span>
              </div>
              
              <div className="bg-[#FFF0F5] border border-[#FFD6E7] rounded-2xl p-4 shadow-inner">
                <div className="text-[10px] text-[#B07AAA] font-black tracking-wider uppercase">SIÊU ƯU ĐÃI HÔM NAY</div>
                <div className="text-3xl font-black text-[#E91E8C] my-1">GIẢM ĐẾN 50%</div>
                <div className="text-[10px] text-[#B07AAA] font-bold">Áp dụng trực tiếp tại giỏ hàng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS BAR */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border-2 border-[#FFD6E7] rounded-3xl p-6 shadow-xl shadow-pink-200/30">
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F8] flex items-center justify-center text-[#E91E8C] shrink-0 shadow-inner">
              <Truck size={22} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#2D1B3D]">Giao hỏa tốc</div>
              <div className="text-xs text-[#B07AAA] font-semibold mt-0.5">Nội thành trong ngày</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[#22C55E] shrink-0 shadow-inner">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#2D1B3D]">Chính hãng 100%</div>
              <div className="text-xs text-[#B07AAA] font-semibold mt-0.5">Cam kết hoàn trả 200%</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF4FF] flex items-center justify-center text-[#A855F7] shrink-0 shadow-inner">
              <RefreshCw size={22} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#2D1B3D]">Đổi trả 7 ngày</div>
              <div className="text-xs text-[#B07AAA] font-semibold mt-0.5">Thủ tục đơn giản nhanh gọn</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] shrink-0 shadow-inner">
              <Headset size={22} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#2D1B3D]">Hỗ trợ 24/7</div>
              <div className="text-xs text-[#B07AAA] font-semibold mt-0.5">Chat trực tiếp, Zalo, Hotline</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#E91E8C] tracking-widest uppercase mb-2">
            <span>🎀</span> DANH MỤC MUA SẮM
          </div>
          <h2 className="font-pacifico text-3xl sm:text-4xl text-[#2D1B3D] mb-3">Mua sắm theo nhu cầu 💕</h2>
          <p className="text-sm font-semibold text-[#B07AAA]">Khám phá các bộ sưu tập xinh xắn nhất dành riêng cho bạn</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              className="bg-white border-2 border-transparent hover:border-[#FFD6E7] rounded-3xl p-6 text-center shadow-md hover:shadow-xl shadow-pink-200/10 hover:shadow-pink-300/20 hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: cat.bg }}>
                {cat.icon}
              </div>
              <div className="font-black text-sm text-[#2D1B3D] mb-1 truncate">{cat.name}</div>
              <div className="text-[10px] text-[#B07AAA] font-extrabold">{cat.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FLASH SALE SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-gradient-to-br from-[#FFF0F8] to-[#FCE7F3] border-2 border-[#FFADD2] rounded-[32px] p-6 sm:p-8 shadow-xl shadow-pink-200/30">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#E91E8C] text-white rounded-2xl px-4 py-2 font-black text-sm sm:text-base flex items-center gap-2 shadow-md shadow-pink-500/20">
                <Zap size={16} fill="currentColor" className="animate-pulse" /> FLASH SALE
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#2D1B3D]">Đang Diễn Ra 🔥</div>
            </div>
            
            {/* Real React Countdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#B07AAA] tracking-wider uppercase">KẾT THÚC SAU:</span>
              <div className="flex items-center gap-1">
                <div className="bg-[#2D1B3D] text-white font-mono font-black text-base px-2.5 py-1 rounded-lg min-w-[34px] text-center shadow-inner">
                  {formatNum(timeLeft.hours)}
                </div>
                <span className="font-black text-[#E91E8C]">:</span>
                <div className="bg-[#2D1B3D] text-white font-mono font-black text-base px-2.5 py-1 rounded-lg min-w-[34px] text-center shadow-inner">
                  {formatNum(timeLeft.minutes)}
                </div>
                <span className="font-black text-[#E91E8C]">:</span>
                <div className="bg-[#2D1B3D] text-white font-mono font-black text-base px-2.5 py-1 rounded-lg min-w-[34px] text-center shadow-inner">
                  {formatNum(timeLeft.seconds)}
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flashSaleProducts.map((prod) => (
              <div key={prod.id} className="bg-white border-2 border-[#FFD6E7] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-300/20 hover:-translate-y-1 transition-all group flex flex-col">
                {/* Product Image Wrapper */}
                <div className="relative overflow-hidden aspect-square bg-[#FFF0F8] shrink-0">
                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-[#E91E8C] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                    {prod.discount}
                  </div>
                  
                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-all border border-[#FFF0F8]"
                    onClick={() => toggleWishlist(prod.id)}
                    aria-label="Thêm vào danh sách yêu thích"
                  >
                    <Heart 
                      size={18} 
                      className="transition-colors"
                      fill={wishlist[prod.id] ? "#E91E8C" : "none"}
                      color={wishlist[prod.id] ? "#E91E8C" : "#B07AAA"}
                    />
                  </button>

                  <img 
                    src={prod.image} 
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Soft Hover Overlay */}
                  <div className="absolute inset-0 bg-[#E91E8C]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-extrabold text-[#2D1B3D] text-sm leading-tight hover:text-[#E91E8C] transition-colors line-clamp-2 mb-2 min-h-[40px]">
                    {prod.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(prod.rating)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#B07AAA] font-bold">({prod.reviews})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-black text-[#E91E8C] text-lg">{prod.price}</span>
                    <span className="text-xs font-semibold text-[#B07AAA] line-through">{prod.oldPrice}</span>
                  </div>

                  {/* Add to cart */}
                  <button 
                    className="w-full mt-4 py-2.5 px-4 bg-[#FFF0F5] border-2 border-[#FFD6E7] group-hover:border-[#E91E8C] group-hover:bg-[#E91E8C] group-hover:text-white rounded-full text-xs font-black text-[#C2185B] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={14} /> Thêm giỏ hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW PRODUCTS SECTION (Dynamic Filter) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#E91E8C] tracking-widest uppercase mb-2">
            <span>✨</span> BỘ SƯU TẬP MỚI
          </div>
          <h2 className="font-pacifico text-3xl sm:text-4xl text-[#2D1B3D] mb-3">Sản phẩm mới lên kệ 💕</h2>
          <p className="text-sm font-semibold text-[#B07AAA]">Cập nhật xu hướng ngọt ngào không thể bỏ qua</p>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex justify-center gap-2.5 mb-10 flex-wrap">
          {['Tất cả', 'Thời trang', 'Điện tử', 'Làm đẹp', 'Gia dụng'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wide border-2 transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-[#E91E8C] border-[#E91E8C] text-white shadow-md shadow-pink-500/20'
                  : 'bg-white border-[#FFD6E7] text-[#6B3A5E] hover:border-[#E91E8C] hover:text-[#E91E8C]'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="bg-white border-2 border-[#FFD6E7] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-300/20 hover:-translate-y-1 transition-all group flex flex-col">
              {/* Image */}
              <div className="relative overflow-hidden aspect-square bg-[#FFF0F8] shrink-0">
                {/* Discount Badge */}
                <div className="absolute top-3 left-3 z-10 bg-[#FFD6E7] border border-[#FFADD2] text-[#BE185D] text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                  NEW
                </div>

                {/* Wishlist Button */}
                <button 
                  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-all border border-[#FFF0F8]"
                  onClick={() => toggleWishlist(prod.id)}
                  aria-label="Thêm vào danh sách yêu thích"
                >
                  <Heart 
                    size={18} 
                    className="transition-colors"
                    fill={wishlist[prod.id] ? "#E91E8C" : "none"}
                    color={wishlist[prod.id] ? "#E91E8C" : "#B07AAA"}
                  />
                </button>

                <img 
                  src={prod.image} 
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-grow">
                <span className="text-[10px] text-[#E91E8C] font-black tracking-wider uppercase mb-1">{prod.category}</span>
                <h3 className="font-extrabold text-[#2D1B3D] text-sm leading-tight hover:text-[#E91E8C] transition-colors line-clamp-2 mb-2 min-h-[40px]">
                  {prod.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(prod.rating)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#B07AAA] font-bold">({prod.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="font-black text-[#2D1B3D] text-base">{prod.price}</span>
                  <span className="text-[11px] font-semibold text-[#B07AAA] line-through">{prod.oldPrice}</span>
                </div>

                {/* Add to cart */}
                <button 
                  className="w-full mt-4 py-2.5 px-4 bg-[#FFF0F5] border-2 border-[#FFD6E7] group-hover:border-[#E91E8C] group-hover:bg-[#E91E8C] group-hover:text-white rounded-full text-xs font-black text-[#C2185B] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={14} /> Thêm giỏ hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border-2 border-[#FFD6E7] rounded-[32px] p-8 shadow-lg shadow-pink-200/20 text-center">
          <div className="p-4 border-r border-[#FFF0F8] last:border-none">
            <span className="text-4xl block mb-2">📦</span>
            <div className="font-black text-2xl text-[#E91E8C] mb-1">10.000+</div>
            <div className="text-xs font-extrabold text-[#6B3A5E]">Đơn hàng hoàn tất</div>
          </div>
          <div className="p-4 sm:border-r border-[#FFF0F8] last:border-none">
            <span className="text-4xl block mb-2">👥</span>
            <div className="font-black text-2xl text-[#E91E8C] mb-1">5.000+</div>
            <div className="text-xs font-extrabold text-[#6B3A5E]">Khách hàng hài lòng</div>
          </div>
          <div className="p-4 border-r border-[#FFF0F8] last:border-none">
            <span className="text-4xl block mb-2">⭐</span>
            <div className="font-black text-2xl text-[#E91E8C] mb-1">4.9/5</div>
            <div className="text-xs font-extrabold text-[#6B3A5E]">Đánh giá trung bình</div>
          </div>
          <div className="p-4 last:border-none">
            <span className="text-4xl block mb-2">🤝</span>
            <div className="font-black text-2xl text-[#E91E8C] mb-1">50+</div>
            <div className="text-xs font-extrabold text-[#6B3A5E]">Thương hiệu đối tác</div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="relative bg-gradient-to-br from-[#EC4899] via-[#F472B6] to-[#C084FC] rounded-[40px] px-6 sm:px-12 py-12 text-center text-white overflow-hidden shadow-xl shadow-pink-400/20">
          {/* Decorative Transparent ribbons */}
          <div className="absolute -top-6 -right-6 text-9xl opacity-15 pointer-events-none select-none">🎀</div>
          <div className="absolute -bottom-8 -left-6 text-8xl opacity-15 pointer-events-none select-none">🎀</div>
          
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-pacifico text-3xl sm:text-4xl mb-4 text-white filter drop-shadow">Nhận Ưu Đãi Ngọt Ngào 🎀</h2>
            <p className="text-xs sm:text-sm font-bold opacity-90 mb-8 leading-relaxed">
              Đăng ký email để nhận thông tin về các bộ sưu tập giới hạn, mã giảm giá Flash Sale độc quyền & quà tặng ngạc nhiên từ KittyShop! 💕
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Nhập địa chỉ email của bạn..." 
                className="flex-grow px-6 py-3.5 rounded-full text-[#2D1B3D] placeholder-[#B07AAA] text-xs sm:text-sm font-extrabold outline-none border-2 border-transparent focus:border-[#BE185D] shadow-inner w-full"
              />
              <button className="px-8 py-3.5 bg-[#2D1B3D] hover:bg-[#1F0A17] active:scale-95 text-white font-black text-xs sm:text-sm rounded-full shadow-lg hover:shadow-black/20 transition-all shrink-0 flex items-center justify-center gap-1.5">
                <Send size={14} /> Đăng ký
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#1F0A17] text-white pt-16 pb-8 border-t-4 border-[#E91E8C]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-4 text-left">
              <a href="#" className="font-pacifico text-2xl text-[#EC4899] flex items-center gap-2 mb-4">
                <span>🎀</span> KittyShop
              </a>
              <p className="text-xs text-[#9CA3AF] font-bold leading-relaxed mb-6">
                Thế giới mua sắm ngập tràn niềm vui, dễ thương và chất lượng tuyệt vời phong cách Hello Kitty. Phục vụ với sự ngọt ngào & tận tâm nhất! 💕
              </p>
              
              <div className="flex flex-col gap-3 text-xs text-[#9CA3AF] font-extrabold">
                <span className="flex items-center gap-2">
                  <Mail size={14} className="text-[#EC4899]" /> contact@kittyshop.vn
                </span>
                <span className="flex items-center gap-2">
                  <Phone size={14} className="text-[#EC4899]" /> 1900 8888 (8h - 22h)
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#EC4899]" /> 123 Đường Hoa Hồng, Quận 1, TP. HCM
                </span>
              </div>
            </div>

            {/* Col 2: About */}
            <div className="lg:col-span-2 text-left">
              <h4 className="font-extrabold text-xs tracking-wider text-white mb-4 uppercase">VỀ KITTYSHOP</h4>
              <div className="flex flex-col gap-3 text-xs font-extrabold text-[#9CA3AF]">
                <a href="#about" className="hover:text-[#EC4899] transition-colors">Giới thiệu cửa hàng</a>
                <a href="#careers" className="hover:text-[#EC4899] transition-colors">Tuyển dụng liên kết</a>
                <a href="#blog" className="hover:text-[#EC4899] transition-colors">Hành trình dễ thương</a>
                <a href="#news" className="hover:text-[#EC4899] transition-colors">Tin tức khuyến mãi</a>
              </div>
            </div>

            {/* Col 3: Support */}
            <div className="lg:col-span-2 text-left">
              <h4 className="font-extrabold text-xs tracking-wider text-white mb-4 uppercase">HỖ TRỢ KHÁCH HÀNG</h4>
              <div className="flex flex-col gap-3 text-xs font-extrabold text-[#9CA3AF]">
                <a href="#faq" className="hover:text-[#EC4899] transition-colors">Câu hỏi thường gặp</a>
                <a href="#shipping" className="hover:text-[#EC4899] transition-colors">Chính sách vận chuyển</a>
                <a href="#return" className="hover:text-[#EC4899] transition-colors">Chính sách đổi trả 7 ngày</a>
                <a href="#privacy" className="hover:text-[#EC4899] transition-colors">Bảo mật thông tin</a>
              </div>
            </div>

            {/* Col 4: Community + Social */}
            <div className="lg:col-span-4 text-left">
              <h4 className="font-extrabold text-xs tracking-wider text-white mb-4 uppercase">KẾT NỐI VỚI CHÚNG TÔI</h4>
              <p className="text-xs text-[#9CA3AF] font-bold leading-relaxed mb-4">
                Tham gia cộng đồng yêu Hello Kitty để cập nhật quà tặng nhanh nhất!
              </p>
              
              {/* Social Icons */}
              <div className="flex gap-2.5 mb-6">
                <a href="#fb" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#E91E8C] flex items-center justify-center transition-colors active:scale-90 text-white" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
                <a href="#ig" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#E91E8C] flex items-center justify-center transition-colors active:scale-90 text-white" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              </div>

              {/* Micro-form */}
              <div className="flex bg-white/10 rounded-full border border-white/10 p-1">
                <input 
                  type="email" 
                  placeholder="Ý kiến của bạn..." 
                  className="bg-transparent border-none outline-none text-xs px-3 py-2 text-white placeholder-gray-500 font-bold w-full"
                />
                <button className="bg-[#EC4899] hover:bg-[#C2185B] text-white p-2 rounded-full active:scale-95 transition-all" aria-label="Gửi ý kiến">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#6B7280] font-bold">
              © {new Date().getFullYear()} KittyShop. Mua sắm dễ thương như Hello Kitty 💕. Thiết kế UI tinh xảo.
            </span>
            
            {/* Payments Badges (No functionality, aesthetic only) */}
            <div className="flex gap-1.5 flex-wrap justify-center">
              {['COD', 'ATM', 'MoMo', 'VNPay', 'Stripe'].map((m) => (
                <span key={m} className="bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-[10px] font-black text-white uppercase select-none shadow-sm">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
