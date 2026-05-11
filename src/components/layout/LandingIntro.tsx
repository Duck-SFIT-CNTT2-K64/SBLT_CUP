"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const INTRO_DURATION_MS = 1000;

// Module-level variable to track if intro has been shown in the current JS environment
// This persists during client-side navigation but resets on full page reload (F5)
let hasSeenIntro = false;

export function LandingIntro() {
  const [visible, setVisible] = useState(!hasSeenIntro);

  useEffect(() => {
    if (hasSeenIntro) return;

    // Mark as seen and start timer
    hasSeenIntro = true;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
        >
          <style>{`body { overflow-y: hidden !important; }`}</style>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_16%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_50%_70%,rgba(220,38,38,0.12),transparent_20%)]"
          />

          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: [0.32, 0, 0.67, 0] }}
          >

            <div className="text-center px-4">
              <motion.div
                className="sblt-heading text-[clamp(4rem,18vw,12rem)] leading-none tracking-[0.18em] text-white drop-shadow-[0_0_26px_rgba(255,255,255,0.28)]"
                style={{ transformOrigin: "center center" }}
              >
                <span className="inline-block bg-gradient-to-b from-white via-[#fff7f7] to-[#e6b3b3] bg-clip-text text-transparent">
                  SBLT CUP
                </span>
              </motion.div>
              <motion.div
                className="mt-4 text-[clamp(0.7rem,1.8vw,1rem)] uppercase tracking-[0.45em] text-white/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Giải đấu TFT
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}