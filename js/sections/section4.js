import { fetchTimeTravelData, MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';

export async function initSection4() {
  const mapContainer = document.getElementById('map-s4');
  if (!mapContainer) return;

  const mapS4 = L.map('map-s4', { zoomControl: false, scrollWheelZoom: false, crs: getCrsEx() }).setView([37.577613 - 0.015, 126.976897], 7);
  const baseMapS4 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });
  const airMapS4 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_air, { minZoom: 1, maxZoom: 15 });
  baseMapS4.addTo(mapS4);
  addMapToggleControl(mapS4, baseMapS4, airMapS4)

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

          geojsonData.features.forEach((feature) => {
            const props = feature.properties;
            const subId = String(props.COT_THEME_SUB_ID);
            const name = props.COT_CONTS_NAME || "알 수 없는 장소";
            const address = props.COT_ADDR_FULL_NEW || props.COT_ADDR_FULL_OLD || "주소 정보 없음";
            const desc = props.COT_VALUE_03 || props.COT_VALUE_01 || "상세 설명이 없습니다.";

            if (!props.COT_COORD_Y || !props.COT_COORD_X) return;
            const latlng = [parseFloat(props.COT_COORD_Y), parseFloat(props.COT_COORD_X)];

            let pulseClass = '';
            let targetLayer = null;
            let currentDelay = 0;

            if (subId === '3') {
              pulseClass = 'sc4-pulse-site';
              targetLayer = siteLayer;
              currentDelay = siteDelay;
              siteDelay += 150;
            } else if (subId === '4') {
              pulseClass = 'sc4-pulse-hub';
              targetLayer = hubLayer;
              currentDelay = hubDelay;
              hubDelay += 150;
            }

            if (pulseClass !== '' && targetLayer) {
              setTimeout(() => {
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
                      <a href="https://history.seoul.go.kr/" target="_blank" class="sc4-btn history-btn">역사편찬원</a>
                      <a href="https://map.seoul.go.kr/" target="_blank" class="sc4-btn map-btn">서울스마트맵</a>
                    </div>
                  </div>
                `;
                marker.bindPopup(popupContent, { offset: [0, -15], className: 'sc4-leaflet-popup' });

                marker.on('click', () => {
                  mapS4.setView(latlng, 11, { animate: true, duration: 0.8 });
                });

                marker.addTo(targetLayer);
              }, currentDelay);
            }
          });
        }
      });
    }, { threshold: 0.3 });
    observerS4.observe(mapContainer);

    const filterItems = document.querySelectorAll('#sc4-filter-list li');
    filterItems.forEach(item => {
      item.addEventListener('click', () => {
        const filterType = item.getAttribute('data-filter');
        const isActive = item.classList.contains('active');

        if (isActive) {
          item.classList.remove('active');
          if (filterType === 'hub') mapS4.removeLayer(hubLayer);
          if (filterType === 'site') mapS4.removeLayer(siteLayer);
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