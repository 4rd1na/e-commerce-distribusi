"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfileForm({
    form,
    setForm,
    onSave,
    loading,
}: any) {
    return (
        <div className="bg-white border rounded-2xl p-5 space-y-4">

            <div>
                <label className="text-sm font-medium">
                    Nama Lengkap
                </label>

                <Input
                    value={form.full_name}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            full_name: e.target.value,
                        })
                    }
                />
            </div>

            <div>
                <label className="text-sm font-medium">
                    Nomor HP
                </label>

                <Input
                    value={form.phone_number}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            phone_number: e.target.value,
                        })
                    }
                />
            </div>

            <div>
                <label className="text-sm font-medium">
                    Email
                </label>

                <Input value={form.email} disabled />
            </div>

            <Button
                onClick={onSave}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
            >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
        </div>
    );
}