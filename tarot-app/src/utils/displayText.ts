const QUESTION_REWRITES: Record<string, string> = {
  "짝사랑과 나, 썸 Ż 수 있을까": "짝사랑과 나, 썸 탈 수 있을까",
};

const GENERIC_QUESTION_PARTS = new Set([
  "건강 상태",
  "상태나 성격",
  "재산이나 소유물 등의 상태",
  "어떻게 하는 것이 좋을까요",
]);

const getDateParts = () => {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
  };
};

export const formatDisplayText = (value: string) => {
  if (!value) return "";

  const { year, month } = getDateParts();
  let text = value
    .trim()
    .replaceAll("$year", year)
    .replaceAll("$month", month)
    .replaceAll("year년", `${year}년`)
    .replaceAll("month월", `${month}월`);

  text = QUESTION_REWRITES[text] ?? text;
  text = text.replaceAll("Ż", "탈");

  if (text.includes("#")) {
    const parts = text
      .split("#")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      text =
        GENERIC_QUESTION_PARTS.has(parts[0]) && parts.length > 1
          ? parts[1]
          : parts[0];
    }
  }

  return text.replace(/\s+/g, " ").replace(/\s+([?!])/g, "$1").trim();
};
