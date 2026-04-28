import { useState, useEffect, useCallback } from 'react';
import { Category, Question } from '../types/tarot';

const API = 'http://localhost:8001';

export interface TarotReading {
  card_type: string;
  card_name: string;
  direction: string;
  category: string;
  content: string;
  source: string;
}

const ICON_MAP: Record<string, string> = {
  love:    '💕',
  meeting: '🌹',
  money:   '💰',
  future:  '🔮',
  mind:    '🧠',
  daily:   '🌟',
};

const COLOR_MAP: Record<string, string> = {
  love:    'from-pink-500 to-rose-600',
  meeting: 'from-red-500 to-pink-600',
  money:   'from-yellow-500 to-amber-600',
  future:  'from-purple-500 to-indigo-600',
  mind:    'from-blue-500 to-cyan-600',
  daily:   'from-green-500 to-emerald-600',
};

export const useTarotDataDB = () => {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API}/data/categories.json`);
        if (!res.ok) throw new Error('카테고리 로드 실패');

        const data: { id: string; name: string; icon: string; questions: string[] }[] = await res.json();

        const formatted: Category[] = data.map((cat) => ({
          id:       cat.id,
          title:    cat.name,
          subtitle: `${cat.questions.length}개 질문`,
          keywords: [],
          icon:     ICON_MAP[cat.id] ?? '✨',
          color:    COLOR_MAP[cat.id] ?? 'from-purple-500 to-indigo-600',
        }));

        setCategories(formatted);
        console.log('✅ 카테고리 로드 완료:', formatted.length);
      } catch (err) {
        console.error('❌ 카테고리 로드 실패:', err);
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // 그룹 ID로 질문 목록 조회
  const getQuestionsByCategory = useCallback(async (groupId: string): Promise<Question[]> => {
    try {
      const res = await fetch(`${API}/data/questions?group=${groupId}`);
      if (!res.ok) return [];

      const data: { id: string; text: string }[] = await res.json();
      return data.map((q) => ({
        id:       q.id,
        text:     q.text,
        category: groupId,
      }));
    } catch (err) {
      console.error('질문 로드 실패:', err);
      return [];
    }
  }, []);

  // 운세 풀이 조회
  // category: 실제 질문 텍스트 (예: "지금 나의 재물운은 어떨까")
  // cardName: 카드명 (예: "탑")
  // direction: 'normal' | 'reversed'
  const findReading = useCallback(async (
    category: string,
    cardName: string,
    direction: 'normal' | 'reversed',
    userName = '당신',
    partnerName = '그 사람',
  ): Promise<TarotReading | null> => {
    try {
      const dirKo = direction === 'normal' ? '정방향' : '역방향';
      const params = new URLSearchParams({
        category,
        card:      cardName,
        direction: dirKo,
        user_name: userName,
        partner:   partnerName,
      });

      const res = await fetch(`${API}/data/reading?${params}`);
      if (!res.ok) return null;

      return await res.json();
    } catch (err) {
      console.error('풀이 로드 실패:', err);
      return null;
    }
  }, []);

  // 카드 자체 설명 조회 (선택적 사용)
  const getCardDescription = useCallback(async (
    cardName: string,
    direction: 'normal' | 'reversed',
  ): Promise<string | null> => {
    try {
      const dirKo = direction === 'normal' ? '정방향' : '역방향';
      const res = await fetch(
        `${API}/data/card_desc?card=${encodeURIComponent(cardName)}&direction=${encodeURIComponent(dirKo)}`
      );
      if (!res.ok) return null;

      const data = await res.json();
      return data.description ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    loading,
    error,
    categories,
    getQuestionsByCategory,
    findReading,
    getCardDescription,
  };
};