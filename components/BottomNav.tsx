"use client";

import { Home, Grid, FileText, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function BottomNav() {
    const pathname = usePathname();

    const items = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: ShoppingBag, label: 'Food', href: '/food', active: true }, // Simulate 'Food' selected as per prompt
        { icon: Grid, label: 'Categories', href: '#' },
        { icon: FileText, label: 'Orders', href: '#' },
        { icon: User, label: 'Account', href: '#' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-[80px] pb-4 z-50 max-w-[390px] mx-auto text-[10px] font-medium text-gray-400">
            {items.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn("flex flex-col items-center gap-1 w-1/5", (pathname === '/' && item.label === 'Food') ? "text-snoonu-red" : "text-gray-400")}
                >
                    <item.icon
                        size={24}
                        fill={(pathname === '/' && item.label === 'Food') ? "currentColor" : "none"}
                        strokeWidth={(pathname === '/' && item.label === 'Food') ? 0 : 2}
                    />
                    <span>{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
