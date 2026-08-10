import { MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';

export function initSection1() {
  const mapConfigsS1 = [
    {
      id: 'map-s1-1', center: [37.5562, 126.9850], zoom: 11, title: '남산 통감관저 터', region: 'seoul',
      address: '서울특별시 중구 예장동 2-1',
      desc: '1910년 강제 한일병합조약이 체결되었던 뼈아픈 역사의 현장입니다.'
    },
    {
      id: 'map-s1-2', center: [37.5658, 126.9751], zoom: 11, title: '덕수궁 함녕전', region: 'seoul',
      address: '서울특별시 중구 세종대로 99',
      desc: '1919년 1월, 고종 황제가 갑작스럽게 붕어하여 민중의 슬픔과 분노가 3·1운동의 도화선이 된 장소입니다.'
    },
    {
      id: 'map-s1-3', center: [48.8566, 2.3522], zoom: 8, title: '프랑스 파리', region: 'global',
      address: '프랑스 파리 (Paris)',
      desc: '제1차 세계대전 직후 파리 강화 회의가 열려 식민지 약소국들에게 희망을 준 민족자결주의가 제창된 곳입니다.'
    },
    {
      id: 'map-s1-4', center: [35.6989, 139.7544], zoom: 15, title: '도쿄 YMCA', region: 'global',
      address: '일본 도쿄도 지요다구',
      desc: '1919년 2월 8일, 적의 심장부인 도쿄에서 조선 유학생들이 모여 2·8 독립선언서를 낭독한 뜻깊은 장소입니다.'
    }
  ];

  const mapInstances = [];

  // 1. 지도 4개 생성
  mapConfigsS1.forEach(config => {
    const mapElement = document.getElementById(config.id);
    if (!mapElement) return;

    const map = L.map(config.id, {
      center: config.center, zoom: config.zoom, zoomControl: false, scrollWheelZoom: false,
      attributionControl: false, crs: config.region === 'seoul' ? getCrsEx() : L.CRS.EPSG3857
    });

    let baseMapLayer, airMapLayer;
    if (config.region === 'seoul') {
      baseMapLayer = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_kor, { minZoom: 1, maxZoom: 15 });
      airMapLayer = new L.TileLayer.DAWULGIS_EX(MAP_ENDPOINTS.seoulBaseMap_air, { minZoom: 1, maxZoom: 15 });
    } else {
      baseMapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 });
      airMapLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    }

    baseMapLayer.addTo(map);
    addMapToggleControl(map, baseMapLayer, airMapLayer);

    const icon = L.divIcon({ className: 'custom-marker-wrapper', html: '<div class="map-pulse"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });

    const popupContent = `
      <div class="sc1-popup-inner">
        <h3>${config.title}</h3>
        <span class="sc1-pop-addr">${config.address}</span>
        <div class="sc1-pop-desc">${config.desc}</div>
      </div>
    `;

    L.marker(config.center, { icon: icon })
      .addTo(map)
      .bindPopup(popupContent, {
        offset: [0, -15],
        className: 'sc1-leaflet-popup',
        closeButton: false,
        autoClose: false,
        closeOnClick: false
      })
      .openPopup();

    mapInstances.push(map);
  });

  // 2. 슬라이드 및 타이머 제어
  const slides = document.querySelectorAll('.sc1-slide');
  const dots = document.querySelectorAll('.sc1-dot');
  const playPauseBtn = document.getElementById('sc1-play-pause');
  const playPauseIcon = playPauseBtn.querySelector('.material-symbols-outlined');

  let currentIdx = 0;
  let slideInterval;
  let isPlaying = true;

  function goToSlide(index) {
    slides[currentIdx].classList.remove('active');
    dots[currentIdx].classList.remove('active');
    currentIdx = index;
    slides[currentIdx].classList.add('active');
    dots[currentIdx].classList.add('active');

    setTimeout(() => {
      if (mapInstances[currentIdx]) {
        mapInstances[currentIdx].invalidateSize();
      }
    }, 500);
  }

  function startAutoSlide() {
    slideInterval = setInterval(() => {
      let nextIdx = (currentIdx + 1) % slides.length;
      goToSlide(nextIdx);
    }, 5000);
    isPlaying = true;
    playPauseIcon.textContent = '||';
  }

  function stopAutoSlide() {
    clearInterval(slideInterval);
    isPlaying = false;
    playPauseIcon.textContent = '▶';
  }

  playPauseBtn.addEventListener('click', () => {
    if (isPlaying) stopAutoSlide();
    else startAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      if (isPlaying) {
        clearInterval(slideInterval);
        startAutoSlide();
      }
    });
  });

  startAutoSlide();
}