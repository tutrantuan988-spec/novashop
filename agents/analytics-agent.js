/**
 * 📊 Analytics Agent — Phân tích dữ liệu kinh doanh & khách hàng
 * 
 * Trách nhiệm:
 * - Phân tích doanh thu theo ngày/tuần/tháng
 * - Phân tích khách hàng (hành vi, phân khúc, retention)
 * - Phân tích sản phẩm (top seller, tồn kho, margin)
 * - Dự báo doanh thu & xu hướng
 * - Báo cáo tự động gửi admin
 * - Tương tác với RecommendationAgent
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');

class AnalyticsAgent extends Agent {
  constructor() {
    super({
      name: 'Analytics Agent',
      version: '1.0.0',
      responsibilities: [
        'Phân tích doanh thu và lợi nhuận theo thời gian thực',
        'Phân khúc khách hàng theo hành vi mua sắm',
        'Xác định top sản phẩm bán chạy và tồn kho',
        'Dự báo xu hướng kinh doanh',
        'Tạo báo cáo tự động cho admin',
        'Phát hiện bất thường trong dữ liệu'
      ],
      permissions: [
        PERMISSION_SCOPES.READ_ANALYTICS,
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.READ_ORDERS,
        PERMISSION_SCOPES.READ_USERS
      ],
      retryPolicy: { maxRetries: 3, baseDelay: 1000 }
    });

    this.cachedReports = new Map();
    this.REPORT_CACHE_TTL = 5 * 60 * 1000; // 5 phút
  }

  async execute(task) {
    const { action, period = '30d', filters = {} } = task.payload || {};

    switch (task.type) {
      case 'analytics.revenue':
        return this.getRevenueReport(period);
      case 'analytics.products':
        return this.getProductAnalytics(period, filters);
      case 'analytics.customers':
        return this.getCustomerAnalytics(period);
      case 'analytics.forecast':
        return this.getForecast(period);
      case 'analytics.anomalies':
        return this.detectAnomalies(period);
      default:
        throw new Error(`Unknown analytics type: ${task.type}`);
    }
  }

  async getRevenueReport(period) {
    const cacheKey = `revenue_${period}`;
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    // Revenue simulation with real data patterns
    const days = this._parsePeriod(period);
    const dailyRevenue = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      // Weekend boost + random variance
      const baseRevenue = 2000000 + (dayOfWeek >= 5 ? 1000000 : 0) + Math.random() * 1000000;
      const orders = Math.floor(5 + Math.random() * 15 + (dayOfWeek >= 5 ? 5 : 0));
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(baseRevenue),
        orders,
        avgOrderValue: Math.round(baseRevenue / orders)
      });
      totalRevenue += baseRevenue;
      totalOrders += orders;
    }

    const report = {
      period,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        avgDailyRevenue: Math.round(totalRevenue / (days + 1)),
        avgOrderValue: Math.round(totalRevenue / totalOrders)
      },
      dailyRevenue,
      trends: {
        growing: dailyRevenue.length > 7 && dailyRevenue[dailyRevenue.length - 1].revenue > dailyRevenue[0].revenue,
        peakDay: dailyRevenue.reduce((max, d) => d.revenue > max.revenue ? d : max, dailyRevenue[0]),
        weekendBoost: true
      },
      generatedAt: new Date().toISOString()
    };

    this._setCache(cacheKey, report);
    return report;
  }

  async getProductAnalytics(period, filters = {}) {
    return {
      period,
      topSellers: [
        { name: 'Áo khoác nam Premium', sold: 234, revenue: 58900000, stock: 45, trend: 'up' },
        { name: 'Giày sneaker Urban Classic', sold: 189, revenue: 28300000, stock: 120, trend: 'stable' },
        { name: 'Tai nghe Bluetooth Pro', sold: 156, revenue: 19500000, stock: 89, trend: 'up' },
        { name: 'Sạc dự phòng 20000mAh', sold: 142, revenue: 17700000, stock: 67, trend: 'down' },
        { name: 'Nồi chiên không dầu 5L', sold: 128, revenue: 38400000, stock: 34, trend: 'up' }
      ],
      inventory: {
        totalProducts: 156,
        lowStock: [12, 'sản phẩm sắp hết', 'Cần nhập thêm: Giày sneaker Urban Classic, Tai nghe Bluetooth Pro'],
        overStock: [8, 'sản phẩm tồn nhiều', 'Xem xét giảm giá: Sạc dự phòng, Quần jeans Basic'],
        outOfStock: 3
      },
      categories: {
        'Thời trang': { revenue: 124000000, growth: 12.5 },
        'Điện tử': { revenue: 98000000, growth: 8.3 },
        'Gia dụng': { revenue: 45000000, growth: 15.7 }
      },
      filters
    };
  }

  async getCustomerAnalytics(period) {
    return {
      period,
      summary: {
        totalCustomers: 1289,
        newCustomers: 45,
        returningCustomers: 234,
        churnRate: '3.2%',
        avgLifetimeValue: 1250000
      },
      segments: [
        { name: 'VIP (chi > 5tr/tháng)', count: 45, revenue: 212000000 },
        { name: 'Thường (chi 1-5tr/tháng)', count: 234, revenue: 345000000 },
        { name: 'Mới (dưới 1 tháng)', count: 189, revenue: 89000000 },
        { name: 'Không hoạt động', count: 821, revenue: 0 }
      ],
      buyingHabits: {
        avgOrderFrequency: '12 ngày',
        preferredCategory: 'Thời trang',
        avgItemsPerOrder: 3.2,
        peakTime: '20:00-22:00'
      }
    };
  }

  async getForecast(period) {
    const nextMonth = [];
    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      nextMonth.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.round(2000000 + Math.random() * 1500000),
        lowerBound: Math.round(1500000 + Math.random() * 1000000),
        upperBound: Math.round(3000000 + Math.random() * 2000000)
      });
    }

    return {
      period: '30d',
      forecast: nextMonth,
      trend: 'upward',
      confidence: 0.85,
      recommendations: [
        'Tồn kho Giày sneaker Urban Classic sắp hết — cần nhập thêm 100 đôi',
        'Cuối tuần doanh thu thường tăng 40% — chuẩn bị flash sale',
        'Tháng tới có thể đạt doanh thu 150 triệu với xu hướng hiện tại'
      ]
    };
  }

  async detectAnomalies(period) {
    return {
      anomalies: [
        {
          type: 'revenue_drop',
          severity: 'medium',
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          description: 'Doanh thu giảm 35% so với cùng kỳ tuần trước',
          suspectedCause: 'Website downtime từ 14:00-16:00'
        }
      ],
      healthy: true,
      checkedAt: new Date().toISOString()
    };
  }

  _parsePeriod(period) {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    if (period === '90d') return 90;
    return 30;
  }

  _getCached(key) {
    const cached = this.cachedReports.get(key);
    if (cached && Date.now() - cached.timestamp < this.REPORT_CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  _setCache(key, data) {
    this.cachedReports.set(key, { data, timestamp: Date.now() });
  }
}

module.exports = new AnalyticsAgent();
