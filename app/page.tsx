import Link from 'next/link';
import { Search, ChevronDown, Home } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function HomePage() {
    return (
        <div className="pb-24 bg-[#F8F8F8] min-h-screen">
            {/* Header */}
            <header className="px-4 py-3 bg-white sticky top-0 z-20 shadow-sm">
                <div className="flex items-center space-x-2 text-snoonu-red mb-3">
                    <Home size={20} className="fill-snoonu-red" />
                    <span className="font-bold text-sm text-[#111] truncate max-w-[200px]">Ar-Rayyan, Al Rayyan Municipa...</span>
                    <ChevronDown size={16} className="text-[#111]" />
                </div>
                <div className="bg-snoonu-input rounded-xl h-12 px-4 flex items-center text-text-secondary w-full">
                    <Search size={20} className="mr-3 text-gray-400" />
                    <span className="text-[15px] text-gray-500 font-normal">Search for Cake / Pizza</span>
                </div>
            </header>

            {/* Dark Banner */}
            <div className="bg-snoonu-dark text-white px-4 py-3 text-xs font-medium flex items-center justify-center">
                <span>Some merchants may be unavailable due to high demand</span>
            </div>

            <div className="p-4 space-y-8">
                {/* Promo Banner */}
                <div className="w-full h-40 bg-gradient-to-br from-red-600 to-rose-500 rounded-card shadow-card flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                        <div className="w-32 h-32 bg-white rounded-full"></div>
                    </div>
                    <h3 className="font-extrabold text-2xl z-10">Free Delivery</h3>
                    <p className="text-sm opacity-90 z-10">On your first order</p>
                </div>

                {/* Categories */}
                <div>
                    <h2 className="text-[20px] font-extrabold text-[#111] mb-4">Categories</h2>
                    <Link href="/merchant" className="inline-flex flex-col items-center group">
                        <div className="w-[88px] h-[88px] bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex items-center justify-center mb-2 group-active:scale-95 transition-transform border border-transparent group-hover:border-red-50">
                            <img src="/assets/hoyacafe-logo.png" alt="Restaurants" className="w-12 h-12 object-contain" />
                        </div>
                        <span className="font-bold text-[13px] text-[#111]">Restaurants</span>
                    </Link>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
