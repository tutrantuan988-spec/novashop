/**
 * ✍️ Content Agent — Tạo nội dung tự động cho sản phẩm & marketing
 * 
 * Trách nhiệm:
 * - Tạo mô tả sản phẩm chuẩn SEO
 * - Viết blog posts, bài viết hướng dẫn mua sắm
 * - Tạo nội dung promotion, flash sale
 * - Viết email marketing & newsletter
 * - Tối ưu content theo từ khóa SEO
 * - Quản lý thư viện template content
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');

// Template content mẫu cho các loại sản phẩm
const PRODUCT_TEMPLATES = {
  'thoi-trang': {
    intro: [
      'Phong cách hoàn hảo cho bạn!',
      'Chất liệu cao cấp, phù hợp với mọi phong cách.'
    ],
    features: [
      'Chất liệu cao cấp, thoáng mát và bền đẹp',
      'Thiết kế hiện đại, phù hợp xu hướng mới nhất',
      'Đường may tỉ mỉ, form dáng chuẩn',
      'Dễ phối đồ, phù hợp nhiều hoàn cảnh'
    ],
    outro: ['Đặt hàng ngay để nhận ưu đãi freeship từ 300K!']
  },
  'dien-tu': {
    intro: [
      'Công nghệ tiên tiến cho cuộc sống thông minh!',
      'Hiệu năng vượt trội, giá cả hợp lý.'
    ],
    features: [
      'Công nghệ mới nhất, hiệu năng mạnh mẽ',
      'Thiết kế nhỏ gọn, tiện lợi mang theo',
      'Tiết kiệm năng lượng, thân thiện môi trường',
      'Bảo hành chính hãng 12 tháng'
    ],
    outro: ['Giao nhanh trong 24h — Trải nghiệm công nghệ đỉnh cao!']
  },
  'gia-dung': {
    intro: [
      'Nâng tầm không gian sống của bạn!',
      'Chất liệu an toàn, thiết kế thông minh.'
    ],
    features: [
      'Chất liệu cao cấp, an toàn cho gia đình',
      'Thiết kế thông minh, tiết kiệm không gian',
      'Đa năng, phù hợp mọi nhu cầu sử dụng',
      'Dễ dàng vệ sinh và bảo quản'
    ],
    outro: ['Mua sắm thông minh — Gia dụng chất lượng cho mọi nhà!']
  }
};

class ContentAgent extends Agent {
  constructor() {
    super({
      name: 'Content Agent',
      version: '1.0.0',
      responsibilities: [
        'Tạo mô tả sản phẩm chuẩn SEO (tiếng Việt)',
        'Viết bài blog về hướng dẫn mua sắm',
        'Tạo nội dung cho flash sale & promotion',
        'Viết email marketing & newsletter',
        'Quản lý template content',
        'Tối ưu content theo từ khóa'
      ],
      permissions: [
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.WRITE_CONTENT,
        PERMISSION_SCOPES.SEND_EMAIL
      ],
      retryPolicy: { maxRetries: 2, baseDelay: 1000 }
    });
  }

  async execute(task) {
    const { action, product, template, keywords, campaign } = task.payload || {};

    switch (task.type) {
      case 'content.generate':
        return this.generateProductDescription(product, template);
      case 'content.blog':
        return this.generateBlogPost(template || 'general');
      case 'content.promotion':
        return this.generatePromotionContent(campaign);
      case 'content.email':
        return this.generateEmail(template || 'welcome');
      case 'content.templates':
        return this.listTemplates();
      default:
        throw new Error(`Unknown content action: ${task.type}`);
    }
  }

  async fallback(task, error) {
    return {
      success: true,
      fallback: true,
      content: '[Nội dung đang được tạo... Vui lòng thử lại sau]',
      error: error.message
    };
  }

  /**
   * Tạo mô tả sản phẩm
   */
  generateProductDescription(product, templateName) {
    if (!product || !product.name) {
      return { error: 'Thiếu thông tin sản phẩm', success: false };
    }

    const category = (product.category || '').toLowerCase();
    const template = PRODUCT_TEMPLATES[category] || PRODUCT_TEMPLATES['thoi-trang'];
    const name = product.name;
    const brand = product.brand || '';

    const intro = template.intro[Math.floor(Math.random() * template.intro.length)];
    const features = template.features.slice(0, 3).map(f => `✓ ${f}`).join('\n');
    const outro = template.outro[Math.floor(Math.random() * template.outro.length)];

    const description = `${intro}\n\n${name}${brand ? ' từ thương hiệu ' + brand : ''} — ${category || 'sản phẩm'} chất lượng cao.\n\nƯu điểm nổi bật:\n${features}\n\n${outro}\n\n🏪 Mua ngay tại TRỌNG ĐỊNH STORE — Cam kết chính hãng 100%.`;

    return {
      productId: product.id || product._id,
      name,
      description,
      shortDescription: `${name} — ${intro.slice(0, 80)}`,
      seoKeywords: this._extractKeywords(description),
      wordCount: description.split(' ').length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Tạo blog post
   */
  generateBlogPost(topic) {
    const blogTemplates = {
      'phoi-do-thu-dong': {
        title: 'Hướng dẫn phối đồ mùa đông стильный',
        content: `Phối đồ mùa đông không chỉ giữ ấm mà còn phải стильный...`,
        tags: ['thời trang', 'phối đồ', 'mùa đông']
      },
      'chon-dien-thoai': {
        title: 'Cách chọn điện thoại phù hợp theo nhu cầu',
        content: `Mỗi người dùng có nhu cầu khác nhau khi chọn điện thoại...`,
        tags: ['điện thoại', 'công nghệ', 'hướng dẫn']
      },
      'samsung-vs-apple': {
        title: 'Samsung hay Apple? So sánh chi tiết 2024',
        content: `Samsung và Apple là hai thương hiệu điện thoại hàng đầu thế giới...`,
        tags: ['samsung', 'apple', 'so sánh']
      }
    };

    const blog = blogTemplates[topic] || blogTemplates['phoi-do-thu-dong'];
    return {
      title: blog.title,
      excerpt: blog.content.slice(0, 150) + '...',
      content: blog.content,
      tags: blog.tags,
      readTime: '5 phút',
      seoMeta: {
        title: `${blog.title} | TRỌNG ĐỊNH STORE`,
        description: blog.content.slice(0, 155) + '...'
      }
    };
  }

  /**
   * Tạo nội dung promotion
   */
  generatePromotionContent(campaign) {
    const promoTemplates = {
      'flash-sale': {
        title: '⚡ FLASH SALE — Giảm đến 30% sản phẩm chính hãng!',
        subtitle: 'Chỉ trong 24h — Nhanh tay kẻo hết!',
        body: 'Ưu đãi đặc biệt cuối tuần: Giảm giá sốc các thương hiệu Nike, Adidas, Samsung, Xiaomi. Freeship từ 300K.',
        cta: 'Mua ngay'
      },
      'free-ship': {
        title: '🚚 Freeship từ 300K — Giao nhanh trong 24h',
        subtitle: 'Nhập mã FREESHIP khi thanh toán',
        body: 'Miễn phí giao hàng cho đơn từ 300K. Giao nhanh nội thành Hà Nội trong 24h.',
        cta: 'Mua sắm ngay'
      }
    };

    const promo = promoTemplates[campaign?.type] || promoTemplates['flash-sale'];
    return {
      ...promo,
      campaign: campaign?.name || 'Flash Sale',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Tạo email content
   */
  generateEmail(template) {
    const emails = {
      'welcome': {
        subject: '🎉 Chào mừng bạn đến với TRỌNG ĐỊNH STORE!',
        preview: 'Cảm ơn bạn đã đăng ký — tặng bạn mã giảm 10%',
        body: `Chào bạn,\n\nCảm ơn bạn đã đăng ký tài khoản tại TRỌNG ĐỊNH STORE! 🎉\n\nTặng bạn mã WELCOME10 giảm 10% cho đơn hàng đầu tiên.\n\nMua sắm ngay: https://trong-dinh-store.netlify.app\n\nĐội ngũ TRỌNG ĐỊNH STORE`
      },
      'abandoned-cart': {
        subject: '⏰ Bạn chưa thanh toán đơn hàng?',
        preview: 'Giỏ hàng đang chờ bạn — giảm thêm 5%',
        body: `Chào bạn,\n\nChúng tôi thấy bạn đã bỏ quên giỏ hàng 🛒\n\nNhập mã QUAYLAI5 để giảm thêm 5% — ưu đãi chỉ trong hôm nay!`,
        cta: 'Thanh toán ngay'
      },
      'order-confirmation': {
        subject: '✅ Xác nhận đơn hàng #{orderId}',
        preview: 'Đơn hàng của bạn đã được xác nhận',
        body: 'Cảm ơn bạn đã đặt hàng tại TRỌNG ĐỊNH STORE!\n\nMã đơn hàng: #{orderId}\nChúng tôi sẽ giao hàng trong thời gian sớm nhất.',
        cta: 'Theo dõi đơn hàng'
      }
    };

    return emails[template] || emails.welcome;
  }

  listTemplates() {
    return {
      productTemplates: Object.keys(PRODUCT_TEMPLATES),
      blogTemplates: ['phoi-do-thu-dong', 'chon-dien-thoai', 'samsung-vs-apple'],
      promoTemplates: ['flash-sale', 'free-ship'],
      emailTemplates: ['welcome', 'abandoned-cart', 'order-confirmation'],
      total: 12
    };
  }

  _extractKeywords(text) {
    const stopWords = ['của', 'và', 'có', 'cho', 'với', 'trong', 'một', 'các', 'được', 'như'];
    const words = text.toLowerCase().split(/[\s,.\n]+/);
    const keywords = {};
    words.forEach(w => {
      if (w.length > 2 && !stopWords.includes(w)) {
        keywords[w] = (keywords[w] || 0) + 1;
      }
    });
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

module.exports = new ContentAgent();
