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


def group_categories(all_cats):
    groups = {
        "love":    {"id": "love",    "name": "연애/이별",   "icon": "💕", "questions": []},
        "meeting": {"id": "meeting", "name": "만남/인연",   "icon": "🌹", "questions": []},
        "money":   {"id": "money",   "name": "재물/직업",   "icon": "💰", "questions": []},
        "future":  {"id": "future",  "name": "미래/운세",   "icon": "🔮", "questions": []},
        "mind":    {"id": "mind",    "name": "심리/속마음", "icon": "🧠", "questions": []},
        "daily":   {"id": "daily",   "name": "일상/고민",   "icon": "🌟", "questions": []},
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
                groups["love"]["questions"].append(cat); placed = True; break
        if placed: continue
        for kw in meeting_kw:
            if kw in cat:
                groups["meeting"]["questions"].append(cat); placed = True; break
        if placed: continue
        for kw in money_kw:
            if kw in cat:
                groups["money"]["questions"].append(cat); placed = True; break
        if placed: continue
        for kw in mind_kw:
            if kw in cat:
                groups["mind"]["questions"].append(cat); placed = True; break
        if placed: continue
        for kw in future_kw:
            if kw in cat:
                groups["future"]["questions"].append(cat); placed = True; break
        if not placed:
            groups["daily"]["questions"].append(cat)

    return list(groups.values())


def call_openai(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    body = json.dumps({
        "model": "gpt-4.1-mini",  # 가볍고 빠름
        "messages": [
            {"role": "system", "content": "당신은 따뜻한 타로 상담가입니다."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.8
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
        self.send_json([{"id": q, "text": q} for q in target["questions"]] if target else [])

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
        cards     = body.get("cards", [])
        readings  = body.get("readings", [])
        positions = ["과거", "현재", "미래"]

        card_descriptions = []
        for i, card in enumerate(cards):
            reading      = readings[i] if i < len(readings) else None
            direction_ko = "정방향" if card.get("direction") == "normal" else "역방향"
            label        = positions[i] if i < len(positions) else f"{i+1}번째"

            if reading and reading.get("source") == "csv_content" and reading.get("content"):
                card_descriptions.append(
                    f"[{label}] {card['card']} {direction_ko}\n풀이 참고: {reading['content']}"
                )
            else:
                card_descriptions.append(f"[{label}] {card['card']} {direction_ko}")

        prompt = f"""
당신은 공감 능력이 뛰어난 타로 상담가입니다.

질문: {category}

뽑힌 카드:
{chr(10).join(card_descriptions)}

아래 기준을 반드시 지켜서 해석하세요:

1. 전체 흐름 중심
- 과거 → 현재 → 미래의 흐름을 하나의 이야기처럼 자연스럽게 이어주세요
- 각 카드를 따로 설명하지 말고 서로 연결해서 해석하세요

2. 감정 공감
- 질문자의 상황에 공감하는 문장으로 시작하세요
- "요즘 마음이 많이 복잡하셨던 것 같아요" 같은 자연스러운 공감 표현 포함

3. 타로다운 표현
- “~의 흐름이 보입니다”
- “~한 에너지가 느껴집니다”
- “~의 가능성이 열려 있습니다”
이런 식의 은유적이고 부드러운 표현 사용

4. 조언 포함
- 단순 결과 말고, 앞으로 어떻게 하면 좋을지 현실적인 조언을 포함하세요

5. 말투
- 친근하고 부드러운 해요체
- 너무 단정짓지 말고 여지를 남기는 표현 사용

6. 길이
- 400~600자
- 하나의 자연스러운 단락으로 작성 (줄바꿈 없이)

7. 참고 데이터 활용
- 풀이 참고가 있는 경우 그 의미를 자연스럽게 녹여서 사용
- 없는 경우 카드의 일반적인 의미로 보완

절대 금지:
- "과거:", "현재:" 같은 딱딱한 구분
- 리스트 형식
- 기계적인 설명

자연스럽고 사람과 대화하는 느낌으로 작성하세요."""

        try:
            result = call_openai(prompt)
            self.send_json({"content": result})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[Gemini HTTP 오류] {e.code}: {err_body}")
            self.send_json({"error": f"Gemini {e.code}: {err_body}"}, status=500)
        except Exception as e:
            print(f"[Gemini 오류] {e}")
            self.send_json({"error": str(e)}, status=500)

    # ── 유틸 ────────────────────────────────────────────────

    def _param(self, params, key, default=None):
        val = params.get(key, [default])[0]
        return unquote(val) if val else default

    def _replace_vars(self, text, user_name="당신", partner="그 사람"):
        return (
            text
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

    def log_message(self, fmt, *args):
        print(f"[API] {self.address_string()} {fmt % args}")


def run(port=8001):
    if not Path(DB_PATH).exists():
        print(f"❌ {DB_PATH} 없음 — 먼저 tarot_pipeline.py 실행하세요")
        return

    httpd = HTTPServer(("", port), TarotAPIHandler)
    print(f"🔮 타로 API 서버: http://localhost:{port}")
    print("엔드포인트:")
    print("  GET  /data/categories.json")
    print("  GET  /data/questions?group={love|money|daily|future|meeting|mind}")
    print("  GET  /data/reading?category={질문}&card={카드명}&direction={정방향|역방향}")
    print("  POST /gemini/reading  ← Gemini 통합 풀이")
    print("Ctrl+C 로 종료\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 서버 종료")
        httpd.server_close()


if __name__ == "__main__":
    run()