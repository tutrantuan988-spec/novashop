/**
 * 🔄 Data Pipeline Agent — Xử lý dữ liệu nhập/xuất & ETL
 * 
 * Trách nhiệm:
 * - Import sản phẩm từ Excel/CSV
 * - Export dữ liệu báo cáo
 * - Validate & clean dữ liệu
 * - Đồng bộ giữa MongoDB và Firestore
 * - Transform dữ liệu cho các agent khác
 * - ETL pipeline cho analytics
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');

class DataPipelineAgent extends Agent {
  constructor() {
    super({
      name: 'Data Pipeline Agent',
      version: '1.0.0',
      responsibilities: [
        'Import sản phẩm từ nhiều định dạng (Excel, CSV, JSON)',
        'Export báo cáo doanh thu, sản phẩm, khách hàng',
        'Validate & chuẩn hóa dữ liệu sản phẩm',
        'Đồng bộ dữ liệu giữa MongoDB và Firestore',
        'Transform dữ liệu cho các agent khác',
        'Xử lý ETL pipeline định kỳ'
      ],
      permissions: [
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.WRITE_PRODUCTS,
        PERMISSION_SCOPES.READ_ORDERS,
        PERMISSION_SCOPES.EXPORT_DATA,
        PERMISSION_SCOPES.IMPORT_DATA
      ],
      retryPolicy: { maxRetries: 3, baseDelay: 2000 }
    });

    this.pipelineStats = { imports: 0, exports: 0, transforms: 0, errors: 0 };
  }

  async execute(task) {
    const { action, format, data, type, filters = {} } = task.payload || {};

    switch (task.type) {
      case 'datapipeline.import':
        return this.importData(data, format);
      case 'datapipeline.export':
        return this.exportData(type, format, filters);
      case 'datapipeline.validate':
        return this.validateData(data);
      case 'datapipeline.sync':
        return this.syncDatabases(type);
      case 'datapipeline.transform':
        return this.transformData(data, type);
      case 'datapipeline.etl':
        return this.runETLPipeline(type);
      default:
        throw new Error(`Unknown data pipeline action: ${task.type}`);
    }
  }

  async fallback(task, error) {
    return {
      success: false,
      message: 'Data pipeline tạm thời không hoạt động',
      error: error.message,
      fallbackAction: 'Vui lòng nhập liệu thủ công hoặc thử lại sau'
    };
  }

  /**
   * Import dữ liệu sản phẩm
   */
  async importData(data, format = 'json') {
    const startTime = Date.now();
    
    // Validate
    const validation = this.validateData(data);
    if (!validation.valid) {
      return { success: false, errors: validation.errors, imported: 0 };
    }

    const items = Array.isArray(data) ? data : [data];
    const imported = [];
    const failed = [];

    for (const item of items) {
      try {
        const normalized = this._normalizeProduct(item);
        // Simulate save
        imported.push(normalized);
      } catch (err) {
        failed.push({ item: item.name || 'unknown', error: err.message });
      }
    }

    this.pipelineStats.imports += imported.length;

    return {
      success: failed.length === 0,
      format,
      total: items.length,
      imported: imported.length,
      failed: failed.length,
      errors: failed,
      processingTime: `${Date.now() - startTime}ms`,
      sample: imported.slice(0, 2)
    };
  }

  /**
   * Export dữ liệu
   */
  async exportData(type, format = 'json', filters = {}) {
    this.pipelineStats.exports++;
    
    const exportTemplates = {
      'products': {
        filename: `san-pham_${new Date().toISOString().split('T')[0]}`,
        headers: ['id', 'tên sản phẩm', 'danh mục', 'thương hiệu', 'giá nhập', 'giá bán', 'tồn kho', 'trạng thái'],
        rows: 156
      },
      'orders': {
        filename: `don-hang_${new Date().toISOString().split('T')[0]}`,
        headers: ['mã đơn', 'khách hàng', 'sản phẩm', 'tổng tiền', 'trạng thái', 'ngày đặt'],
        rows: 89
      },
      'customers': {
        filename: `khach-hang_${new Date().toISOString().split('T')[0]}`,
        headers: ['email', 'tên', 'số điện thoại', 'tổng chi tiêu', 'số đơn', 'lần mua cuối'],
        rows: 1289
      }
    };

    const tmpl = exportTemplates[type] || exportTemplates.products;

    return {
      success: true,
      type,
      format,
      filename: `${tmpl.filename}.${format}`,
      exportDate: new Date().toISOString(),
      totalRows: tmpl.rows,
      headers: tmpl.headers,
      filters,
      downloadUrl: `/api/export/${type}?format=${format}`,
      estimatedSize: `${Math.round(tmpl.rows * 0.5)} KB`,
      recommendedFormat: format === 'xlsx' ? 'Excel (có định dạng)' : 'JSON (cấu trúc sẵn)'
    };
  }

  /**
   * Validate dữ liệu đầu vào
   */
  validateData(data) {
    if (!data) {
      return { valid: false, errors: ['Không có dữ liệu'] };
    }

    const items = Array.isArray(data) ? data : [data];
    const errors = [];
    const warnings = [];

    items.forEach((item, i) => {
      if (!item.name && !item['tên sản phẩm']) {
        errors.push(`Dòng ${i + 1}: Thiếu tên sản phẩm`);
      }
      if (!item.price && !item['giá bán']) {
        errors.push(`Dòng ${i + 1}: Thiếu giá sản phẩm`);
      }
      if (item.price && item.price < 0) {
        errors.push(`Dòng ${i + 1}: Giá không hợp lệ (${item.price})`);
      }
      if (!item.category && !item['danh mục']) {
        warnings.push(`Dòng ${i + 1}: Thiếu danh mục, gán mặc định`);
      }
    });

    return {
      valid: errors.length === 0,
      totalItems: items.length,
      errors,
      warnings,
      errorCount: errors.length,
      warningCount: warnings.length
    };
  }

  /**
   * Đồng bộ databases
   */
  async syncDatabases(type = 'products') {
    return {
      type,
      status: 'syncing',
      source: 'MongoDB',
      destination: 'Firestore',
      progress: '0%',
      totalDocuments: 156,
      syncedDocuments: 0,
      estimatedTime: '30 giây',
      lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
      schedule: 'Mỗi 6 giờ'
    };
  }

  /**
   * Transform dữ liệu
   */
  async transformData(data, type) {
    if (!data) {
      return { error: 'No data to transform', success: false };
    }

    switch (type) {
      case 'product-to-analytics':
        return {
          type: 'product-to-analytics',
          transformed: data.map(p => ({
            id: p.id || p._id,
            name: p.name,
            category: p.category,
            price: p.price,
            cost: p.cost || p.price * 0.6,
            margin: p.price ? Math.round(((p.price - (p.cost || p.price * 0.6)) / p.price) * 100) : 0,
            stockStatus: p.stock > 10 ? 'good' : p.stock > 0 ? 'low' : 'out'
          }))
        };

      case 'order-to-shipping':
        return {
          type: 'order-to-shipping',
          transformed: data.map(o => ({
            orderId: o.orderId || o._id,
            address: o.shippingAddress,
            province: o.province,
            weight: o.totalWeight || '2kg',
            items: (o.items || []).length
          }))
        };

      default:
        return { type, message: 'Định dạng transform không xác định, giữ nguyên dữ liệu gốc' };
    }
  }

  /**
   * ETL Pipeline
   */
  async runETLPipeline(type = 'daily') {
    const pipelineId = `etl_${Date.now().toString(36)}`;
    this.pipelineStats.transforms++;

    const pipelines = {
      'daily': [
        { step: 'extract', source: 'MongoDB Orders', status: 'completed', duration: '2.3s' },
        { step: 'transform', type: 'order-to-analytics', status: 'completed', duration: '1.1s' },
        { step: 'load', destination: 'Analytics Cache', status: 'completed', duration: '0.5s' }
      ],
      'hourly': [
        { step: 'extract', source: 'Redis Cache', status: 'completed', duration: '0.3s' },
        { step: 'transform', type: 'cache-refresh', status: 'completed', duration: '0.8s' },
        { step: 'load', destination: 'In-Memory Store', status: 'completed', duration: '0.2s' }
      ]
    };

    const steps = pipelines[type] || pipelines.daily;
    const allPassed = steps.every(s => s.status === 'completed');

    return {
      pipelineId,
      type: `${type} ETL Pipeline`,
      status: allPassed ? 'completed' : 'failed',
      steps,
      totalDuration: steps.reduce((s, step) => {
        const ms = parseFloat(step.duration);
        return s + (isNaN(ms) ? 0 : ms * 1000);
      }, 0),
      recordsProcessed: Math.floor(Math.random() * 1000) + 200,
      nextScheduledAt: new Date(Date.now() + 3600000).toISOString()
    };
  }

  getPipelineStats() {
    return {
      ...this.pipelineStats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  _normalizeProduct(item) {
    return {
      id: item.id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: item.name || item['tên sản phẩm'] || 'Unnamed Product',
      category: item.category || item['danh mục'] || 'Chưa phân loại',
      brand: item.brand || item['thương hiệu'] || 'Khác',
      price: item.price || item['giá bán'] || 0,
      cost: item.cost || item['giá nhập'] || 0,
      stock: item.stock || item['tồn kho'] || 0,
      unit: item.unit || item['đơn vị'] || 'túi',
      status: item.status || 'active',
      normalizedAt: new Date().toISOString()
    };
  }
}

module.exports = new DataPipelineAgent();
