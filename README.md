# 서울 히스토리맵, 1919년 3월 그날의 발자취

스마트서울맵 Open API와 Leaflet.js 기반 3·1운동 인터랙티브 스토리맵.
1919년 서울 3·1운동의 배경, 시위 전개, 인물, 유산을 6개 섹션의 지도·타임라인 결합 스크롤 형식으로 시각화함.

- 웹페이지: https://march-first-storymap.vercel.app
- 사업 구분: 서울시 매력일자리 사업 – AI활용 공간정보구축사업
- 사료 출처: 서울역사편찬원 『1919년 3월 1일 그날을 걷다』

<br>

## Tech Stack

| 구분     | 기술                                                                   |
| -------- | ---------------------------------------------------------------------- |
| Language | HTML, CSS, JavaScript (ES Modules)                                     |
| Map      | Leaflet.js 1.9.4, 스마트서울맵 Open API, 경성대지도 WMS, OpenStreetMap |
| UI       | Swiper.js 11, Pretendard 웹폰트                                        |
| Data     | 스마트서울맵 테마 API (JSON → GeoJSON 런타임 변환)                     |
| CRS      | EPSG:5179 (UTM-K), EPSG:3857 (Web Mercator)                            |
| Deploy   | Vercel                                                                 |

<br>

## Architecture

```
[스마트서울맵 테마 API]        [사료 원문 (API 미반영)]
          │                           │
     fetch (JSON)          js/data/history-data.js
          │                           │
  transformToGeoJSON()                │
          └───────────┬───────────────┘
                      ▼
          GeoJSON FeatureCollection (런타임 생성)
                      │
        ┌─────────────┴─────────────┐
   width > 768px                width ≤ 768px
   pc-sections (Leaflet)        mobile-sections (Swiper)
```

- 지도 데이터는 전량 테마 API 호출로 수신, 로컬 GeoJSON 파일 미참조
- API 미등록 사료(섹션 1·6 일부)만 `history-data.js` 정적 데이터로 관리
- PC·모바일 6개 섹션은 동일 데이터 공유, 레이아웃 모듈만 분리
- 768px 기준선 통과 리사이즈 시 페이지 재로드로 모듈 재초기화

<br>

## Core Features

### 1. 공간데이터 변환 (API → GeoJSON)

- 테마 콘텐츠 API(`theme_id` 11100550, 100173) 호출 후 GeoJSON FeatureCollection 생성
- `COT_COORD_DATA`가 2차원 배열이면 `LineString`(경로), 그 외 `Point`(지점)로 판별
- `COT_THEME_SUB_ID` 기준 분류: `3` 시위 장소 / `4` 중요 지점 / `5` 인물

```js
const geometry = Array.isArray(coords[0])
  ? { type: "LineString", coordinates: coords }
  : { type: "Point", coordinates: coords };
```

### 2. 패럴렉스 스크롤링 (Scrollytelling)

- `IntersectionObserver`로 섹션·스텝 진입 감지
- 진입 스텝 기준 좌측 카드 내용, 마커 활성 상태, 경로선, 지도 카메라 동시 갱신
- 섹션 진입 시 마커 순차 렌더링, `.reveal → .active` 클래스 전환 방식 등장 애니메이션 적용

```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateSection(entry.target.dataset.featureId);
    });
  },
  { threshold: 0.5 },
);

document
  .querySelectorAll(".sc3-scroll-step")
  .forEach((step) => observer.observe(step));
```

### 3. 펄스(Pulse) 애니메이션

- 주요 거점 마커에 CSS `@keyframes` 기반 파동 효과 적용
- `scale(1 → 4)`, `opacity(1 → 0)` 2초 무한 반복

```css
@keyframes sc1-pulse-anim {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}
```

### 4. 시위 경로 애니메이션

- 활성 경로: 빨간 점선 + `stroke-dashoffset` 기반 dash 애니메이션
- 비활성 경로: 반투명 처리
- 경유지 마커 및 곡선 경로 생성 유틸(`generateCurvedPath`) 적용

### 5. 과거·현재 지도 교차 렌더링

- 스마트서울맵 배경지도: EPSG:5179 사용자 정의 CRS 적용
- 경성대지도: 스마트서울맵 GeoServer WMS(`tile_map:g_old_capital_tms`)를 `L.tileLayer.wms`로 중첩
- 해외 지점(도쿄, 파리): OpenStreetMap(EPSG:3857) + ArcGIS 위성 타일로 분기

