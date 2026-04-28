import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard as TarotCardType } from '../types/tarot';

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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl border-2 border-purple-600/50">
          <div className="text-purple-300 text-6xl">?</div>
        </div>
      );
    }

    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 to-purple-800 rounded-xl border-2 border-purple-500/50 ${card.direction === 'reversed' ? 'rotate-180' : ''}`}>
        <div className="text-white text-xl font-bold text-center px-2">
          {card.card}
        </div>
        <div className="text-purple-200 text-sm mt-2">
          {card.direction === 'reversed' ? 'Reversed' : 'Normal'}
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
