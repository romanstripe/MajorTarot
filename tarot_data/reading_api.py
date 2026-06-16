"""
타로 API 서버 (실제 DB 구조 기반)
테이블: tarot_content, desc_categories, desc_types

실행: py reading_api.py
주소: http://localhost:8001

엔드포인트:
  GET  /data/categories.json
  GET  /data/questions?group={love|money|daily|future|meeting|mind}
  GET  /data/reading?category={질문}&card={카드명}&direction={정방향|역방향}
  GET  /data/card_desc?card={카드명}&direction={정방향|역방향}
  POST /gemini/reading  (body: JSON)
"""
import json
import os
import sqlite3
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from pathlib import Path
from dotenv import load_dotenv
import re
from collections import Counter
from datetime import datetime

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

DB_PATH     = "tarot.db"   # ← 본인 키로 교체

MAJOR_ARCANA = [
    "광대", "마법사", "고위 여사제", "여왕", "황제",
    "교황", "연인들", "전차", "힘", "은둔자",
    "운명의 수레바퀴", "정의", "매달린 남자", "죽음", "절제",
    "악마", "탑", "별", "달", "태양",
    "심판", "세계",
]

CATEGORY_META = {
    "new_start": {
        "name": "새로운 설렘",
        "description": "썸, 솔로, 새로운 인연",
    },
    "love_classic": {
        "name": "연애와 관계",
        "description": "커플, 결혼, 관계의 흐름",
    },
    "love_again": {
        "name": "이별과 재회",
        "description": "미련, 재회, 다시 사랑할 가능성",
    },
    "money_success": {
        "name": "돈과 성공",
        "description": "재물, 직장, 학업과 성취",
    },
    "find_myself": {
        "name": "나를 찾는 시간",
        "description": "성격, 심리, 나와 타인의 시선",
    },
    "precious_being": {
        "name": "소중한 존재",
        "description": "가족, 반려동물, 일상의 운세",
    },
}

GENERIC_QUESTION_PARTS = {
    "건강 상태",
    "상태나 성격",
    "재산이나 소유물 등의 상태",
    "어떻게 하는 것이 좋을까요",
}

QUESTION_REWRITES = {
    "짝사랑과 나, 썸 Ż 수 있을까": "짝사랑과 나, 썸 탈 수 있을까",
}


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def load_all_categories():
    conn = get_conn()
    rows = conn.execute(
        "SELECT DISTINCT category FROM tarot_content ORDER BY category"
    ).fetchall()
    conn.close()
    return [r["category"] for r in rows]


def get_current_date_parts():
    now = datetime.now()
    return {
        "year": str(now.year),
        "month": str(now.month),
    }


def replace_date_vars(text: str) -> str:
    if not text:
        return text

    parts = get_current_date_parts()
    return (
        text
        .replace("$year", parts["year"])
        .replace("$month", parts["month"])
        .replace("year년", f"{parts['year']}년")
        .replace("month월", f"{parts['month']}월")
    )


def clean_display_text(text: str) -> str:
    if not text:
        return ""

    cleaned = replace_date_vars(text.strip())
    cleaned = QUESTION_REWRITES.get(cleaned, cleaned)
    cleaned = cleaned.replace("Ż", "탈")

    if "#" in cleaned:
        parts = [part.strip() for part in cleaned.split("#") if part.strip()]
        if parts:
            first = parts[0]
            cleaned = parts[1] if first in GENERIC_QUESTION_PARTS and len(parts) > 1 else first

    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+([?!])", r"\1", cleaned)
    return cleaned.strip()


def load_mapped_categories():
    conn = get_conn()
    rows = []
    try:
        rows = conn.execute("""
            SELECT category_id, name, description, question_ids
            FROM categories
            ORDER BY id
        """).fetchall()
    except sqlite3.Error:
        rows = []

    mapped = []
    for row in rows:
        cat_id = row["category_id"]
        meta = CATEGORY_META.get(cat_id, {})
        try:
            question_ids = json.loads(row["question_ids"] or "[]")
        except json.JSONDecodeError:
            question_ids = []

        questions = []
        for question_id in question_ids:
            question = conn.execute(
                "SELECT DISTINCT category FROM tarot_content WHERE id = ? LIMIT 1",
                (question_id,),
            ).fetchone()
            if question:
                raw_text = question["category"]
                questions.append({
                    "id": raw_text,
                    "text": clean_display_text(raw_text),
                })

        mapped.append({
            "id": cat_id,
            "name": meta.get("name", row["name"]),
            "description": meta.get("description", row["description"] or ""),
            "icon": "",
            "questions": questions,
        })

    conn.close()
    return mapped


