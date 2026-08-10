# MARCH-FIRST-STORYMAP

1919년 3월 1일, 세상을 깨운 뜨거운 외침과 서울 곳곳에 새겨진 그날의 발자취를 되짚어보는 디지털 인터랙티브 스토리맵입니다. 
스마트서울맵 OpenAPI와 Leaflet.js를 활용하여 역사적 현장을 지도 위에 시각화하였습니다.

## ✨ 주요 기능 (Features)

*   PC 환경 (Scrollytelling UI):
    *   스크롤에 따라 지도가 부드럽게 이동하고 애니메이션(경로 라인, 펄스 마커)이 작동하는 인터랙티브 스토리텔링 구현
    *   일반/위성 지도 전환 및 인물 초성 검색 기능 제공
*   모바일 환경 (Swipe Card UI):
    *   작은 화면에서의 사용성을 고려하여 Swiper.js를 활용한 풀스크린 카드 슬라이드 UI 제공
    *   무거운 지도 스크롤 대신 정적 이미지와 핵심 텍스트를 배치하여 가독성 및 성능 최적화
*   모듈화된 아키텍처:
    *   유지보수와 확장을 고려하여 HTML, CSS, JS를 각 섹션과 기능별(Utils)로 철저히 분리

## 📂 프로젝트 폴더 구조 (Directory Structure)

```
MARCH-FIRST-STORYMAP/
├── api/
│   ├── config.js              # API 키 및 전역 설정
│   └── mapService.js          # 스마트서울맵 API 호출 및 GeoJSON 변환 로직
├── assets/
│   ├── data/
│   │   ├── data1_3·1운동시간여행.geojson
│   │   └── data2_3·1운동 생활 속 현장.geojson
│   └── images/                # 커스텀 마커, 팝업 이미지, 모바일 배경 캡처본 등
├── css/
│   ├── sections/              # 섹션별 독립된 스타일시트
│   │   ├── section0.css
│   │   ├── section1.css
│   │   ├── section2.css
│   │   ├── section3.css
│   │   ├── section4.css
│   │   ├── section5.css
│   │   └── section6.css
│   ├── global.css             # 전체 여백, CSS 변수(컬러), 헤더/푸터 공통 스타일
│   ├── index.css              # @import를 사용하여 모든 CSS를 묶어주는 허브
│   └── index_mobile.css       # 모바일 환경(768px 이하) 전용 스와이프 카드 UI 스타일
├── js/
│   ├── sections/              # 섹션별 지도 렌더링 및 애니메이션 로직
│   │   ├── section1.js
│   │   ├── section2.js
│   │   ├── section3.js
│   │   ├── section4.js
│   │   ├── section5.js
│   │   └── section6.js
│   ├── utils/                 # 공통 유틸리티 함수
│   │   ├── mapUtils.js        # 일반/위성 토글, 곡선 경로 생성기 등
│   │   └── uiUtils.js         # 스크롤 옵저버, 초성 검색기 등
│   └── index.js               # 앱 초기화 및 모바일/PC 분기 처리 (Entry Point)
├── .gitignore
├── index.html                 # 메인 HTML (PC/모바일 컨테이너 분리)
└── README.md
```