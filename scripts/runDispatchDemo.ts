/**
 * Pulse Dispatch Demo Runner
 * 
 * Loads FULL CSV data from the exact paths and runs dispatch for all tiers.
 * Uses a built-in robust CSV parser (no external dependencies).
 */

import * as fs from 'fs';
import { pulseDispatch, normalizeOrder, normalizeCourier, Order, Courier } from '../lib/pulseDispatch';

// =============================================================================
// EXACT FILE PATHS (as specified)
// =============================================================================
const ORDER_CSV = "C:\\Users\\Hassan Amin\\Downloads\\doha_test_orders_50.csv";
const COURIER_CSV = "C:\\Users\\Hassan Amin\\Downloads\\doha_couriers_50.csv";
const BASELINE_KPIS_CSV = "C:\\Users\\Hassan Amin\\Downloads\\baseline_kpis_B01_haversine_circuity_tomtom.csv";
const BASELINE_ASSIGNMENTS_CSV = "C:\\Users\\Hassan Amin\\Downloads\\baseline_assignments_B01_haversine_circuity_tomtom.csv";

// =============================================================================
// ROBUST CSV PARSER (handles quoted fields, CRLF, etc.)
// =============================================================================
function parseCSV(filePath: string): any[] {
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.warn(`Warning: Could not read ${filePath}`);
        return [];
    }

    // Normalize line endings
    const content = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        console.warn(`Warning: ${filePath} has fewer than 2 lines.`);
        return [];
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
            // Try to recover: if values.length is close, pad with empty strings
            while (values.length < headers.length) values.push('');
            if (values.length > headers.length) continue; // Skip malformed
        }

        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j].trim()] = values[j].trim();
        }
        data.push(row);
    }

    return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++;
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }

    result.push(current);
    return result;
}

// =============================================================================
// MAIN
// =============================================================================
async function run() {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("           PULSE DISPATCH DEMO RUNNER");
    console.log("═══════════════════════════════════════════════════════════════\n");

    // 1. Load CSVs
    console.log("Loading CSVs...\n");

    const rawOrders = parseCSV(ORDER_CSV);
    const rawCouriers = parseCSV(COURIER_CSV);
    const rawKpis = parseCSV(BASELINE_KPIS_CSV);
    const rawAssignments = parseCSV(BASELINE_ASSIGNMENTS_CSV);

    // Normalize
    const allOrders: Order[] = rawOrders.map(normalizeOrder);
    const couriers: Courier[] = rawCouriers.map(normalizeCourier);

    // Log counts
    console.log(`Loaded orders: ${allOrders.length}`);
    console.log(`Loaded couriers: ${couriers.length}`);
    console.log(`Loaded baseline_kpis: ${rawKpis.length} (optional)`);
    console.log(`Loaded baseline_assignments: ${rawAssignments.length} (optional)`);

    // Validate counts
    if (allOrders.length < 40) {
        throw new Error(`CSV parse error: only loaded ${allOrders.length} orders — check delimiter/headers/CRLF.`);
    }
    if (couriers.length < 40) {
        throw new Error(`CSV parse error: only loaded ${couriers.length} couriers — check delimiter/headers/CRLF.`);
    }

    console.log("\n✓ All CSVs loaded successfully.\n");

    // 2. Create multiple test orders to demonstrate bundling
    // IMPORTANT: For bundling to trigger, we need:
    // 1. Orders with LONGER distances (so bundle efficiency matters)
    // 2. Bundle partner orders with pickups within 2-3 km radius
    // 3. Similar drop-off directions (to minimize detour)

    // Test Order 1: Al Sadd → West Bay (longer route, ~5 km)
    // Near DOH-0001 area, partners: DOH-0002, DOH-0003, DOH-0004 etc.
    const testOrder1: Order = {
        order_id: "DEMO_ORDER_1",
        pickup_lat: 25.2859,  // Al Sadd Grill area (same as DOH-0001)
        pickup_lon: 51.4965,
        drop_lat: 25.3295,    // West Bay area (longer trip)
        drop_lon: 51.5298,
        created_ts: Date.now(),
        assigned: false,
    };

    // Test Order 2: Msheireb → The Pearl (very long route, ~9 km)
    // Near DOH-0022/0023 area, partners in Msheireb cluster
    const testOrder2: Order = {
        order_id: "DEMO_ORDER_2",
        pickup_lat: 25.2853,  // Msheireb Street Eats (exact DOH-0022 location)
        pickup_lon: 51.5338,
        drop_lat: 25.3664,    // The Pearl area (very long trip)
        drop_lon: 51.5488,
        created_ts: Date.now(),
        assigned: false,
    };

    // Test Order 3: West Bay → Lusail (long route, ~10 km)
    // Near DOH-0008 area, partners in West Bay cluster
    const testOrder3: Order = {
        order_id: "DEMO_ORDER_3",
        pickup_lat: 25.3295,  // West Bay Burger (exact DOH-0008 location)
        pickup_lon: 51.5298,
        drop_lat: 25.4202,    // Lusail Marina area
        drop_lon: 51.5287,
        created_ts: Date.now(),
        assigned: false,
    };

    const testOrders = [
        { order: testOrder1, label: "Al Sadd → West Bay (~5 km)" },
        { order: testOrder2, label: "Msheireb → The Pearl (~9 km)" },
        { order: testOrder3, label: "West Bay → Lusail (~10 km)" },
    ];

    // 3. Run dispatch for each test order across all tiers
    const tiers = ["FAST", "NORMAL", "ECO"] as const;

    for (const { order: testOrder, label } of testOrders) {
        console.log("\n═══════════════════════════════════════════════════════════════");
        console.log(`  TEST ORDER: ${label}`);
        console.log(`  Pickup: (${testOrder.pickup_lat.toFixed(4)}, ${testOrder.pickup_lon.toFixed(4)})`);
        console.log(`  Drop:   (${testOrder.drop_lat.toFixed(4)}, ${testOrder.drop_lon.toFixed(4)})`);
        console.log("═══════════════════════════════════════════════════════════════");

        for (const tier of tiers) {
            console.log(`\n  ─── TIER: ${tier} ───`);

            const plan = pulseDispatch({
                tier,
                new_order: testOrder,
                all_orders: allOrders,
                couriers: couriers,
                baseline_kpis: rawKpis,
                baseline_assignments: rawAssignments,
            });

            console.log(`  Decision:   ${plan.decision}`);
            console.log(`  Courier:    ${plan.courier_id}`);
            console.log(`  ETA:        ${plan.eta_minutes} min`);
            console.log(`  Fee:        ${plan.fee_qr} QAR`);

            if (plan.decision === "BUNDLE") {
                console.log(`  Bundled:    [${plan.bundled_order_ids.join(", ")}]`);
            }
            if (plan.decision === "HUB") {
                console.log(`  Hub:        ${plan.hub_id}`);
            }

            console.log(`  Route:      ${plan.route_steps.join(" → ")}`);
            console.log(`  Metrics:    detour=${plan.metrics.detour_minutes}min, risk=${plan.metrics.late_risk_score.toFixed(2)}, dist=${plan.metrics.total_distance_km}km`);

            // Show first explanation line
            if (plan.explanation.length > 0) {
                console.log(`  Note:       ${plan.explanation[0]}`);
            }
        }
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  DEMO COMPLETE");
    console.log("═══════════════════════════════════════════════════════════════");
}

run().catch((err) => {
    console.error("\n❌ ERROR:", err.message || err);
    process.exit(1);
});