def group_categories(all_cats):
    mapped = load_mapped_categories()
    if mapped:
        return mapped

    groups = {
        "love":    {"id": "love",    "name": "연애와 관계", "description": "연애, 이별, 재회의 흐름", "icon": "", "questions": []},
        "meeting": {"id": "meeting", "name": "만남과 인연", "description": "새로운 사람과 이어질 가능성", "icon": "", "questions": []},
        "money":   {"id": "money",   "name": "돈과 일", "description": "재물, 직업, 현실적인 고민", "icon": "", "questions": []},
        "future":  {"id": "future",  "name": "미래와 운세", "description": "앞으로의 흐름과 시기", "icon": "", "questions": []},
        "mind":    {"id": "mind",    "name": "속마음", "description": "상대와 나의 심리", "icon": "", "questions": []},
        "daily":   {"id": "daily",   "name": "일상 고민", "description": "생활 속 작고 큰 선택", "icon": "", "questions": []},
    }

    love_kw    = ["연인", "애인", "사랑", "애정", "이별", "헤어", "재회", "고백", "썸", "짝사랑", "남자친구", "여자친구", "사귀"]
    meeting_kw = ["만남", "이상형", "인연", "새로운 사람", "만나게"]
    money_kw   = ["재물", "금전", "돈", "직업", "취업", "이직", "사업", "재정", "로또"]
    mind_kw    = ["속마음", "마음", "심리", "생각", "감정", "느낌"]
    future_kw  = ["운세", "미래", "앞으로", "올해", "월", "년", "운"]

    for cat in all_cats:
        placed = False
        for kw in love_kw:
            if kw in cat:
                groups["love"]["questions"].append({"id": cat, "text": clean_display_text(cat)}); placed = True; break
        if placed: continue
        for kw in meeting_kw:
            if kw in cat:
                groups["meeting"]["questions"].append({"id": cat, "text": clean_display_text(cat)}); placed = True; break
        if placed: continue
        for kw in money_kw:
            if kw in cat:
                groups["money"]["questions"].append({"id": cat, "text": clean_display_text(cat)}); placed = True; break
        if placed: continue
        for kw in mind_kw:
            if kw in cat:
                groups["mind"]["questions"].append({"id": cat, "text": clean_display_text(cat)}); placed = True; break
        if placed: continue
        for kw in future_kw:
            if kw in cat:
                groups["future"]["questions"].append({"id": cat, "text": clean_display_text(cat)}); placed = True; break
        if not placed:
            groups["daily"]["questions"].append({"id": cat, "text": clean_display_text(cat)})

    return list(groups.values())


# ── 기존 해석 데이터 활용 함수 ──────────────────────────────

