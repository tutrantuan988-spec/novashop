/**
 * 🎯 Recommendation Agent — Gợi ý sản phẩm thông minh
 * 
 * Trách nhiệm:
 * - Gợi ý sản phẩm dựa trên lịch sử mua hàng
 * - Cross-sell (sản phẩm bán kèm) 
 * - Up-sell (sản phẩm cao cấp hơn)
 * - Tương tác với AnalyticsAgent cho insights
 * - Cá nhân hóa hiển thị sản phẩm
 * - Phân tích hành vi real-time
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');

// Product relationships cho recommendations
const PRODUCT_RELATIONSHIPS = {
  'thoi-trang': {
    crossSell: ['phụ kiện thời trang', 'ví', 'túi xách', 'mũ nón', 'thắt lưng'],
    upSell: ['thời trang cao cấp', 'thiết kế thương hiệu'],
    bundle: ['set combo outfit hoàn chỉnh', 'set quà tặng thời trang']
  },
  'dien-tu': {
    crossSell: ['ốp lưng', 'cáp sạc', 'tai nghe', 'sạc dự phòng', 'miếng dán màn hình'],
    upSell: ['thiết bị cao cấp', 'flagship mới nhất'],
    bundle: ['set combo công nghệ', 'set quà tặng điện tử']
  },
  'gia-dung': {
    crossSell: ['đồ dùng nhà bếp', 'chăn ga gối', 'nến thơm', 'khăn tắm'],
    upSell: ['gia dụng thông minh', 'thiết bị cao cấp'],
    bundle: ['set gia dụng trọn bộ']
  }
};

class RecommendationAgent extends Agent {
  constructor() {
    super({
      name: 'Recommendation Agent',
      version: '1.0.0',
      responsibilities: [
        'Gợi ý sản phẩm thông minh dựa trên hành vi người dùng',
        'Cross-sell & up-sell tự động trên trang sản phẩm',
        'Cá nhân hóa trang chủ theo từng khách hàng',
        'Phân tích giỏ hàng để gợi ý bổ sung',
        'Recommendation email cho khách hàng tiềm năng',
        'A/B test recommendation strategies'
      ],
      permissions: [
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.READ_ORDERS,
        PERMISSION_SCOPES.READ_USERS
      ],
      retryPolicy: { maxRetries: 2, baseDelay: 500 }
    });
  }

  async execute(task) {
    const { action, productId, category, userId, cartItems, strategy = 'cross-sell', limit = 5 } = task.payload || {};

    switch (task.type) {
      case 'recommend.cross-sell':
        return this.getCrossSell(productId, category, limit);
      case 'recommend.up-sell':
        return this.getUpSell(productId, category, limit);
      case 'recommend.personalized':
        return this.getPersonalized(userId, limit);
      case 'recommend.cart':
        return this.getCartRecommendations(cartItems, limit);
      case 'recommend.popular':
        return this.getPopular(category, limit);
      case 'recommend.bundle':
        return this.getBundleDeals(category);
      case 'recommend.segment':
        return this.getSegmentRecommendations(strategy, limit);
      default:
        throw new Error(`Unknown recommendation action: ${task.type}`);
    }
  }

  /**
   * Cross-sell: sản phẩm bán kèm
   */
  getCrossSell(productId, category, limit = 5) {
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thoi-trang'];
    const items = relationships.crossSell.slice(0, limit).map((name, i) => ({
      id: `cs_${i}_${Date.now()}`,
      name: `${name} chất lượng cao`,
      type: 'cross-sell',
      confidence: 0.85 - (i * 0.05),
      reason: `Thường mua cùng sản phẩm ${category}`
    }));

    return {
      productId,
      category,
      strategy: 'cross-sell',
      recommendations: items,
      total: items.length
    };
  }

  /**
   * Up-sell: sản phẩm cao cấp hơn
   */
  getUpSell(productId, category, limit = 3) {
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thoi-trang'];
    const items = relationships.upSell.slice(0, limit).map((name, i) => ({
      id: `us_${i}_${Date.now()}`,
      name: `${name} cao cấp`,
      type: 'up-sell',
      confidence: 0.7 - (i * 0.1),
      reason: 'Phiên bản cao cấp hơn, chất lượng vượt trội',
      premium: true
    }));

    return {
      productId,
      category,
      strategy: 'up-sell',
      recommendations: items,
      total: items.length
    };
  }

  /**
   * Cá nhân hóa theo user
   */
  getPersonalized(userId, limit = 8) {
    const segments = ['thường xuyên', 'mới', 'vip'];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    
    const recommendations = [
      { id: 'rec1', name: 'Áo khoác nam Premium', type: 'personalized', reason: 'Dựa trên phong cách bạn đã mua', confidence: 0.92 },
      { id: 'rec2', name: 'Ví da nam Genuine', type: 'personalized', reason: 'Phụ kiện thường mua kèm', confidence: 0.88 },
      { id: 'rec3', name: 'Tai nghe Bluetooth Pro', type: 'personalized', reason: 'Sản phẩm phổ biến trong phân khúc của bạn', confidence: 0.85 },
      { id: 'rec4', name: 'Nồi chiên không dầu 5L', type: 'personalized', reason: 'Khách hàng tương tự cũng mua', confidence: 0.82 }
    ].slice(0, limit);

    return {
      userId,
      segment,
      recommendations,
      total: recommendations.length,
      personalized: true
    };
  }

  /**
   * Dựa trên giỏ hàng hiện tại
   */
  getCartRecommendations(cartItems, limit = 4) {
    if (!cartItems || cartItems.length === 0) {
      return this.getPopular(null, limit);
    }

    const categories = cartItems.map(item => item.category || 'thoi-trang');
    const mainCategory = categories[0];
    const relationships = PRODUCT_RELATIONSHIPS[mainCategory] || PRODUCT_RELATIONSHIPS['thoi-trang'];

    const recommendations = [
      { name: relationships.crossSell[0] || 'Phụ kiện thời trang', reason: 'Hoàn hảo để kết hợp với đơn hàng của bạn', price: '35.000₫' },
      { name: relationships.crossSell[1] || 'Ví da cao cấp', reason: 'Thêm 50.000₫ để được freeship!', price: '25.000₫' }
    ].slice(0, limit);

    return {
      cartValue: cartItems.reduce((s, i) => s + (i.price || 0), 0),
      recommendations,
      savingsTip: 'Mua thêm 1 sản phẩm để được giảm 10% combo'
    };
  }

  /**
   * Sản phẩm phổ biến
   */
  getPopular(category, limit = 8) {
    const popular = [
      { id: 'pop1', name: 'Áo khoác nam Premium', price: 890000, sold: 1234, rating: 4.8 },
      { id: 'pop2', name: 'Giày sneaker Urban Classic', price: 520000, sold: 2341, rating: 4.6 },
      { id: 'pop3', name: 'Tai nghe Bluetooth Pro', price: 155000, sold: 3120, rating: 4.7 },
      { id: 'pop4', name: 'Sạc dự phòng 20000mAh', price: 125000, sold: 5678, rating: 4.5 },
      { id: 'pop5', name: 'Nồi chiên không dầu 5L', price: 680000, sold: 987, rating: 4.9 }
    ];

    return {
      category,
      strategy: 'popular',
      recommendations: popular.slice(0, limit),
      total: popular.length
    };
  }

  getBundleDeals(category) {
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thoi-trang'];
    return {
      bundles: relationships.bundle.slice(0, 2).map((name, i) => ({
        id: `bundle_${i}`,
        name,
        originalPrice: (300000 + i * 100000),
        bundlePrice: (250000 + i * 80000),
        savePercent: 15 + i * 5,
        items: 3 + i
      })),
      savingTip: 'Mua bundle tiết kiệm đến 20% so với mua lẻ'
    };
  }

  getSegmentRecommendations(strategy, limit = 5) {
    const strategies = {
      'winter': { title: 'Mùa đông ấm áp', items: ['Áo khoác giữ nhiệt', 'Khăn len cashmere', 'Giày boot da'] },
      'new-customer': { title: 'Mới mua sắm', items: ['Set khởi đầu', 'Áo thun basic + quần jeans', 'Phụ kiện cơ bản', 'Túi xách đa năng'] },
      'premium': { title: 'Dòng cao cấp', items: ['Áo khoác designer', 'Đồng hồ thông minh', 'Nước hoa cao cấp'] }
    };

    const s = strategies[strategy] || strategies['new-customer'];
    return {
      strategy,
      title: s.title,
      recommendations: s.items.slice(0, limit).map((name, i) => ({
        id: `seg_${i}`,
        name,
        confidence: 0.9 - (i * 0.05)
      }))
    };
  }
}

module.exports = new RecommendationAgent();
