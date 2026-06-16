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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-purple-100">
          보고 싶은 주제를 선택하세요
        </h2>
        <p className="text-purple-200 text-lg max-w-2xl mx-auto">
          주제를 고르면 그 안에서 더 구체적인 질문을 선택할 수 있어요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick(category)}
            className="relative overflow-hidden rounded-2xl px-8 py-10 md:py-12 glass-card hover:bg-white/15 hover:border-white/35 hover:shadow-purple-500/20 group cursor-pointer"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
            
            <div className="relative z-10 space-y-3">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {category.title}
                </h3>
                <p className="text-white/80 text-sm">
                  {category.subtitle}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
