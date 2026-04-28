"""
타로 데이터 통합 파이프라인 (A)
CSV 3개 + description JSON 6개 → tarot.db (SQLite)

사용법:
    pip install pandas
    python tarot_pipeline.py

이 스크립트와 같은 폴더에 아래 파일이 있어야 합니다:
    train.csv, validation.csv, test.csv
    description_r1n5.json, description_r1n10.json
    description_r2n1.json, description_r2n2.json
    description_r3n5.json, description_r3n10.json
"""

import json
import re
import sqlite3
import pandas as pd
from pathlib import Path
from typing import Tuple, Optional

DB_PATH = "tarot.db"

CSV_FILES = {
    "train":      "train.csv",
    "validation": "validation.csv",
    "test":       "test.csv",
}

DESCRIPTION_FILES = [
    "description_r1n5.json",
    "description_r1n10.json",
    "description_r2n1.json",
    "description_r2n2.json",
    "description_r3n5.json",
    "description_r3n10.json",
]


# ──────────────────────────────────────────────────────────────
# 1. DB 초기화
# ──────────────────────────────────────────────────────────────
def init_db(conn: sqlite3.Connection):
    conn.executescript("""
    -- ① CSV 운세 텍스트 (핵심 서비스 컨텐츠)
    CREATE TABLE IF NOT EXISTS tarot_content (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        split       TEXT NOT NULL,      -- train / validation / test
        category    TEXT NOT NULL,      -- 질문 템플릿 (예: 지금 나의 재물운은)
        card_name   TEXT NOT NULL,      -- 카드 이름 (예: 탑)
        direction   TEXT,               -- 정방향 / 역방향 / NULL
        card_type   TEXT NOT NULL,      -- 카드명+방향 (예: 탑 정방향)
        content     TEXT NOT NULL       -- 실제 운세 풀이 텍스트
    );

    -- ② description JSON: 질문별 풀이 (AI 생성 6버전)
    CREATE TABLE IF NOT EXISTS desc_categories (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file TEXT NOT NULL,      -- 원본 파일명
        round       TEXT NOT NULL,      -- r1 / r2 / r3
        n_batch     TEXT NOT NULL,      -- n5 / n10 / n1 / n2
        category    TEXT NOT NULL,      -- 질문 텍스트
        content     TEXT NOT NULL       -- 풀이 텍스트
    );

    -- ③ description JSON: 카드 자체 설명 (AI 생성 6버전)
    CREATE TABLE IF NOT EXISTS desc_types (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file TEXT NOT NULL,
        round       TEXT NOT NULL,
        n_batch     TEXT NOT NULL,
        card_type   TEXT NOT NULL,      -- 예: 광대 / 광대 정방향 / 광대 역방향
        card_name   TEXT NOT NULL,      -- 예: 광대
        direction   TEXT,               -- 정방향 / 역방향 / NULL
        content     TEXT NOT NULL
    );

    -- 조회 인덱스
    CREATE INDEX IF NOT EXISTS idx_content_lookup
        ON tarot_content(category, card_type);
    CREATE INDEX IF NOT EXISTS idx_content_card
        ON tarot_content(card_type);
    CREATE INDEX IF NOT EXISTS idx_desc_cat
        ON desc_categories(category);
    CREATE INDEX IF NOT EXISTS idx_desc_type
        ON desc_types(card_type);
    """)
    conn.commit()
    print("✅ DB 테이블 생성 완료")


# ──────────────────────────────────────────────────────────────
# 헬퍼
# ──────────────────────────────────────────────────────────────
def parse_filename(fname: str) -> tuple[str, str]:
    """description_r1n5.json → ('r1', 'n5')"""
    stem = Path(fname).stem           # description_r1n5
    part = stem.split("_")[-1]        # r1n5
    m = re.match(r"(r\d+)(n\d+)", part)
    if m:
        return m.group(1), m.group(2)
    return "unknown", "unknown"


def parse_card_type(card_type: str) -> Tuple[str, Optional[str]]:
    """
    '탑 정방향' → ('탑', '정방향')
    '탑 역방향' → ('탑', '역방향')
    '탑'        → ('탑', None)
    """
    card_type = card_type.strip()
    if card_type.endswith(" 정방향"):
        return card_type[:-4].strip(), "정방향"
    if card_type.endswith(" 역방향"):
        return card_type[:-4].strip(), "역방향"
    return card_type, None


