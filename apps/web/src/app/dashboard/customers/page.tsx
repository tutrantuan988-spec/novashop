'use client';

import { useState } from 'react';

export default function CustomersPage() {
  const [customers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '0901234567', orders: 5, spent: 5000000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '0912345678', orders: 3, spent: 2500000 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '0923456789', orders: 8, spent: 12000000 },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Orders</th>
              <th className="p-4">Total Spent</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-100">
                <td className="p-4 font-medium">{customer.name}</td>
                <td className="p-4">{customer.email}</td>
                <td className="p-4">{customer.phone}</td>
                <td className="p-4">{customer.orders}</td>
                <td className="p-4">{customer.spent.toLocaleString()} VND</td>
                <td className="p-4">
                  <button className="text-blue-600 hover:text-blue-700 mr-2">View</button>
                  <button className="text-gray-600 hover:text-gray-700">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
