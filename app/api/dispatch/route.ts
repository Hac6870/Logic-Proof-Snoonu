import { NextResponse } from 'next/server';
import path from 'path';
import { pulseDispatch, normalizeOrder, normalizeCourier, Order, Courier } from '@/lib/pulseDispatch';
import { parseCSV } from '@/lib/csvParser';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tier, pickup, drop } = body;

        // 1. Load CSV Data
        // Ideally cache this, but for demo reading on every request is fine and ensures freshness
        const dataDir = path.join(process.cwd(), 'data');
        const rawOrders = parseCSV(path.join(dataDir, 'orders.csv'));
        const rawCouriers = parseCSV(path.join(dataDir, 'couriers.csv'));
        const rawKpis = parseCSV(path.join(dataDir, 'kpis.csv'));
        const rawAssignments = parseCSV(path.join(dataDir, 'assignments.csv'));

        // Normalize
        const allOrders: Order[] = rawOrders.map(normalizeOrder);
        const couriers: Courier[] = rawCouriers.map(normalizeCourier);

        // 2. Create New Order
        // If pickup/drop provided in request, use them. Otherwise default (demo mode)
        const newOrder: Order = {
            order_id: `NEW_ORDER_${Date.now()}`,
            pickup_lat: pickup?.lat || 25.2859, // Al Sadd
            pickup_lon: pickup?.lon || 51.4965,
            drop_lat: drop?.lat || 25.3200,     // West Bay
            drop_lon: drop?.lon || 51.5250,
            created_ts: Date.now(),
            assigned: false,
        };

        // 3. Run Pulse Dispatch
        const plan = pulseDispatch({
            tier: tier || 'NORMAL',
            new_order: newOrder,
            all_orders: allOrders,
            couriers: couriers,
            baseline_kpis: rawKpis,
            baseline_assignments: rawAssignments,
        });

        // 4. Return Plan
        return NextResponse.json(plan);

    } catch (error: any) {
        console.error("Dispatch API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
