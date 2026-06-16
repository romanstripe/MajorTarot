const CARD_IMAGE_BASE = "/assets/tarot";

const CARD_IMAGE_FILES: Record<string, string> = {
  "광대": "fool.jpg",
  "마법사": "magician.jpg",
  "고위 여사제": "high-priestess.jpg",
  "여왕": "empress.jpg",
  "황제": "emperor.jpg",
  "교황": "hierophant.jpg",
  "연인들": "lovers.jpg",
  "전차": "chariot.jpg",
  "힘": "strength.jpg",
  "은둔자": "hermit.jpg",
  "운명의 수레바퀴": "wheel-of-fortune.jpg",
  "정의": "justice.jpg",
  "매달린 남자": "hanged-man.jpg",
  "죽음": "death.jpg",
  "절제": "temperance.jpg",
  "악마": "devil.jpg",
  "탑": "tower.jpg",
  "별": "star.jpg",
  "달": "moon.jpg",
  "태양": "sun.jpg",
  "심판": "judgement.jpg",
  "세계": "world.jpg",
};

export const CARD_BACK_IMAGE = `${CARD_IMAGE_BASE}/card-back.svg`;

export const getTarotCardImage = (cardName: string) => {
  const fileName = CARD_IMAGE_FILES[cardName];
  return fileName ? `${CARD_IMAGE_BASE}/${fileName}` : CARD_BACK_IMAGE;
};
