import { fetchDailyLifeData, MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';
import { getInitialConsonant } from '../utils/uiUtils.js';

export async function initSection5() {
  const mapContainer = document.getElementById('map-s5');
  if (!mapContainer) return;

  const mapS5 = L.map('map-s5', { zoomControl: false, scrollWheelZoom: false, zoomSnap: 1, zoomAnimation: false, crs: getCrsEx() }).setView([37.577613, 126.976897], 10);
  const baseMapS5 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });
  const airMapS5 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_air, { minZoom: 1, maxZoom: 15 });
  baseMapS5.addTo(mapS5);
  addMapToggleControl(mapS5, baseMapS5, airMapS5);

  try {
    const geojsonData = await fetchDailyLifeData();
    const trackContainer = document.getElementById('sc5-activist-list');

    const searchToggle = document.getElementById('sc5-search-toggle');
    const searchPanel = document.getElementById('sc5-search-panel');
    const searchInput = document.getElementById('sc5-search-input');
    const filterBtns = document.querySelectorAll('.sc5-filter-btn');

    const activists = geojsonData.features.filter(f => String(f.properties.COT_THEME_SUB_ID) === '5');

    activists.sort((a, b) => {
      const nameA = a.properties.COT_CONTS_NAME || "";
      const nameB = b.properties.COT_CONTS_NAME || "";
      return nameA.localeCompare(nameB, 'ko-KR');
    });

    const activistItems = [];
    const allLatLngs = [];

    activists.forEach((feature) => {
      const props = feature.properties;
      if (!props.COT_COORD_Y || !props.COT_COORD_X) return;

      const lat = parseFloat(props.COT_COORD_Y);
      const lng = parseFloat(props.COT_COORD_X);
      const name = props.COT_CONTS_NAME || "무명 열사";
      const shortAddr = props.COT_ADDR_FULL_NEW || props.COT_ADDR_FULL_OLD || "활동 지역 불명";
      const detailDesc = props.COT_VALUE_03 || props.COT_VALUE_01 || "상세한 기록이 남아있지 않습니다.";
      let imgUrl = props.COT_IMG_MAIN_URL || "";
      if (imgUrl && !imgUrl.startsWith("http")) imgUrl = "https://map.seoul.go.kr" + (imgUrl.startsWith("/") ? "" : "/") + imgUrl;
      if (imgUrl.startsWith("http://")) {
        imgUrl = "https://images.weserv.nl/?url=" + encodeURIComponent(imgUrl);
      }

      // --- [추가됨] 고유 ID 추출 및 스마트서울맵 링크 동적 생성 ---
      const poiId = props.COT_CONTS_ID;
      // Section 5는 '생활속현장' 테마이므로 ti=100173 을 사용합니다.
      const mapLink = `https://map.seoul.go.kr/smgis2/poiViewMap?ti=100173&pi=${poiId}&lang=ko`;
      // -------------------------------------------------------------------

      const initial = getInitialConsonant(name);
      allLatLngs.push([lat, lng]);

      const card = document.createElement('div');
      card.className = 'sc5-card';
      card.innerHTML = `
        <div class="sc5-card-img"><img src="${imgUrl}" alt="${name} 사진" onerror="this.style.display='none';"></div>
        <div class="sc5-card-info"><h4>${name}</h4><p>${shortAddr.split(' ')[0]} ${shortAddr.split(' ')[1] || ''}</p></div>
      `;
      trackContainer.appendChild(card);

      const icon = L.divIcon({
        className: 'sc5-marker-wrapper',
        html: `<div class="sc5-custom-pin"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      const marker = L.marker([lat, lng], { icon: icon }).addTo(mapS5);

      let historyUrl = props.EXTRA_DATA_02 || props.COT_EXTRA_DATA_02 || "";

      if (!historyUrl.startsWith("http")) {
        historyUrl = `https://db.history.go.kr/modern/ia/level.do?nameKr=${encodeURIComponent(name)}&orderColumn=person_id&recordCountPerPage=20&pageIndex=1`;
      } else {
        historyUrl = historyUrl.replace("http://", "https://");
      }

      const popupContent = `
        <div class="sc5-popup-inner">
          <h3>${name}</h3>
          ${imgUrl ? `<img src="${imgUrl}" alt="${name}" class="sc5-pop-img" onerror="this.style.display='none';">` : ''}
          <span class="sc5-pop-addr">${shortAddr}</span>
          <div class="sc5-pop-desc">${detailDesc}</div>
          <div class="sc5-pop-btns">
            <!-- [수정됨] 고정 링크 대신 ${mapLink} 동적 변수 적용 -->
            <a href="${mapLink}" target="_blank" class="sc5-btn map-btn">스마트서울맵</a>
            <a href="${historyUrl}" target="_blank" class="sc5-btn history-btn">일제감시대상인물카드</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -35], className: 'sc5-leaflet-popup', autoPan: false });

      marker.on('popupopen', function (e) {
        const popupNode = e.popup._contentNode;
        const popupImg = popupNode.querySelector('.sc5-pop-img');
        if (popupImg && imgUrl) {
          popupImg.addEventListener('click', function () {
            if (window.openGlobalModal) {
              window.openGlobalModal(imgUrl, name);
            }
          });
        }
      });

      const activateItem = () => {
        document.querySelectorAll('.sc5-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        marker.openPopup();
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

        // --- [수정됨] 팝업창이 잘리지 않도록 지도의 중심을 Y축으로 내려줌 ---
        const targetZoom = 12;
        const targetPoint = mapS5.project([lat, lng], targetZoom);
        targetPoint.y -= 180; // 화면 위쪽 공간 확보를 위해 중심점 Y좌표 조정 (값을 키울수록 지도가 더 아래로 내려감)
        mapS5.setView(mapS5.unproject(targetPoint, targetZoom), targetZoom, { animate: true });
        // -------------------------------------------------------------
      };

      card.addEventListener('click', activateItem);
      marker.on('click', activateItem);

      activistItems.push({ name, initial, card, marker, latlng: [lat, lng] });
    });

    let defaultBounds = null;

    if (allLatLngs.length > 0) {
      defaultBounds = L.latLngBounds(allLatLngs);
      setTimeout(() => {
        mapS5.invalidateSize();
        mapS5.fitBounds(defaultBounds, { padding: [50, 50], maxZoom: 11, animate: false });
      }, 500);
    }

    const resetBtn = document.getElementById('sc5-reset-btn');

    mapS5.on('zoomend', () => {
      if (mapS5.getZoom() > 11) {
        resetBtn.classList.add('show');
      } else {
        resetBtn.classList.remove('show');
      }
    });

    resetBtn.addEventListener('click', () => {
      if (defaultBounds) {
        mapS5.fitBounds(defaultBounds, { padding: [50, 50], maxZoom: 11, animate: false });
      }
      mapS5.closePopup();
      document.querySelectorAll('.sc5-card').forEach(c => c.classList.remove('active'));
    });

    searchToggle.addEventListener('click', () => {
      searchPanel.classList.toggle('show');
    });

    function applyFilters() {
      const searchText = searchInput.value.trim().toLowerCase();
      const activeFilterBtn = document.querySelector('.sc5-filter-btn.active');
      const filterValue = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

      const visibleLatLngs = [];

      activistItems.forEach(item => {
        const matchText = searchText === '' || item.name.toLowerCase().includes(searchText);
        const matchConsonant = filterValue === 'all' || item.initial === filterValue;

        if (matchText && matchConsonant) {
          item.card.style.display = 'block';
          if (!mapS5.hasLayer(item.marker)) mapS5.addLayer(item.marker);
          visibleLatLngs.push(item.latlng);
        } else {
          item.card.style.display = 'none';
          if (mapS5.hasLayer(item.marker)) mapS5.removeLayer(item.marker);
        }
      });

      trackContainer.scrollTo({ left: 0, behavior: 'smooth' });
      if (visibleLatLngs.length > 0) {
        mapS5.closePopup();
      }
    }

    searchInput.addEventListener('input', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('.sc5-filter-btn[data-filter="all"]').classList.add('active');
      applyFilters();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        searchInput.value = '';
        applyFilters();
      });
    });

    document.getElementById('sc5-btn-prev').addEventListener('click', () => trackContainer.scrollBy({ left: -300, behavior: 'smooth' }));
    document.getElementById('sc5-btn-next').addEventListener('click', () => trackContainer.scrollBy({ left: 300, behavior: 'smooth' }));

  } catch (error) { console.error('Section 5 에러:', error); }

  const sc5RevealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll('.sc5-reveal').forEach(el => sc5RevealObserver.observe(el));
}