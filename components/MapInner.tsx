"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

const createEmojiIcon = (emoji: string, bg: string = 'white', size: number = 30) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${bg}; width: ${size}px; height: ${size}px; font-size: ${size - 10}px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border: 2px solid white;">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const ICONS = {
    rider: createEmojiIcon('🛵', '#D80010', 36),
    pickup: createEmojiIcon('☕', '#111', 30),
    dropoff: createEmojiIcon('🏠', '#111', 30),
    hub: createEmojiIcon('🏢', '#888', 24),
};

const POINTS = {
    pickup: [25.319, 51.528] as [number, number], // HoyaCafe
    dropoff: [25.2854, 51.5310] as [number, number], // House (Msheireb)
    hubs: [
        { name: 'Education City', pos: [25.314, 51.444] as [number, number] },
        { name: 'West Bay', pos: [25.328, 51.530] as [number, number] },
        { name: 'Msheireb', pos: [25.286, 51.526] as [number, number] },
    ]
};

// Distance helper
function getDistance(p1: [number, number], p2: [number, number]) {
    const R = 6371e3; // metres
    const φ1 = p1[0] * Math.PI / 180;
    const φ2 = p2[0] * Math.PI / 180;
    const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
    const Δλ = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function RiderMarker({ route, speed = 0.005 }: { route: [number, number][], speed?: number }) {
    const [position, setPosition] = useState(route[0]);
    const [progress, setProgress] = useState(0);

    // Simple linear interpolation along the route segments
    // For demo: single segment or two segments.
    const flatRoute = useMemo(() => {
        // Flatten points if we were doing real routing, but here we just have Waypoints.
        // We will interpolate segment by segment.
        return route;
    }, [route]);

    useEffect(() => {
        let animationFrameId: number;
        // Total distance approximation to normalize speed? Keep it simple.
        // Just t from 0 to 1 over X seconds.
        // 30 seconds for full trip simulation
        const DURATION = 30000;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const t = Math.min((now - startTime) / DURATION, 1);

            // Find current segment
            // length of route - 1 segments.
            // If route has 2 points: index 0. t is 0..1
            // If route has 3 points: index 0 (0..0.5), index 1 (0.5..1)

            const numSegments = flatRoute.length - 1;
            const totalT = t * numSegments; // e.g. 1.5
            const currentSegmentIndex = Math.min(Math.floor(totalT), numSegments - 1);
            const segmentT = totalT - currentSegmentIndex; // 0..1 within segment

            const p1 = flatRoute[currentSegmentIndex];
            const p2 = flatRoute[currentSegmentIndex + 1];

            if (p1 && p2) {
                const lat = p1[0] + (p2[0] - p1[0]) * segmentT;
                const lng = p1[1] + (p2[1] - p1[1]) * segmentT;
                setPosition([lat, lng]);
            }

            if (t < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [flatRoute]);

    return <Marker position={position} icon={ICONS.rider} />;
}

// Adjust map view to fit bounds
function MapAdjuster({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [bounds, map]);
    return null;
}

export default function MapInner({ mode }: { mode: string }) {
    const route = useMemo(() => {
        if (mode === 'eco') {
            // Find closest hub to midpoint
            const midLat = (POINTS.pickup[0] + POINTS.dropoff[0]) / 2;
            const midLng = (POINTS.pickup[1] + POINTS.dropoff[1]) / 2;
            const midPoint: [number, number] = [midLat, midLng];

            let closestHub = POINTS.hubs[0];
            let minDist = Infinity;

            POINTS.hubs.forEach(hub => {
                const d = getDistance(midPoint, hub.pos);
                if (d < minDist) {
                    minDist = d;
                    closestHub = hub;
                }
            });

            return [POINTS.pickup, closestHub.pos, POINTS.dropoff];
        } else {
            return [POINTS.pickup, POINTS.dropoff];
        }
    }, [mode]);

    const bounds = L.latLngBounds([POINTS.pickup, POINTS.dropoff, ...POINTS.hubs.map(h => h.pos)]);

    return (
        <MapContainer
            center={[25.2854, 51.5310]}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Markers */}
            <Marker position={POINTS.pickup} icon={ICONS.pickup} />
            <Marker position={POINTS.dropoff} icon={ICONS.dropoff} />

            {POINTS.hubs.map(hub => (
                <Marker key={hub.name} position={hub.pos} icon={ICONS.hub} opacity={0.6} />
            ))}

            {/* Polyline */}
            <Polyline positions={route as [number, number][]} color="#D80010" weight={4} opacity={0.8} dashArray="10, 10" />

            {/* Rider */}
            <RiderMarker route={route as [number, number][]} />

            <MapAdjuster bounds={bounds} />
        </MapContainer>
    );
}
