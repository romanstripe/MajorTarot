import { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import { TarotData, SearchResult, Category, Question } from '../types/tarot';

export const useTarotData = () => {
  const [lookupTable, setLookupTable] = useState<Map<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tarotData, setTarotData] = useState<TarotData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data sources
        const [tarotDataResponse, ...descResponses] = await Promise.all([
          fetch('/data/tarot-data.json'),
          fetch('/data/description_r1n5.json'),
          fetch('/data/description_r1n10.json'),
          fetch('/data/description_r2n1.json'),
          fetch('/data/description_r2n2.json'),
          fetch('/data/description_r3n5.json'),
          fetch('/data/description_r3n10.json'),
        ]);

        const data = await tarotDataResponse.json();
        const descData = await Promise.all(descResponses.map(r => r.json()));

        // Create unified lookup table
        const table = new Map<string, string>();

        // Add data from tarot-data.json
        Object.values(data.data).forEach((categoryData: any) => {
          categoryData.forEach((item: any) => {
            const key = `${item.category}#${item.types}`;
            table.set(key, item.content);
          });
        });

        // Add data from description files
        descData.forEach((data) => {
          if (data.data) {
            Object.values(data.data).forEach((categoryData: any) => {
              categoryData.forEach((item: any) => {
                const key = `${item.category}#${item.types}`;
                table.set(key, item.content);
              });
            });
          }
        });

        setLookupTable(table);
        setTarotData(data);
        console.log('✅ Data Loaded Success');
      } catch (err) {
        console.error('❌ Data Load Failed');
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const searchCategories = useCallback((query: string): SearchResult[] => {
    if (!tarotData) return [];
    
    const fuse = new Fuse(tarotData.categories, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true
    });

    const results = fuse.search(query);
    return results.map((result: any) => ({
      category: result.item,
      score: result.score || 0
    }));
  }, [tarotData]);

  const findReading = useCallback((category: string, card: string, direction: 'normal' | 'reversed') => {
    if (!lookupTable) return null;
    
    const directionKorean = direction === 'normal' ? '정방향' : '역방향';
    const key = `${category}#${card} ${directionKorean}`;
    
    return lookupTable.get(key) || null;
  }, [lookupTable]);

  const getQuestionsByCategory = useCallback((category: string) => {
    if (!lookupTable) return [];
    
    const allQuestions = Array.from(lookupTable.keys());
    const questions = allQuestions.map(key => key.split('#')[0]).filter(q => q && q.trim());
    
    // Remove duplicates using Set
    const uniqueQuestions = Array.from(new Set(questions));
    
    // Korean keyword map for auto-classification
    const keywordMap: { [key: string]: string[] } = {
      'love': ['연애', '사랑', '이별', '재회', '미련', '궁합', '그 사람', '배우자', '만남', '짝사랑'],
      'career': ['직업', '회사', '성공', '시험', '재정', '돈', '벌 수', '부자', '재물'],
      'health': ['건강', '상태', '몸'],
      'family': ['자녀', '아이', '부모', '친구', '강아지'],
      'spiritual': ['꿈', '메시지', '운명', '운세']
    };
    
    const keywords = keywordMap[category.toLowerCase()] || [];
    
    return uniqueQuestions.filter(question => {
      return keywords.some(keyword => question.includes(keyword));
    });
  }, [lookupTable]);

  const categories: Category[] = [
    {
      id: 'love',
      title: 'Love & Relationships',
      subtitle: 'Find guidance in matters of heart',
      keywords: ['연애', '사랑', '이별', '재회', '미련', '궁합', '그 사람', '배우자', '만남', '짝사랑'],
      icon: '❤️',
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'career',
      title: 'Career & Finance',
      subtitle: 'Navigate your professional path',
      keywords: ['직업', '회사', '성공', '시험', '재정', '돈', '벌 수', '부자', '재물'],
      icon: '💼',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'health',
      title: 'Health & Wellness',
      subtitle: 'Balance your physical and mental well-being',
      keywords: ['건강', '상태', '몸'],
      icon: '🌿',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'family',
      title: 'Family & Friends',
      subtitle: 'Strengthen your personal connections',
      keywords: ['자녀', '아이', '부모', '친구', '강아지'],
      icon: '👨‍👩‍👧‍👦',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'spiritual',
      title: 'Spiritual Growth',
      subtitle: 'Explore your inner journey and destiny',
      keywords: ['꿈', '메시지', '운명', '운세'],
      icon: '✨',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  return {
    lookupTable,
    loading,
    error,
    searchCategories,
    findReading,
    getQuestionsByCategory,
    tarotData,
    categories
  };
};
