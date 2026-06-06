"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setMessageType("error");
            setMessage("Format Email Tidak Valid!");
            return;
        }

        try {
            const dummyPassword = Math.random().toString(36).slice(-10) + "A1!";

            const { data, error } = await supabase.auth.signUp({
                email,
                password: dummyPassword,
                options: {
                    data: {
                        full_name: fullName,
                        phone_number: phoneNumber,
                    },
                },
            });

            if (error) throw error;

            setMessageType("success");
            setMessage("Pendaftaran berhasil! Silahkan login...");

            setTimeout(() => {
                router.push("/auth/login");
            }, 1000);

        } catch (error: any) {
            setMessageType("error");
            setMessage(error.message || "Gagal mendaftar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-7">
                    <div className="text-center mb-7">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">Daftar Akun</h1>
                        <p className="text-sm text-slate-500 mt-1">Buat akun untuk mulai berbelanja</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Nama lengkap"
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <Input
                                    type="email"
                                    placeholder="nama@email.com"
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Nomor WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <Input
                                    type="tel"
                                    placeholder="08123456789"
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setPhoneNumber(value);
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                        >
                            Register
                        </Button>
                    </form>

                    {message && (
                        <div className={`mt-4 text-center text-xs rounded-xl px-4 py-3 ${messageType === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Sudah punya akun?{" "}
                        <Link href="/auth/login" className="text-emerald-600 font-bold hover:underline">
                            Masuk
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}