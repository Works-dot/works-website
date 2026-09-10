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
        <div className="flex w-full min-w-0 items-center py-12 sm:py-16 lg:w-1/2 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mx-auto w-full min-w-0 max-w-[720px] px-6 sm:px-10 lg:px-12 xl:px-16 [overflow-wrap:anywhere] ${contentClassName}`}
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