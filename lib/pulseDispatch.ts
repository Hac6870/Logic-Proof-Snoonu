/**
 * Pulse Dispatch Engine v2
 * 
 * Handles FAST/NORMAL/ECO tier dispatch with proper differentiation:
 * - FAST: Solo only, strict SLA protection
 * - NORMAL: Solo + Bundle(2) attempt
 * - ECO: Solo + Bundle(2) + Hub relay attempt
 */

// =============================================================================
// TYPES
// =============================================================================

export type Order = {
    order_id: string;
    pickup_lat: number;
    pickup_lon: number;
    drop_lat: number;
    drop_lon: number;
    created_ts?: number;
    promised_eta_min?: number;
    assigned?: boolean;
};

export type Courier = {
    courier_id: string;
    lat: number;
    lon: number;
    status: "available" | "busy" | "offline" | "free_soon";
    capacity: number;
    current_orders: number;
};

export type DispatchPlan = {
    tier: "FAST" | "NORMAL" | "ECO";
    decision: "SOLO" | "BUNDLE" | "HUB";
    courier_id: string;
    bundled_order_ids: string[];
    hub_id?: string;
    eta_minutes: number;
    fee_qr: number;
    explanation: string[];
    route_steps: string[];
    metrics: {
        detour_minutes: number;
        late_risk_score: number;
        total_distance_km: number;
    };
};

