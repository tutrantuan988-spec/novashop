export default function DashboardOverview() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$45,231</p>
          <p className="text-green-600 text-sm mt-2">+20.1% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">+2350</p>
          <p className="text-green-600 text-sm mt-2">+12.5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">+12,234</p>
          <p className="text-green-600 text-sm mt-2">+8.2% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Customers</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">+573</p>
          <p className="text-green-600 text-sm mt-2">+2.4% from last month</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-t border-gray-100">
                <td className="py-3">#ORD-001</td>
                <td className="py-3">John Doe</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span></td>
                <td className="py-3">$120.00</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-3">#ORD-002</td>
                <td className="py-3">Jane Smith</td>
                <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span></td>
                <td className="py-3">$85.00</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-3">#ORD-003</td>
                <td className="py-3">Bob Johnson</td>
                <td className="py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Processing</span></td>
                <td className="py-3">$200.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
