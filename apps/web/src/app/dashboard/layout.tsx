export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-orange-600">NovaShop</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Overview
          </a>
          <a href="/dashboard/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Products
          </a>
          <a href="/dashboard/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Orders
          </a>
          <a href="/dashboard/customers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Customers
          </a>
          <a href="/dashboard/analytics" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Analytics
          </a>
          <a href="/dashboard/billing" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Billing
          </a>
          <a href="/dashboard/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Settings
          </a>
          <a href="/dashboard/webhooks" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Webhooks
          </a>
          <a href="/dashboard/architecture" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Architecture
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
