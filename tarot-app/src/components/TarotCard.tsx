import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard as TarotCardType } from '../types/tarot';
import { CARD_BACK_IMAGE, getTarotCardImage } from '../utils/tarotImages';

interface TarotCardProps {
  card: TarotCardType;
  isFlipped: boolean;
  onClick: () => void;
  disabled?: boolean;
  index: number;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isFlipped,
  onClick,
  disabled = false,
  index,
}) => {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      rotateY: 0,
      scale: 0.8,
    },
    visible: { 
      opacity: 1, 
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
    flip: {
      rotateY: 180,
      transition: {
        duration: 0.6,
      },
    },
  };

  const getCardDisplay = () => {
    if (!isFlipped) {
      return (
        <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-purple-600/50">
          <img
            src={CARD_BACK_IMAGE}
            alt="카드 뒷면"
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-purple-500/50">
        <img
          src={getTarotCardImage(card.card)}
          alt={card.card}
          className={`h-full w-full object-cover ${card.direction === 'reversed' ? 'rotate-180' : ''}`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center">
          <p className="truncate text-xs font-medium text-white">{card.card}</p>
          <p className="text-[10px] text-purple-100">
            {card.direction === 'reversed' ? '역방향' : '정방향'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="relative w-24 h-36 cursor-pointer"
      variants={cardVariants}
      initial="hidden"
      animate={isFlipped ? "flip" : "visible"}
      whileHover={!disabled && !isFlipped ? { scale: 1.05, y: -5 } : {}}
      whileTap={!disabled && !isFlipped ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {getCardDisplay()}
    </motion.div>
  );
};
