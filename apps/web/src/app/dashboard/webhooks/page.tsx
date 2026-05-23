'use client';

import { useState } from 'react';

export default function WebhooksPage() {
  const [webhooks] = useState([
    { id: 1, name: 'Order Created', url: 'https://example.com/webhooks/orders', events: ['order.created'], isActive: true, triggerCount: 1234, failureCount: 5 },
    { id: 2, name: 'Payment Succeeded', url: 'https://example.com/webhooks/payments', events: ['payment.succeeded'], isActive: true, triggerCount: 987, failureCount: 2 },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          Add Webhook
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
              <th className="p-4">Name</th>
              <th className="p-4">URL</th>
              <th className="p-4">Events</th>
              <th className="p-4">Status</th>
              <th className="p-4">Triggers</th>
              <th className="p-4">Failures</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {webhooks.map((webhook) => (
              <tr key={webhook.id} className="border-b border-gray-100">
                <td className="p-4 font-medium">{webhook.name}</td>
                <td className="p-4 text-gray-600">{webhook.url}</td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {webhook.events.map((event, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {event}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${webhook.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">{webhook.triggerCount}</td>
                <td className="p-4">{webhook.failureCount}</td>
                <td className="p-4">
                  <button className="text-blue-600 hover:text-blue-700 mr-2">Edit</button>
                  <button className="text-gray-600 hover:text-gray-700 mr-2">Logs</button>
                  <button className="text-red-600 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Available Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">order.created</p>
            <p className="text-sm text-gray-500">Triggered when a new order is created</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">order.updated</p>
            <p className="text-sm text-gray-500">Triggered when an order is updated</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">payment.succeeded</p>
            <p className="text-sm text-gray-500">Triggered when a payment succeeds</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">payment.failed</p>
            <p className="text-sm text-gray-500">Triggered when a payment fails</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">customer.created</p>
            <p className="text-sm text-gray-500">Triggered when a customer is created</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">user.registered</p>
            <p className="text-sm text-gray-500">Triggered when a new user registers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
