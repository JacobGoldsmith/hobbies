"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

type Hobby = {
  id: string;
  title: string;
  description: string;
  pricePerHour: number;
  hostId: string;
  createdAt?: Timestamp;
};

export default function BrowsePage() {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Here is where we will switch to server fetch once ready (e.g., RSC or route handlers)
        const q = query(
          collection(db, "hobbies"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        if (!active) return;
        const mapped = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: String(data.title ?? ""),
            description: String(data.description ?? ""),
            pricePerHour: Number(data.pricePerHour ?? 0),
            hostId: String(data.hostId ?? ""),
            createdAt: data.createdAt as Timestamp | undefined,
          } satisfies Hobby;
        });
        setHobbies(mapped);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("Unable to load hobbies. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const heroCopy = useMemo(
    () => ({
      title: "Browse immersive hobbies",
      subtitle: "Curated sessions from makers, movers, and mentors. Minimal, premium, and built for focus.",
    }),
    []
  );

  return (
    <div className="min-h-screen bg-base-950 text-base-100">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-16">
        <motion.div {...fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-base-800/80 bg-base-900/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-base-400 shadow-glow">
          Browse marketplace
        </motion.div>
        <motion.h1 {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }} className="mt-4 text-4xl font-semibold leading-tight text-base-50 sm:text-5xl">
          {heroCopy.title}
        </motion.h1>
        <motion.p {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }} className="mt-3 max-w-3xl text-lg text-base-300">
          {heroCopy.subtitle}
        </motion.p>

        <section className="mt-10">
          {loading ? (
            <HobbySkeletonGrid />
          ) : error ? (
            <div className="card-border rounded-2xl bg-base-900/70 px-6 py-10 text-center text-base-300">
              {error}
            </div>
          ) : hobbies.length === 0 ? (
            <div className="card-border rounded-2xl bg-base-900/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-base-50">No active hobbies yet</p>
              <p className="mt-2 text-base-300">Hosts will appear here once they publish. Check back soon.</p>
            </div>
          ) : (
            <div className="grid auto-rows-[1fr] gap-6 md:grid-cols-12">
              {hobbies.map((hobby, idx) => (
                <Link key={hobby.id} href={`/hobbies/${hobby.id}`} className={cardSpanClass(idx)}>
                  <motion.div
                    {...fadeInUp}
                    transition={{ ...fadeInUp.transition, delay: Math.min(0.04 * idx, 0.3) }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    className="h-full"
                  >
                    <HobbyCard hobby={hobby} />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HobbyCard({ hobby }: { hobby: Hobby }) {
  return (
    <div className="card-border flex h-full flex-col overflow-hidden rounded-2xl bg-base-900/70 transition-colors hover:border-base-700">
      <div className="relative h-44 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-base-800 via-base-900 to-base-900" />
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(94,234,212,0.06),transparent_28%)]" />
        <div className="absolute bottom-3 left-3 rounded-full border border-base-800/80 bg-base-900/70 px-3 py-1 text-xs text-base-200 shadow-glow">Image incoming</div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-base-50">{hobby.title}</h3>
          <span className="rounded-full border border-base-800 bg-base-900 px-3 py-1 text-xs font-semibold text-base-100 shadow-glow transition duration-200">
            ${hobby.pricePerHour.toFixed(0)}/hr
          </span>
        </div>
        <p
          className="text-sm text-base-300"
          style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}
        >
          {hobby.description}
        </p>
        <div className="mt-auto flex items-center justify-between text-xs text-base-500">
          <span className="rounded-full border border-base-800 bg-base-900/70 px-2 py-1">Host: {hobby.hostId.slice(0, 6)}...</span>
          <span>Live now</span>
        </div>
      </div>
    </div>
  );
}

function HobbySkeletonGrid() {
  const placeholders = Array.from({ length: 6 });
  return (
    <div className="grid auto-rows-[1fr] gap-6 md:grid-cols-12">
      {placeholders.map((_, idx) => (
        <div key={idx} className={cardSpanClass(idx)}>
          <div className="card-border h-full rounded-2xl bg-base-900/70">
            <div className="h-44 w-full animate-pulse bg-base-900/80" />
            <div className="space-y-3 px-5 py-5">
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-base-800" />
              <div className="h-4 w-full animate-pulse rounded-full bg-base-800" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-base-800" />
              <div className="h-4 w-1/3 animate-pulse rounded-full bg-base-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function cardSpanClass(idx: number) {
  // Soft Bento-like staggering
  const base = "col-span-12";
  if (idx % 5 === 0) return `${base} md:col-span-7`;
  if (idx % 5 === 1) return `${base} md:col-span-5`;
  if (idx % 5 === 2) return `${base} md:col-span-6`;
  if (idx % 5 === 3) return `${base} md:col-span-6`;
  return `${base} md:col-span-4`;
}
