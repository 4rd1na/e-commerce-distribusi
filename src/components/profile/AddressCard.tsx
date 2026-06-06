"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Pencil,
    Trash2,
    MapPin,
    Phone,
    Check,
} from "lucide-react";

export default function AddressCard({
    address,
    onEdit,
    onDelete,
    onSetDefault,
}: any) {
    return (
        <div className="border rounded-2xl p-4 bg-white shadow-sm">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">

                <div>
                    <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-semibold text-slate-800">
                            {address.recipient_name}
                        </h3>

                        {address.is_default && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                Utama
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <Phone className="w-4 h-4" />
                        {address.phone}
                    </div>
                </div>

                {!address.is_default && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSetDefault}
                        className="rounded-xl"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Jadikan Utama
                    </Button>
                )}
            </div>

            {/* ADDRESS */}
            <div className="mt-4 flex gap-2">

                <MapPin className="w-4 h-4 text-slate-400 mt-1" />

                <div className="text-sm text-slate-600 leading-relaxed">
                    <p>{address.address_detail}</p>

                    <p className="mt-1 text-slate-500">
                        {address.village}, {address.district},{" "}
                        {address.city}, {address.province}
                    </p>
                </div>
            </div>

            {/* ACTION */}
            <div className="flex items-center gap-2 mt-4">

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="rounded-xl"
                >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                </Button>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="rounded-xl"
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hapus
                </Button>
            </div>
        </div>
    );
}