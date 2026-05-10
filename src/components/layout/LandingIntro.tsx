"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const INTRO_DURATION_MS = 3200;

export function LandingIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeOut" } }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]" />
          <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_16%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_50%_70%,rgba(220,38,38,0.12),transparent_20%)]" />

          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0.55, rotate: -18, opacity: 0 }}
            animate={{
              scale: [0.55, 1.06, 1.18, 1.05],
              rotate: [-18, 12, 360, 396],
              opacity: [0, 1, 1, 1],
            }}
            exit={{
              scale: [1.05, 0.18],
              y: [0, 160],
              opacity: [1, 1, 0],
              rotate: 360,
              transition: {
                duration: 1.2,
                times: [0, 0.6, 1],
                ease: "easeInOut",
              },
            }}
            transition={{
              duration: 2.7,
              times: [0, 0.45, 0.82, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="absolute inset-[-28vw] rounded-full border border-white/12"
              animate={{ rotate: 360, scale: [0.92, 1.04, 0.92], opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-18vw] rounded-full border border-[#dc2626]/20"
              animate={{ rotate: -360, scale: [1.02, 0.96, 1.02], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, 1, 1], y: [8, 0, 0] }}
                transition={{ duration: 2.2, ease: "easeOut", times: [0, 0.35, 1] }}
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