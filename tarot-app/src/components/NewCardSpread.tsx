import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TarotCard as TarotCardType } from '../types/tarot';
import { CARD_BACK_IMAGE, getTarotCardImage } from '../utils/tarotImages';

interface NewCardSpreadProps {
  onCardsSelected: (cards: TarotCardType[]) => void;
}

const TAROT_CARDS_KO = [
  '광대', '마법사', '고위 여사제', '여왕', '황제',
  '교황', '연인들', '전차', '힘', '은둔자',
  '운명의 수레바퀴', '정의', '매달린 남자', '죽음', '절제',
  '악마', '탑', '별', '달', '태양',
  '심판', '세계',
];

const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

export const NewCardSpread: React.FC<NewCardSpreadProps> = ({ onCardsSelected }) => {
  const [deck, setDeck] = useState<string[]>(shuffle(TAROT_CARDS_KO));
  const [selectedCards, setSelectedCards] = useState<TarotCardType[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setDeck(shuffle(TAROT_CARDS_KO));
      setIsShuffling(false);
    }, 800);
  };

  const handleCardClick = (cardName: string) => {
    if (isShuffling) return;
    if (selectedCards.length >= 3) return;
    if (selectedCards.some((card) => card.card === cardName)) return;

    setFlipped((prev) => new Set(prev).add(cardName));

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
      <div className="flex justify-center gap-4">
        {[0, 1, 2].map((i) => {
          const card = selectedCards[i];

          return (
            <div key={i} className="flex-1 max-w-[150px]">
              <p className="mb-2 text-center text-sm text-purple-400">{positionNames[i]}</p>
              <div className="aspect-[2/3] overflow-hidden rounded-xl glass-card">
                {card ? (
                  <div className="relative h-full w-full">
                    <img
                      src={getTarotCardImage(card.card)}
                      alt={card.card}
                      className={`h-full w-full object-cover ${card.direction === 'reversed' ? 'rotate-180' : ''}`}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center">
                      <p className="truncate text-xs font-medium text-white">{card.card}</p>
                      <p className="text-[10px] text-purple-100">
                        {card.direction === 'normal' ? '정방향' : '역방향'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={CARD_BACK_IMAGE}
                      alt={`${i + 1}번 카드 뒷면`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-center">
                      <p className="text-[10px] text-purple-100">{i + 1}번 카드</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-purple-400">
        {selectedCards.length < 3
          ? `끌리는 카드 3장을 선택하세요 (${selectedCards.length}/3)`
          : '카드 3장 선택 완료! 잠시 후 결과가 나옵니다...'}
      </p>

      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          disabled={isShuffling}
          className="rounded-xl px-6 py-2 text-purple-100 glass-card hover:bg-white/15 disabled:opacity-50"
        >
          {isShuffling ? '셔플 중...' : '셔플'}
        </motion.button>
      </div>

      <AnimatePresence>
        {!isShuffling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto grid max-w-3xl grid-cols-7 gap-2"
          >
            {deck.map((card, index) => {
              const isSelected = selectedCards.some((selected) => selected.card === card);
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
                  className={`relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                    isSelected
                      ? 'cursor-not-allowed border-purple-300 opacity-45'
                      : isDisabled
                        ? 'border-yellow-300/70 bg-white/10'
                        : 'glass-card hover:border-white/40 hover:bg-white/15'
                  }`}
                >
                  {isSelected || flipped.has(card) ? (
                    <img
                      src={getTarotCardImage(card)}
                      alt={card}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={CARD_BACK_IMAGE}
                      alt="카드 뒷면"
                      className="h-full w-full object-cover"
                    />
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <span className="text-xs font-medium text-white">선택됨</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShuffling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-purple-300/30 border-t-purple-200"
            />
            <p className="ml-4 text-lg text-purple-400">카드를 섞는 중...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
