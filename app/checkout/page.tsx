"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Target, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'fast' | 'normal' | 'eco';

export default function CheckoutPage() {
    const router = useRouter();
    const [selectedMode, setSelectedMode] = useState<Mode>('normal');

    const modes = [
        {
            id: 'fast',
            label: 'Fast',
            icon: Zap,
            color: 'text-amber-500',
            bgColor: 'bg-amber-100',
            fee: 10,
            time: '35 min',
            desc: 'Just like lightning',
            target: 'Target 35 min'
        },
        {
            id: 'normal',
            label: 'Normal',
            icon: Target,
            color: 'text-blue-500',
            bgColor: 'bg-blue-100',
            fee: 5,
            time: '45 min',
            desc: 'Balanced',
            target: 'Target 45 min'
        },
        {
            id: 'eco',
            label: 'Eco',
            icon: Leaf,
            color: 'text-green-500',
            bgColor: 'bg-green-100',
            fee: 0,
            time: '60 min',
            desc: 'Efficiency',
            target: 'Target 60 min'
        },
    ] as const;

    const itemPrice = 34;
    const currentFee = modes.find(m => m.id === selectedMode)?.fee || 0;
    const total = itemPrice + currentFee;

    const handlePlaceOrder = () => {
        router.push(`/tracking?mode=${selectedMode}`);
    };

    return (
        <div className="min-h-screen bg-[#F8F8F8] pb-32">
            {/* Header */}
            <header className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center">
                <Link href="/cart" className="p-2 -ml-2">
                    <ArrowLeft size={22} className="text-[#111]" />
                </Link>
                <h1 className="flex-1 text-center text-[18px] font-bold text-[#111] pr-8">Checkout</h1>
            </header>

            <div className="p-4 space-y-6">
                <h2 className="text-[22px] font-extrabold text-[#111]">Delivery Options</h2>

                <div className="space-y-3">
                    {modes.map((mode) => (
                        <div
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={cn(
                                "relative bg-white rounded-card p-4 shadow-sm border-2 transition-all cursor-pointer flex items-center",
                                selectedMode === mode.id ? "border-snoonu-red bg-red-50/10" : "border-transparent"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-4", mode.bgColor, mode.color)}>
                                <mode.icon size={20} fill="currentColor" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[#111] text-base">{mode.label}</span>
                                    <span className="font-bold text-[#111]">{mode.fee === 0 ? 'Free' : `${mode.fee} QAR`}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">{mode.desc}</span>
                                    <span className={cn("font-bold", selectedMode === mode.id ? "text-snoonu-red" : "text-gray-400")}>{mode.target}</span>
                                </div>
                            </div>
                            {selectedMode === mode.id && (
                                <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-[5px] border-snoonu-red bg-white hidden"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="bg-white rounded-card p-4 shadow-card space-y-3 mt-8">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{itemPrice} QAR</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Delivery Fee</span>
                        <span>{currentFee === 0 ? 'Free' : `${currentFee} QAR`}</span>
                    </div>
                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-extrabold text-[#111] text-lg">
                        <span>Total</span>
                        <span>{total} QAR</span>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-[390px] mx-auto">
                <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-snoonu-red text-white font-bold h-[50px] rounded-pill flex items-center justify-center shadow-lg shadow-red-200 text-[17px] active:scale-95 transition-transform"
                >
                    Place Order
                </button>
            </div>
        </div>
    )
}
