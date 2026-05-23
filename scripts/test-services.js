/**
 * Test script for commerce services
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { initializePool, shutdown } = require('../server/db/postgres');
const {
  catalogService,
  categoryService,
  attributeService,
  variantService,
  inventoryService
} = require('../server/services');

async function testServices() {
  console.log('🧪 Testing Commerce Services...\n');
  
  try {
    // Initialize database
    await initializePool();
    console.log('✅ Database connected\n');
    
    // Test CategoryService
    console.log('📁 Testing CategoryService...');
    const categories = await categoryService.find({ is_active: true }, { limit: 5 });
    console.log(`   Found ${categories.length} active categories`);
    if (categories.length > 0) {
      console.log(`   Example: ${categories[0].name_vi} (${categories[0].slug})`);
    }
    
    const categoryTree = await categoryService.getCategoryTree();
    console.log(`   Category tree has ${categoryTree.length} root categories`);
    console.log('');
    
    // Test AttributeService
    console.log('🏷️  Testing AttributeService...');
    const attributes = await attributeService.find({}, { limit: 5 });
    console.log(`   Found ${attributes.length} attributes`);
    if (attributes.length > 0) {
      console.log(`   Example: ${attributes[0].name_vi} (${attributes[0].type})`);
    }
    
    const variantAttrs = await attributeService.getVariantAttributes();
    console.log(`   Found ${variantAttrs.length} variant attributes`);
    console.log('');
    
    // Test CatalogService
    console.log('📦 Testing CatalogService...');
    const productCount = await catalogService.count({ status: 'active' });
    console.log(`   Active products: ${productCount}`);
    
    const products = await catalogService.listProducts({ status: 'active' }, { limit: 3 });
    console.log(`   Listed ${products.products.length} products`);
    console.log('');
    
    // Test VariantService
    console.log('🎨 Testing VariantService...');
    const variantCount = await variantService.count({ is_active: true });
    console.log(`   Active variants: ${variantCount}`);
    console.log('');
    
    // Test InventoryService
    console.log('📊 Testing InventoryService...');
    const lowStock = await inventoryService.getLowStockProducts();
    console.log(`   Low stock products: ${lowStock.length}`);
    console.log('');
    
    console.log('✅ All service tests passed!\n');
    console.log('🎉 Service layer is ready for use\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await shutdown();
    process.exit(0);
  }
}

testServices();
