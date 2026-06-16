import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTarotDataDB } from '../hooks/useTarotDataDB';
import { Question } from '../types/tarot';
import { formatDisplayText } from '../utils/displayText';

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
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
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
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const filtered = questions.filter((question) =>
        formatDisplayText(question.text).toLowerCase().includes(normalizedQuery)
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
          className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
        >
          <span>{"<"}</span>
          <span>카테고리로 돌아가기</span>
        </button>
        <h2 className="text-3xl font-bold text-purple-100">질문을 선택하세요</h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문 검색..."
          className="w-full px-6 py-3 text-lg glass-input rounded-xl focus:outline-none
                     focus:border-white/45 focus:bg-white/15"
        />
      </div>

      <div className="space-y-4">
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
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuestionSelect(question.id)}
              className="w-full text-left p-6 glass-card rounded-xl hover:bg-white/15 hover:border-white/35
                         transition-all group"
            >
              <div className="flex items-center justify-between">
                <p className="text-purple-100 text-lg group-hover:text-white">
                  {formatDisplayText(question.text)}
                </p>
                <span className="ml-6 text-purple-200 group-hover:text-white">{">"}</span>
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
