import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TarotCard as TarotCardType } from "../types/tarot";
import { useTarotDataDB } from "../hooks/useTarotDataDB";
import { formatDisplayText } from "../utils/displayText";
import { getTarotCardImage } from "../utils/tarotImages";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

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
  userName = "당신",
  partnerName = "그 사람",
}) => {
  const { findReading } = useTarotDataDB();
  const [combinedText, setCombinedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCards.length) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const readings = await Promise.all(
          selectedCards.map((card) =>
            findReading(
              category,
              card.card,
              card.direction,
              userName,
              partnerName,
            ),
          ),
        );

        const res = await fetch(`${API_BASE_URL}/ai/reading`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            cards: selectedCards.map((c) => ({
              card: c.card,
              direction: c.direction,
            })),
            readings: readings.map((r) =>
              r ? { content: r.content, source: r.source } : null,
            ),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setCombinedText(data.content);
      } catch (err) {
        console.error("풀이 생성 실패:", err);
        setError("풀이를 생성하는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category, selectedCards, userName, partnerName, findReading]);

  const positionLabels = ["과거", "현재", "미래"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto p-4 space-y-8"
    >
      <h2 className="text-2xl font-bold text-center text-purple-100">
        {formatDisplayText(category)}
      </h2>

      <div className="flex justify-center gap-4">
        {selectedCards.map((card, i) => (
          <div key={i} className="flex-1 max-w-[150px] text-center space-y-2">
            <p className="text-purple-200 text-xs font-medium">
              {positionLabels[i]}
            </p>
            <div className="relative mx-auto aspect-[2/3] overflow-hidden rounded-lg glass-card">
              <img
                src={getTarotCardImage(card.card)}
                alt={card.card}
                className={`h-full w-full object-cover ${
                  card.direction === "reversed" ? "rotate-180" : ""
                }`}
              />
            </div>
            <p className="text-purple-100 text-xs font-medium">{card.card}</p>
            <p className="text-purple-200 text-[10px]">
              {card.direction === "normal" ? "정방향" : "역방향"}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-6 min-h-[160px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-9 w-9 rounded-full border-2 border-purple-300/30 border-t-purple-100"
            />
            <p className="text-purple-200 text-sm">
              카드의 메시지를 읽는 중...
            </p>
          </div>
        ) : error ? (
          <p className="text-red-300 text-center text-sm">{error}</p>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-purple-50 text-base leading-relaxed whitespace-pre-line"
          >
            {combinedText}
          </motion.p>
        )}
      </div>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-10 py-4 glass-card text-white font-bold rounded-full hover:bg-white/15 hover:border-white/35"
        >
          처음으로 돌아가기
        </motion.button>
      </div>
    </motion.div>
  );
};
