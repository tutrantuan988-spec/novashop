'use client';

import { useState } from 'react';

export default function ProductsPage() {
  const [products] = useState([
    { id: 1, name: 'Royal Canin Dog Food', price: 450000, stock: 50, status: 'Active' },
    { id: 2, name: 'Whiskas Cat Food', price: 120000, stock: 100, status: 'Active' },
    { id: 3, name: 'Pet Collar', price: 85000, stock: 25, status: 'Active' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-100">
                <td className="p-4">{product.name}</td>
                <td className="p-4">{product.price.toLocaleString()} VND</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    {product.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:text-blue-700 mr-2">Edit</button>
                  <button className="text-red-600 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