export type DispatchInput = {
    tier: "FAST" | "NORMAL" | "ECO";
    new_order: Order;
    all_orders: Order[];
    couriers: Courier[];
    baseline_kpis?: any[];
    baseline_assignments?: any[];
    now_ts?: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

// Tier definitions
const TIER_CONFIG = {
    FAST: { target: 35, fee: 10, clampMin: 25, clampMax: 50 },
    NORMAL: { target: 45, fee: 5, clampMin: 30, clampMax: 60 },
    ECO: { target: 60, fee: 0, clampMin: 35, clampMax: 80 },
};

// Service times (minutes)
const PREP_MINUTES = 10;       // Merchant prep time
const PICKUP_SERVICE = 2;      // Time at pickup location
const DROP_SERVICE = 2;        // Time at drop location
const HUB_HANDLING_PENALTY = 5;
const ECO_HOLD_MINUTES = 2;    // Eco matching window

// Travel parameters
const SPEED_KMH = 28;
const CIRCUITY_FACTOR = 1.25;

// Feasibility caps (relaxed for demo visibility)
const BUNDLE_CAPS = {
    NORMAL: { maxDetour: 10, maxRisk: 0.40 },
    ECO: { maxDetour: 15, maxRisk: 0.60 },
};

// Hub coordinates (approximate Doha locations)
const HUBS = [
    { id: "EDUCATION_CITY", name: "Education City", lat: 25.314, lon: 51.440 },
    { id: "WEST_BAY", name: "West Bay", lat: 25.320, lon: 51.520 },
    { id: "MSHEIREB", name: "Msheireb", lat: 25.286, lon: 51.528 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Haversine distance in kilometers
 */
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Travel time in minutes (haversine + circuity)
 */
function travelMin(distKm: number): number {
    return (distKm * CIRCUITY_FACTOR / SPEED_KMH) * 60;
}

/**
 * Late risk score: 0.1 if on time, up to 1.0 if very late
 */
function lateRisk(eta: number, promised: number): number {
    const slack = promised - eta;
    if (slack >= 0) return 0.10;
    return Math.min(1, Math.abs(slack) / 15);
}

/**
 * Clamp ETA to tier-specific realistic range
 */
function clampEta(eta: number, tier: "FAST" | "NORMAL" | "ECO"): number {
    const cfg = TIER_CONFIG[tier];
    return Math.max(cfg.clampMin, Math.min(cfg.clampMax, eta));
}

// =============================================================================
// NORMALIZE HELPERS (Defensive CSV mapping)
// =============================================================================

export function normalizeOrder(row: any): Order {
    // Map possible column variants
    const getId = () => row.order_id || row.id || row.Order_ID || `ord_${Math.random().toString(36).substr(2, 5)}`;
    const getFloat = (keys: string[], def: number) => {
        for (const k of keys) if (row[k] !== undefined && row[k] !== "") return parseFloat(row[k]);
        return def;
    };
    const getBool = (keys: string[]) => {
        for (const k of keys) {
            if (row[k] === true || row[k] === "true" || row[k] === "1") return true;
        }
        return false;
    };

    return {
        order_id: getId(),
        pickup_lat: getFloat(["pickup_lat", "pickup_latitude", "pickupLat"], 0),
        pickup_lon: getFloat(["pickup_lon", "pickup_lng", "pickup_longitude", "pickupLon"], 0),
        drop_lat: getFloat(["drop_lat", "drop_latitude", "dropoff_lat", "dropLat"], 0),
        drop_lon: getFloat(["drop_lon", "dropoff_lng", "drop_lng", "dropoff_lon", "drop_longitude", "dropLon"], 0),
        created_ts: getFloat(["created_ts", "created_at", "timestamp"], undefined as any),
        promised_eta_min: getFloat(["promised_eta_min", "promised_eta", "sla_minutes"], undefined as any),
        assigned: getBool(["assigned", "is_assigned"]),
    };
}

export function normalizeCourier(row: any): Courier {
    const getId = () => row.courier_id || row.id || row.Courier_ID || `cour_${Math.random().toString(36).substr(2, 5)}`;
    const getFloat = (keys: string[], def: number) => {
        for (const k of keys) if (row[k] !== undefined && row[k] !== "") return parseFloat(row[k]);
        return def;
    };
    const getStatus = (): Courier["status"] => {
        const s = (row.status || row.courier_status || "available").toLowerCase();
        if (s === "offline") return "offline";
        if (s === "busy") return "busy";
        if (s === "free_soon") return "free_soon";
        return "available";
    };

    return {
        courier_id: getId(),
        lat: getFloat(["lat", "courier_lat", "latitude"], 0),
        lon: getFloat(["lon", "lng", "courier_lng", "longitude"], 0),
        status: getStatus(),
        capacity: getFloat(["capacity", "bundle_capacity", "max_orders"], 1),
        current_orders: getFloat(["current_orders", "active_orders"], 0),
    };
}

// =============================================================================
// MAIN DISPATCH FUNCTION
// =============================================================================

export function pulseDispatch({
    tier,
    new_order,
    all_orders,
    couriers,
}: DispatchInput): DispatchPlan {
    const cfg = TIER_CONFIG[tier];
    const promised = new_order.promised_eta_min ?? cfg.target;

    // -------------------------------------------------------------------------
    // A) Courier Shortlist
    // -------------------------------------------------------------------------
    let validCouriers = couriers.filter(
        (c) => c.status !== "offline" && c.current_orders + 1 <= c.capacity
    );

    const pickupPos = { lat: new_order.pickup_lat, lon: new_order.pickup_lon };

    validCouriers.sort((a, b) => haversine(a, pickupPos) - haversine(b, pickupPos));

    let shortlist = validCouriers.slice(0, 10);

    // Fallback: expand to busy couriers
    if (shortlist.length === 0) {
        const fallbackList = couriers
            .filter((c) => c.status !== "offline")
            .sort((a, b) => haversine(a, pickupPos) - haversine(b, pickupPos))
            .slice(0, 20);

        if (fallbackList.length === 0) {
            return {
                tier,
                decision: "SOLO",
                courier_id: "NONE",
                bundled_order_ids: [],
                eta_minutes: cfg.target + 10,
                fee_qr: cfg.fee,
                explanation: ["No couriers available → manual/queue fallback."],
                route_steps: [],
                metrics: { detour_minutes: 0, late_risk_score: 1, total_distance_km: 0 },
            };
        }
        shortlist = fallbackList;
    }

    const bestCourier = shortlist[0];
    const dropPos = { lat: new_order.drop_lat, lon: new_order.drop_lon };

    // -------------------------------------------------------------------------
    // B) Build Candidates
    // -------------------------------------------------------------------------
    type Candidate = { plan: DispatchPlan; score: number };
    const candidates: Candidate[] = [];

    // -------------------------------------------------------------------------
    // 1) SOLO Candidate (always)
    // -------------------------------------------------------------------------
    const soloLeg1Km = haversine(bestCourier, pickupPos);
    const soloLeg2Km = haversine(pickupPos, dropPos);
    const soloTotalKm = (soloLeg1Km + soloLeg2Km) * CIRCUITY_FACTOR;
    const soloRawEta =
        PREP_MINUTES +
        travelMin(soloLeg1Km) + PICKUP_SERVICE +
        travelMin(soloLeg2Km) + DROP_SERVICE;
    const soloEta = clampEta(Math.round(soloRawEta), tier);
    const soloRisk = lateRisk(soloEta, promised);

    // Scoring based on tier
    let soloScore: number;
    if (tier === "FAST") {
        soloScore = soloEta + 6 * soloRisk;
    } else if (tier === "NORMAL") {
        soloScore = soloEta + 4 * soloRisk;
    } else {
        // ECO: ecoScore
        soloScore = 0.7 * soloEta + 0.3 * (soloTotalKm * 2.0) + 4 * soloRisk;
    }

    const soloPlan: DispatchPlan = {
        tier,
        decision: "SOLO",
        courier_id: bestCourier.courier_id,
        bundled_order_ids: [],
        eta_minutes: soloEta,
        fee_qr: cfg.fee,
        explanation:
            tier === "FAST"
                ? [
                    `Fast selected → protect SLA (target ${cfg.target} min).`,
                    "Solo dispatch only (no bundling/hubs).",
                    `ETA ${soloEta} min • late risk ${soloRisk.toFixed(2)}.`,
                ]
                : tier === "NORMAL"
                    ? [
                        `Normal selected → bundling attempted (size 2).`,
                        "No eligible partner within caps → solo.",
                        `ETA ${soloEta} min • late risk ${soloRisk.toFixed(2)}.`,
                    ]
                    : [
                        `Eco selected → efficiency mode (target ${cfg.target} min).`,
                        "No eligible bundle/hub improvement → solo.",
                        `ETA ${soloEta} min • late risk ${soloRisk.toFixed(2)}.`,
                    ],
        route_steps: ["Courier → HoyaCafe", "Pickup → House"],
        metrics: {
            detour_minutes: 0,
            late_risk_score: soloRisk,
            total_distance_km: parseFloat(soloTotalKm.toFixed(2)),
        },
    };

    candidates.push({ plan: soloPlan, score: soloScore });

    // -------------------------------------------------------------------------
    // 2) BUNDLE Candidate (NORMAL + ECO only)
    // -------------------------------------------------------------------------
    if (tier === "NORMAL" || tier === "ECO") {
        const caps = BUNDLE_CAPS[tier];

        // Find potential partners
        const potentialPartners = all_orders
            .filter((o) => o.order_id !== new_order.order_id && !o.assigned)
            .map((o) => {
                const pickupDist = haversine(pickupPos, { lat: o.pickup_lat, lon: o.pickup_lon });
                const dropDist = haversine(dropPos, { lat: o.drop_lat, lon: o.drop_lon });
                return { order: o, partnerScore: pickupDist + 0.5 * dropDist };
            })
            .sort((a, b) => a.partnerScore - b.partnerScore)
            .slice(0, 15);

        let bestBundle: { partner: Order; eta: number; detour: number; risk: number; km: number; score: number } | null = null;

        for (const { order: partner } of potentialPartners) {
            const p1 = pickupPos;
            const p2 = { lat: partner.pickup_lat, lon: partner.pickup_lon };
            const d1 = dropPos;
            const d2 = { lat: partner.drop_lat, lon: partner.drop_lon };

            // Route: courier → p1 → p2 → d1 → d2
            const leg1 = haversine(bestCourier, p1);
            const leg2 = haversine(p1, p2);
            const leg3 = haversine(p2, d1);
            const leg4 = haversine(d1, d2);
            const totalKm = (leg1 + leg2 + leg3 + leg4) * CIRCUITY_FACTOR;

            const rawEta =
                PREP_MINUTES +
                travelMin(leg1) + PICKUP_SERVICE +
                travelMin(leg2) + PICKUP_SERVICE +
                travelMin(leg3) + DROP_SERVICE +
                travelMin(leg4) + DROP_SERVICE +
                (tier === "ECO" ? ECO_HOLD_MINUTES : 0);

            const bundleEta = clampEta(Math.round(rawEta), tier);
            const detour = Math.max(0, bundleEta - soloEta);
            const risk = lateRisk(bundleEta, promised);

            // Check feasibility
            if (detour > caps.maxDetour || risk > caps.maxRisk) continue;

            // Scoring
            let score: number;
            if (tier === "NORMAL") {
                score = bundleEta + 4 * risk + detour + 2; // stop_penalty=2
            } else {
                score = 0.7 * bundleEta + 0.3 * (totalKm * 2.0) + 4 * risk;
            }

            if (!bestBundle || score < bestBundle.score) {
                bestBundle = { partner, eta: bundleEta, detour, risk, km: totalKm, score };
            }
        }

        if (bestBundle) {
            const bundlePlan: DispatchPlan = {
                tier,
                decision: "BUNDLE",
                courier_id: bestCourier.courier_id,
                bundled_order_ids: [bestBundle.partner.order_id],
                eta_minutes: bestBundle.eta,
                fee_qr: cfg.fee,
                explanation:
                    tier === "NORMAL"
                        ? [
                            `Normal selected → bundling allowed (size 2).`,
                            `Bundled with order ${bestBundle.partner.order_id} • detour +${Math.round(bestBundle.detour)} min.`,
                            `ETA ${bestBundle.eta} min • late risk ${bestBundle.risk.toFixed(2)}.`,
                        ]
                        : [
                            `Eco selected → efficiency mode (target ${cfg.target} min).`,
                            `Eco hold (+${ECO_HOLD_MINUTES} min) used to form bundle.`,
                            `Bundled with order ${bestBundle.partner.order_id}.`,
                            `ETA ${bestBundle.eta} min • late risk ${bestBundle.risk.toFixed(2)}.`,
                        ],
                route_steps: ["Courier → HoyaCafe", "Pickup 2nd order nearby", "Dropoffs (optimized order)"],
                metrics: {
                    detour_minutes: bestBundle.detour,
                    late_risk_score: bestBundle.risk,
                    total_distance_km: parseFloat(bestBundle.km.toFixed(2)),
                },
            };

            candidates.push({ plan: bundlePlan, score: bestBundle.score });
        }
    }

    // -------------------------------------------------------------------------
    // 3) HUB Candidate (ECO only)
    // -------------------------------------------------------------------------
    if (tier === "ECO") {
        let bestHubCandidate: { hub: typeof HUBS[0]; eta: number; detour: number; risk: number; km: number; score: number } | null = null;

        for (const hub of HUBS) {
            const hubPos = { lat: hub.lat, lon: hub.lon };
            const leg1 = haversine(bestCourier, pickupPos);
            const leg2 = haversine(pickupPos, hubPos);
            const leg3 = haversine(hubPos, dropPos);
            const totalKm = (leg1 + leg2 + leg3) * CIRCUITY_FACTOR;

            const rawEta =
                PREP_MINUTES +
                travelMin(leg1) + PICKUP_SERVICE +
                travelMin(leg2) +
                HUB_HANDLING_PENALTY +
                travelMin(leg3) + DROP_SERVICE;

            const hubEta = clampEta(Math.round(rawEta), tier);
            const detour = Math.max(0, hubEta - soloEta);
            const risk = lateRisk(hubEta, promised);

            // EcoScore
            const hubScore = 0.7 * hubEta + 0.3 * (totalKm * 2.0) + 4 * risk;

            // Must improve ecoScore by at least 1.0 vs solo
            if (hubScore <= soloScore - 1.0) {
                if (!bestHubCandidate || hubScore < bestHubCandidate.score) {
                    bestHubCandidate = { hub, eta: hubEta, detour, risk, km: totalKm, score: hubScore };
                }
            }
        }

        if (bestHubCandidate) {
            const hubPlan: DispatchPlan = {
                tier,
                decision: "HUB",
                courier_id: bestCourier.courier_id,
                bundled_order_ids: [],
                hub_id: bestHubCandidate.hub.id,
                eta_minutes: bestHubCandidate.eta,
                fee_qr: cfg.fee,
                explanation: [
                    `Eco selected → efficiency mode (target ${cfg.target} min).`,
                    `Hub relay chosen: ${bestHubCandidate.hub.name} improved distance-weighted ecoScore.`,
                    `ETA ${bestHubCandidate.eta} min • late risk ${bestHubCandidate.risk.toFixed(2)}.`,
                ],
                route_steps: ["Courier → HoyaCafe", `Relay via hub: ${bestHubCandidate.hub.name}`, "Hub → House"],
                metrics: {
                    detour_minutes: bestHubCandidate.detour,
                    late_risk_score: bestHubCandidate.risk,
                    total_distance_km: parseFloat(bestHubCandidate.km.toFixed(2)),
                },
            };

            candidates.push({ plan: hubPlan, score: bestHubCandidate.score });
        }
    }

    // -------------------------------------------------------------------------
    // C) Choose Winner 
    // For NORMAL/ECO, prefer BUNDLE/HUB over SOLO (that's the business value)
    // -------------------------------------------------------------------------
    // Apply preference: SOLO gets a penalty in NORMAL/ECO to prefer alternatives
    const adjustedCandidates = candidates.map(c => {
        let adjustedScore = c.score;
        if (tier === "NORMAL" && c.plan.decision === "SOLO" && candidates.some(x => x.plan.decision === "BUNDLE")) {
            // If bundle is feasible, penalize solo to prefer bundle
            adjustedScore += 5;
        }
        if (tier === "ECO" && c.plan.decision === "SOLO" && candidates.some(x => x.plan.decision !== "SOLO")) {
            // ECO strongly prefers bundle/hub
            adjustedScore += 8;
        }
        return { ...c, adjustedScore };
    });

    adjustedCandidates.sort((a, b) => {
        if (Math.abs(a.adjustedScore - b.adjustedScore) > 0.01) return a.adjustedScore - b.adjustedScore;
        if (a.plan.eta_minutes !== b.plan.eta_minutes) return a.plan.eta_minutes - b.plan.eta_minutes;
        return a.plan.metrics.total_distance_km - b.plan.metrics.total_distance_km;
    });

    return adjustedCandidates[0].plan;
}
