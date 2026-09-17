import { fetchDailyLifeData, MAP_ENDPOINTS, HISTORICAL_MAPS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';
import { getInitialConsonant } from '../utils/uiUtils.js';

export async function initSection5() {
  const mapContainer = document.getElementById('map-s5');
  if (!mapContainer) return;

  const mapS5 = L.map('map-s5', { zoomControl: false, scrollWheelZoom: false, zoomSnap: 1, zoomAnimation: false, crs: getCrsEx() }).setView([37.577613, 126.976897], 10);
  const baseMapS5 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });

  const gyeongseongMapS5 = L.tileLayer.wms(HISTORICAL_MAPS.wmsUrl, {
    layers: HISTORICAL_MAPS.gyeongseong,
    format: 'image/png',
    transparent: true,
    maxZoom: 18,
    attribution: '경성대지도'
  });

  baseMapS5.addTo(mapS5);
  addMapToggleControl(mapS5, baseMapS5, gyeongseongMapS5, '경성대지도');

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

    let defaultBounds = null;

    activists.forEach((feature) => {
      const props = feature.properties || feature;
      if (!props.COT_COORD_Y || !props.COT_COORD_X) return;

      const lat = parseFloat(props.COT_COORD_Y);
      const lng = parseFloat(props.COT_COORD_X);
      const name = props.COT_CONTS_NAME || "무명 열사";
      const shortAddr = props.COT_ADDR_FULL_NEW || props.COT_ADDR_FULL_OLD || "활동 지역 불명";

      let imgUrl = props.COT_IMG_MAIN_URL || props.IMG_MAIN_URL || "";
      if (imgUrl && !imgUrl.startsWith("http")) {
        imgUrl = "https://map.seoul.go.kr" + (imgUrl.startsWith("/") ? "" : "/") + imgUrl;
      }
      if (imgUrl.startsWith("http://")) {
        imgUrl = "https://images.weserv.nl/?url=" + encodeURIComponent(imgUrl);
      }

      const poiId = props.COT_CONTS_ID || "";
      const mapLink = `https://map.seoul.go.kr/smgis2/poiViewMap?ti=100173&pi=${poiId}&lang=ko`;

      const initial = getInitialConsonant(name);
      allLatLngs.push([lat, lng]);

      const card = document.createElement('div');
      card.className = 'sc5-card';
      card.innerHTML = `
        <div class="sc5-card-img"><img src="${imgUrl}" alt="${name} 사진" onerror="this.style.display='none';"></div>
        <div class="sc5-card-info"><h4>${name}</h4></div>
      `;
      trackContainer.appendChild(card);

      const icon = L.divIcon({
        className: 'sc5-marker-wrapper',
        html: `<div class="sc5-custom-pin"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      const marker = L.marker([lat, lng], { icon: icon }).addTo(mapS5);

      let historyUrl = props.COT_EXTRA_DATA_02 || props.EXTRA_DATA_02 || "";
      if (!historyUrl || !historyUrl.startsWith("http")) {
        historyUrl = `https://db.history.go.kr/modern/ia/level.do?nameKr=${encodeURIComponent(name)}&orderColumn=person_id&recordCountPerPage=20&pageIndex=1`;
      } else {
        historyUrl = historyUrl.replace("http://", "https://");
      }

      // 💡 1. 초기 팝업창은 로딩 상태로 만들어 둡니다.
      const initialPopupContent = `
        <div class="sc5-popup-inner">
          <h3>${name}</h3>
          <span class="sc5-pop-addr">${shortAddr}</span>
          <div class="sc5-pop-desc">
            <div class="info-row" style="padding: 10px 0; text-align: center; color: #888;">
              상세 정보를 불러오는 중입니다...
            </div>
          </div>
          <div class="sc5-pop-btns">
            <a href="${mapLink}" target="_blank" class="sc5-btn map-btn">스마트서울맵</a>
            <a href="${historyUrl}" target="_blank" class="sc5-btn history-btn">일제감시대상인물카드</a>
          </div>
        </div>
      `;

      marker.bindPopup(initialPopupContent, { offset: [0, -35], className: 'sc5-leaflet-popup', autoPan: false });

      let isDetailLoaded = false; // 데이터를 한 번만 불러오기 위한 플래그

      // 💡 2. 클릭 시 실행되는 함수 (비동기 async 추가)
      const activateItem = async () => {
        const isAlreadyActive = card.classList.contains('active');

        if (isAlreadyActive) {
          // 이미 켜져있다면 줌아웃(끄기)
          card.classList.remove('active');
          mapS5.closePopup();

          if (defaultBounds) {
            mapS5.fitBounds(defaultBounds, {
              paddingTopLeft: [100, 50],
              paddingBottomRight: [50, 200],
              maxZoom: 11,
              animate: true
            });
          }
        } else {
          // 안 켜져있다면 줌인(켜기) 및 팝업 열기
          document.querySelectorAll('.sc5-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          marker.openPopup();
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

          const targetZoom = 11;
          const targetPoint = mapS5.project([lat, lng], targetZoom);
          targetPoint.y -= 60;
          mapS5.setView(mapS5.unproject(targetPoint, targetZoom), targetZoom, { animate: true });

          // 💡 3. 상세 정보 API 호출 로직 (아직 로드되지 않았을 경우에만)
          if (!isDetailLoaded && poiId) {
            try {
              // 기존 MAP_ENDPOINTS에서 API 키가 포함된 기본 주소 추출
              const baseUrl = MAP_ENDPOINTS.themeData_100173.split('/public/')[0];
              const detailApiUrl = `${baseUrl}/public/themes/contents/detail?theme_id=100173&conts_id=${poiId}`;

              const response = await fetch(detailApiUrl);
              const detailData = await response.json();

              if (detailData && detailData.body && detailData.body.length > 0) {
                const dProps = detailData.body[0]; // 상세 API에서 받아온 프로퍼티

                // 상세 정보 추출기
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

                // 💡 4. 데이터를 덮어씌운 새로운 팝업 HTML 생성
                const updatedPopupContent = `
                  <div class="sc5-popup-inner">
                    <h3>${name}</h3>
                    <span class="sc5-pop-addr">${shortAddr}</span>
                    <div class="sc5-pop-desc">
                      <div class="sc5-pop-info-list">
                        ${sinbun ? `<div class="info-row"><span class="info-label">신분</span><span class="info-val">${sinbun}</span></div>` : ''}
                        ${sagun ? `<div class="info-row"><span class="info-label">사건개요</span><span class="info-val">${sagun}</span></div>` : ''}
                        ${pangyul ? `<div class="info-row"><span class="info-label">판결날</span><span class="info-val">${pangyul}</span></div>` : ''}
                        ${joemyung ? `<div class="info-row"><span class="info-label">죄명</span><span class="info-val">${joemyung}</span></div>` : ''}
                      </div>
                    </div>
                    <div class="sc5-pop-btns">
                      <a href="${mapLink}" target="_blank" class="sc5-btn map-btn">스마트서울맵</a>
                      <a href="${historyUrl}" target="_blank" class="sc5-btn history-btn">일제감시대상인물카드</a>
                    </div>
                  </div>
                `;

                // 팝업 내용 업데이트 및 로드 완료 처리
                marker.setPopupContent(updatedPopupContent);
                isDetailLoaded = true;
              }
            } catch (error) {
              console.error(`상세 API 호출 실패 (${name}):`, error);
              marker.setPopupContent(`
                <div class="sc5-popup-inner">
                  <h3>${name}</h3>
                  <div class="sc5-pop-desc"><span class="info-val">상세 정보를 불러올 수 없습니다.</span></div>
                </div>
              `);
            }
          }
        }
      };

      card.addEventListener('click', activateItem);
      marker.on('click', activateItem);

      activistItems.push({ name, initial, card, marker, latlng: [lat, lng] });
    });

    if (allLatLngs.length > 0) {
      defaultBounds = L.latLngBounds(allLatLngs);
      setTimeout(() => {
        mapS5.invalidateSize();
        mapS5.fitBounds(defaultBounds, {
          paddingTopLeft: [100, 50],
          paddingBottomRight: [50, 200],
          maxZoom: 11,
          animate: false
        });
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
        mapS5.fitBounds(defaultBounds, {
          paddingTopLeft: [100, 50],
          paddingBottomRight: [50, 200],
          maxZoom: 11,
          animate: false
        });
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