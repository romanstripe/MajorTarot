export interface TarotCard {
  card: string;
  direction: 'normal' | 'reversed';
  position?: 'past' | 'present' | 'future';
}

export interface TarotReading {
  category: string;
  card: string;
  direction: string;
  content: string;
  type: string;
}

export interface TarotData {
  categories: string[];
  cards: string[];
  totalEntries: number;
  data: Record<string, TarotReading[]>;
  allData: TarotReading[];
}

export interface SearchResult {
  category: string;
  score: number;
}

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: string;
  color: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface Reading {
  id: string;
  question: string;
  cards: TarotCard[];
  interpretation: string[];
  timestamp: Date;
}
