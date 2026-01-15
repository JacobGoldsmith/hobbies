"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  collection,
  addDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { type User } from "firebase/auth";
import { auth, db, onAuthChange, signInWithGoogle, signOut, serverTime } from "@/lib/firebase";
import { clsx } from "clsx";

type HobbyForm = {
  title: string;
  description: string;
  pricePerHour: string;
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<HobbyForm>({ title: "", description: "", pricePerHour: "" });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error" | "loading"; message?: string }>({ type: "idle" });

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const userDisplay = useMemo(
    () => ({
      name: user?.displayName ?? "Guest",
      email: user?.email ?? "",
      photoURL: user?.photoURL ?? "",
    }),
    [user]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setStatus({ type: "error", message: "Please sign in to publish a hobby." });
      return;
    }

    const trimmedTitle = form.title.trim();
    const trimmedDescription = form.description.trim();
    const price = Number(form.pricePerHour);

    if (!trimmedTitle || !trimmedDescription || Number.isNaN(price) || price <= 0) {
      setStatus({ type: "error", message: "All fields are required and price must be greater than 0." });
      return;
    }

    try {
      setStatus({ type: "loading", message: "Publishing..." });

      await addDoc(collection(db, "hobbies"), {
        hostId: user.uid,
        title: trimmedTitle,
        description: trimmedDescription,
        pricePerHour: price,
        isActive: true,
        createdAt: serverTime(),
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          roles: { isGuest: false, isHost: true },
          lastLogin: serverTime(),
          createdAt: serverTime(),
        },
        { merge: true }
      );

      setStatus({ type: "success", message: "Hobby published." });
      setForm({ title: "", description: "", pricePerHour: "" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-base-950 text-base-100">
      <header className="sticky top-0 z-20 glass border-b border-base-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-base-200 to-base-500/60 shadow-glow" />
            <div className="text-sm uppercase tracking-[0.2em] text-base-400">Hobby Market</div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-base-800/80 bg-base-900/60 px-3 py-1">
                {userDisplay.photoURL ? (
                  <img src={userDisplay.photoURL} alt={userDisplay.name} className="h-8 w-8 rounded-full border border-base-800" />
                ) : (
                  <div className="h-8 w-8 rounded-full border border-base-800 bg-base-800" />
                )}
                <div className="leading-tight">
                  <p className="text-sm font-medium text-base-50">{userDisplay.name}</p>
                  <p className="text-xs text-base-400">{userDisplay.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-full border border-base-700 px-3 py-1 text-xs text-base-300 transition hover:border-base-500 hover:text-base-100"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-base-900 shadow-glow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-14">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <motion.div {...fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-base-800/80 bg-base-900/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-base-400 shadow-glow">
              Premium hobby marketplace
            </motion.div>
            <motion.h1 {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }} className="text-4xl font-semibold leading-tight text-base-50 sm:text-5xl">
              Host your craft. Find your next passion.
            </motion.h1>
            <motion.p {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }} className="max-w-2xl text-lg text-base-300">
              A curated platform where makers, movers, and mentors share immersive experiences. Built with the same polish as Linear and Vercel.
            </motion.p>
            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.12 }} className="flex flex-wrap gap-3">
              <button
                onClick={() => (user ? undefined : signInWithGoogle())}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition shadow-glow",
                  user ? "bg-base-800/80 text-base-100 border border-base-700" : "bg-white text-base-900 hover:-translate-y-0.5"
                )}
              >
                {user ? "You are signed in" : "Sign in with Google"}
              </button>
              <Link
                href="/browse"
                className="rounded-full border border-base-800 bg-base-900 px-5 py-3 text-sm font-semibold text-base-200 transition hover:border-base-500 hover:text-base-50"
              >
                Browse experiences
              </Link>
            </motion.div>
          </div>

          <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.16 }} className="card-border rounded-2xl bg-base-900/70 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-base-500">Host a hobby</p>
                <p className="text-lg font-semibold text-base-50">Publish your session</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-base-200 to-base-500/60" />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-base-300">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-base-800 bg-base-900 px-4 py-3 text-base-100 placeholder:text-base-500 focus:border-base-500 focus:outline-none"
                  placeholder="e.g., Analog film photography 101"
                  disabled={status.type === "loading"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-base-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[120px] w-full rounded-xl border border-base-800 bg-base-900 px-4 py-3 text-base-100 placeholder:text-base-500 focus:border-base-500 focus:outline-none"
                  placeholder="What can learners expect?"
                  disabled={status.type === "loading"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-base-300">Price per hour (USD)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.pricePerHour}
                  onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                  className="w-full rounded-xl border border-base-800 bg-base-900 px-4 py-3 text-base-100 placeholder:text-base-500 focus:border-base-500 focus:outline-none"
                  placeholder="60"
                  disabled={status.type === "loading"}
                />
              </div>
              {status.type === "error" && (
                <p className="text-sm text-red-400">{status.message}</p>
              )}
              {status.type === "success" && (
                <p className="text-sm text-emerald-300">{status.message}</p>
              )}
              <button
                type="submit"
                disabled={status.type === "loading"}
                className="flex w-full items-center justify-center rounded-xl bg-base-50 px-4 py-3 text-base-900 font-semibold shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {user ? (status.type === "loading" ? "Publishing..." : "Publish now") : "Sign in to publish"}
              </button>
            </form>
          </motion.div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.05 * idx }}
              className={clsx(
                "card-border relative overflow-hidden rounded-2xl bg-base-900/70 p-6",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/2 before:to-transparent before:opacity-50"
              )}
            >
              <div className="relative space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-base-800 text-base-200">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-base-50">{feature.title}</h3>
                <p className="text-sm text-base-300">{feature.copy}</p>
              </div>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}

const features = [
  {
    title: "Frameless onboarding",
    copy: "Google sign-in with automatic host profile creation and role upgrades.",
    icon: "⚡",
  },
  {
    title: "Curated listings",
    copy: "Structured hobby cards with host identity, pricing, and availability flags.",
    icon: "🎟️",
  },
  {
    title: "Host-grade reliability",
    copy: "Firestore-backed writes with server timestamps and merge-safe role updates.",
    icon: "🛡️",
  },
];
