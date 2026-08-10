import { fetchTimeTravelData, MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl, generateCurvedPath } from '../utils/mapUtils.js';

export async function initSection2() {
  const mapContainer = document.getElementById('map-s2');
  if (!mapContainer) return;

  const defaultCenter = [37.5759, 126.9850];
  const defaultZoom = 10;

  const mapS2 = L.map('map-s2', {
    zoomControl: false,
    scrollWheelZoom: false,
    closePopupOnClick: false,
    crs: getCrsEx()
  }).setView(defaultCenter, defaultZoom);

  const baseMapS2 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });
  const airMapS2 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_air, { minZoom: 1, maxZoom: 15 });
  baseMapS2.addTo(mapS2);
  addMapToggleControl(mapS2, baseMapS2, airMapS2);

  const resizeObserverS2 = new ResizeObserver(() => mapS2.invalidateSize());
  resizeObserverS2.observe(mapContainer);

  const pathLine = L.polyline([], { color: '#000000', weight: 3, dashArray: '8, 8', opacity: 1, lineJoin: 'round' }).addTo(mapS2);

  const resetBtn = document.getElementById('sc2-reset-btn');
  L.DomEvent.disableClickPropagation(resetBtn);

  mapS2.on('zoomend', () => {
    if (mapS2.getZoom() > defaultZoom) {
      resetBtn.classList.add('show');
    } else {
      resetBtn.classList.remove('show');
    }
  });

  let isResetting = false;
  let isMarkerClicked = false;

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResetting = true;
    mapS2.setView(defaultCenter, defaultZoom, { animate: true, duration: 0.8 });
    setTimeout(() => { isResetting = false; }, 900);
  });

  try {
    const geojsonData = await fetchTimeTravelData();

    const targetIds = [
      "start_01", "start_02", "start_03", "start_04", "start_08",
      "start_05", "start_09", "start_07", "start_13"
    ];

    const timelineData = [];
    const locationsS2 = [];

    targetIds.forEach(targetId => {
      const feature = geojsonData.features.find(f => f.properties.COT_CONTS_ID === targetId);

      if (feature) {
        const props = feature.properties;
        let finalImgUrl = props.COT_IMG_MAIN_URL || "";
        if (finalImgUrl && !finalImgUrl.startsWith("http")) {
          finalImgUrl = "https://map.seoul.go.kr" + (finalImgUrl.startsWith("/") ? "" : "/") + finalImgUrl;
        }

        timelineData.push({
          id: targetId,
          date: props.COT_ADDR_FULL_OLD || "위치 정보 없음",
          title: props.COT_CONTS_NAME || "제목 없음",
          desc: props.COT_VALUE_03 || props.COT_VALUE_01 || "설명 정보가 없습니다.",
          imgUrl: finalImgUrl
        });

        if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
          locationsS2.push({
            id: targetId,
            pos: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            label: props.COT_CONTS_NAME || "지명 없음",
            addrNew: props.COT_ADDR_FULL_NEW || "현재 주소 정보 없음",
            addrOld: props.COT_ADDR_FULL_OLD || "옛 주소 정보 없음",
            shortDesc: props.COT_VALUE_01 || props.COT_VALUE_03 || "간단한 소개가 없습니다."
          });
        }
      }
    });

    const scrollTrack = document.getElementById('sc2-scroll-track');
    const cardContent = document.getElementById('sc2-card-content');
    const sideNav = document.getElementById('sc2-side-nav');

    scrollTrack.innerHTML = '';
    sideNav.innerHTML = '';

    timelineData.forEach((item, index) => {
      const stepNum = index + 1;
      scrollTrack.insertAdjacentHTML('beforeend', `<div class="sc2-scroll-step" data-marker="${item.id}" id="step-${item.id}"></div>`);
      sideNav.insertAdjacentHTML('beforeend', `<button class="sc2-nav-btn" data-marker="${item.id}" aria-label="${stepNum}번째 장소">${stepNum}</button>`);
    });

    const navBtns = document.querySelectorAll('.sc2-nav-btn');
    let currentCardId = null;

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-marker');
        const targetStep = document.getElementById(`step-${targetId}`);
        if (targetStep) targetStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    function updateCardContent(activeId) {
      if (currentCardId === activeId) return;
      currentCardId = activeId;

      const item = timelineData.find(d => d.id === activeId);
      if (!item) return;

      navBtns.forEach(btn => {
        if (btn.getAttribute('data-marker') === activeId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      cardContent.classList.add('fade-out');
      setTimeout(() => {
        const imageHTML = item.imgUrl ? `<img src="${item.imgUrl}" alt="${item.title}" class="sc2-item-img">` : "";
        cardContent.innerHTML = `
          <span class="sc2-item-date">${item.date}</span>
          <h3 class="sc2-item-title">${item.title}</h3>
          ${imageHTML} 
          <p class="sc2-item-desc">${item.desc}</p>
        `;
        cardContent.classList.remove('fade-out');
      }, 300);
    }

    const markers = {};
    locationsS2.forEach(loc => {
      const stepNumber = targetIds.indexOf(loc.id) + 1;
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class='sc2-marker-wrapper sc2-marker-dimmed' id='map-marker-container-${loc.id}'><div class='sc2-marker-circle'>${stepNumber}</div></div>`,
        iconSize: [30, 30], iconAnchor: [15, 15]
      });
      const marker = L.marker(loc.pos, { icon }).addTo(mapS2);

      const popupContent = `
        <div class="sc2-popup-inner">
          <h4 class="sc2-pop-title">${loc.label}</h4>
          <div class="sc2-pop-info">
            <p><strong>현재:</strong> ${loc.addrNew}</p>
            <p><strong>옛지명:</strong> ${loc.addrOld}</p>
          </div>
          <p class="sc2-pop-desc">${loc.shortDesc}</p>
          <div class="sc2-pop-btns">
            <a href="https://history.seoul.go.kr/" target="_blank" class="sc2-btn history-btn">역사편찬원</a>
            <a href="https://map.seoul.go.kr/" target="_blank" class="sc2-btn map-btn">서울스마트맵</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'sc2-leaflet-popup',
        offset: [0, -15],
        closeButton: false,
        autoClose: false,
        closeOnClick: false
      });

      marker.on('click', () => {
        isMarkerClicked = true;

        const targetStep = document.getElementById(`step-${loc.id}`);
        if (targetStep) targetStep.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const targetZoom = 13;
        const targetPoint = mapS2.project(loc.pos, targetZoom);
        targetPoint.x -= (window.innerWidth <= 768 ? 0 : 350);
        mapS2.setView(mapS2.unproject(targetPoint, targetZoom), targetZoom, { animate: true, duration: 0.8 });

        setTimeout(() => { isMarkerClicked = false; }, 900);
      });

      markers[loc.id] = { marker, popup: marker.getPopup() };
    });

    const initialCoords = targetIds.map(id => locationsS2.find(l => l.id === id)?.pos).filter(Boolean);
    pathLine.setLatLngs(generateCurvedPath(initialCoords));

    const markerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const activeId = String(entry.target.getAttribute('data-marker'));
          const activeIndex = targetIds.indexOf(activeId);

          updateCardContent(activeId);

          Object.keys(markers).forEach(key => {
            if (key === activeId) {
              if (!markers[key].marker.isPopupOpen()) markers[key].marker.openPopup();
            } else {
              if (markers[key].marker.isPopupOpen()) markers[key].marker.closePopup();
            }
          });

          targetIds.forEach((id) => {
            const container = document.getElementById(`map-marker-container-${id}`);
            if (container) {
              if (id === activeId) { container.classList.remove('sc2-marker-dimmed'); container.classList.add('sc2-marker-active'); }
              else { container.classList.remove('sc2-marker-active'); container.classList.add('sc2-marker-dimmed'); }
            }
          });

          const visibleCoords = targetIds.slice(0, activeIndex + 1).map(id => locationsS2.find(l => String(l.id) === id)?.pos).filter(Boolean);
          pathLine.setLatLngs(generateCurvedPath(visibleCoords));

          const activeLoc = locationsS2.find(l => String(l.id) === activeId);

          if (activeLoc && !isResetting && !isMarkerClicked) {
            mapS2.invalidateSize();
            const currentZoom = mapS2.getZoom();
            const targetPoint = mapS2.project(activeLoc.pos, currentZoom);
            targetPoint.x -= (window.innerWidth <= 768 ? 0 : 350);
            mapS2.panTo(mapS2.unproject(targetPoint, currentZoom), { animate: true, duration: 0.8 });
          }
        }
      });
    }, { threshold: 0.5, rootMargin: "-20% 0px -20% 0px" });

    document.querySelectorAll('.sc2-scroll-step').forEach(item => markerObserver.observe(item));
  } catch (error) { console.error('Section 2 에러:', error); }
}