import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard as TarotCardType } from '../types/tarot';

interface NewCardSpreadProps {
  onCardsSelected: (cards: TarotCardType[]) => void;
}

const TAROT_CARDS_KO = [
  "광대", "마법사", "고위 여사제", "여왕", "황제",
  "교황", "연인들", "전차", "힘", "은둔자",
  "운명의 수레바퀴", "정의", "매달린 남자", "죽음", "절제",
  "악마", "탑", "별", "달", "태양",
  "심판", "세계",
];

const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

export const NewCardSpread: React.FC<NewCardSpreadProps> = ({ onCardsSelected }) => {
  const [deck, setDeck] = useState<string[]>(shuffle(TAROT_CARDS_KO));

  const [selectedCards, setSelectedCards] = useState<TarotCardType[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

// flipped state 추가
const [flipped, setFlipped] = useState<Set<string>>(new Set());

// handleShuffle에서 selectedCards 초기화 제거
const handleShuffle = () => {
  setIsShuffling(true);
  setTimeout(() => {
    setDeck(shuffle(TAROT_CARDS_KO));
    setIsShuffling(false);
  }, 800);
  // setSelectedCards([]) ← 이 줄 있으면 제거
};

const handleCardClick = (cardName: string) => {
  if (isShuffling) return;
  if (selectedCards.length >= 3) return;
  if (selectedCards.some(c => c.card === cardName)) return;

  setFlipped(prev => new Set(prev).add(cardName));

  const direction = Math.random() > 0.5 ? 'normal' : 'reversed';
  const positions = ['past', 'present', 'future'] as const;
  const newCard: TarotCardType = {
    card: cardName,
    direction,
    position: positions[selectedCards.length],
  };

  const updated = [...selectedCards, newCard];
  setSelectedCards(updated);

  if (updated.length === 3) {
    setTimeout(() => onCardsSelected(updated), 800);
  }
};


  const positionNames = ['과거', '현재', '미래'];

  return (
    <div className="space-y-8">
      {/* 선택된 카드 슬롯 */}
      <div className="flex justify-center gap-4">
        {[0, 1, 2].map((i) => {
          const card = selectedCards[i];
          return (
            <div key={i} className="flex-1 max-w-[160px]">
              <p className="text-center text-purple-400 text-sm mb-2">{positionNames[i]}</p>
              <div className="h-28 bg-purple-900/20 border-2 border-purple-600/30 rounded-xl flex items-center justify-center">
                {card ? (
                  <div className="text-center px-2">
                    <p className="text-purple-200 text-sm font-medium">{card.card}</p>
                    <p className="text-purple-400 text-xs mt-1">
                      {card.direction === 'normal' ? '정방향' : '역방향'}
                    </p>
                  </div>
                ) : (
                  <p className="text-purple-600 text-sm">{i + 1}번 카드</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <p className="text-center text-purple-400 text-sm">
        {selectedCards.length < 3
          ? `카드를 클릭해 뒤집고, 다시 클릭해 선택하세요 (${selectedCards.length}/3)`
          : '카드 3장 선택 완료! 잠시 후 결과가 나옵니다...'}
      </p>

      {/* 버튼 */}
      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          disabled={isShuffling}
          className="px-6 py-2 bg-purple-600/30 border-2 border-purple-500/50 rounded-xl
                     text-purple-300 hover:bg-purple-600/40 transition-all disabled:opacity-50"
        >
          {isShuffling ? '셔플 중...' : '🔀 셔플'}
        </motion.button>
      </div>

      {/* 카드 덱 */}
      <AnimatePresence>
        {!isShuffling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-7 gap-2 max-w-3xl mx-auto"
          >
            {deck.map((card, index) => {
              const isSelected = selectedCards.some(c => c.card === card);
              const isDisabled = selectedCards.length >= 3 && !isSelected;

              return (
                <motion.div
                  key={card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={!isDisabled ? { scale: 1.08, y: -4 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                  onClick={() => !isDisabled && handleCardClick(card)}
                  className={`relative cursor-pointer aspect-[2/3] rounded-lg border-2 transition-all duration-300
                    ${isSelected
                      ? 'border-purple-400 opacity-40 cursor-not-allowed'
                      : isDisabled

                      ? 'border-yellow-400 bg-purple-800/60'
                      : 'border-purple-600/50 bg-purple-900/40 hover:border-purple-400'
                    }`}
                >
                  {/* 카드 앞면/뒷면 */}
                  <div className="absolute inset-0 flex items-center justify-center p-1 rounded-lg overflow-hidden">
                    {isSelected ? (
  <span className="text-purple-300 text-xl">✓</span>
) : flipped.has(card) ? (
  <div className="text-center p-1">
    <p className="text-purple-100 text-[10px] leading-tight">{card}</p>
  </div>
) : (
  <div className="text-purple-600 text-xl">🔮</div>
)}
                  </div>

                  {/* 선택된 카드 표시 */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-purple-400/10">
                      <span className="text-purple-300 text-lg">✓</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 셔플 중 애니메이션 */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              🔮
            </motion.div>
            <p className="text-purple-400 ml-4 text-lg">카드를 섞는 중...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};