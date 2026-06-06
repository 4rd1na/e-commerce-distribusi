"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix issue icon Leaflet hilang saat build di Next.js
import "leaflet/dist/leaflet.css";

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onChangeLocation: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChangeLocation }: MapPickerProps) {
    const center = useMemo(() => [lat || -7.54, lng || 112.23] as [number, number], [lat, lng]);

    // Komponen internal untuk menangani klik di peta
    function MapEvents() {
        useMapEvents({
            click(e) {
                onChangeLocation(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    }

    return (
        <div className="w-full h-[250px] rounded-xl overflow-hidden border relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents />
                <Marker
                    position={center}
                    icon={icon}
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            const position = marker.getLatLng();
                            onChangeLocation(position.lat, position.lng);
                        },
                    }}
                />
            </MapContainer>
        </div>
    );
}