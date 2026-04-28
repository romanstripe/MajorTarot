import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTarotData } from '../hooks/useTarotData';
import { SearchResult } from '../types/tarot';

interface SearchInputProps {
  onCategorySelect: (category: any) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onCategorySelect }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { searchCategories } = useTarotData();

  useEffect(() => {
    console.log('SearchInput useEffect called with query:', query);
    console.log('searchCategories function:', searchCategories);
    
    if (query.trim()) {
      const results = searchCategories(query);
      console.log('Results from searchCategories:', results);
      setSearchResults(results.slice(0, 5)); // Show top 5 results
      setIsOpen(true);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  }, [query, searchCategories]);

  const handleCategoryClick = (category: string) => {
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
          placeholder="What would you like to know about your future?"
          className="w-full px-6 py-4 text-lg bg-purple-900/30 border-2 border-purple-500/50 rounded-2xl
                   text-white placeholder-purple-300/70 focus:outline-none focus:border-purple-400
                   focus:bg-purple-900/40 transition-all duration-300 backdrop-blur-sm"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-6 h-6 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-purple-900/90 backdrop-blur-md
                     border-2 border-purple-500/30 rounded-2xl overflow-hidden z-50"
          >
            {searchResults.map((result, index) => (
              <motion.button
                key={result.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategoryClick(result.category)}
                className="w-full text-left px-6 py-4 text-white hover:bg-purple-800/50
                         transition-colors duration-200 border-b border-purple-700/30 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{result.category}</span>
                  <span className="text-xs text-purple-300">
                    {(1 - result.score).toFixed(2)} match
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
