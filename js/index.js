/* =======================================================
   [모듈 가져오기]
======================================================= */
import { loadSeoulMapAPI } from './utils/mapUtils.js';
import { initGlobalUI } from './utils/uiUtils.js';

import { initSection1 } from './sections/section1.js';
import { initSection2 } from './sections/section2.js';
import { initSection3 } from './sections/section3.js';
import { initSection4 } from './sections/section4.js';
import { initSection5 } from './sections/section5.js';
import { initSection6 } from './sections/section6.js';

/* =======================================================
   🚀 최종 메인 앱 실행 (App Initialization)
======================================================= */
async function initApp() {
  // 1. 현재 화면 너비가 768px 이하인지(모바일인지) 확인
  const isMobile = window.innerWidth <= 768;

  // 📱 [모바일 모드]
  if (isMobile) {
    console.log("📱 모바일 모드 진입: Swiper 슬라이더 실행");

    // Swiper 라이브러리 가동 (스와이프 기능 및 하단 점 생성)
    new Swiper(".mySwiper", {
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      grabCursor: true, // 마우스로 잡고 끄는 커서 모양 활성화
    });

    // 모바일에서는 무거운 PC용 지도 로직을 실행하지 않고 여기서 끝냅니다.
    return;
  }

  // 💻 [PC 모드]
  try {
    console.log("💻 PC 모드 진입: 지도 API 부팅 시작...");

    await loadSeoulMapAPI();
    console.log("✅ 스마트서울맵 API 로드 완료! 화면을 그립니다.");

    initGlobalUI();
    initSection1();
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

/* =======================================================
   🔄 PC <-> 모바일 화면 크기 변경 시 자동 새로고침 처리
======================================================= */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const currentIsMobile = window.innerWidth <= 768;
    const initialIsMobile = document.body.getAttribute('data-mobile-init') === 'true';

    // PC 모드에서 모바일 창 크기로, 혹은 그 반대로 변했을 때만 새로고침하여 UI를 전환함
    if (currentIsMobile !== initialIsMobile) {
      location.reload();
    }
  }, 250);
});

// 처음 로드될 때 모바일 상태였는지 기록해둠
document.body.setAttribute('data-mobile-init', window.innerWidth <= 768);