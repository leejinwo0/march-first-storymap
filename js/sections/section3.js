import { fetchTimeTravelData, MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';

export async function initSection3() {
  const mapContainer = document.getElementById('map-s3');
  if (!mapContainer) return;

  const mapS3 = L.map('map-s3', { zoomControl: false, scrollWheelZoom: false, crs: getCrsEx() });
  const baseMapS3 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });
  const airMapS3 = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_air, { minZoom: 1, maxZoom: 15 });
  baseMapS3.addTo(mapS3);
  addMapToggleControl(mapS3, baseMapS3, airMapS3);

  let activeMarkers = [];
  const routeLayers = {};

  const sc3Groups = [
    { id: 'east-1', targetIds: ["22"] }, { id: 'east-2', targetIds: ["14"] },
    { id: 'west-1', targetIds: ["21"] }, { id: 'west-2', targetIds: ["20"] },
    { id: 'west-3', targetIds: ["19"] }, { id: 'march5-1', targetIds: ["8"] },
    { id: 'march5-2', targetIds: ["4"] }
  ];

  try {
    const sc3Data = await fetchTimeTravelData();
    const scrollTrack = document.getElementById('sc3-scroll-track');
    const cardContent = document.getElementById('sc3-card-content');
    const sideNav = document.getElementById('sc3-side-nav');

    scrollTrack.innerHTML = '';
    sideNav.innerHTML = '';

    const targetFeatures = [];
    const allBounds = L.latLngBounds();

    sc3Groups.forEach(group => {
      const feature = sc3Data.features.find(f => String(f.id) === group.targetIds[0] || String(f.properties.RNUM) === group.targetIds[0]);
      if (feature) {
        targetFeatures.push(feature);
        const featureId = String(feature.id || feature.properties.RNUM);

        if (feature.geometry.type === 'LineString') {
          const layer = L.geoJSON(feature, {
            style: { color: '#000000', weight: 4, opacity: 0.15 }
          }).addTo(mapS3);

          routeLayers[featureId] = layer;
          allBounds.extend(layer.getBounds());
        }
      }
    });

    setTimeout(() => {
      mapS3.invalidateSize();
      const isMobile = window.innerWidth <= 768;
      mapS3.fitBounds(allBounds, {
        paddingTopLeft: isMobile ? [30, 30] : [450, 50],
        paddingBottomRight: isMobile ? [30, 150] : [50, 50],
        maxZoom: 13
      });
    }, 500);

    const timelineData = [];

    targetFeatures.forEach((feature, index) => {
      const props = feature.properties;
      const stepNum = index + 1;
      const featureId = String(feature.id || props.RNUM);

      timelineData.push({
        id: featureId,
        title: props.COT_CONTS_NAME || "제목 없음",
        val1: props.COT_VALUE_01 || "",
        val2: props.COT_VALUE_03 ? String(props.COT_VALUE_03).replace(/\n/g, '<br>') : ""
      });

      scrollTrack.insertAdjacentHTML('beforeend', `<div class="sc3-scroll-step" data-feature-id="${featureId}" id="sc3-step-${featureId}"></div>`);
      sideNav.insertAdjacentHTML('beforeend', `<button class="sc3-nav-btn" data-feature-id="${featureId}">${stepNum}</button>`);
    });

    const navBtns = document.querySelectorAll('.sc3-nav-btn');
    let currentFeatureId = null;

    function updateSection3(activeId) {
      if (currentFeatureId === activeId) return;
      currentFeatureId = activeId;

      navBtns.forEach(btn => {
        if (btn.getAttribute('data-feature-id') === activeId) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      const item = timelineData.find(d => d.id === activeId);
      if (item) {
        cardContent.classList.add('fade-out');
        setTimeout(() => {
          cardContent.innerHTML = `
            <h3 class="sc3-item-title">${item.title}</h3>
            ${item.val1 ? `<div class="sc3-route-box"><p class="sc3-route-val">${item.val1}</p></div>` : ''}
            ${item.val2 ? `<div class="sc3-desc-box"><p class="sc3-item-desc">${item.val2}</p></div>` : ''}
          `;
          cardContent.classList.remove('fade-out');
        }, 300);
      }

      Object.keys(routeLayers).forEach(id => {
        if (id === activeId) {
          routeLayers[id].setStyle({
            color: '#ff0000',
            weight: 7,
            opacity: 1,
            dashArray: '15, 15',
            className: 'sc3-draw-path-active'
          });
          routeLayers[id].bringToFront();
        } else {
          routeLayers[id].setStyle({
            color: '#000000',
            weight: 4,
            opacity: 0.2,
            dashArray: null,
            className: ''
          });
        }
      });

      activeMarkers.forEach(m => mapS3.removeLayer(m));
      activeMarkers = [];

      const targetFeature = targetFeatures.find(f => String(f.id) === activeId || String(f.properties.RNUM) === activeId);
      if (targetFeature && targetFeature.geometry.type === 'LineString') {
        const lineCoords = targetFeature.geometry.coordinates;
        if (lineCoords.length > 0) {
          const startCoord = [lineCoords[0][1], lineCoords[0][0]];
          const endCoord = [lineCoords[lineCoords.length - 1][1], lineCoords[lineCoords.length - 1][0]];

          const startIcon = L.divIcon({ className: 'sc3-point-marker start', html: '<div class="sc3-point-label">출발</div><div class="sc3-point-dot"></div>', iconSize: [40, 40], iconAnchor: [20, 40] });
          const endIcon = L.divIcon({ className: 'sc3-point-marker end', html: '<div class="sc3-point-label">도착</div><div class="sc3-point-dot"></div>', iconSize: [40, 40], iconAnchor: [20, 40] });

          activeMarkers.push(L.marker(startCoord, { icon: startIcon }).addTo(mapS3));
          activeMarkers.push(L.marker(endCoord, { icon: endIcon }).addTo(mapS3));
        }
      }
    }

    const mapUpdateObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateSection3(entry.target.getAttribute('data-feature-id'));
        }
      });
    }, { threshold: 0.5, rootMargin: "-20% 0px -20% 0px" });

    document.querySelectorAll('.sc3-scroll-step').forEach(item => mapUpdateObserver.observe(item));

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-feature-id');
        const targetStep = document.getElementById(`sc3-step-${targetId}`);
        if (targetStep) targetStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

  } catch (error) { console.error('Section 3 에러:', error); }
}