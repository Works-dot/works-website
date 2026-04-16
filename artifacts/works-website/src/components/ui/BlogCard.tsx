import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  index: number;
}

export function BlogCard({ slug, title, excerpt, date, image, index }: BlogCardProps) {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="flex flex-col group bg-white overflow-hidden border border-works-muted/30 hover:border-works-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/blog/${slug}`} className="flex flex-col flex-grow">
        <div className="w-full aspect-[4/3] relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          <div className="flex items-center text-sm text-works-dark/50 mb-4 font-medium">
            <Calendar className="w-4 h-4 mr-2 text-works-primary" />
            {date}
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-works-dark mb-3 line-clamp-2 min-h-[3.5rem] sm:min-h-[4rem] group-hover:text-works-primary transition-colors">
            {title}
          </h3>
          
          <p className="text-works-dark/60 mb-6 line-clamp-3 min-h-[4.5rem] sm:min-h-[5rem] leading-relaxed">
            {excerpt}
          </p>
          
          <span className="inline-flex items-center text-works-dark font-semibold text-sm group-hover:text-works-primary mt-auto">
            Elolvasom
            <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
