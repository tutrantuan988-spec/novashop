/**
 * FirestoreAdapter - Wraps existing Firestore operations
 * Provides consistent interface for dual-write pattern
 */

const admin = require('firebase-admin');

class FirestoreAdapter {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Create a product in Firestore
   * @param {Object} productData - Product data
   * @returns {Object} Created product with ID
   */
  async createProduct(productData) {
    try {
      const docRef = await this.db.collection('products').add({
        ...productData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...productData
      };
    } catch (error) {
      console.error('[FirestoreAdapter] Create product failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a product from Firestore
   * @param {string} productId - Product ID
   * @returns {Object} Product data or null
   */
  async getProduct(productId) {
    try {
      const doc = await this.db.collection('products').doc(productId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('[FirestoreAdapter] Get product failed:', error.message);
      throw error;
    }
  }

  /**
   * Update a product in Firestore
   * @param {string} productId - Product ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updates) {
    try {
      await this.db.collection('products').doc(productId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return this.getProduct(productId);
    } catch (error) {
      console.error('[FirestoreAdapter] Update product failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete a product from Firestore
   * @param {string} productId - Product ID
   * @returns {boolean} Success
   */
  async deleteProduct(productId) {
    try {
      await this.db.collection('products').doc(productId).delete();
      return true;
    } catch (error) {
      console.error('[FirestoreAdapter] Delete product failed:', error.message);
      throw error;
    }
  }

  /**
   * List products from Firestore
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Array} Products
   */
  async listProducts(filters = {}, pagination = {}) {
    try {
      let query = this.db.collection('products');
      
      // Apply filters
      if (filters.categoryId) {
        query = query.where('categoryId', '==', filters.categoryId);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      // Apply pagination
      const limit = pagination.limit || 20;
      query = query.limit(limit);
      
      if (pagination.startAfter) {
        query = query.startAfter(pagination.startAfter);
      }
      
      // Execute query
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[FirestoreAdapter] List products failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a category in Firestore
   * @param {Object} categoryData - Category data
   * @returns {Object} Created category with ID
   */
  async createCategory(categoryData) {
    try {
      const docRef = await this.db.collection('categories').add({
        ...categoryData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...categoryData
      };
    } catch (error) {
      console.error('[FirestoreAdapter] Create category failed:', error.message);
      throw error;
    }
  }

  /**
   * Update a category in Firestore
   * @param {string} categoryId - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated category
   */
  async updateCategory(categoryId, updates) {
    try {
      await this.db.collection('categories').doc(categoryId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const doc = await this.db.collection('categories').doc(categoryId).get();
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('[FirestoreAdapter] Update category failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete a category from Firestore
   * @param {string} categoryId - Category ID
   * @returns {boolean} Success
   */
  async deleteCategory(categoryId) {
    try {
      await this.db.collection('categories').doc(categoryId).delete();
      return true;
    } catch (error) {
      console.error('[FirestoreAdapter] Delete category failed:', error.message);
      throw error;
    }
  }
}

module.exports = new FirestoreAdapter();
