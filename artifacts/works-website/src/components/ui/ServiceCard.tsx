import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceCardProps {
  iconSrc?: string;
  title: string;
  description: string;
  index: number;
}

export function ServiceCard({ iconSrc, title, description, index }: ServiceCardProps) {
  return (
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
            <img src={iconSrc} alt="" className="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(23%)_sepia(93%)_saturate(2568%)_hue-rotate(337deg)_brightness(91%)_contrast(92%)] group-hover:[filter:brightness(0)_invert(1)]" />
          ) : (
            <Search className="w-5 h-5" strokeWidth={1.5} />
          )}
        </div>
        <h3 className="text-xl font-bold text-works-dark group-hover:text-works-primary transition-colors">{title}</h3>
      </div>
      <p className="text-works-dark/60 leading-relaxed flex-grow">{description}</p>
    </motion.div>
  );
}
