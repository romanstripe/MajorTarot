"""
카테고리 데이터를 JSON으로 내보내기 (React 앱에서 사용)
"""

import json
import sqlite3
from pathlib import Path

def export_categories():
    """카테고리 데이터를 JSON으로 내보내기"""
    db_path = "tarot.db"
    
    if not Path(db_path).exists():
        print(f"❌ {db_path} 파일을 찾을 수 없습니다.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 카테고리 데이터 조회
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    
    categories = []
    for row in rows:
        categories.append({
            "category_id": row[1],
            "name": row[2],
            "description": row[3],
            "question_ids": json.loads(row[4]) if row[4] else []
        })
    
    # 카테고리별 질문 추출
    for category in categories:
        question_ids = category["question_ids"]
        questions = []
        
        for q_id in question_ids:
            # tarot_content 테이블에서 질문 조회
            cursor.execute("""
                SELECT DISTINCT category FROM tarot_content 
                WHERE id = ? 
                LIMIT 1
            """, (q_id,))
            
            result = cursor.fetchone()
            if result:
                questions.append({
                    "id": str(q_id),
                    "text": result[0]
                })
        
        category["questions"] = questions
    
    conn.close()
    
    # JSON 파일로 저장
    output_dir = Path("../tarot-app/public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 전체 카테고리 파일
    with open(output_dir / "categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
    
    # 카테고리별 질문 파일
    for category in categories:
        category_id = category["category_id"]
        with open(output_dir / f"questions_{category_id}.json", "w", encoding="utf-8") as f:
            json.dump(category["questions"], f, ensure_ascii=False, indent=2)
    
    print("✅ 카테고리 데이터 내보내기 완료!")
    print(f"📁 저장 위치: {output_dir}")
    
    # 요약 출력
    for category in categories:
        print(f"  📋 {category['name']}: {len(category['questions'])}개 질문")

if __name__ == "__main__":
    export_categories()
