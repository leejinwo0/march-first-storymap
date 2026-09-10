export function initSection6() {
  // 1. 기존 스크롤 등장 애니메이션 유지
  const sc6RevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

  document.querySelectorAll('.sc6-reveal').forEach(el => sc6RevealObserver.observe(el));

  // 2. 모달(팝업창) 동적 생성 및 body에 추가
  const modalHTML = `
    <div id="sc6-modal" class="sc6-modal-overlay">
      <div class="sc6-modal-container">
        <button id="sc6-modal-close" class="sc6-modal-close">&times;</button>
        <div class="sc6-modal-header">
          <span id="sc6-modal-num" class="sc6-modal-num">01</span>
          <h3 id="sc6-modal-title" class="sc6-modal-title">Title</h3>
          <p id="sc6-modal-en" class="sc6-modal-en">English subtitle</p>
        </div>
        <div class="sc6-modal-body">
          <p id="sc6-modal-desc">상세 내용이 들어갑니다.</p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('sc6-modal');
  const modalClose = document.getElementById('sc6-modal-close');
  const modalNum = document.getElementById('sc6-modal-num');
  const modalTitle = document.getElementById('sc6-modal-title');
  const modalEn = document.getElementById('sc6-modal-en');
  const modalDesc = document.getElementById('sc6-modal-desc');

  // 3. 팝업창에 들어갈 각 카드별 상세 내용 (필요시 텍스트 수정 가능)
  const expandedDetails = [
    "3·1운동은 국내외 독립운동의 역량을 하나로 결집하는 결정적 계기가 되었습니다. 각지에 흩어져 있던 독립운동 세력은 체계적인 지도부의 필요성을 절감하였고, 이는 1919년 4월 상하이에서 대한민국 임시정부가 수립되는 직접적인 원동력이 되었습니다. 임시정부는 이후 무장투쟁과 외교활동 등 독립운동의 최고 구심점 역할을 수행하게 됩니다.",
    "3·1운동의 거대한 폭발력에 놀란 일제는 기존의 강압적인 무단통치(헌병경찰제)를 버리고, 이른바 '문화통치(보통경찰제)'로 정책을 전환할 수밖에 없었습니다. 비록 이는 민족 분열을 획책하기 위한 기만적인 전술이었으나, 우리 민족의 거센 저항이 제국주의 식민 지배 체제에 물리적인 균열을 냈다는 점에서 큰 역사적 의의를 지닙니다.",
    "3·1운동의 비폭력 평화 저항 정신은 국경을 넘어 아시아 각국의 민족 해방 운동에 거대한 영감을 주었습니다. 대표적으로 중국의 5·4 운동(1919년 5월)을 촉발하는 핵심 자극제가 되었으며, 인도의 마하트마 간디가 이끄는 비폭력 불복종 운동 등 전 세계 피압박 민족의 독립 투쟁에 깊고 뚜렷한 발자취를 남겼습니다."
  ];

  // 4. 각 카드에 클릭 이벤트 연결
  const cards = document.querySelectorAll('.sc6-card');
  cards.forEach((card, index) => {
    // 마우스를 올렸을 때 클릭 가능하다는 표시(포인터) 추가
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      // HTML에서 카드 정보 추출
      const num = card.querySelector('.sc6-card-num').textContent;
      const title = card.querySelector('.sc6-card-title').textContent;
      const en = card.querySelector('.sc6-card-en').textContent;

      // 모달에 정보 덮어쓰기
      modalNum.textContent = num;
      modalTitle.textContent = title;
      modalEn.textContent = en;
      modalDesc.textContent = expandedDetails[index] || "상세 내용이 없습니다.";

      // 모달 열기 및 뒷배경 스크롤 방지
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // 5. 모달 닫기 로직
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 스크롤 복구
  };

  modalClose.addEventListener('click', closeModal);

  // 모달 뒷배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}