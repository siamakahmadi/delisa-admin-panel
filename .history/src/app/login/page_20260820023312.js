"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ShieldCheck, Phone, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { setSession } from "@/lib/auth";

const RESEND_SECONDS = 120;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("شماره نامعتبر است", "لطفاً یک شماره موبایل معتبر وارد کنید.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${baseUrl}/api/auth/send-otp`, { phone, role: "admin" });
      setStep("otp");
      setCountdown(RESEND_SECONDS);
      setOtp(["", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (err) {
      toast.error("ارسال کد ناموفق بود", err?.response?.data?.message || "لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 5) {
      toast.error("کد کامل نیست", "لطفاً هر ۵ رقم را وارد کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${baseUrl}/api/auth/verify-otp`, { phone, code });
      const { token, user } = res.data;
      if (!token) throw new Error("no-token");
      setSession(token, user);
      toast.success("خوش آمدید", "ورود با موفقیت انجام شد.");
      router.push(searchParams.get("next") || "/");
    } catch (err) {
      toast.error("کد نامعتبر است", err?.response?.data?.message || "لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const next = [...otp];
    next[index] = val[val.length - 1];
    setOtp(next);
    if (index < 4) inputsRef.current[index + 1]?.focus();
    if (index === 4 && next.every((d) => d !== "")) {
      setTimeout(() => verifyOtp(), 150);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] p-4">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[var(--brand-500)] opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[var(--accent-teal)] opacity-20 blur-[120px]" />

      <div className="animate-fade-in-up relative z-10 w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-lg)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-pink)] text-white shadow-[var(--shadow-md)]">
            <Sparkles size={26} />
          </div>
          <h1 className="text-lg font-bold text-[var(--text)]">پنل مدیریت دلیسا</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {step === "phone" ? "برای ورود شماره موبایل خود را وارد کنید" : `کد ارسال‌شده به ${phone} را وارد کنید`}
          </p>
        </div>

        {step === "phone" && (
          <div key="phone" className="animate-fade-in space-y-4">
            <div className="relative">
              <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <Input
                autoFocus
                dir="ltr"
                inputMode="numeric"
                maxLength={11}
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendOtp();
                  }
                }}
                className="pr-9 text-center tracking-widest"
              />
            </div>
            <Button type="button" className="w-full" loading={submitting} onClick={sendOtp}>
              دریافت کد ورود
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div key="otp" className="animate-fade-in space-y-4">
            <div className="flex justify-center gap-2" dir="ltr">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-12 w-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-center text-lg font-semibold outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                />
              ))}
            </div>

            <Button type="button" className="w-full" onClick={verifyOtp} loading={submitting}>
              <ShieldCheck size={16} />
              تأیید و ورود
            </Button>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <button type="button" onClick={() => setStep("phone")} className="hover:text-[var(--text)]">
                ویرایش شماره
              </button>
              {countdown > 0 ? (
                <span>
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} تا ارسال مجدد
                </span>
              ) : (
                <button type="button" onClick={sendOtp} className="font-medium text-[var(--brand-600)]">
                  ارسال مجدد کد
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
