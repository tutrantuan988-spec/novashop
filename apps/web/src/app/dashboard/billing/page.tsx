'use client';

import { useState } from 'react';

export default function BillingPage() {
  const [currentPlan] = useState({ name: 'PROFESSIONAL', price: 890000, features: ['1000 products', '10000 orders', 'Advanced analytics'] });
  const [plans] = useState([
    { name: 'FREE', price: 0, features: ['10 products', '100 orders', 'Basic analytics'] },
    { name: 'STARTER', price: 290000, features: ['100 products', '1000 orders', 'Standard analytics'] },
    { name: 'PROFESSIONAL', price: 890000, features: ['1000 products', '10000 orders', 'Advanced analytics'] },
    { name: 'ENTERPRISE', price: 2890000, features: ['Unlimited products', 'Unlimited orders', 'Custom features'] },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-orange-600">{currentPlan.name}</p>
            <p className="text-gray-500">{currentPlan.price.toLocaleString()} VND/month</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Manage Subscription
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Upgrade Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-6 rounded-lg border ${
              plan.name === currentPlan.name
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
            <p className="text-2xl font-bold mb-4">{plan.price.toLocaleString()} VND/month</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-sm text-gray-600">
                  ✓ {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 rounded-lg ${
                plan.name === currentPlan.name
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
              disabled={plan.name === currentPlan.name}
            >
              {plan.name === currentPlan.name ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
