import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '../types/tarot';
import { useTarotDataDB } from '../hooks/useTarotDataDB';

interface CategoryButtonsProps {
  onCategorySelect: (category: Category) => void;
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({ onCategorySelect }) => {
  const { categories } = useTarotDataDB();

  const handleCategoryClick = (category: Category) => {
    onCategorySelect(category);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'briefcase':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
        );
      case 'graduation-cap':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
          </svg>
        );
      case 'leaf':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        );
      case 'home':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        );
      case 'sparkles':
        return (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-purple-300">
          Choose Your Path
        </h2>
        <p className="text-purple-400 text-lg max-w-2xl mx-auto">
          Select a category to explore questions that resonate with your journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick(category)}
            className={`relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${category.color}
                     border-2 border-purple-500/30 shadow-2xl
                     hover:shadow-purple-500/25 transition-all duration-300
                     group cursor-pointer`}
          >
            {/* Background glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 
                           group-hover:opacity-20 transition-opacity duration-300`} />
            
            <div className="relative z-10 space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                  {getIcon(category.icon)}
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {category.title}
                </h3>
                <p className="text-white/80 text-sm">
                  {category.subtitle}
                </p>
              </div>
              
              {/* Hover indicator */}
              <div className="flex justify-center">
                <div className="w-8 h-1 bg-white/50 rounded-full group-hover:w-16 transition-all duration-300" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
