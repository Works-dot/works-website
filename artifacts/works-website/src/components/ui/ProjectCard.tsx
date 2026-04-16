import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ProjectCardProps {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
  reverse?: boolean;
}

export function ProjectCard({ slug, title, tags, description, image, reverse = false }: ProjectCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
    >
      <div className="w-full lg:w-1/2 overflow-hidden">
        <div className="w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="relative z-10 w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex flex-col items-start py-4">
        <h3 className="text-3xl lg:text-4xl font-bold text-works-dark mb-4 leading-tight">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm font-semibold text-works-primary border border-works-primary bg-transparent"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-lg text-works-dark/60 mb-8 leading-relaxed">
          {description}
        </p>
        <Link 
          href={`/projektek/${slug}`}
          className="inline-flex items-center text-works-primary font-semibold text-lg group hover:text-works-dark transition-colors"
        >
          Megnézem az esettanulmányt
          <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}
