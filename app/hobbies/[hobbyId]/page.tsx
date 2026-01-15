"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: "easeOut" },
};

type Hobby = {
  id: string;
  title: string;
  description: string;
  pricePerHour: number;
  hostId: string;
  createdAt?: Timestamp;
  isActive: boolean;
};

type Host = {
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

type LoadState = "loading" | "ready" | "not-found" | "error";

export default function HobbyDetailPage() {
  const params = useParams<{ hobbyId: string }>();
  const hobbyId = params?.hobbyId;

  const [hobby, setHobby] = useState<Hobby | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!hobbyId) return;

    let active = true;
    const load = async () => {
      try {
        // Here is where we can switch to server fetch (e.g., route handler or RSC) when ready.
        const hobbySnap = await getDoc(doc(db, "hobbies", hobbyId));
        if (!active) return;
        if (!hobbySnap.exists()) {
          setState("not-found");
          return;
        }
        const data = hobbySnap.data();
        if (!data.isActive) {
          setState("not-found");
          return;
        }
        const mapped: Hobby = {
          id: hobbySnap.id,
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          pricePerHour: Number(data.pricePerHour ?? 0),
          hostId: String(data.hostId ?? ""),
          createdAt: data.createdAt as Timestamp | undefined,
          isActive: Boolean(data.isActive),
        };
        setHobby(mapped);
        setState("ready");

        if (mapped.hostId) {
          const hostSnap = await getDoc(doc(db, "users", mapped.hostId));
          if (!active) return;
          if (hostSnap.exists()) {
            const hostData = hostSnap.data();
            setHost({
              name: hostData.name,
              email: hostData.email,
              photoURL: hostData.photoURL,
            });
          }
        }
      } catch (error) {
        console.error(error);
        if (active) setState("error");
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [hobbyId]);

  const heroCopy = useMemo(
    () => ({
      kicker: "Hobby detail",
    }),
    []
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-base-950 text-base-100">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="h-72 w-full animate-pulse rounded-3xl bg-base-900/80" />
          <div className="mt-8 space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-base-900" />
            <div className="h-4 w-full animate-pulse rounded-full bg-base-900" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-base-900" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="min-h-screen bg-base-950 text-base-100">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-500">Hobby not found</p>
          <h1 className="mt-3 text-3xl font-semibold text-base-50">This listing is unavailable</h1>
          <p className="mt-3 text-base-400">It may be inactive or no longer exists. Check back for new sessions.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-base-950 text-base-100">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-500">Error</p>
          <h1 className="mt-3 text-3xl font-semibold text-base-50">Unable to load this hobby</h1>
          <p className="mt-3 text-base-400">Please refresh or try again later.</p>
        </div>
      </div>
    );
  }

  if (!hobby) return null;

  return (
    <div className="min-h-screen bg-base-950 text-base-100">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-14">
        <motion.div {...fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-base-800/80 bg-base-900/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-base-400 shadow-glow">
          {heroCopy.kicker}
        </motion.div>

        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }} className="mt-4 overflow-hidden rounded-3xl border border-base-800/80 bg-base-900/70 shadow-glow">
          <div className="relative h-80 w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-base-800 via-base-900 to-base-950" />
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(94,234,212,0.05),transparent_28%)]" />
            <div className="absolute bottom-3 left-3 rounded-full border border-base-800/80 bg-base-900/70 px-3 py-1 text-xs text-base-200 shadow-glow">Image placeholder</div>
          </div>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }} className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold text-base-50">{hobby.title}</h1>
              <div className="inline-flex items-center gap-2 rounded-full border border-base-800 bg-base-900 px-3 py-1 text-xs text-base-300">
                ${hobby.pricePerHour.toFixed(0)} per hour
              </div>
            </div>
            <p className="text-base text-base-200 leading-relaxed whitespace-pre-line">{hobby.description}</p>
          </div>

          <div className="space-y-4">
            <div className="card-border rounded-2xl bg-base-900/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-base-500">Host</p>
                  <p className="text-lg font-semibold text-base-50">{host?.name || "Host"}</p>
                  {host?.email && <p className="text-sm text-base-400">{host.email}</p>}
                </div>
                {host?.photoURL ? (
                  <img src={host.photoURL} alt={host.name ?? "Host"} className="h-14 w-14 rounded-full border border-base-800 object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full border border-base-800 bg-base-800" />
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center rounded-xl bg-base-50 px-4 py-3 text-base-900 font-semibold shadow-glow transition hover:shadow-lg"
            >
              Request Lesson
            </motion.button>

            <div className="card-border rounded-2xl bg-base-900/70 p-5 text-sm text-base-400">
              <p className="font-semibold text-base-200">Details</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-base-400">
                <span className="rounded-full border border-base-800 bg-base-900 px-3 py-1">ID: {hobby.id}</span>
                {hobby.createdAt && (
                  <span className="rounded-full border border-base-800 bg-base-900 px-3 py-1">
                    Added: {hobby.createdAt.toDate().toLocaleDateString()}
                  </span>
                )}
                <span className="rounded-full border border-base-800 bg-base-900 px-3 py-1">Host: {hobby.hostId.slice(0, 6)}...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
