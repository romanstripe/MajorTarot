"""
타로 풀이 생성 엔진 (B)
질문 + 카드 + 사용자 정보 → 운세 텍스트 반환

사용법:
    from tarot_engine import TarotEngine

    engine = TarotEngine("tarot.db")

    result = engine.get_reading(
        category="지금 나의 재물운은 어떨까",
        card_type="탑 정방향",
        user_name="홍길동",
    )
    print(result)
"""

import random
import re
import sqlite3
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Tuple, Optional, List, Union  # 이 줄을 추가하세요


# ──────────────────────────────────────────────────────────────
# 데이터 클래스
# ──────────────────────────────────────────────────────────────
@dataclass
class TarotResult:
    card_type: str          # 예: 탑 정방향
    card_name: str          # 예: 탑
    direction: Optional[str]   # 정방향 / 역방향 / None
    category: str           # 질문 템플릿
    content: str            # 최종 운세 텍스트
    source: str             # csv_content / desc_categories / desc_types


# ──────────────────────────────────────────────────────────────
# 메인 엔진
# ──────────────────────────────────────────────────────────────
class TarotEngine:
    # 22장 메이저 아르카나
    MAJOR_ARCANA = [
        "광대", "마법사", "고위 여사제", "여왕", "황제",
        "교황", "연인들", "전차", "힘", "은둔자",
        "운명의 수레바퀴", "정의", "매달린 남자", "죽음", "절제",
        "악마", "탑", "별", "달", "태양",
        "심판", "세계",
    ]
    DIRECTIONS = ["정방향", "역방향"]

    def __init__(self, db_path: str = "tarot.db"):
        if not Path(db_path).exists():
            raise FileNotFoundError(
                f"DB 파일을 찾을 수 없습니다: {db_path}\n"
                "먼저 tarot_pipeline.py를 실행하세요."
            )
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._category_list = self._load_categories()

    def close(self):
        self.conn.close()

    # ──────────────────────────────────────
    # 공개 API
    # ──────────────────────────────────────
    def draw_card(self) -> str:
        """카드 랜덤 뽑기 → '탑 정방향' 형태 반환"""
        card = random.choice(self.MAJOR_ARCANA)
        direction = random.choice(self.DIRECTIONS)
        return f"{card} {direction}"

    def get_categories(self) -> list[str]:
        """사용 가능한 질문 목록 반환"""
        return self._category_list

    def get_reading(
        self,
        category: str,
        card_type: str,
        user_name: str = "당신",
        partner_name: str = "그 사람",
        partner_gender: str = "그 사람",
        year: str = "",
        month: str = "",
        **kwargs,
    ) -> TarotResult:
        """
        핵심 메서드: 질문 + 카드 → 운세 풀이 반환

        우선순위:
          1. tarot_content (CSV, 실제 서비스 데이터)
          2. desc_categories (JSON, AI 생성 풀이)
          3. desc_types (JSON, 카드 기본 설명)
        """
        card_name, direction = self._parse_card_type(card_type)

        # 질문을 DB에 있는 가장 유사한 카테고리로 매핑
        matched_category = self._match_category(category)

        content, source = self._fetch_content(
            matched_category, card_type, card_name
        )

        # 변수 치환
        content = self._replace_vars(
            content,
            user_name=user_name,
            partner_name=partner_name,
            partner_gender=partner_gender,
            year=year,
            month=month,
        )

        return TarotResult(
            card_type=card_type,
            card_name=card_name,
            direction=direction,
            category=category,
            content=content,
            source=source,
        )

    def get_card_description(self, card_type: str) -> Optional[str]:
        """카드 자체 설명 반환 (types 테이블)"""
        rows = self.conn.execute("""
            SELECT content FROM desc_types
            WHERE card_type = ?
            ORDER BY RANDOM() LIMIT 1
        """, (card_type,)).fetchall()

        if rows:
            return rows[0]["content"]

        # 정/역방향 없이 카드명만으로도 시도
        card_name, _ = self._parse_card_type(card_type)
        rows = self.conn.execute("""
            SELECT content FROM desc_types
            WHERE card_name = ?
            ORDER BY RANDOM() LIMIT 1
        """, (card_name,)).fetchall()

        return rows[0]["content"] if rows else None

    def get_multiple_readings(
        self,
        category: str,
        card_type: str,
        n: int = 3,
        **kwargs,
    ) -> list[TarotResult]:
        """같은 카드+질문 조합의 풀이 n개 반환 (다양성 제공용)"""
        results = []
        seen = set()

        rows = self.conn.execute("""
            SELECT content FROM tarot_content
            WHERE category = ? AND card_type = ?
            ORDER BY RANDOM()
            LIMIT ?
        """, (category, card_type, n * 2)).fetchall()

        for row in rows:
            c = row["content"]
            if c not in seen:
                seen.add(c)
                result = self.get_reading(category, card_type, **kwargs)
                result.content = self._replace_vars(c, **kwargs)
                results.append(result)
            if len(results) >= n:
                break

        return results

    # ──────────────────────────────────────
    # 내부 메서드
    # ──────────────────────────────────────
    def _load_categories(self) -> list[str]:
        rows = self.conn.execute(
            "SELECT DISTINCT category FROM tarot_content ORDER BY category"
        ).fetchall()
        return [r["category"] for r in rows]

    def _parse_card_type(self, card_type: str) -> Tuple[str, Optional[str]]:
        card_type = card_type.strip()
        if card_type.endswith(" 정방향"):
            return card_type[:-4].strip(), "정방향"
        if card_type.endswith(" 역방향"):
            return card_type[:-4].strip(), "역방향"
        return card_type, None

    def _match_category(self, category: str) -> str:
        """입력 질문을 DB에 있는 가장 유사한 카테고리로 매핑"""
        if category in self._category_list:
            return category

        # 유사도 기반 매칭 (간단한 fuzzy)
        best, best_score = category, 0.0
        for cat in self._category_list:
            score = SequenceMatcher(None, category, cat).ratio()
            if score > best_score:
                best_score = score
                best = cat

        return best

    def _fetch_content(
        self,
        category: str,
        card_type: str,
        card_name: str,
    ) -> tuple[str, str]:
        """
        우선순위에 따라 content 조회
        반환: (content 텍스트, source 이름)
        """

        # 1순위: CSV (tarot_content) — 정확히 일치
        row = self.conn.execute("""
            SELECT content FROM tarot_content
            WHERE category = ? AND card_type = ?
            ORDER BY RANDOM() LIMIT 1
        """, (category, card_type)).fetchone()
        if row:
            return row["content"], "csv_content"

        # 1순위 완화: 같은 카드, 다른 질문의 CSV 컨텐츠
        row = self.conn.execute("""
            SELECT content FROM tarot_content
            WHERE card_type = ?
            ORDER BY RANDOM() LIMIT 1
        """, (card_type,)).fetchone()
        if row:
            return row["content"], "csv_content_fallback"

        # 2순위: desc_categories
        row = self.conn.execute("""
            SELECT content FROM desc_categories
            WHERE category = ?
            ORDER BY RANDOM() LIMIT 1
        """, (category,)).fetchone()
        if row:
            return row["content"], "desc_categories"

        # 3순위: desc_types (카드 기본 설명)
        row = self.conn.execute("""
            SELECT content FROM desc_types
            WHERE card_type = ?
            ORDER BY RANDOM() LIMIT 1
        """, (card_type,)).fetchone()
        if row:
            return row["content"], "desc_types"

        # 최후 fallback
        return (
            f"{card_type} 카드가 나왔습니다. 카드의 에너지를 받아들이고 직관을 믿어보세요.",
            "fallback",
        )

    def _replace_vars(
        self,
        text: str,
        user_name: str = "당신",
        partner_name: str = "그 사람",
        partner_gender: str = "그 사람",
        year: str = "",
        month: str = "",
        **kwargs,
    ) -> str:
        """템플릿 변수 치환"""
        replacements = {
            "$user_name": user_name,
            "$partner_name": partner_name,
            "$partner_gender": partner_gender,
            "$year": year,
            "$month": month,
            # 더미 이름도 치환
            "홍길순": user_name,
            "홍길동": partner_name,
        }
        for placeholder, value in replacements.items():
            if value:  # 값이 있을 때만 치환
                text = text.replace(placeholder, value)
        return text


