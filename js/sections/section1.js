import { MAP_ENDPOINTS } from '../../api/mapService.js';
import { addMapToggleControl } from '../utils/mapUtils.js';

export function initSection1() {
  const mapConfigsS1 = [
    {
      id: 'map-s1-1', center: [37.5562, 126.9850], zoom: 11, title: '남산 통감관저 터', region: 'seoul',
      address: '서울특별시 중구 예장동 2-1 (옛 통감관저 터)',
      desc: '1910년 8월 22일, 일제 통감 데라우치 마사타케와 이완용 사이에 강제 한일병합조약이 체결된 비극적인 역사의 현장입니다. 국권 상실의 아픔이 서려 있는 곳으로, 제국주의 침탈의 뼈아픈 교훈을 남기고 있습니다.',
      imgUrl: '/assets/images/역사편찬원/3.1운동(2차)/201_남산 총독관저(옛 통감관저_서울역사박물관).jpg',
      caption: '남산 총독관저(옛 통감관저)'
    },
    {
      id: 'map-s1-2', center: [37.5658, 126.9751], zoom: 11, title: '덕수궁 함녕전', region: 'seoul',
      address: '서울특별시 중구 세종대로 99 (덕수궁 내)',
      desc: '1919년 1월 21일, 대한제국의 고종 황제가 갑작스럽게 붕어한 침전입니다. 일제에 의한 독살설이 퍼지면서 일어난 민중의 거대한 슬픔과 분노는 3·1운동이 전국적으로 폭발하는 결정적인 도화선이 되었습니다.',
      imgUrl: '/assets/images/역사편찬원/3.1운동(1차)/202_고종황제 장례식에 대한문 앞에 모인 사람들(서울역사박물관).jpg',
      caption: '고종황제 장례식에 대한문 앞에 모인 사람들'
    },
    {
      id: 'map-s1-3', center: [48.8566, 2.3522], zoom: 8, title: '프랑스 파리', region: 'global',
      address: '프랑스 파리 (제1차 세계대전 파리 강화 회의장)',
      desc: '1919년 전후 처리를 위한 파리 강화 회의가 열린 곳입니다. 미국 윌슨 대통령의 \'민족자결주의\'가 제창되었으며, 신한청년당의 김규식이 한국의 독립을 요구하는 청원서를 제출하여 국제 사회에 독립 의지를 알린 상징적인 장소입니다.',
      imgUrl: '/assets/images/역사편찬원/3.1운동(1차)/204_김규식이 윌슨에게 보낸 편지(독립기념관).jpg',
      caption: '김규식이 윌슨에게 보낸 편지'
    },
    {
      id: 'map-s1-4', center: [35.6989, 139.7544], zoom: 15, title: '도쿄 YMCA', region: 'global',
      address: '일본 도쿄도 지요다구 간다 (재일본한국YMCA)',
      desc: '1919년 2월 8일, 적의 심장부인 도쿄에서 600여 명의 조선 유학생들이 \'조선청년독립단\'을 결성하고 2·8 독립선언서를 낭독한 곳입니다. 이들의 꺾이지 않는 독립 투지는 국내로 전해져 3·1운동이 촉발되는 직접적인 계기가 되었습니다.',
      imgUrl: '/assets/images/역사편찬원/3.1운동(1차)/203_2.8독립선언서(국가지정기록물_독립기념관).jpg',
      caption: '2.8독립선언서'
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
        ${config.imgUrl ? `<img src="${config.imgUrl}" alt="${config.title}" class="sc1-pop-img">` : ''}
        <span class="sc1-pop-addr">${config.address}</span>
        <div class="sc1-pop-desc">${config.desc}</div>
      </div>
    `;

    const marker = L.marker(config.center, { icon: icon })
      .addTo(map)
      .bindPopup(popupContent, {
        offset: [0, -15],
        className: 'sc1-leaflet-popup',
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        autoPan: false
      });

    // --- [수정됨] 팝업이 열릴 때 이미지 클릭 이벤트 바인딩 (전역 모달 호출) ---
    map.on('popupopen', function (e) {
      const popupNode = e.popup._contentNode;
      const popupImg = popupNode.querySelector('.sc1-pop-img');

      // 이미지가 존재하면 클릭 시 모달 열기 함수 실행
      if (popupImg && config.imgUrl) {
        popupImg.style.cursor = 'pointer'; // 클릭 가능함을 표시
        popupImg.addEventListener('click', function () {
          const displayCaption = config.caption ? config.caption : config.title;

          // index.js에 정의된 전역 함수 호출
          if (window.openGlobalModal) {
            window.openGlobalModal(config.imgUrl, displayCaption);
          }
        });
      }
    });
    // -------------------------------------------------------------------

    marker.openPopup();
    mapInstances.push(map);

    const targetZoom = config.zoom;
    const targetPoint = map.project(config.center, targetZoom);
    targetPoint.y -= 250; // 이 숫자를 키울수록 마커가 화면 아래로 더 많이 내려갑니다. (150~300 사이 조절 권장)
    map.setView(map.unproject(targetPoint, targetZoom), targetZoom, { animate: false });
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