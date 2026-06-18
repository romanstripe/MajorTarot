import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Question } from '../types/tarot';
import { formatDisplayText } from '../utils/displayText';

interface SearchInputProps {
  categories: Category[];
  getQuestionsByCategory: (categoryId: string) => Promise<Question[]>;
  onCategorySelect: (category: Category) => void;
  onQuestionSelect: (question: string) => void;
}

type SearchResult =
  | {
      type: 'category';
      category: Category;
      score: number;
    }
  | {
      type: 'question';
      category: Category;
      question: Question;
      score: number;
    };

export const SearchInput: React.FC<SearchInputProps> = ({
  categories,
  getQuestionsByCategory,
  onCategorySelect,
  onQuestionSelect,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [questionIndex, setQuestionIndex] = useState<Array<{ category: Category; question: Question }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');

  const getCategoryScore = useCallback((category: Category, rawQuery: string) => {
    const query = normalize(rawQuery);
    if (!query) return 0;

    const id = normalize(category.id);
    const title = normalize(category.title);
    const subtitle = normalize(category.subtitle);
    const searchableText = `${id} ${title} ${subtitle}`;

    if (title === query || id === query) return 100;
    if (title.startsWith(query)) return 90;
    if (title.includes(query)) return 80;
    if (subtitle.includes(query)) return 60;
    if (id.includes(query)) return 50;
    if (searchableText.includes(query)) return 30;

    return 0;
  }, []);

  const getQuestionScore = useCallback((question: Question, rawQuery: string) => {
    const query = normalize(rawQuery);
    if (!query) return 0;

    const displayText = normalize(formatDisplayText(question.text));
    const rawText = normalize(question.id);

    if (displayText === query || rawText === query) return 95;
    if (displayText.startsWith(query)) return 85;
    if (displayText.includes(query)) return 75;
    if (rawText.includes(query)) return 65;

    return 0;
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setQuestionIndex([]);
      return;
    }

    let cancelled = false;

    const loadQuestions = async () => {
      const groupedQuestions = await Promise.all(
        categories.map(async (category) => {
          const questions = await getQuestionsByCategory(category.id);
          return questions.map((question) => ({ category, question }));
        }),
      );

      if (!cancelled) {
        setQuestionIndex(groupedQuestions.flat());
      }
    };

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [categories, getQuestionsByCategory]);

  useEffect(() => {
    if (query.trim()) {
      const categoryResults: SearchResult[] = categories
        .map((category) => ({
          type: 'category' as const,
          category,
          score: getCategoryScore(category, query),
        }))
        .filter((result) => result.score > 0);

      const questionResults: SearchResult[] = questionIndex
        .map(({ category, question }) => ({
          type: 'question' as const,
          category,
          question,
          score: getQuestionScore(question, query),
        }))
        .filter((result) => result.score > 0);

      const results = [...categoryResults, ...questionResults].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.type === 'category' ? -1 : 1;
      });

      setSearchResults(results.slice(0, 5));
      setIsOpen(true);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  }, [query, categories, questionIndex, getCategoryScore, getQuestionScore]);

  const goToCategory = (category: Category) => {
    onCategorySelect(category);
    setQuery('');
    setIsOpen(false);
  };

  const goToQuestion = (question: Question) => {
    onQuestionSelect(question.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (searchResults.length === 0) return;

    e.preventDefault();
    const firstResult = searchResults[0];
    if (firstResult.type === 'category') {
      goToCategory(firstResult.category);
    } else {
      goToQuestion(firstResult.question);
    }
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
          onKeyDown={handleInputKeyDown}
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
                key={
                  result.type === 'category'
                    ? `category-${result.category.id}`
                    : `question-${result.question.id}`
                }
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() =>
                  result.type === 'category'
                    ? goToCategory(result.category)
                    : goToQuestion(result.question)
                }
                className="w-full text-left px-6 py-4 text-white hover:bg-white/10
                         transition-colors duration-200 border-b border-white/10 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span>
                    <span className="block text-xs text-purple-200/80">
                      {result.type === 'category' ? '카테고리' : result.category.title}
                    </span>
                    <span className="block text-lg">
                      {result.type === 'category'
                        ? result.category.title
                        : formatDisplayText(result.question.text)}
                    </span>
                    {result.type === 'category' && (
                      <span className="block text-xs text-purple-200/80">
                        {result.category.subtitle}
                      </span>
                    )}
                  </span>
                  <span className="text-purple-200">{">"}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
        {isOpen && query.trim() && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl px-6 py-4 text-sm text-purple-200 z-50"
          >
            일치하는 카테고리나 질문을 찾지 못했습니다.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
