"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Phone, MessageSquare, MapPin, Navigation, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { DispatchPlan } from '@/lib/pulseDispatch';

// Dynamic import for Map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapInner'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

type Mode = 'fast' | 'normal' | 'eco';

export default function TrackingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TrackingContent />
        </Suspense>
    );
}

function TrackingContent() {
    const searchParams = useSearchParams();
    const mode = (searchParams.get('mode') as any) || 'NORMAL';
    const normalizedMode = mode.toLowerCase() as Mode;
    const tier = mode.toUpperCase(); // FAST, NORMAL, ECO

    const [plan, setPlan] = useState<DispatchPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [eta, setEta] = useState(normalizedMode === 'fast' ? 35 : normalizedMode === 'normal' ? 45 : 60);
    const [status, setStatus] = useState('Confirmed');
    const [showAddOn, setShowAddOn] = useState(true);
    const [total, setTotal] = useState(34);
    const [toast, setToast] = useState<string | null>(null);

    // Simulation Timer
    const [elapsed, setElapsed] = useState(0);

    // Fetch Plan on Mount
    useEffect(() => {
        async function fetchDispatch() {
            try {
                // Use coordinates that trigger bundling (Al Sadd -> West Bay)
                const res = await fetch('/api/dispatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tier: tier,
                        pickup: { lat: 25.2859, lon: 51.4965 },
                        drop: { lat: 25.3295, lon: 51.5298 }
                    })
                });
                const data = await res.json();
                if (data && !data.error) {
                    setPlan(data);
                    setEta(data.eta_minutes);
                    setTotal(34 + (data.fee_qr || 0));
                    console.log("Dispatch Plan:", data);
                }
            } catch (err) {
                console.error("Failed to fetch dispatch plan:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDispatch();
    }, [tier]);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(e => e + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Hide add-on strip logic
        const limit = normalizedMode === 'fast' ? 90 : normalizedMode === 'normal' ? 120 : 240;
        if (elapsed > limit) setShowAddOn(false);

        // Update Status
        if (elapsed < 5) setStatus('Confirmed');
        else if (elapsed < 10) setStatus('Preparing');
        else if (elapsed < 15) setStatus('Picked up');
        else if (elapsed < 60) setStatus('On the way');
        else setStatus('Delivered');
    }, [elapsed, normalizedMode]);

    const handleAddProduct = (item: string, price: number, timeAdded: number) => {
        setTotal(t => t + price);
        setEta(e => e + timeAdded);
        setToast(`Add-on accepted • ETA updated +${timeAdded} min`);
        setTimeout(() => setToast(null), 3000);
    };

    const getDecisionLabel = () => {
        if (!plan) return "Dispatching...";
        if (plan.decision === 'SOLO') return `Pulse: SOLO (${plan.tier})`;
        if (plan.decision === 'BUNDLE') return `Pulse: BUNDLE (${plan.tier})`;
        if (plan.decision === 'HUB') return `Pulse: HUB RELAY (${plan.tier})`;
        return "Pulse: Dispatching...";
    };

    return (
        <div className="h-screen flex flex-col bg-[#F8F8F8] relative overflow-hidden">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <Link href="/" className="bg-white p-2 rounded-full shadow-md pointer-events-auto">
                    <ArrowLeft size={20} className="text-[#111]" />
                </Link>
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md text-center pointer-events-auto">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Deliver Now</div>
                    <div className="text-xl font-extrabold text-[#111]">
                        {loading ? "..." : `${eta} min`}
                    </div>
                </div>
                <div className="w-10"></div>{/* Spacer */}
            </div>

            {/* Pulse Decision Chip */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-max max-w-[90%]">
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm border border-white/20 flex flex-col items-center",
                    normalizedMode === 'fast' ? "bg-amber-500" : normalizedMode === 'normal' ? "bg-blue-500" : "bg-green-600"
                )}>
                    <span>{getDecisionLabel()}</span>
                    {plan?.explanation && plan.explanation.length > 0 && (
                        <span className="text-[8px] font-normal opacity-90 mt-0.5 max-w-[200px] truncate">
                            {plan.decision === 'BUNDLE'
                                ? `Bundled w/ ${plan.bundled_order_ids.join(', ')}`
                                : plan.explanation[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0">
                <MapComponent mode={normalizedMode} />
            </div>

            {/* Bottom Sheet */}
            <div className="bg-white rounded-t-[25px] shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30 relative -mt-6 pt-2 pb-8 px-4 flex flex-col">
                {/* Handle */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

                {/* Status Bar */}
                <div className="flex justify-between items-center mb-6 px-1">
                    {['Confirmed', 'Preparing', 'Picked up', 'On the way'].map((s, i) => {
                        const step = ['Confirmed', 'Preparing', 'Picked up', 'On the way', 'Delivered'].indexOf(status);
                        const current = ['Confirmed', 'Preparing', 'Picked up', 'On the way'].indexOf(s);
                        return (
                            <div key={s} className="flex flex-col items-center gap-1 w-1/4">
                                <div className={cn("w-full h-1 rounded-full transition-all duration-500", step >= current ? "bg-snoonu-red" : "bg-gray-200")}></div>
                                <span className={cn("text-[9px] font-bold transition-colors", step >= current ? "text-[#111]" : "text-gray-300")}>{s}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Courier */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Navigation size={20} className="text-[#111]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#111] text-sm">
                                {plan ? `Rider ${plan.courier_id.split('-').pop()}` : "Assigning..."}
                            </h3>
                            <p className="text-xs text-snoonu-red font-medium">Pulse Courier</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#111]"><Phone size={18} /></button>
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#111]"><MessageSquare size={18} /></button>
                    </div>
                </div>

                {/* Add More Strip */}
                {showAddOn && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-[#111] text-sm">Something else?</h3>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                {normalizedMode === 'fast' ? 'Ending soon' : 'Add-on available'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                            {/* Card 1: Cupcakes */}
                            <div className="min-w-[200px] bg-white border border-gray-100 rounded-card p-2 flex items-center gap-2 shadow-sm">
                                <img src="/assets/bulldog-cupcakes.png" className="w-10 h-10 rounded-lg bg-gray-50 object-cover" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-[#111] line-clamp-1">Bulldog cupcakes</div>
                                    <div className="text-[10px] text-gray-500">34 QAR</div>
                                </div>
                                <button
                                    onClick={() => handleAddProduct('Cupcakes', 34, normalizedMode === 'fast' ? 2 : normalizedMode === 'normal' ? 3 : 4)}
                                    className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-[#111]"
                                >
                                    <ShoppingBag size={14} />
                                </button>
                            </div>

                            {/* Card 2: Stickers */}
                            <div className={cn("min-w-[200px] bg-white border border-gray-100 rounded-card p-2 flex items-center gap-2 shadow-sm", normalizedMode === 'fast' ? "opacity-50 grayscale" : "")}>
                                <img src="/assets/gumart-stickers.png" className="w-10 h-10 rounded-lg bg-gray-50 object-cover" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-[#111] line-clamp-1">GUmart stickers</div>
                                    <div className="text-[10px] text-gray-500">20 QAR</div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (normalizedMode === 'fast') return;
                                        handleAddProduct('Stickers', 20, normalizedMode === 'normal' ? 3 : 4);
                                    }}
                                    disabled={normalizedMode === 'fast'}
                                    className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-[#111] disabled:cursor-not-allowed"
                                >
                                    <ShoppingBag size={14} />
                                </button>
                            </div>
                        </div>
                        {normalizedMode === 'fast' && <p className="text-[10px] text-gray-400 mt-1">Fast: In-route add-ons from other merchants disabled.</p>}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-[#111] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </div>
    )
}