# ──────────────────────────────────────────────────────────────
# 2. CSV 로드 → tarot_content
# ──────────────────────────────────────────────────────────────
def load_csv(conn: sqlite3.Connection):
    rows = []
    for split, fpath in CSV_FILES.items():
        if not Path(fpath).exists():
            print(f"  ⚠️  {fpath} 없음, 건너뜀")
            continue

        df = pd.read_csv(fpath)
        print(f"  📄 {fpath}: {len(df)}행")

        for _, row in df.iterrows():
            v1 = str(row.get("value1", "")).strip()
            v2 = str(row.get("value2", "")).strip()

            if not v1 or v1 == "nan":
                continue

            # card_type 조합 (value2가 없으면 카드명만)
            if v2 and v2 not in ("nan", ""):
                card_type = f"{v1} {v2}"
            else:
                card_type = v1

            card_name, direction = parse_card_type(card_type)

            content = str(row.get("content", "")).strip()
            if not content or content == "nan":
                continue

            category = str(row.get("categories", "")).strip()

            rows.append((
                split,
                category,
                card_name,
                direction,
                card_type,
                content,
            ))

    conn.executemany("""
        INSERT INTO tarot_content
            (split, category, card_name, direction, card_type, content)
        VALUES (?, ?, ?, ?, ?, ?)
    """, rows)
    conn.commit()
    print(f"  ✅ tarot_content 저장: {len(rows)}건\n")


# ──────────────────────────────────────────────────────────────
# 3. description JSON → desc_categories + desc_types
# ──────────────────────────────────────────────────────────────
def load_descriptions(conn: sqlite3.Connection):
    cat_rows  = []
    type_rows = []

    for fname in DESCRIPTION_FILES:
        if not Path(fname).exists():
            print(f"  ⚠️  {fname} 없음, 건너뜀")
            continue

        rnd, nbatch = parse_filename(fname)

        with open(fname, "r", encoding="utf-8") as f:
            data = json.load(f)

        # categories: { 질문: 풀이텍스트 }
        categories = data.get("categories", {})
        for category, content in categories.items():
            if isinstance(content, str) and content.strip():
                cat_rows.append((fname, rnd, nbatch, category, content.strip()))

        # types: { 카드타입: 설명텍스트 }
        types = data.get("types", {})
        for card_type, content in types.items():
            if isinstance(content, str) and content.strip():
                card_name, direction = parse_card_type(card_type)
                type_rows.append((
                    fname, rnd, nbatch,
                    card_type, card_name, direction,
                    content.strip()
                ))

        print(f"  📄 {fname}: categories {len(categories)}개, types {len(types)}개")

    conn.executemany("""
        INSERT INTO desc_categories
            (source_file, round, n_batch, category, content)
        VALUES (?, ?, ?, ?, ?)
    """, cat_rows)

    conn.executemany("""
        INSERT INTO desc_types
            (source_file, round, n_batch, card_type, card_name, direction, content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, type_rows)

    conn.commit()
    print(f"  ✅ desc_categories 저장: {len(cat_rows)}건")
    print(f"  ✅ desc_types 저장: {len(type_rows)}건\n")


# ──────────────────────────────────────────────────────────────
# 4. 검증
# ──────────────────────────────────────────────────────────────
def validate(conn: sqlite3.Connection):
    print("=" * 50)
    print("📊 DB 통계")
    print("=" * 50)

    tables = ["tarot_content", "desc_categories", "desc_types"]
    for table in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count}건")

    print()

    # 카드별 컨텐츠 수
    print("📋 카드별 운세 컨텐츠 수 (tarot_content, train만):")
    rows = conn.execute("""
        SELECT card_type, COUNT(*) as cnt
        FROM tarot_content
        WHERE split = 'train'
        GROUP BY card_type
        ORDER BY cnt DESC
        LIMIT 10
    """).fetchall()
    for card_type, cnt in rows:
        print(f"  {card_type}: {cnt}건")

    print()

    # 질문 카테고리 수
    cat_count = conn.execute(
        "SELECT COUNT(DISTINCT category) FROM tarot_content"
    ).fetchone()[0]
    print(f"📋 고유 질문 카테고리 수: {cat_count}개")

    # 카드 종류 수
    card_count = conn.execute(
        "SELECT COUNT(DISTINCT card_type) FROM tarot_content"
    ).fetchone()[0]
    print(f"📋 고유 카드타입 수: {card_count}개")


# ──────────────────────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────────────────────
def main():
    print(f"\n🔮 타로 데이터 파이프라인 시작")
    print(f"   저장 위치: {DB_PATH}\n")

    # DB가 이미 있으면 삭제 후 재생성
    if Path(DB_PATH).exists():
        Path(DB_PATH).unlink()
        print("  🗑️  기존 DB 삭제\n")

    conn = sqlite3.connect(DB_PATH)

    print("[1/3] DB 초기화")
    init_db(conn)

    print("[2/3] CSV 로드")
    load_csv(conn)

    print("[3/3] description JSON 로드")
    load_descriptions(conn)

    validate(conn)
    conn.close()

    size_kb = Path(DB_PATH).stat().st_size / 1024
    print(f"\n✅ 완료! DB 크기: {size_kb:.1f} KB → {DB_PATH}")


if __name__ == "__main__":
    main()