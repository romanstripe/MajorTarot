import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTarotDataDB } from '../hooks/useTarotDataDB';

interface QuestionSelectorProps {
  selectedCategory: string;
  onQuestionSelect: (question: string) => void;
  onBack: () => void;
}

export const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedCategory,
  onQuestionSelect,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState<string[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const { getQuestionsByCategory } = useTarotDataDB();

  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingQ(true);

    // URL에서 오는 카테고리가 한글일 수 있으므로 디코딩
    const groupId = decodeURIComponent(selectedCategory);
    console.log('📂 카테고리 로드:', groupId);

    const load = async () => {
      const questions = await getQuestionsByCategory(groupId);
      console.log('❓ 받은 질문 수:', questions.length, questions);
      const texts = questions.map((q: any) => q.text || q);
      const filtered = texts.filter((q: string) =>
        q.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuestions(filtered);
      setLoadingQ(false);
    };

    load();
  }, [selectedCategory, searchQuery, getQuestionsByCategory]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="text-center space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← 카테고리로 돌아가기
        </button>
        <h2 className="text-3xl font-bold text-purple-300">질문을 선택하세요</h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문 검색..."
          className="w-full px-6 py-3 text-lg bg-purple-900/30 border-2 border-purple-500/50
                     rounded-xl text-white placeholder-purple-300/70 focus:outline-none
                     focus:border-purple-400 transition-all"
        />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loadingQ ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3" />
            <p className="text-purple-400">질문 불러오는 중...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-400">질문을 찾을 수 없습니다. (카테고리: {selectedCategory})</p>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <motion.button
              key={question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuestionSelect(question)}
              className="w-full text-left p-6 bg-purple-900/20 border-2 border-purple-600/30
                         rounded-xl hover:bg-purple-900/40 hover:border-purple-500/50
                         transition-all group"
            >
              <div className="flex items-center justify-between">
                <p className="text-purple-200 text-lg group-hover:text-purple-100">{question}</p>
                <span className="text-purple-400 group-hover:text-purple-300 ml-4">→</span>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {filteredQuestions.length > 0 && (
        <p className="text-center text-purple-400 text-sm">{filteredQuestions.length}개 질문</p>
      )}
    </motion.div>
  );
};