### 6. 인물 검색

- 독립운동가 94명 지도 마커 + 하단 캐러셀
- 이름 검색 및 한글 초성 필터, 판결 정보 상세 팝업

### 7. 모바일 UI

- Swiper 풀스크린 카드, 세로형 타임라인
- 인물 2열 그리드, 하단 시트·상세 모달

<br>

## Exception Handling & Correction Logic

| 항목              | 문제                                                           | 적용 내용                                                           |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| 줌 레벨 보정      | 경성대지도(WMS)·일반지도 간 축척 차이로 전환 시 화면 범위 변동 | `layeradd` 이벤트에서 레이어 전환 시 줌 1단계 자동 보정             |
| X축 오프셋        | PC 좌측 고정 카드가 지도 마커를 가림                           | 목표 좌표 픽셀 변환 → 카드 폭만큼 X축 가산 → `unproject` 후 `panTo` |
| 이미지 404        | 외부 이미지 누락 시 `onerror` 반복 호출                        | `onerror`에서 img 제거·숨김, 인물 카드 이름 첫 글자 모노그램 대체   |
| Mixed Content     | HTTPS 페이지에서 HTTP 사료 이미지 차단                         | 이미지 프록시 경유 호출로 변경                                      |
| 줌 전환 화면 오류 | 줌 전환 중 검은 화면 렌더링                                    | 줌 애니메이션 옵션 조정, `maxZoom` 제한                             |
| 지도 API 실패     | 모바일 섹션 3 지도 스크립트 로드 실패                          | SVG 경로 그림으로 대체 표시                                         |
| 상세 API 호출     | 모바일 섹션 5 반복 호출                                        | 1회 호출 후 캐시, 로딩 중 스켈레톤 표시                             |

```js
// 줌 레벨 보정
map.on("layeradd", (e) => {
  if (e.layer === baseMap) map.setZoom(map.getZoom() + 1, { animate: false });
});

// X축 오프셋
const point = map.project(latlng, zoom).add([cardWidth / 2, 0]);
map.panTo(map.unproject(point, zoom));
```

<br>

## Directory Structure

```
MARCH-FIRST-STORYMAP/
├── api/
│   ├── config.js                  # API 키 및 전역 설정
│   └── mapService.js              # 테마 API 호출 및 GeoJSON 변환
├── assets/
│   ├── data/
│   │   ├── data-100173.geojson    # 런타임 미사용 (API 응답 구조 참고용)
│   │   └── data-11100550.geojson  # 런타임 미사용 (API 응답 구조 참고용)
│   ├── images/
│   │   ├── history/               # 사료 이미지
│   │   ├── markers/               # 커스텀 마커 아이콘
│   │   ├── mobile-cards/          # 모바일 카드 배경 이미지
│   │   └── storymap-ai-summary.png
├── css/
│   ├── mobile-sections/
│   │   ├── index-mobile.css       # 모바일 공통 스타일
│   │   └── mobile-section1~6.css  # 모바일 섹션별 스타일
│   ├── pc-sections/
│   │   └── section0~6.css         # PC 섹션별 스타일
│   ├── global.css                 # 공통 레이아웃·컴포넌트 스타일
│   └── tokens.css                 # 디자인 토큰 (컬러, 폰트 변수)
├── js/
│   ├── data/
│   │   └── history-data.js        # API 미반영 사료 정적 데이터
│   ├── mobile-sections/           # 모바일 섹션별 로직
│   ├── pc-sections/               # PC 섹션별 지도·애니메이션 로직
│   ├── utils/
│   │   ├── mapUtils.js            # 지도 토글, 곡선 경로 생성
│   │   └── uiUtils.js             # 스크롤 옵저버, 초성 검색
│   └── index.js                   # 진입점, PC·모바일 분기
├── .gitignore
├── index.html
└── README.md
```

<br>

## Data Source

- 스마트서울맵 테마 콘텐츠 API (`theme_id` 11100550, 100173)
- 서울역사편찬원 『1919년 3월 1일 그날을 걷다』 (API 미반영 사료)
- 한국근대사료DB (인물 판결 정보 링크)
