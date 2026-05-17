'use client';

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$125,231</p>
          <p className="text-green-600 text-sm mt-2">+15.3% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">8,234</p>
          <p className="text-green-600 text-sm mt-2">+12.5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Conversion Rate</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">3.24%</p>
          <p className="text-green-600 text-sm mt-2">+2.1% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Average Order Value</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$15.21</p>
          <p className="text-red-600 text-sm mt-2">-1.4% from last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Chart placeholder - Add Recharts integration</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Chart placeholder - Add Recharts integration</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Top Products</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
              <th className="p-4">Product</th>
              <th className="p-4">Sales</th>
              <th className="p-4">Revenue</th>
              <th className="p-4">Growth</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100">
              <td className="p-4">Royal Canin Dog Food</td>
              <td className="p-4">1,234</td>
              <td className="p-4">$12,340</td>
              <td className="p-4 text-green-600">+15%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4">Whiskas Cat Food</td>
              <td className="p-4">987</td>
              <td className="p-4">$8,890</td>
              <td className="p-4 text-green-600">+12%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4">Pet Collar</td>
              <td className="p-4">654</td>
              <td className="p-4">$5,590</td>
              <td className="p-4 text-red-600">-3%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
