// js/mobiles/mobile_section5.js
import { fetchDailyLifeData, MAP_ENDPOINTS } from '../../api/mapService.js';

export async function initMobileSection5() {
  const grid = document.getElementById('mobile-activist-grid');
  if (!grid) return;

  // 모바일 전용 팝업(모달) 동적 생성
  let modal = document.getElementById('mobile-activist-modal');
  if (!modal) {
    const modalHTML = `
      <div id="mobile-activist-modal" class="mobile-modal-overlay">
        <div class="mobile-modal-container">
          <button id="mobile-modal-close" class="mobile-modal-close">&times;</button>
          <div id="mobile-modal-body" class="mobile-modal-body"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('mobile-activist-modal');

    document.getElementById('mobile-modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  const modalBody = document.getElementById('mobile-modal-body');

  try {
    const geojsonData = await fetchDailyLifeData();
    const activists = geojsonData.features.filter(f => String(f.properties.COT_THEME_SUB_ID) === '5');

    activists.sort((a, b) => {
      const nameA = a.properties.COT_CONTS_NAME || "";
      const nameB = b.properties.COT_CONTS_NAME || "";
      return nameA.localeCompare(nameB, 'ko-KR');
    });

    grid.innerHTML = '';

    activists.forEach((feature) => {
      const props = feature.properties || feature;
      const name = props.COT_CONTS_NAME || "무명 열사";
      const poiId = props.COT_CONTS_ID || "";

      let imgUrl = props.COT_IMG_MAIN_URL || props.IMG_MAIN_URL || "";
      if (imgUrl && !imgUrl.startsWith("http")) {
        imgUrl = "https://map.seoul.go.kr" + (imgUrl.startsWith("/") ? "" : "/") + imgUrl;
      }
      if (imgUrl.startsWith("http://")) {
        imgUrl = "https://images.weserv.nl/?url=" + encodeURIComponent(imgUrl);
      }
      const defaultImg = '../assets/images/default_profile.png';

      let historyUrl = props.COT_EXTRA_DATA_02 || props.EXTRA_DATA_02 || "";
      if (!historyUrl || !historyUrl.startsWith("http")) {
        historyUrl = `https://db.history.go.kr/modern/ia/level.do?nameKr=${encodeURIComponent(name)}&orderColumn=person_id&recordCountPerPage=20&pageIndex=1`;
      } else {
        historyUrl = historyUrl.replace("http://", "https://");
      }

      const card = document.createElement('div');
      card.className = 'mobile-activist-card';

      // 💡 주소를 없애고 사진과 이름만 렌더링
      card.innerHTML = `
        <img src="${imgUrl}" alt="${name} 사진" class="mobile-activist-img" onerror="this.src='${defaultImg}'">
        <div class="mobile-activist-name">${name}</div>
      `;

      // 💡 카드 클릭 이벤트: 상세 API 호출 및 팝업 표시
      card.addEventListener('click', async () => {
        // 로딩 상태 표시 후 모달 열기
        modalBody.innerHTML = `
          <div class="mobile-modal-loading">
            <img src="${imgUrl}" onerror="this.src='${defaultImg}'" class="mobile-modal-img">
            <h3>${name}</h3>
            <p style="color:#888; margin-top:20px;">상세 정보를 불러오는 중입니다...</p>
          </div>
        `;
        modal.classList.add('active');

        if (!poiId) return; // POI ID가 없으면 로딩에서 멈춤 (데이터 없음)

        try {
          const baseUrl = MAP_ENDPOINTS.themeData_100173.split('/public/')[0];
          const detailApiUrl = `${baseUrl}/public/themes/contents/detail?theme_id=100173&conts_id=${poiId}`;
          const response = await fetch(detailApiUrl);
          const detailData = await response.json();

          if (detailData && detailData.body && detailData.body.length > 0) {
            const dProps = detailData.body[0];

            const getSafeValue = (labelKw, directCotKey) => {
              for (const key in dProps) {
                if (key.includes('NAME_')) {
                  if (String(dProps[key]).includes(labelKw)) {
                    const valKey = key.replace('NAME_', 'VALUE_');
                    const val = dProps[valKey];
                    if (val && val !== 'null' && String(val).trim() !== '') return val;
                  }
                }
              }
              const directVal = dProps[directCotKey];
              if (directVal && directVal !== 'null' && String(directVal).trim() !== '') return directVal;
              return "";
            };

            const sinbun = getSafeValue("신분", "COT_VALUE_02");
            const sagun = getSafeValue("사건개요", "COT_VALUE_03");
            const pangyul = getSafeValue("판결날", "COT_VALUE_04");
            const joemyung = getSafeValue("죄명", "COT_VALUE_05");

            // 💡 팝업 내용 업데이트 (사진 + 상세 정보)
            modalBody.innerHTML = `
              <div class="mobile-modal-header">
                <img src="${imgUrl}" onerror="this.src='${defaultImg}'" class="mobile-modal-img">
                <h3 class="mobile-modal-title">${name}</h3>
              </div>
              <div class="mobile-modal-info">
                ${sinbun ? `<div class="info-row"><span class="info-label">신분</span><span class="info-val">${sinbun}</span></div>` : ''}
                ${sagun ? `<div class="info-row"><span class="info-label">사건개요</span><span class="info-val">${sagun}</span></div>` : ''}
                ${pangyul ? `<div class="info-row"><span class="info-label">판결날</span><span class="info-val">${pangyul}</span></div>` : ''}
                ${joemyung ? `<div class="info-row"><span class="info-label">죄명</span><span class="info-val">${joemyung}</span></div>` : ''}
                ${(!sinbun && !sagun && !pangyul && !joemyung) ? `<div class="info-row"><span class="info-val">상세 정보가 없습니다.</span></div>` : ''}
              </div>
              <a href="${historyUrl}" target="_blank" class="mobile-btn nikh-btn" style="margin-top: 1.5rem;">한국근대사료DB 보기</a>
            `;
          }
        } catch (error) {
          console.error(`상세 API 호출 실패 (${name}):`, error);
          modalBody.innerHTML = `
            <div class="mobile-modal-header">
              <img src="${imgUrl}" onerror="this.src='${defaultImg}'" class="mobile-modal-img">
              <h3 class="mobile-modal-title">${name}</h3>
            </div>
            <p style="color:#a83228; text-align:center; margin-top:20px;">정보를 불러올 수 없습니다.</p>
          `;
        }
      });

      grid.appendChild(card);
    });

  } catch (error) {
    console.error("모바일 독립운동가 데이터를 불러오는 중 오류가 발생했습니다:", error);
    grid.innerHTML = '<p style="color: rgba(238, 230, 216, 0.6); text-align: center; grid-column: 1 / -1; margin-top: 2rem;">데이터를 불러올 수 없습니다.</p>';
  }
}