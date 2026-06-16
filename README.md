<div align="center">

> **Major Arcana + AI = MajorTarot**  
> 카드의 흐름을 기반으로 직관적인 해석을 제공하는 AI 타로 상담 서비스

[![Live Demo](https://img.shields.io/badge/Live_Demo-major--tarot.vercel.app-8B5CF6?style=for-the-badge&logo=vercel)](https://major-tarot-tk3l.vercel.app/)

</div>

---

## 프로젝트 소개

MajorTarot은 사용자가 선택한 질문과 뽑은 카드 조합을 바탕으로 자연스럽고 통찰력 있는 타로 해석을 제공하는 웹 애플리케이션입니다.

130개 질문과 메이저 아르카나 22장에 대한 데이터베이스를 기반으로 카드별 해석을 조회하고, OpenAI 모델을 통해 **과거 → 현재 → 미래의 흐름을 하나의 이야기로 연결**합니다. 단순히 카드 의미를 나열하는 것이 아니라, 질문의 맥락과 카드의 방향성을 함께 반영해 상담형 리딩 경험을 제공합니다.

---

### 타겟 사용자

- 타로를 가볍게 경험해보고 싶은 사용자
- 감정적 공감과 조언을 원하는 사용자
- 복잡한 상황을 흐름으로 이해하고 싶은 사용자
- 간단한 선택이나 고민에 대해 방향성을 얻고 싶은 사용자

---

### 핵심 가치

- **스토리 기반 해석**: 카드 흐름을 하나의 이야기로 연결
- **감정 공감 중심 상담**: 사용자의 상황에 공감하는 자연스러운 해석
- **직관적인 UX**: 질문 선택 → 카드 선택 → 결과 확인까지 간결한 흐름
- **데이터 기반 안정성**: 원문 질문과 표시용 제목을 분리해 DB 매칭 유지
- **AI 기반 확장성**: 다양한 질문 유형에 대응 가능한 프롬프트 구조

---

## 주요 기능

### 타로 리딩

- **질문 선택**: 연애, 재회, 속마음, 미래, 재물, 일상 고민 등 다양한 카테고리
- **질문 검색**: 카테고리 및 소주제 질문 검색 지원
- **카드 선택**: 메이저 아르카나 22장 기반 3카드 선택
- **실제 카드 이미지 표시**: Rider-Waite-Smith 계열 메이저 아르카나 이미지 매핑
- **카드 뒷면 UI**: 프로젝트 전용 카드백 SVG 적용
- **방향성 반영**: 정방향 / 역방향 해석 지원
- **AI 해석 생성**: 카드 흐름을 기반으로 자연스러운 리딩 제공

---

### AI 해석

- **스토리형 결과**: 과거 → 현재 → 미래 흐름으로 해석
- **감정 공감**: 사용자 상황에 맞춘 공감형 문장
- **조언 제공**: 단순 결과가 아닌 행동 방향 제시
- **타로 표현 강화**: 흐름, 에너지, 가능성 중심 서술
- **Fallback 처리**: 특정 카드/질문 데이터가 부족할 때 보완 해석 제공

---

### 데이터 정규화

- **표시용 제목 정리**: `#`로 연결된 원문 질문을 사용자에게 보기 좋은 형태로 표시
- **동적 날짜 치환**: `$month`, `$year`, `month월`, `year년`을 현재 날짜 기준으로 자동 변환
- **깨진 텍스트 보정**: 일부 잘못 인코딩된 질문 제목을 표시 전에 보정
- **원문 보존**: 화면에는 정리된 제목을 보여주되, DB 조회에는 원문 질문 id를 사용

---

## 기술 스택

### Frontend

- **React (Create React App)** - 프론트엔드 UI
- **TypeScript** - 정적 타입 지원
- **React Router** - 페이지 라우팅
- **React Hooks** - 상태 및 로직 관리
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 화면 전환 및 카드 애니메이션

### Backend

- **Python** - API 서버
- **HTTPServer** - 경량 API 서버 구현
- **SQLite** - 카드/질문/해석 데이터 저장
- **OpenAI GPT-4.1-mini** - 타로 해석 생성
- **python-dotenv** - 환경 변수 관리

### 데이터 및 에셋

- **CSV / JSON** - 원천 타로 데이터 및 설명 데이터
- **Wikimedia Commons Rider-Waite-Smith images** - 메이저 아르카나 카드 이미지
- **Custom SVG** - 프로젝트 전용 카드 뒷면 이미지

### 개발 및 배포

- **Vercel** - 프론트엔드 배포
- **Render** - 백엔드 배포
- **GitHub** - 버전 관리

---

## 카드 이미지 출처

메이저 아르카나 카드 이미지는 Wikimedia Commons의 Rider-Waite-Smith 공개 도메인 계열 이미지를 사용했습니다.

- Source category: https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck
- 카드 뒷면 이미지는 `tarot-app/public/assets/tarot/card-back.svg`에 있는 프로젝트 전용 커스텀 SVG입니다.
- 상업용 Universal Waite 덱 이미지와 카드 뒷면은 저작권 문제로 사용하지 않았습니다.

---

## 프로젝트 구조

```text
MajorTarot/
├── tarot-app/                 # Frontend (React CRA)
│   ├── public/
│   │   └── assets/
│   │       └── tarot/          # 카드 이미지 및 카드백
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   ├── hooks/              # 데이터 로딩 훅
│   │   ├── types/              # 타입 정의
│   │   ├── utils/              # 표시 텍스트/카드 이미지 매핑 유틸
│   │   ├── AppRouter.tsx       # 라우팅 및 화면 흐름
│   │   └── index.css           # Tailwind 및 공통 스타일
│   └── package.json
│
└── tarot_data/                 # Backend (Python)
    ├── reading_api.py          # API 서버
    ├── tarot_engine.py         # 해석 로직
    ├── tarot_pipeline.py       # 데이터 처리
    ├── category_mapping.py     # 질문 카테고리 매핑
    ├── export_categories.py    # 카테고리 JSON 내보내기
    ├── tarot.db                # SQLite DB
    ├── train.csv               # 학습/원천 데이터
    ├── valid.csv
    └── test.csv
```

---

## 사용 방법

### 1. 질문 선택

- 원하는 큰 카테고리를 선택합니다.
- 검색창을 통해 관련 카테고리나 질문을 찾을 수 있습니다.

### 2. 카드 뽑기

- 카드 뒷면으로 펼쳐진 메이저 아르카나 카드 중 3장을 선택합니다.
- 각 카드는 정방향 또는 역방향으로 랜덤 결정됩니다.

### 3. 결과 확인

- 선택한 질문과 카드 조합을 기반으로 AI가 생성한 타로 해석을 확인합니다.
- 결과는 과거, 현재, 미래를 하나의 자연스러운 이야기 형태로 제공합니다.

---

## 배포

- **Frontend**: Vercel
- **Backend**: Render

---

## 문의

프로젝트 관련 문의는 이슈로 남겨주세요.

---

**MajorTarot과 함께 직관적인 타로 경험을 만나보세요.**
