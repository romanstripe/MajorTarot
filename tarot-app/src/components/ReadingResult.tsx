import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TarotCard as TarotCardType } from '../types/tarot';
import { useTarotDataDB, TarotReading } from '../hooks/useTarotDataDB';

const API = 'http://localhost:8001';

interface ReadingResultProps {
  category: string;
  selectedCards: TarotCardType[];
  onReset: () => void;
  userName?: string;
  partnerName?: string;
}

export const ReadingResult: React.FC<ReadingResultProps> = ({
  category,
  selectedCards,
  onReset,
  userName = '당신',
  partnerName = '그 사람',
}) => {
  const { findReading } = useTarotDataDB();
  const [combinedText, setCombinedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCards.length) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. DB에서 카드별 풀이 조회
        const readings = await Promise.all(
          selectedCards.map((card) =>
            findReading(category, card.card, card.direction, userName, partnerName)
          )
        );

        // 2. 서버에서 Gemini로 통합 풀이 생성
        const res = await fetch(`${API}/gemini/reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            cards: selectedCards.map((c) => ({ card: c.card, direction: c.direction })),
            readings: readings.map((r) => r ? { content: r.content, source: r.source } : null),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setCombinedText(data.content);
      } catch (err) {
        console.error('풀이 생성 실패:', err);
        setError('풀이를 생성하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category, selectedCards, userName, partnerName]);

  const positionLabels = ['과거', '현재', '미래'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto p-4 space-y-8"
    >
      {/* 질문 */}
      <h2 className="text-2xl font-bold text-center text-purple-300">
        {category}
      </h2>

      {/* 선택된 카드 3장 */}
      <div className="flex justify-center gap-4">
        {selectedCards.map((card, i) => (
          <div key={i} className="flex-1 max-w-[140px] text-center space-y-2">
            <p className="text-purple-400 text-xs font-medium">{positionLabels[i]}</p>
            <div className={`mx-auto w-16 h-24 bg-purple-800/50 border-2 border-purple-500
                            rounded-lg flex items-center justify-center
                            ${card.direction === 'reversed' ? 'rotate-180' : ''}`}>
              <span className="text-2xl">🔮</span>
            </div>
            <p className="text-purple-200 text-xs font-medium">{card.card}</p>
            <p className="text-purple-400 text-[10px]">
              {card.direction === 'normal' ? '정방향' : '역방향'}
            </p>
          </div>
        ))}
      </div>

      {/* 통합 풀이 */}
      <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-6 min-h-[160px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              🔮
            </motion.div>
            <p className="text-purple-300 text-sm">카드의 메시지를 읽는 중...</p>
          </div>
        ) : error ? (
          <p className="text-red-400 text-center text-sm">{error}</p>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-purple-100 text-base leading-relaxed whitespace-pre-line"
          >
            {combinedText}
          </motion.p>
        )}
      </div>

      {/* 다시하기 */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                     font-bold rounded-full hover:from-purple-500 hover:to-indigo-500
                     transition-all shadow-lg shadow-purple-500/20"
        >
          새로운 복채 내고 다시보기
        </motion.button>
      </div>
    </motion.div>
  );
};