def load_description_patterns(category: str) -> dict:
    """
    기존 description 파일에서 같은 질문(category)에 대한 
    해석들을 로드해서 공통 패턴/특이점 추출
    """
    try:
        # r3n10이 가장 다양하므로 r3n10 우선 시도
        desc_path = Path("description_r3n10.json")
        if not desc_path.exists():
            desc_path = Path("description_r3n5.json")
        
        if not desc_path.exists():
            return {}
        
        with open(desc_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 해당 질문의 해석들 추출
        if "categories" in data and category in data["categories"]:
            existing_interpretation = data["categories"][category]
            
            # 특이점 추출: 자주 나오는 단어/표현 찾기
            patterns = extract_key_patterns(existing_interpretation)
            
            return {
                "existing": existing_interpretation,
                "patterns": patterns
            }
        
        return {}
    except Exception as e:
        print(f"[패턴 로드 오류] {e}")
        return {}


def extract_key_patterns(text: str) -> list:
    """
    해석 텍스트에서 반복되는 특이점/주제 추출
    """
    # 주요 키워드 표현식 패턴
    patterns = []
    
    # "~카드" 패턴 찾기
    card_patterns = re.findall(r'(\w+\s+카드)', text)
    if card_patterns:
        patterns.append(f"카드 언급: {', '.join(set(card_patterns[:3]))}")
    
    # "~의미" 패턴
    meaning_patterns = re.findall(r'([\w\s]+)(?:를?을?|이?가?)\s+(?:의미|나타내)', text)
    if meaning_patterns:
        top_meanings = Counter(meaning_patterns).most_common(2)
        for meaning, _ in top_meanings:
            patterns.append(f"중요 의미: {meaning.strip()}")
    
    # "지금", "앞으로", "시간" 같은 타임 프레임 단어
    time_keywords = ['지금', '앞으로', '앞서', '일단', '기다', '곧', '점차', '마지막']
    found_times = [kw for kw in time_keywords if kw in text]
    if found_times:
        patterns.append(f"시간관점: {', '.join(found_times[:2])}")
    
    # "행동", "조언", "주의" 같은 실행 지시
    action_keywords = ['행동', '조언', '주의', '조심', '버려', '유지', '자제', '개선']
    found_actions = [kw for kw in action_keywords if kw in text]
    if found_actions:
        patterns.append(f"액션: {', '.join(found_actions[:2])}")
    
    return patterns[:4]  # 상위 4개 특이점만


def call_openai(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    body = json.dumps({
        "model": "gpt-4.1-mini",  # 가볍고 빠름
        "messages": [
            {"role": "system", "content": "당신은 공감 능력이 뛰어난 타로 상담가입니다. 개성 있고 신선한 해석을 제공하세요."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 1.0  # 창의성 극대화
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    return data["choices"][0]["message"]["content"]
    

class TarotAPIHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path
        params = parse_qs(parsed.query)

        try:
            if path == "/data/categories.json":
                self.serve_categories()
            elif path == "/data/questions":
                self.serve_questions(self._param(params, "group"))
            elif path == "/data/reading":
                self.serve_reading(
                    self._param(params, "category"),
                    self._param(params, "card"),
                    self._param(params, "direction", "정방향"),
                    self._param(params, "user_name", "당신"),
                    self._param(params, "partner", "그 사람"),
                )
            elif path == "/data/card_desc":
                self.serve_card_desc(
                    self._param(params, "card"),
                    self._param(params, "direction", "정방향"),
                )
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_error(500, str(e))

    def do_POST(self):
        parsed = urlparse(self.path)
        path   = parsed.path

        try:
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}

            if path == "/gemini/reading":
                self.serve_gemini_reading(body)
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_error(500, str(e))

    # ── GET 엔드포인트 ───────────────────────────────────────

    def serve_categories(self):
        self.send_json(group_categories(load_all_categories()))

    def serve_questions(self, group_id):
        groups = group_categories(load_all_categories())
        target = next((g for g in groups if g["id"] == group_id), None)
        self.send_json(target["questions"] if target else [])

    def serve_reading(self, category, card, direction, user_name, partner):
        if not card:
            self.send_json({"error": "card 파라미터 필요"}); return

        card_type = f"{card} {direction}" if direction else card
        conn = get_conn()
        content = source = None

        if category:
            row = conn.execute("""
                SELECT content FROM tarot_content
                WHERE category = ? AND card_type = ?
                ORDER BY RANDOM() LIMIT 1
            """, (category, card_type)).fetchone()
            if row: content, source = row["content"], "csv_content"

        if not content:
            row = conn.execute("""
                SELECT content FROM tarot_content
                WHERE card_type = ? ORDER BY RANDOM() LIMIT 1
            """, (card_type,)).fetchone()
            if row: content, source = row["content"], "csv_fallback"

        if not content and category:
            row = conn.execute("""
                SELECT content FROM desc_categories
                WHERE category = ? ORDER BY RANDOM() LIMIT 1
            """, (category,)).fetchone()
            if row: content, source = row["content"], "desc_categories"

        if not content:
            row = conn.execute("""
                SELECT content FROM desc_types
                WHERE card_type = ? ORDER BY RANDOM() LIMIT 1
            """, (card_type,)).fetchone()
            if row: content, source = row["content"], "desc_types"

        conn.close()

        if not content:
            content = f"{card_type} 카드가 나왔습니다."
            source  = "fallback"

        content = self._replace_vars(content, user_name, partner)
        self.send_json({
            "card_type": card_type, "card_name": card,
            "direction": direction, "category": category,
            "content": content, "source": source,
        })

    def serve_card_desc(self, card, direction):
        card_type = f"{card} {direction}" if direction else card
        conn = get_conn()
        row  = conn.execute("""
            SELECT content FROM desc_types
            WHERE card_type = ? ORDER BY RANDOM() LIMIT 1
        """, (card_type,)).fetchone()
        conn.close()
        self.send_json({"card_type": card_type, "description": row["content"] if row else ""})

    # ── POST 엔드포인트 ──────────────────────────────────────

    def serve_gemini_reading(self, body):
        """
        body: {
          category: str,
          cards: [{card, direction}, ...],
          readings: [{content, source} | null, ...]
        }
        """
        category  = body.get("category", "")
        display_category = clean_display_text(category)
        cards     = body.get("cards", [])
        readings  = body.get("readings", [])
        positions = ["과거", "현재", "미래"]

        # 기존 패턴 로드
        pattern_data = load_description_patterns(category)
        pattern_hints = "\n".join(pattern_data.get("patterns", []))

        card_descriptions = []
        for i, card in enumerate(cards):
            reading      = readings[i] if i < len(readings) else None
            direction_ko = "정방향" if card.get("direction") == "normal" else "역방향"
            label        = positions[i] if i < len(positions) else f"{i+1}번째"
            
            # 각 카드별 더 풍부한 설명 구성
            card_text = f"[{label}] {card['card']} {direction_ko}"
            
            if reading and reading.get("source") == "csv_content" and reading.get("content"):
                # CSV의 풀이를 상세하게 포함
                card_text += f"\n  풀이 참고: {reading['content'][:150]}..."
            
            card_descriptions.append(card_text)

        prompt = f"""
당신은 정교한 감정 공감 능력을 가진 타로 상담가입니다.
이미 수백 번 검증된 우리 데이터에서 발견된 패턴과 특이점을 알고 있습니다.

[질문]
{display_category}

[3카드 구조 - 과거 → 현재 → 미래]
{chr(10).join(card_descriptions)}

[우리 데이터에서 발견된 특이점]
{pattern_hints if pattern_hints else '(데이터 기반 특이점)'}

[핵심 해석 전략]

1. 카드 간 '대비와 반향' 찾기
   - 첫 카드와 마지막 카드를 비교: 같은 방향? 반대? → 이는 흐름의 방향성을 암시
   - 중간 카드(현재)가 중개자 역할을 하는가? → 변화의 징조 포착
   - 예: 악마(과거) → 별(현재) → 태양(미래) 라면 "속박에서 해방되는 여정"

2. 카드의 '숨겨진 대화' 들려주기
   - 단순 카드 설명이 아님. 카드들이 무엇을 말하려 하는지 느껴짐
   - "당신이 과거에 심었던 씨앗이 지금 싹을 틔우고 있어요"
   - "현재의 이 정체 상태는 다음 단계로 가기 전 필요한 숨 고르기예요"

3. 질문자의 '지금 이 순간'을 중심으로
   - 질문의 감정 톤 파악: 불안한가? 기대하는가? 혼란한가?
   - 그 감정에서 보일 만한 구체적인 다음 단계 제시
   - 타이밍 힌트: "다음 2주간", "이번 분기", "올 여름" 같은 시간 단위 제시

4. 매우 구체적인 '액션 조언'
   - "조금 더 기다려보세요" 말고
   - "다음 2주간은 새로운 시도보다 관계를 돌보세요. 그 후에 움직여도 늦지 않습니다" 이렇게

5. 표현 스타일
   - "~한 흐름이", "~에너지가", "~가능성이" 같은 타로 표현
   - 심리학적 깊이 추가: "무의식적 두려움", "성장의 통과의례", "자기 확신의 시간"
   - 친근한 어조로 (해요/습니다체 자연스럽게 섞음)
   - 불확실성 표현 활용 ("~일 수 있어요", "~처럼 보입니다")

6. 절대 금지 사항
   - "과거:", "현재:", "미래:" 이렇게 나누기 금지
   - 3개 항목의 리스트 형식 금지
   - "카드는 ~를 의미합니다" 같은 건조한 정의 금지
   - 카드 설명을 그대로 복사-붙여넣기 금지

7. 길이와 형식
   - 350~550자, 하나의 자연스러운 단락으로
   - 마치 친구와 대화하는 느낌
   - 끝은 따뜻하거나 희망적인 톤으로 마무리

8. 데이터 활용 원칙
   - 제공된 풀이 참고는 의미만 재해석해서 자연스럽게 녹임
   - 우리 데이터에서 발견된 패턴을 참고해서 차별화된 각도로 해석
   - 그 카드가 이 질문과 만날 때 특별히 의미하는 것이 뭘까?

자연스럽게 흘러가는 하나의 이야기처럼 작성하세요.
"""

        try:
            result = call_openai(prompt)
            self.send_json({"content": result})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[OpenAI HTTP 오류] {e.code}: {err_body}")
            self.send_json({"error": f"OpenAI {e.code}: {err_body}"}, status=500)
        except Exception as e:
            print(f"[OpenAI 오류] {e}")
            self.send_json({"error": str(e)}, status=500)

    # ── 유틸 ────────────────────────────────────────────────

    def _param(self, params, key, default=None):
        val = params.get(key, [default])[0]
        return unquote(val) if val else default

    def _replace_vars(self, text, user_name="당신", partner="그 사람"):
        return (
            replace_date_vars(text)
            .replace("$user_name", user_name)
            .replace("$partner_name", partner)
            .replace("$partner_gender", partner)
            .replace("홍길순", user_name)
            .replace("홍길동", partner)
        )

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._set_cors()
        self.end_headers()
        self.wfile.write(body)

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")


def run_server():
    port = 8001
    server = HTTPServer(("0.0.0.0", port), TarotAPIHandler)
    print(f"🌙 타로 API 실행 중... http://localhost:{port}")
    print(f"엔드포인트: /data/categories.json, /data/reading, /gemini/reading")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
