import React, { useState } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchInput } from './components/SearchInput';
import { CategoryButtons } from './components/CategoryButtons';
import { QuestionSelector } from './components/QuestionSelector';
import { NewCardSpread } from './components/NewCardSpread';
import { ReadingResult } from './components/ReadingResult';
import { useTarotDataDB } from './hooks/useTarotDataDB';
import { TarotCard as TarotCardType } from './types/tarot';
import { formatDisplayText } from './utils/displayText';

function AppRouter() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<TarotCardType[]>([]);
  const { loading } = useTarotDataDB();
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();

  const handleCategorySelect = (category: string) => {
    console.log('🎯 선택된 카테고리:', category);  // 이 줄 추가
    setSelectedCategory(category);
    navigate(`/${category}`);
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    navigate('/cards');
  };

  const handleCardsSelected = (cards: TarotCardType[]) => {
    setSelectedCards(cards);
    navigate('/result');
  };

  const handleReset = () => {
    navigate('/');
  };


  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">타로 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <AnimatePresence mode="wait">
          <Routes>
              <Route path="/" element={
                <motion.div
                  key="home"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-purple-100">MajorTarot</h1>
                    <p className="text-purple-200">지금 궁금한 흐름을 카드로 살펴보세요</p>
                  </div>
                  <SearchInput onCategorySelect={(cat: any) => handleCategorySelect(cat.id)} />
                  <CategoryButtons onCategorySelect={(cat: any) => handleCategorySelect(cat.id)} />
                </motion.div>
              } />
              
              <Route path="/cards" element={
                <motion.div
                  key="cards"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-semibold text-purple-300">
                      카드를 선택하세요
                    </h2>
                    <div className="text-purple-100 glass-panel px-6 py-3 rounded-xl max-w-2xl mx-auto">
                      {formatDisplayText(selectedQuestion || selectedCategory)}
                    </div>
                  </div>
                  <NewCardSpread onCardsSelected={handleCardsSelected} />
                </motion.div>
              } />
              
              <Route path="/result" element={
                <motion.div
                  key="result"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ReadingResult
                    category={selectedQuestion || selectedCategory}
                    selectedCards={selectedCards}
                    onReset={handleReset}
                  />
                </motion.div>
              } />

              <Route path="/:category" element={
  <motion.div
    key="questions"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <QuestionSelector
      selectedCategory={selectedCategory || category || ''}
      onQuestionSelect={handleQuestionSelect}
      onBack={() => navigate('/')}
    />
  </motion.div>
} />

            </Routes>
          </AnimatePresence>
        </div>
      </div>
  );
}

export default AppRouter;
