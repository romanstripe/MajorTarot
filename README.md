<div align="center">

<img src="./tarot-app/public/logo.png" alt="MajorTarot-logo" width="180"/>

> **Major Arcana + AI = MajorTarot**  
> 카드의 흐름을 기반으로 직관적인 해석을 제공하는 AI 타로 상담 서비스

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-major-tarot.vercel.app-60A5FA?style=for-the-badge&logo=vercel)](https://major-tarot.vercel.app/)

</div>

---

## 🌟 프로젝트 소개

MajorTarot은 사용자가 선택한 질문과 뽑은 카드 조합을 바탕으로, AI가 자연스럽고 통찰력 있는 타로 해석을 제공하는 웹 애플리케이션입니다.  
카드의 단순 의미를 나열하는 것이 아니라, **과거 → 현재 → 미래의 흐름을 하나의 이야기로 연결**하여 직관적인 상담 경험을 제공합니다.

---

### 🎯 타겟 사용자 (페르소나)

- 타로를 가볍게 경험해보고 싶은 사용자
- 감정적 공감과 조언을 원하는 사용자
- 복잡한 상황을 흐름으로 이해하고 싶은 사용자
- 간단한 선택이나 고민에 대해 방향성을 얻고 싶은 사용자

---

### 💡 핵심 가치

- **스토리 기반 해석**: 카드 흐름을 하나의 이야기로 연결
- **감정 공감 중심 상담**: 사용자의 상황에 공감하는 자연스러운 해석
- **직관적인 UX**: 질문 → 카드 선택 → 결과까지 간결한 흐름
- **AI 기반 확장성**: 다양한 질문 유형에 대응 가능한 구조

---

## ✨ 주요 기능

### 🔮 타로 리딩

- **질문 선택**: 연애, 재회, 속마음, 미래 등 다양한 카테고리
- **카드 선택**: 메이저 아르카나 기반 카드 랜덤 선택
- **방향성 반영**: 정방향 / 역방향 해석 지원
- **AI 해석 생성**: 카드 흐름을 기반으로 자연스러운 리딩 제공

---

### 🧠 AI 해석

- **스토리형 결과**: 과거 → 현재 → 미래 흐름으로 해석
- **감정 공감**: 사용자 상황에 맞춘 공감형 문장
- **조언 제공**: 단순 결과가 아닌 행동 방향 제시
- **타로 표현 강화**: 흐름, 에너지, 가능성 중심 서술

---

### ⚙️ 시스템 구조

- **데이터 기반 해석**: SQLite에 저장된 카드/카테고리 데이터 활용
- **Fallback 로직**: 데이터 없을 경우 AI가 보완 해석
- **프롬프트 설계**: 타로 특화 자연어 생성 구조

---

## 🛠 기술 스택

### Frontend

- **Next.js** - React 기반 프레임워크
- **TypeScript** - 정적 타입 지원
- **React Hooks** - 상태 및 로직 관리

### Backend

- **Python** - API 서버
- **SQLite** - 로컬 데이터 저장
- **OpenAI GPT-4.1-mini** - 타로 해석 생성

### 개발 도구

- **dotenv** - 환경 변수 관리
- **HTTPServer** - Python API 서버
- **GitHub** - 버전 관리

---

## 📁 프로젝트 구조
MajorTarot/
├── tarot-app/ # Frontend (Next.js)
│ ├── src/
│ │ ├── components/ # UI 컴포넌트
│ │ ├── hooks/ # 커스텀 훅
│ │ ├── types/ # 타입 정의
│ │ └── app/ # 페이지 구조
│ └── package.json
│
└── tarot_data/ # Backend (Python)
├── reading_api.py # API 서버
├── tarot_engine.py # 해석 로직
├── tarot_pipeline.py # 데이터 처리
├── tarot.db # SQLite DB
└── category_mapping.py

---

## 📱 사용 방법

### 1. 질문 선택

- 연애, 미래, 속마음 등 원하는 질문 선택

### 2. 카드 뽑기

- 3장의 카드 자동 선택
- 각 카드의 방향성(정/역) 반영

### 3. 결과 확인

- AI가 생성한 타로 해석 확인
- 하나의 자연스러운 이야기 형태로 제공

---

## 🚀 배포

- **Frontend**: Vercel
- **Backend**: Render

---

## 📞 문의

프로젝트 관련 문의는 이슈로 남겨주세요.

---

**MajorTarot과 함께 직관적인 타로 경험을 만나보세요 🔮**
