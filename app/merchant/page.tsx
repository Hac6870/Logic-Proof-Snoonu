"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function MerchantPage() {
    const [count, setCount] = useState(0);
    const router = useRouter();

    const handleAdd = () => {
        setCount(c => c + 1);
    };

    return (
        <div className="min-h-screen bg-[#F8F8F8] pb-24 relative">
            {/* Header */}
            <div className="relative h-48 bg-white">
                <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center">
                    <Link href="/" className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm">
                        <ArrowLeft size={20} className="text-[#111]" />
                    </Link>
                </div>

                {/* Banner/Logo Area */}
                <div className="w-full h-full flex flex-col items-center justify-center pt-8">
                    <img src="/assets/hoyacafe-logo.png" alt="HoyaCafe" className="w-24 h-24 object-contain mb-2" />
                    <h1 className="text-2xl font-extrabold text-[#111]">HoyaCafe</h1>
                    <div className="flex items-center space-x-2 text-xs text-secondary mt-1">
                        <span className="flex items-center text-[#111] font-bold"><Star size={12} className="fill-orange-400 text-orange-400 mr-1" /> 4.8</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">Coffee, Desserts</span>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center text-gray-500"><Clock size={12} className="mr-1" /> 30-40 min</span>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="p-4">
                <h2 className="text-[20px] font-extrabold text-[#111] mb-4">Recommended</h2>

                {/* Product Card */}
                <div className="bg-white rounded-card p-4 shadow-card flex items-start space-x-4">
                    <img src="/assets/bulldog-cupcakes.png" alt="Bulldog Cupcakes" className="w-24 h-24 rounded-2xl object-cover bg-gray-50" />
                    <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                        <div>
                            <h3 className="font-bold text-[#111] text-[15px] mb-1">Bulldog cupcakes</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">Delicious vanilla cupcakes with our signature bulldog topper.</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-[#111]">34 QAR</span>
                            <button
                                onClick={handleAdd}
                                className="bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-[#111] font-bold px-4 py-1.5 rounded-pill text-sm flex items-center"
                            >
                                <Plus size={16} className="mr-1" /> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Cart Bar */}
            {count > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 max-w-[390px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">{count} item{count > 1 ? 's' : ''}</span>
                        <span className="text-lg font-extrabold text-[#111]">{count * 34} QAR</span>
                    </div>
                    <Link href="/cart" className="w-full bg-snoonu-red text-white font-bold h-[50px] rounded-pill flex items-center justify-between px-6 active:scale-95 transition-transform shadow-lg shadow-red-200">
                        <span>View Cart</span>
                        <span className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-bold">{count * 34} QAR</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
