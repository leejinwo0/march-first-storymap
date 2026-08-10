// js/index.js

/* =======================================================
   [모듈 가져오기]
======================================================= */
import { loadSeoulMapAPI } from './utils/mapUtils.js';
import { initGlobalUI } from './utils/uiUtils.js';

// 각 섹션별 로직 가져오기 (각 sectionX.js 파일에서 내보낸 함수들)
import { initSection1Maps } from './sections/section1.js';
import { initSection2 } from './sections/section2.js';
import { initSection3 } from './sections/section3.js';
import { initSection4 } from './sections/section4.js';
import { initSection5 } from './sections/section5.js';
import { initSection6 } from './sections/section6.js';

/* =======================================================
   🚀 최종 메인 앱 실행 (App Initialization)
======================================================= */
async function initApp() {
  try {
    console.log("지도 API 부팅 시작...");

    // 1. 스마트서울맵 V5 API 동적 로드 대기
    await loadSeoulMapAPI();
    console.log("✅ 스마트서울맵 API 로드 완료! 화면을 그립니다.");

    // 2. 공통 UI 초기화
    initGlobalUI();

    // 3. 각 섹션 초기화 실행
    initSection1Maps();
    initSection2();
    initSection3();
    initSection4();
    initSection5();
    initSection6();

    console.log("🎉 모든 히스토리맵 섹션 로딩 완료!");

  } catch (error) {
    console.error("❌ 앱 초기화 에러:", error);
  }
}

// 웹 브라우저가 HTML 문서를 완전히 읽고 준비가 끝나면 initApp 함수 실행
document.addEventListener('DOMContentLoaded', initApp);