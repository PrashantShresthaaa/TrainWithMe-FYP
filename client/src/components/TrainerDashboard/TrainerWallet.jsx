import React from 'react';
import { DollarSign, ArrowUpRight, Download } from 'lucide-react';

const TrainerWallet = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-brandBlack text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brandOrange/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <p className="text-gray-400 font-medium mb-1">Total Balance</p>
          <h2 className="text-4xl font-bold mb-6">Rs. 45,000</h2>
          <div className="flex gap-4">
            <button className="bg-brandOrange hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition">Withdraw Funds</button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold text-sm transition">View Report</button>
          </div>
        </div>

        {/* Payout Method */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="font-bold text-lg mb-4">Payout Method</h3>
          <div className="flex items-center justify-between p-4 border border-green-100 bg-green-50/50 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">e</div>
              <div>
                <p className="font-bold text-sm text-brandBlack">eSewa</p>
                <p className="text-xs text-gray-500">Connected •••• 9841</p>
              </div>
            </div>
            <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">Active</span>
          </div>
          <button className="text-sm text-gray-500 hover:text-brandBlack font-bold underline">Change Method</button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-brandOrange"><Download size={16}/> Export CSV</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-brandBlack">Session Payment - Anish K.</p>
                  <p className="text-xs text-gray-500">Jan {20 + i}, 2026</p>
                </div>
              </div>
              <span className="font-bold text-brandBlack">+ Rs. 1,500</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerWallet;