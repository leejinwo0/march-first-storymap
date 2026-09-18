export function initSection6() {
  // 1. 기존 스크롤 등장 애니메이션 유지
  const sc6RevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

  document.querySelectorAll('.sc6-reveal').forEach(el => sc6RevealObserver.observe(el));

  // 2. 모달(팝업창) 동적 생성 및 body에 추가 (백과사전 링크 포함)
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
          
          <!-- 💡 한국민족문화대백과사전 외부 링크 버튼 -->
          <a href="https://encykorea.aks.ac.kr/Article/E0026772" target="_blank" class="sc6-modal-link">
            한국민족문화대백과사전 원문 보기 ↗
          </a>
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

  // 3. 팝업창에 들어갈 각 카드별 상세 내용 (한국민족문화대백과사전 원문 반영)
  const expandedDetails = [
    // 01. 문화통치로의 전환
    "일본은 군사력에 의한 무단통치로는 이 운동의 뿌리를 뽑을 수도 없고, 국제 외교상의 비난을 면하기 위해서라도 어떤 조처가 필요함을 느꼈습니다. 그리하여 이른바 '문화통치'로 한국인을 기만하여 식민통치의 목적을 달성하고자, 총독의 자격을 무관에서 문관으로 바꾸고 제복과 패검 폐지, 보통경찰제 도입, 태형제도 폐지 등을 단행하였습니다.",

    // 02. 대한민국 임시정부 수립
    "민족사적 의의로 3·1운동은 세계의 이목을 집중시켜 한국민에 대한 인식을 새롭게 하였고, 이로 인해 중국 상하이에 대한민국임시정부가 수립되었습니다. 또한 이민족에 대한 끈질기고 강렬한 독립투쟁정신을 고취하였으며, 민족의식에 새로운 자각과 힘을 주어 교육의 진흥과 신문예·산업운동이 활성화되어 민족 자립의 기초를 다지게 하였습니다.",

    // 03. 사상 및 경제사적 의의
    "사상사적 측면에서 독립선언서 등에 자주독립의 사상을 명시하였고, 자유평등·민주주의·애국·애족·인도주의를 곁들인 신사상의 출현을 가져왔습니다. 경제사적으로도 물산장려운동, 국산품애용운동 등 경제적 자립을 꾀하는 운동이 계속되어 민족기업을 건설하려는 운동으로까지 확대되었으며, 이는 전국적으로 확대되어 한국경제사의 내재적 발전의 원동력이 되었습니다."
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