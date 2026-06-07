"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [countdown, setCountdown] = useState(0);
    const otpInputRef = useRef<HTMLInputElement>(null);

    // Sakelar pengaman untuk memblokir request ganda setelah sukses
    const isVerifiedRef = useRef(false);

    // Countdown resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
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

        // Jika sudah berhasil terverifikasi sebelumnya, abaikan pemicu kedua
        if (isVerifiedRef.current) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data: { user }, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otp,
                type: "email",
            });

            if (error) throw error;

            if (user) {

                await supabase.auth.refreshSession();

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                console.log("SESSION:", session);

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                setMessage({
                    type: "success",
                    text: "Login berhasil, mengalihkan...",
                });

                isVerifiedRef.current = true;

                // await supabase.auth.getSession();

                setTimeout(() => {

                    router.refresh();

                    router.replace(
                        profile?.role === "internal"
                            ? "/admin/products"
                            : "/"
                    );

                }, 1000);
            }
        } catch (error: any) {
            // Jika pemicu kedua masuk ke sini tapi status aslinya sudah sukses, amankan UI
            if (isVerifiedRef.current) return;

            setMessage({
                type: "error",
                text: error.message || "Kode OTP tidak valid. Silakan coba lagi.",
            });
            setOtp("");
        } finally {
            // Jika sudah sukses, biarkan tombol tetap dalam keadaan loading/disabled
            if (!isVerifiedRef.current) {
                setLoading(false);
            }
        }
    }, [email, otp, router]);

    // Auto verify ketika OTP lengkap (Panjang disesuaikan ke 8 sesuai state awal kamu)
    useEffect(() => {
        if (otp.length === 8 && step === 'otp' && !loading && !isVerifiedRef.current) {
            handleVerifyOtp();
        }
    }, [otp, step, loading, handleVerifyOtp]);

    // Kirim OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        isVerifiedRef.current = false; // Reset sakelar setiap meminta OTP baru

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                },
            });

            if (error) throw error;

            setMessage({
                type: "success",
                text: "Kode OTP berhasil dikirim ke email Anda",
            });
            setStep('otp');
            setCountdown(60);

        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "Gagal mengirim OTP. Silahkan mencoba lagi dan pastikan email sudah terdaftar.",
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
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: undefined,
                },
            });

            if (error) throw error;

            setMessage({
                type: "success",
                text: "Kode OTP baru berhasil dikirim",
            });
            setCountdown(60);
            setOtp("");
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "Gagal mengirim ulang OTP",
            });
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
                            <LockKeyhole className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">
                            {step === 'email' ? "Masuk Akun" : "Verifikasi OTP"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 'email' ? "Masukkan email akun Anda" : "Masukkan kode OTP dari email"}
                        </p>
                    </div>

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
                            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">
                                {loading ? "Mengirim..." : "Kirim OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Kode OTP</Label>
                                <Input
                                    ref={otpInputRef}
                                    type="text"
                                    maxLength={8}
                                    placeholder="--------"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    className="h-12 text-center text-xl font-black tracking-[0.4em] rounded-xl"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold">
                                {loading ? "Memverifikasi..." : "Login"}
                            </Button>
                            <Button type="button" variant="ghost" disabled={loading} onClick={() => { setStep("email"); setOtp(""); setMessage(null); }} className="w-full text-xs text-slate-500">
                                Ganti Email
                            </Button>
                            <Button type="button" variant="ghost" disabled={countdown > 0 || loading} onClick={handleResendOtp} className="w-full text-xs text-emerald-600">
                                {countdown > 0 ? `Kirim ulang OTP (${countdown}s)` : "Kirim Ulang OTP"}
                            </Button>
                        </form>
                    )}

                    {message && (
                        <div className={`mt-4 text-center text-xs rounded-xl px-4 py-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {message.text}
                        </div>
                    )}

                    {step === 'email' && (
                        <div className="mt-6 text-center text-sm text-slate-500">
                            Belum punya akun?{" "}
                            <Link href="/auth/register" className="text-emerald-600 font-bold hover:underline">
                                Daftar
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}