# ──────────────────────────────────────────────────────────────
# 사용 예시 (직접 실행 시)
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    engine = TarotEngine("tarot.db")

    print("=" * 60)
    print("🔮 타로 엔진 테스트")
    print("=" * 60)

    # 1. 카드 뽑기
    card = engine.draw_card()
    print(f"\n🃏 뽑은 카드: {card}")

    # 2. 질문 목록 일부 출력
    categories = engine.get_categories()
    print(f"\n📋 사용 가능한 질문 수: {len(categories)}개")
    print("  예시:")
    for cat in categories[:5]:
        print(f"    - {cat}")

    # 3. 운세 조회
    print("\n" + "─" * 60)
    test_cases = [
        {
            "category": "지금 나의 재물운은 어떨까",
            "card_type": "탑 정방향",
            "user_name": "김민준",
        },
        {
            "category": "나에 대한 그 사람의 속마음은",
            "card_type": "교황 역방향",
            "user_name": "이수진",
            "partner_name": "박지호",
            "partner_gender": "그 남자",
        },
        {
            "category": "이상형을 만날 수 있는 방법은 뭘까",
            "card_type": "광대 정방향",
            "user_name": "정예린",
        },
    ]

    for tc in test_cases:
        result = engine.get_reading(**tc)
        print(f"\n질문: {result.category}")
        print(f"카드: {result.card_type} | 출처: {result.source}")
        print(f"풀이: {result.content[:150]}...")
        print("─" * 60)

    # 4. 카드 설명 조회
    desc = engine.get_card_description("광대 정방향")
    if desc:
        print(f"\n📖 광대 정방향 카드 설명:\n{desc[:150]}...")

    engine.close()
    print("\n✅ 테스트 완료")