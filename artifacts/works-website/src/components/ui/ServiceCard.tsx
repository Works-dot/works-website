import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface ServiceCardProps {
  iconSrc?: string;
  title: string;
  description: string;
  index: number;
  href?: string;
}

export function ServiceCard({ iconSrc, title, description, index, href }: ServiceCardProps) {
  const card = (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white/60 backdrop-blur-sm p-6 border border-works-muted/30 hover:bg-white hover:border-works-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-works-bg text-works-primary flex items-center justify-center shrink-0 group-hover:bg-works-primary group-hover:text-white transition-all duration-300">
          {iconSrc ? (
            <img src={iconSrc} alt="" className="w-5 h-5 object-contain group-hover:[filter:brightness(0)_invert(1)]" />
          ) : (
            <Search className="w-5 h-5" strokeWidth={1.5} />
          )}
        </div>
        <h3 className="text-xl font-bold text-works-dark group-hover:text-works-primary transition-colors">{title}</h3>
      </div>
      <p className="text-works-dark/60 leading-relaxed flex-grow">{description}</p>
      {href && (
        <div className="flex justify-end mt-4">
          <ArrowRight
            className="w-5 h-5 text-works-dark/40 group-hover:text-works-primary group-hover:translate-x-1 transition-all duration-300"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    );
  }

  return card;
}
