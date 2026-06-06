"use client";

import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
    position: [number, number];
    setPosition: (
        value: [number, number]
    ) => void;
}

function LocationMarker({
    position,
    setPosition,
}: Props) {

    useMapEvents({
        click(e) {
            setPosition([
                e.latlng.lat,
                e.latlng.lng,
            ]);
        },
    });

    return (
        <Marker position={position} />
    );
}

export default function AddressMap({
    position,
    setPosition,
}: Props) {

    return (
        <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom
            className="h-[300px] w-full rounded-2xl z-0"
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker
                position={position}
                setPosition={setPosition}
            />
        </MapContainer>
    );
}