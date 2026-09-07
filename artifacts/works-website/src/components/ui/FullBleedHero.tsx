import { motion } from "framer-motion";
import type { ReactNode } from "react";

type FullBleedHeroProps = {
  backgroundImage: string;
  children: ReactNode;
  contentClassName?: string;
  desktopHeight?: "tall" | "viewport";
};

export function FullBleedHero({
  backgroundImage,
  children,
  contentClassName = "",
  desktopHeight = "tall",
}: FullBleedHeroProps) {
  const desktopHeightClass =
    desktopHeight === "viewport"
      ? "lg:min-h-[calc(100vh-72px)]"
      : "lg:min-h-[870px]";

  return (
    <section
      className={`relative mt-20 md:mt-[72px] pt-10 pb-12 lg:py-16 bg-white overflow-hidden flex items-start lg:items-center ${desktopHeightClass}`}
    >
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`max-w-[750px] bg-white/25 backdrop-blur-xl backdrop-saturate-150 border border-white/50 p-5 sm:p-6 lg:p-[25px] ${contentClassName}`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}