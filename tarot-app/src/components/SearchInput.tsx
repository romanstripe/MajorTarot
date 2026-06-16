import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTarotDataDB } from '../hooks/useTarotDataDB';
import { Category } from '../types/tarot';

interface SearchInputProps {
  onCategorySelect: (category: any) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onCategorySelect }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useTarotDataDB();

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery) {
      const results = categories.filter((category) => {
        const searchableText = `${category.id} ${category.title} ${category.subtitle}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      });

      setSearchResults(results.slice(0, 5));
      setIsOpen(true);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  }, [query, categories]);

  const handleCategoryClick = (category: Category) => {
    onCategorySelect(category);
    setQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="어떤 흐름이 궁금한가요?"
          className="w-full px-6 py-4 text-lg glass-input rounded-2xl
                   focus:outline-none focus:border-white/45 focus:bg-white/15"
        />
      </div>

      <AnimatePresence>
        {isOpen && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl overflow-hidden z-50"
          >
            {searchResults.map((result, index) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategoryClick(result)}
                className="w-full text-left px-6 py-4 text-white hover:bg-white/10
                         transition-colors duration-200 border-b border-white/10 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span>
                    <span className="block text-lg">{result.title}</span>
                    <span className="block text-xs text-purple-200/80">{result.subtitle}</span>
                  </span>
                  <span className="text-purple-200">{">"}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
