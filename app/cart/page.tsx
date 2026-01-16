"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function CartPage() {
    const itemPrice = 34;
    const deliveryFee = 5; // Placeholder
    const total = itemPrice + deliveryFee;

    return (
        <div className="min-h-screen bg-[#F8F8F8] pb-32">
            {/* Header */}
            <header className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center">
                <Link href="/merchant" className="p-2 -ml-2">
                    <ArrowLeft size={22} className="text-[#111]" />
                </Link>
                <h1 className="flex-1 text-center text-[18px] font-bold text-[#111] pr-8">Cart</h1>
            </header>

            <div className="p-4 space-y-6">
                {/* Items */}
                <div className="bg-white rounded-card p-4 shadow-card">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                        <h2 className="text-[17px] font-bold text-[#111]">HoyaCafe</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                            1x
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-[#111] text-[15px]">Bulldog cupcakes</div>
                            <div className="text-xs text-gray-500">Delicious vanilla cupcakes...</div>
                        </div>
                        <div className="font-bold text-[#111]">{itemPrice} QAR</div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-card p-4 shadow-card space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{itemPrice} QAR</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Delivery Fee</span>
                        <span>To be calculated</span>
                    </div>
                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-extrabold text-[#111] text-lg">
                        <span>Total</span>
                        <span>{itemPrice} QAR</span>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-[390px] mx-auto">
                <Link href="/checkout" className="w-full bg-snoonu-red text-white font-bold h-[50px] rounded-pill flex items-center justify-center shadow-lg shadow-red-200 text-[17px]">
                    Go to Checkout
                </Link>
            </div>
        </div>
    )
}
