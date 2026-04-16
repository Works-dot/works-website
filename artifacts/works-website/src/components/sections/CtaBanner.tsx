import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function CtaBanner() {
  return (
    <section className="w-full bg-works-dark py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-2xl">
            A designer feladata nem csupán szép felületek tervezése — hanem valódi problémák megoldása.
          </h2>
          <Link
            href="/kapcsolat"
            className="group inline-flex items-center justify-center px-8 py-4 border border-white text-white font-semibold text-lg hover:bg-white hover:text-works-dark transition-colors duration-300 whitespace-nowrap shrink-0 gap-2"
          >
            Segíthetünk?
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
