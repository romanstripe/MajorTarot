"""
카테고리 ID 매핑 스크립트
사용자가 제공한 6개 카테고리와 해당 ID 번호를 기반으로 DB 업데이트
"""

import sqlite3
from pathlib import Path

# 카테고리 정의
CATEGORIES = {
    "new_start": {
        "name": "새로운 설렘 (썸 / 솔로 / 인연)",
        "description": "새로운 시작과 인연을 만나는 과정에 집중한 리스트입니다.",
        "ids": [1, 4, 9, 14, 22, 28, 30, 40, 48, 52, 53, 54, 59, 61, 71, 73, 75, 79, 81, 102, 108, 130]
    },
    "love_classic": {
        "name": "연애의 정석 (커플 / 결혼 / 관계)",
        "description": "현재 관계를 유지하고 발전시키거나, 그 안의 고민을 다룹니다.",
        "ids": [8, 23, 25, 27, 34, 35, 36, 37, 38, 39, 41, 44, 45, 55, 62, 63, 66, 89, 91, 93, 104, 114]
    },
    "love_again": {
        "name": "다시 사랑할까 (이별 / 재회 / 미련)",
        "description": "이별의 아픔을 달래고 다시 만날 가능성을 점쳐보는 리스트입니다.",
        "ids": [3, 12, 15, 16, 20, 29, 47, 56, 64, 65, 67, 68, 69, 85, 86, 87, 94, 97, 99, 101, 106, 120]
    },
    "money_success": {
        "name": "돈과 성공 (재물 / 직장 / 학업)",
        "description": "금전적인 풍요와 사회적 성공, 시험 합격을 다룹니다.",
        "ids": [7, 11, 13, 17, 18, 19, 24, 26, 31, 32, 43, 46, 60, 74, 77, 90, 105, 107, 109, 126, 127]
    },
    "find_myself": {
        "name": "나를 찾는 시간 (성격 / 심리 / 관계)",
        "description": "내 내면과 타인이 보는 나, 친구 관계 등을 깊게 들여다봅니다.",
        "ids": [33, 42, 49, 70, 72, 82, 96, 100, 103, 110, 112, 113, 115, 116, 117, 119, 121, 122, 123, 125, 129]
    },
    "precious_being": {
        "name": "소중한 존재 (반려동물 / 가족 / 운세)",
        "description": "반려동물, 가족, 꿈 해몽 및 오늘의 운세 등 일상의 소중한 것들입니다.",
        "ids": [2, 5, 6, 10, 21, 50, 51, 57, 58, 76, 80, 83, 84, 88, 92, 95, 98, 111, 118, 124, 128]
    }
}

def update_categories():
    """tarot.db의 카테고리 테이블 업데이트"""
    db_path = "tarot.db"
    
    if not Path(db_path).exists():
        print(f"❌ {db_path} 파일을 찾을 수 없습니다.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 기존 카테고리 테이블이 있으면 삭제
    cursor.execute("DROP TABLE IF EXISTS categories")
    
    # 새 카테고리 테이블 생성
    cursor.execute("""
    CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        question_ids TEXT  -- JSON 형태로 ID 목록 저장
    )
    """)
    
    # 카테고리 데이터 삽입
    import json
    for cat_id, info in CATEGORIES.items():
        cursor.execute("""
        INSERT INTO categories (category_id, name, description, question_ids)
        VALUES (?, ?, ?, ?)
        """, (
            cat_id,
            info["name"],
            info["description"],
            json.dumps(info["ids"])
        ))
    
    conn.commit()
    conn.close()
    
    print("✅ 카테고리 테이블 업데이트 완료!")
    
    # 확인 출력
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    
    print("\n📋 등록된 카테고리:")
    for row in rows:
        print(f"  ID: {row[1]}, 이름: {row[2]}")
    
    conn.close()

if __name__ == "__main__":
    update_categories()
