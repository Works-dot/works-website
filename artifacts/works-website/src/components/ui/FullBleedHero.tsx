import { motion } from "framer-motion";
import type { ReactNode } from "react";
import "./FullBleedHero.css";

type FullBleedHeroProps = {
  backgroundImage: string;
  children: ReactNode;
  contentClassName?: string;
  showDecoration?: boolean;
};

export function FullBleedHero({
  backgroundImage,
  children,
  contentClassName = "",
  showDecoration = false,
}: FullBleedHeroProps) {
  return (
    <section
      className="full-bleed-hero relative isolate overflow-hidden flex bg-works-dark text-white"
    >
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-right pointer-events-none select-none"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`w-full min-w-0 lg:w-1/2 [overflow-wrap:anywhere] ${contentClassName}`}
          >
            {children}
            {showDecoration && (
              <div
                aria-hidden="true"
                className="mt-6 h-4 w-4 bg-[#E73352]"
              />
            )}
          </motion.div>
      </div>
    </section>
  );
}