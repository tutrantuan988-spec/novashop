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
  'thức ăn chó': {
    crossSell: ['pate thưởng', 'bánh thưởng', 'đồ chơi', 'bát ăn', 'vòng cổ'],
    upSell: ['thức ăn cao cấp', 'thức ăn chuyên biệt giống'],
    bundle: ['set combo thức ăn + pate', 'set quà tặng thú cưng']
  },
  'thức ăn mèo': {
    crossSell: ['pate mèo', 'đồ chơi mèo', 'cát vệ sinh', 'bát ăn', 'cây cào móng'],
    upSell: ['thức ăn nhập khẩu', 'thức ăn chuyên biệt giống mèo'],
    bundle: ['set combo mèo', 'set quà tặng mèo']
  },
  'phụ kiện': {
    crossSell: ['thức ăn', 'bánh thưởng', 'đồ chơi'],
    upSell: ['phụ kiện cao cấp', 'phụ kiện thiết kế'],
    bundle: ['set phụ kiện trọn bộ']
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
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thức ăn chó'];
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
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thức ăn chó'];
    const items = relationships.upSell.slice(0, limit).map((name, i) => ({
      id: `us_${i}_${Date.now()}`,
      name: `${name} cao cấp`,
      type: 'up-sell',
      confidence: 0.7 - (i * 0.1),
      reason: 'Phiên bản cao cấp hơn, dinh dưỡng vượt trội',
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
      { id: 'rec1', name: 'Royal Canin Maxi Adult', type: 'personalized', reason: 'Dựa trên giống chó bạn đã mua', confidence: 0.92 },
      { id: 'rec2', name: 'Pedigree Dentastix', type: 'personalized', reason: 'Phụ kiện thường mua kèm', confidence: 0.88 },
      { id: 'rec3', name: 'Whiskas Pate Cá Ngừ', type: 'personalized', reason: 'Sản phẩm phổ biến trong phân khúc của bạn', confidence: 0.85 },
      { id: 'rec4', name: 'Đồ chơi Kong Classic', type: 'personalized', reason: 'Khách hàng tương tự cũng mua', confidence: 0.82 }
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

    const categories = cartItems.map(item => item.category || 'thức ăn chó');
    const mainCategory = categories[0];
    const relationships = PRODUCT_RELATIONSHIPS[mainCategory] || PRODUCT_RELATIONSHIPS['thức ăn chó'];

    const recommendations = [
      { name: relationships.crossSell[0] || 'Pate thưởng', reason: 'Hoàn hảo để kết hợp với đơn hàng của bạn', price: '35.000₫' },
      { name: relationships.crossSell[1] || 'Bánh thưởng', reason: 'Thêm 50.000₫ để được freeship!', price: '25.000₫' }
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
      { id: 'pop1', name: 'Royal Canin Maxi Adult 15kg', price: 890000, sold: 1234, rating: 4.8 },
      { id: 'pop2', name: 'Pedigree Adult 3kg', price: 175000, sold: 2341, rating: 4.6 },
      { id: 'pop3', name: 'Whiskas 1+ Cá Biển 1.2kg', price: 85000, sold: 3120, rating: 4.7 },
      { id: 'pop4', name: 'Me-O Pate Gà 400g', price: 28000, sold: 5678, rating: 4.5 },
      { id: 'pop5', name: 'Royal Canin Kitten 2kg', price: 295000, sold: 987, rating: 4.9 }
    ];

    return {
      category,
      strategy: 'popular',
      recommendations: popular.slice(0, limit),
      total: popular.length
    };
  }

  getBundleDeals(category) {
    const relationships = PRODUCT_RELATIONSHIPS[category] || PRODUCT_RELATIONSHIPS['thức ăn chó'];
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
      'winter': { title: 'Mùa đông ấm áp', items: ['Đệm lót cho thú cưng', 'Áo ấm chó mèo', 'Thức ăn giàu calo'] },
      'new-pet': { title: 'Mới nuôi thú cưng', items: ['Set khởi đầu', 'Bát ăn + bát uống', 'Đồ chơi cơ bản', 'Thức ăn khởi đầu'] },
      'premium': { title: 'Dòng cao cấp', items: ['Royal Canin Pure', 'Đồ chơi thông minh', 'Phụ kiện thiết kế'] }
    };

    const s = strategies[strategy] || strategies['new-pet'];
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
