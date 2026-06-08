"use client";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
    position: [number, number];
    setPosition: (
        value: [number, number]
    ) => void;
}

function ChangeMapView({
    position,
}: {
    position: [number, number];
}) {

    const map = useMap();

    useEffect(() => {
        map.setView(position, 16);
    }, [position, map]);

    return null;
}

export default function AddressMap({
    position,
    setPosition,
}: Props) {

    const [loadingLocation, setLoadingLocation] = useState(false);

    const getUserLocation = () => {
        if (!navigator.geolocation) {
            alert("Browser tidak mendukung geolocation.");
            return;
        }
        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (location) => {
                const lat = location.coords.latitude;
                const lng = location.coords.longitude;
                setPosition([lat, lng]);
                setLoadingLocation(false);
            },

            (error) => {
                console.error(error);
                alert("Gagal mendapatkan lokasi.");
                setLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
            }
        );
    };

    return (
        <div className="space-y-3">
            <Button
                type="button"
                onClick={getUserLocation}
                disabled={loadingLocation}
                variant="outline"
                className="rounded-xl"
            >
                <LocateFixed className="w-4 h-4 mr-2" />

                {loadingLocation ? "Mendeteksi Lokasi..." : "Dapatkan Lokasi Saya"}
            </Button>

            <div className="text-xs text-slate-500">
                Latitude:
                {" "}
                {position[0].toFixed(6)}

                <br />

                Longitude:
                {" "}
                {position[1].toFixed(6)}
            </div>

            <MapContainer
                center={position}
                zoom={15}
                scrollWheelZoom={false}
                className="h-[300px] w-full rounded-2xl z-0"
            >

                <ChangeMapView
                    position={position}
                />

                <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={position}>
                    <Popup>
                        Lokasi Anda
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}