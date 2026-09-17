// 💡 1. HISTORICAL_MAPS 임포트 추가
import { fetchTimeTravelData, MAP_ENDPOINTS, HISTORICAL_MAPS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';

export async function initSection4() {
  const mapContainer = document.getElementById('map-s4');
  if (!mapContainer) return;

  const mapS4 = L.map('map-s4', { zoomControl: false, scrollWheelZoom: false, crs: getCrsEx() }).setView([37.577613 - 0.019, 126.976897 - 0.04], 7);
  const baseMapS4 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });

  // 💡 2. 기존 위성지도 대신 WMS 경성대지도 레이어 생성
  const gyeongseongMapS4 = L.tileLayer.wms(HISTORICAL_MAPS.wmsUrl, {
    layers: HISTORICAL_MAPS.gyeongseong,
    format: 'image/png',
    transparent: true,
    maxZoom: 18,
    attribution: '경성대지도'
  });

  baseMapS4.addTo(mapS4);

  // 💡 3. 토글 컨트롤에 경성대지도를 연결하고 버튼 글씨도 변경
  addMapToggleControl(mapS4, baseMapS4, gyeongseongMapS4, '경성대지도');

  let mapTriggered = false;

  const hubLayer = L.layerGroup().addTo(mapS4);
  const siteLayer = L.layerGroup().addTo(mapS4);

  const resetBtn = document.getElementById('sc4-reset-btn');
  const defaultCenter = [37.577613, 126.976897];
  const defaultZoom = 7;

  mapS4.on('zoomend', () => {
    if (mapS4.getZoom() > defaultZoom) {
      resetBtn.classList.add('show');
    } else {
      resetBtn.classList.remove('show');
    }
  });

  resetBtn.addEventListener('click', () => {
    mapS4.setView(defaultCenter, defaultZoom, { animate: true, duration: 0.8 });
    mapS4.closePopup();
    // 초기화 버튼 누를 때 활성화 상태도 모두 지우기
    document.querySelectorAll('.sc4-loc-item').forEach(item => item.classList.remove('active'));
  });

  try {
    const geojsonData = await fetchTimeTravelData();
    const observerS4 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !mapTriggered) {
          mapTriggered = true;
          mapS4.invalidateSize();

          let hubDelay = 0;
          let siteDelay = 0;

          // 리스트를 추가할 부모 컨테이너 찾기
          const hubListContainer = document.getElementById('sc4-hub-list');
          const siteListContainer = document.getElementById('sc4-site-list');

          geojsonData.features.forEach((feature) => {
            const props = feature.properties;
            const subId = String(props.COT_THEME_SUB_ID);
            const name = props.COT_CONTS_NAME || "알 수 없는 장소";
            const address = props.COT_ADDR_FULL_NEW || props.COT_ADDR_FULL_OLD || "주소 정보 없음";
            const desc = props.COT_VALUE_03 || props.COT_VALUE_01 || "상세 설명이 없습니다.";

            const poiId = props.COT_CONTS_ID;
            const mapLink = `https://map.seoul.go.kr/smgis2/poiViewMap?ti=11100550&pi=${poiId}&lang=ko`;

            if (!props.COT_COORD_Y || !props.COT_COORD_X) return;
            const latlng = [parseFloat(props.COT_COORD_Y), parseFloat(props.COT_COORD_X)];

            let pulseClass = '';
            let targetLayer = null;
            let currentDelay = 0;
            let listContainer = null;

            if (subId === '3') {
              pulseClass = 'sc4-pulse-site';
              targetLayer = siteLayer;
              listContainer = siteListContainer;
              currentDelay = siteDelay;
              siteDelay += 150;
            } else if (subId === '4') {
              pulseClass = 'sc4-pulse-hub';
              targetLayer = hubLayer;
              listContainer = hubListContainer;
              currentDelay = hubDelay;
              hubDelay += 150;
            }

            if (pulseClass !== '' && targetLayer) {
              // 1. 마커와 팝업 생성
              const icon = L.divIcon({
                className: 'sc4-marker-wrapper',
                html: `<div class="${pulseClass}"></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });

              const marker = L.marker(latlng, { icon: icon });
              const popupContent = `
                <div class="sc4-popup-inner">
                  <h3>${name}</h3>
                  <span class="sc4-pop-addr">${address}</span>
                  <div class="sc4-pop-desc">${desc.replace(/\n/g, '<br>')}</div>
                  <div class="sc4-pop-btns">
                    <a href="${mapLink}" target="_blank" class="sc4-btn map-btn">스마트서울맵</a>
                    <a href="https://history.seoul.go.kr/" target="_blank" class="sc4-btn history-btn">역사편찬원</a>
                  </div>
                </div>
              `;
              marker.bindPopup(popupContent, { offset: [0, -15], className: 'sc4-leaflet-popup', maxWidth: 450 });

              // 2. 범례 리스트 아이템 생성
              const li = document.createElement('li');
              li.className = 'sc4-loc-item';
              li.innerText = name;
              if (listContainer) {
                listContainer.appendChild(li);
              }

              // 💡 3. 줌인/줌아웃 토글 공통 로직
              const activateItem = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();

                const isAlreadyActive = li.classList.contains('active');

                if (isAlreadyActive) {
                  // 이미 켜져있다면 -> 줌아웃(초기화)
                  li.classList.remove('active');
                  mapS4.closePopup();
                  mapS4.setView(defaultCenter, defaultZoom, { animate: true, duration: 0.8 });
                } else {
                  // 안 켜져있다면 -> 줌인(활성화)
                  const parentCol = li.closest('.sc4-col');
                  if (parentCol && !parentCol.classList.contains('active')) {
                    parentCol.classList.add('active');
                    if (subId === '3') mapS4.addLayer(siteLayer);
                    if (subId === '4') mapS4.addLayer(hubLayer);
                  }

                  // 다른 아이템들 선택 해제
                  document.querySelectorAll('.sc4-loc-item').forEach(item => item.classList.remove('active'));
                  li.classList.add('active'); // 현재 클릭한 것만 선택 표시

                  // 우측 여백 확보하여 줌인
                  const targetZoom = 9;
                  const targetPoint = mapS4.project(latlng, targetZoom);
                  targetPoint.y -= 150;
                  targetPoint.x -= 300;

                  mapS4.setView(mapS4.unproject(targetPoint, targetZoom), targetZoom, { animate: true, duration: 0.8 });
                  setTimeout(() => marker.openPopup(), 300);
                }
              };

              // 마커 클릭, 리스트 클릭 모두 동일한 토글 로직 적용!
              marker.on('click', activateItem);
              li.addEventListener('click', activateItem);

              // 딜레이를 주어 지도에 마커 추가
              setTimeout(() => {
                marker.addTo(targetLayer);
              }, currentDelay);
            }
          });
        }
      });
    }, { threshold: 0.3 });
    observerS4.observe(mapContainer);

    // 필터 기능(헤더 클릭) 연동
    const filterHeaders = document.querySelectorAll('#sc4-filter-list .sc4-col-header');
    filterHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.sc4-col');
        const filterType = item.getAttribute('data-filter');
        const isActive = item.classList.contains('active');

        if (isActive) {
          item.classList.remove('active');
          if (filterType === 'hub') mapS4.removeLayer(hubLayer);
          if (filterType === 'site') mapS4.removeLayer(siteLayer);
          // 카드 비활성화 시 내부 아이템들의 active 상태도 지우기
          item.querySelectorAll('.sc4-loc-item').forEach(li => li.classList.remove('active'));
        } else {
          item.classList.add('active');
          if (filterType === 'hub') mapS4.addLayer(hubLayer);
          if (filterType === 'site') mapS4.addLayer(siteLayer);
        }
      });
    });

  } catch (error) { console.error('Section 4 에러:', error); }

  const sc4RevealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll('.sc4-reveal').forEach(el => sc4RevealObserver.observe(el));
}