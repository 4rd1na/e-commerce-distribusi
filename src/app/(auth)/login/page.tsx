"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registeredEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState(registeredEmail);
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [countdown, setCountdown] = useState(0);
    const otpInputRef = useRef<HTMLInputElement>(null);
    const isVerifiedRef = useRef(false);

    // Countdown resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Autofocus OTP input
    useEffect(() => {
        if (step === 'otp' && otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, [step]);

    // VERIFY OTP
    const handleVerifyOtp = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isVerifiedRef.current) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data: { user }, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });

            if (error) throw error;
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("role, internal_role")
                .eq("id", user.id)
                .single();

            setMessage({ type: "success", text: "Login berhasil! Mengalihkan..." });
            isVerifiedRef.current = true;

            setTimeout(() => {
                router.refresh();
                if (profile?.role === "internal") {
                    if (profile.internal_role === "admin") router.replace("/admin");
                    else if (profile.internal_role === "support") router.replace("/support");
                    else if (profile.internal_role === "billing") router.replace("/billing");
                    else router.replace("/");
                } else {
                    router.replace("/");
                }
            }, 1000);
        } catch (error: any) {
            if (isVerifiedRef.current) return;
            setMessage({ type: "error", text: error.message || "Kode OTP tidak valid. Silakan coba lagi." });
            setOtp("");
        } finally {
            if (!isVerifiedRef.current) setLoading(false);
        }
    }, [email, otp, router]);

    // Auto verify when OTP is 8 digits
    useEffect(() => {
        if (otp.length === 8 && step === 'otp' && !loading && !isVerifiedRef.current) {
            handleVerifyOtp();
        }
    }, [otp, step, loading, handleVerifyOtp]);

    // Kirim OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage({ type: "error", text: "Email wajib diisi" });
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setMessage({ type: "error", text: "Format email tidak valid" });
            return;
        }

        setLoading(true);
        setMessage(null);
        isVerifiedRef.current = false;

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            });

            if (error) throw error;

            setStep('otp');
            setCountdown(60);

        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "Gagal mengirim OTP. Pastikan email sudah terdaftar.",
            });
        } finally {
            setLoading(false);
        }
    };

    // RESEND OTP
    const handleResendOtp = async () => {
        if (countdown > 0 || isVerifiedRef.current) return;
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            });
            if (error) throw error;

            setMessage({ type: "success", text: "Kode OTP baru berhasil dikirim" });
            setCountdown(60);
            setOtp("");
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Gagal mengirim ulang OTP" });
        } finally {
            setLoading(false);
        }
    };

    // Masked email for display
    const maskedEmail = (() => {
        if (!email) return "";
        const [local, domain] = email.split("@");
        if (!domain) return email;
        const visible = local.length <= 2 ? local : local[0] + "***" + local[local.length - 1];
        return `${visible}@${domain}`;
    })();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-7">
                    {/* Header */}
                    <div className="text-center mb-7">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                            step === 'email' ? "bg-emerald-50" : "bg-amber-50"
                        }`}>
                            {step === 'email' ? (
                                <LockKeyhole className="w-6 h-6 text-emerald-600" />
                            ) : (
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                            )}
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">
                            {step === 'email' ? "Masuk Akun" : "Verifikasi OTP"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 'email'
                                ? "Masukkan email untuk menerima kode OTP"
                                : "Masukkan 8 digit kode yang dikirim ke email"
                            }
                        </p>
                    </div>

                    {/* OTP Info Box */}
                    {step === 'otp' && (
                        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-2.5">
                                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-amber-800">
                                        Kode OTP telah dikirim ke
                                    </p>
                                    <p className="text-sm font-bold text-amber-900 truncate">
                                        {email}
                                    </p>
                                    <p className="text-[10px] text-amber-600 mt-1">
                                        Cek inbox atau folder spam jika tidak ditemukan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Email */}
                    {step === 'email' ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
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
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                            >
                                {loading ? "Mengirim..." : "Kirim Kode OTP"}
                            </Button>
                        </form>
                    ) : (
                        /* Step: OTP */
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Kode OTP</Label>
                                <Input
                                    ref={otpInputRef}
                                    type="text"
                                    maxLength={8}
                                    placeholder="••••••••"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    className="h-13 text-center text-xl font-black tracking-[0.4em] rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                            >
                                {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                            </Button>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setMessage(null);
                                    }}
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Ganti Email
                                </button>

                                <button
                                    type="button"
                                    disabled={countdown > 0 || loading}
                                    onClick={handleResendOtp}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition"
                                >
                                    {countdown > 0 ? `Kirim ulang (${countdown}s)` : "Kirim Ulang OTP"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Message */}
                    {message && (
                        <div className={`mt-4 text-center text-xs rounded-xl px-4 py-3 ${
                            message.type === "success"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Register link */}
                    {step === 'email' && (
                        <div className="mt-6 text-center text-sm text-slate-500">
                            Belum punya akun?{" "}
                            <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                                Daftar
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
