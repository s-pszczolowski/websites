// Kompozycje wizualne – po jednej, unikatowej scenie na artykuł (klucz = slug).
// scene: table (martwa natura na blacie), room (wnętrze), bath (łazienka), train (okno pociągu).
// items/wall: [nazwa obiektu z visual-kit, x, y, skala, ...argumenty]
import { C } from './visual-kit.mjs';

export const SCENES = {
  // Zdrowie i dobre samopoczucie
  'drzemka-w-ciagu-dnia': { scene: 'room', palette: 'dusk', light: 'left', win: { x: 160, y: 170, w: 360, h: 520, view: 'sky', sky: 'dusk' }, items: [['bed', 960, 930, 0.95, C.cream, C.blue]], wall: [['clock', 1330, 300, 0.8, C.cream, 2]] },
  'bol-barku-kiedy-do-fizjoterapeuty': { scene: 'room', palette: 'sage', light: 'right', win: { x: 1120, y: 150, w: 330, h: 520, view: 'trees', sky: 'cool' }, items: [['mat', 620, 940, 1.2, C.terra], ['weights', 980, 930, 0.9, C.graphite], ['bottle', 360, 930, 0.8, C.cream, C.sage, false]] },
  'ile-ruchu-potrzebuje-dorosly': { scene: 'table', palette: 'sand', light: 'left', items: [['shoe', 560, 860, 1.25, C.cream, C.terra], ['clock', 1120, 700, 0.75, C.white, 9], ['bottle', 1350, 880, 0.75, C.blue, C.cream, false]], wall: [] },
  'zdrowe-przekaski-jak-wybierac': { scene: 'table', palette: 'clay', light: 'right', items: [['bowl', 560, 850, 1.1, C.cream, [C.ochre, C.terra, C.sage, C.rose]], ['jar', 960, 860, 1.1, '#E6D6BF', C.sage], ['cup', 1280, 880, 0.9, C.sage, false]] },
  'blonnik-w-codziennej-diecie': { scene: 'table', palette: 'sand', light: 'left', items: [['bread', 620, 860, 1.15], ['bowl', 1200, 880, 0.85, C.terra, [C.sage, C.ochre, C.rose, C.sage]]] },
  'zmeczone-oczy-przy-ekranie': { scene: 'table', palette: 'mist', light: 'right', win: { x: 1180, y: 80, w: 300, h: 460, view: 'trees', sky: 'cool' }, items: [['laptop', 640, 860, 1.15], ['glasses', 1080, 900, 1.1], ['plant', 300, 860, 0.6, C.cream]] },
  'kawa-ile-kofeiny-dziennie': { scene: 'table', palette: 'cream', light: 'left', items: [['cup', 560, 850, 1.35, C.cream], ['cup', 960, 880, 0.9, C.terra, false], ['books', 1290, 900, 0.9, [C.sage, C.cream]]] },
  'spacer-jako-trening': { scene: 'room', palette: 'sand', light: 'left', win: { x: 180, y: 140, w: 420, h: 560, view: 'hills', sky: 'warm' }, items: [['shoe', 960, 920, 1.2, C.sage, C.ochre], ['backpack', 1320, 930, 0.9, C.terra]], wall: [] },
  'odpornosc-jesienia-mity-i-fakty': { scene: 'table', palette: 'clay', light: 'right', win: { x: 1160, y: 90, w: 320, h: 460, view: 'trees', sky: 'dusk' }, items: [['cup', 520, 860, 1.1, C.cream], ['bowl', 900, 880, 0.9, C.sand, [C.ochre, C.ochre, C.terra, C.ochre]], ['candle', 1260, 900, 0.9, C.cream]] },

  // Psychologia i relacje
  'granice-w-relacjach-jak-mowic-nie': { scene: 'room', palette: 'cream', light: 'left', win: { x: 640, y: 150, w: 320, h: 470, view: 'sky', sky: 'warm' }, items: [['chairsFacing', 800, 930, 1]], wall: [] },
  'rozmowa-o-pieniadzach-w-zwiazku': { scene: 'table', palette: 'sage', light: 'left', items: [['cup', 420, 870, 0.9, C.cream, false], ['notebook', 800, 880, 1.1, C.cream], ['coins', 1180, 880, 1], ['cup', 1440, 900, 0.75, C.terra, false]] },
  'przyjaznie-w-doroslym-zyciu': { scene: 'table', palette: 'clay', light: 'right', items: [['cup', 520, 870, 1, C.cream], ['cup', 820, 880, 1, C.sage], ['bread', 1200, 900, 0.75]] },
  'rozproszona-uwaga-powiadomienia': { scene: 'table', palette: 'mist', light: 'left', items: [['phone', 640, 880, 1.45, true, 5], ['clock', 1120, 700, 0.8, C.white, 11], ['notebook', 1180, 920, 0.9, C.cream]] },
  'jak-sie-klocic-konstruktywnie': { scene: 'room', palette: 'clay', light: 'right', win: { x: 1140, y: 150, w: 320, h: 470, view: 'city', sky: 'warm' }, items: [['sofa', 660, 930, 0.95, C.sage]], wall: [['bubbles', 660, 380, 1]] },
  'stres-a-cialo-sposoby-regulacji': { scene: 'room', palette: 'sage', light: 'left', win: { x: 200, y: 140, w: 380, h: 540, view: 'hills', sky: 'cool' }, items: [['mat', 980, 930, 1.3, C.cream], ['candle', 1400, 920, 0.9, C.sand], ['plant', 1320, 930, 0.55, C.terra]] },
  'uwaznosc-bez-presji': { scene: 'table', palette: 'dusk', light: 'left', items: [['candle', 560, 860, 1.2, C.cream], ['stones', 900, 880, 1], ['cup', 1260, 880, 0.85, C.sand, true]] },

  // Dom i wnętrza
  'rosliny-w-mieszkaniu-caly-rok': { scene: 'room', palette: 'sage', light: 'left', win: { x: 160, y: 140, w: 380, h: 560, view: 'sky', sky: 'warm' }, items: [['plant', 760, 930, 1.05, C.terra], ['wateringCan', 1120, 930, 0.85, C.ochre], ['plant', 1400, 930, 0.6, C.cream]] },
  'panele-scienne-w-lazience': { scene: 'bath', palette: 'cream', light: 'right', panels: { color: '#E3D8CB', variant: 'stone' }, items: [['sink', 800, 900, 1.1], ['bottle', 640, 770, 0.45, C.sage], ['towels', 1300, 940, 0.75]], wall: [['mirror', 800, 380, 0.9]] },
  'klimatyzacja-w-domu-komfort-i-serwis': { scene: 'room', palette: 'mist', light: 'right', win: { x: 1160, y: 200, w: 300, h: 460, view: 'sky', sky: 'warm' }, items: [['bed', 640, 940, 0.75, C.cream, C.sand]], wall: [['acUnit', 600, 230, 0.9]] },
  'swiatlo-w-mieszkaniu-warstwy-oswietlenia': { scene: 'room', palette: 'night', light: 'none', win: { x: 160, y: 160, w: 330, h: 500, view: 'night', sky: 'night' }, items: [['armchair', 760, 930, 1, C.terra], ['floorLamp', 1060, 930, 1], ['table', 1350, 930, 0.5, C.wood]], wall: [['pendant', 1350, 120, 0.9]] },
  'male-mieszkanie-sprytne-przechowywanie': { scene: 'room', palette: 'cream', light: 'left', win: { x: 120, y: 160, w: 300, h: 480, view: 'city', sky: 'cool' }, items: [['boxes', 1180, 930, 1]], wall: [['shelf', 760, 640, 0.95]] },
  'kolor-scian-jak-dobrac': { scene: 'table', palette: 'clay', light: 'left', items: [['swatches', 620, 880, 1.2], ['paintCan', 1080, 900, 1, C.sage], ['paintCan', 1360, 900, 0.75, C.terra]] },
  'porzadki-metoda-malych-krokow': { scene: 'room', palette: 'sand', light: 'right', win: { x: 1160, y: 150, w: 320, h: 480, view: 'sky', sky: 'warm' }, items: [['boxes', 560, 930, 0.85], ['plant', 900, 930, 0.6, C.sage]], wall: [['clock', 700, 280, 0.7, C.cream, 10]] },
  'akustyka-mieszkania-cisza-w-domu': { scene: 'room', palette: 'dusk', light: 'left', win: { x: 160, y: 160, w: 320, h: 500, view: 'city', sky: 'dusk' }, items: [['sofa', 900, 930, 0.85, C.terra], ['headphones', 1400, 930, 0.7, C.graphite]], wall: [['shelf', 900, 470, 0.7]] },

  // Uroda i pielęgnacja
  'filtry-spf-na-co-dzien': { scene: 'table', palette: 'sand', light: 'left', items: [['hat', 520, 880, 1.05], ['tube', 960, 880, 1.05, C.cream, C.ochre], ['bottle', 1300, 880, 0.75, C.terra, C.cream, false]] },
  'skora-jesienia-bariera-ochronna': { scene: 'table', palette: 'clay', light: 'right', items: [['jar', 560, 870, 1.2, C.cream, C.terra], ['bottle', 900, 870, 0.85, C.sage, C.cream], ['towels', 1300, 900, 0.7, [C.sand, C.rose]]] },
  'sklad-kosmetykow-jak-czytac-inci': { scene: 'table', palette: 'mist', light: 'left', items: [['bottle', 520, 870, 0.9, C.cream, C.blue], ['glasses', 860, 900, 0.9], ['tube', 1240, 890, 0.9, C.sage, C.graphite]] },
  'dlonie-i-paznokcie-pielegnacja': { scene: 'table', palette: 'dusk', light: 'right', items: [['polish', 520, 880, 1.15, C.terra], ['polish', 700, 890, 0.95, C.rose], ['jar', 1000, 880, 1, C.sand, C.sage], ['towels', 1340, 910, 0.6, [C.cream]]] },
  'minimalizm-w-kosmetyczce': { scene: 'table', palette: 'cream', light: 'left', items: [['bottle', 620, 870, 0.85, C.sand, C.cream], ['jar', 900, 880, 0.9, C.cream, C.sand], ['tube', 1220, 890, 0.85, C.cream, C.sage]] },

  // Podróże i odpoczynek
  'weekend-ze-spa-poza-sezonem': { scene: 'table', palette: 'mist', light: 'left', win: { x: 160, y: 80, w: 380, h: 480, view: 'sea', sky: 'cool' }, items: [['towels', 820, 880, 1.05], ['stones', 1180, 890, 0.85], ['candle', 1420, 900, 0.75, C.cream]] },
  'koszty-rezygnacji-z-podrozy-ubezpieczenie': { scene: 'table', palette: 'sand', light: 'right', items: [['suitcase', 520, 880, 0.95, C.sage], ['documents', 960, 900, 1.05, true], ['ticket', 1300, 900, 0.9, C.terra]] },
  'nocnym-pociagiem-przez-europe': { scene: 'train', palette: 'night', light: 'none', view: 'night', items: [['cup', 600, 900, 0.85, C.cream], ['ticket', 1000, 920, 0.9, C.ochre]] },
  'slow-travel-podrozowanie-wolniej': { scene: 'train', palette: 'sand', light: 'right', view: 'hills', items: [['books', 600, 910, 0.8, [C.terra, C.cream]], ['cup', 1040, 910, 0.8, C.sage]] },
  'urlop-ktory-naprawde-regeneruje': { scene: 'room', palette: 'sand', light: 'left', win: { x: 200, y: 140, w: 420, h: 560, view: 'sea', sky: 'warm' }, items: [['armchair', 1000, 930, 1, C.cream], ['hat', 1380, 930, 0.6]] },
  'jet-lag-jak-zlagodzic': { scene: 'table', palette: 'dusk', light: 'right', items: [['clock', 520, 700, 0.75, C.cream, 3], ['clock', 840, 700, 0.75, C.sand, 9], ['suitcase', 1260, 900, 0.75, C.blue], ['glasses', 760, 900, 0.8]] },

  // Rodzina i wychowanie
  'nuda-u-dziecka': { scene: 'room', palette: 'cream', light: 'left', win: { x: 160, y: 150, w: 340, h: 520, view: 'trees', sky: 'warm' }, items: [['blocks', 860, 930, 0.9], ['ball', 1300, 930, 0.8, C.sage]] },
  'kieszonkowe-nauka-pieniedzy': { scene: 'table', palette: 'sage', light: 'left', items: [['moneyJar', 560, 870, 1.05], ['coins', 940, 890, 0.9], ['notebook', 1300, 900, 0.8, C.cream]] },
  'rywalizacja-rodzenstwa': { scene: 'room', palette: 'clay', light: 'right', win: { x: 1140, y: 150, w: 320, h: 480, view: 'hills', sky: 'warm' }, items: [['ball', 520, 930, 0.75, C.ochre], ['ball', 760, 930, 0.75, C.blue], ['blocks', 1020, 930, 0.6]] },
  'spokojne-poranki-z-dziecmi': { scene: 'table', palette: 'sand', light: 'left', win: { x: 160, y: 80, w: 320, h: 460, view: 'sky', sky: 'warm' }, items: [['backpack', 700, 880, 0.75, C.terra], ['cup', 1040, 890, 0.8, C.cream], ['bowl', 1340, 900, 0.65, C.sage, [C.ochre, C.terra, C.rose, C.ochre]]] },
  'rozmowa-z-nastolatkiem': { scene: 'room', palette: 'mist', light: 'left', win: { x: 160, y: 150, w: 330, h: 500, view: 'city', sky: 'dusk' }, items: [['sofa', 960, 930, 0.85, C.blue], ['headphones', 960, 640, 0.55, C.terra]] },

  // Rozwój osobisty i kariera
  'autoprezentacja-na-rozmowie-o-prace': { scene: 'table', palette: 'cream', light: 'right', items: [['documents', 560, 880, 1.1, false], ['glasses', 920, 900, 0.85], ['cup', 1240, 880, 0.85, C.graphite, false], ['vase', 1420, 880, 0.5, C.sage, true]] },
  'jak-budowac-nawyki': { scene: 'table', palette: 'sage', light: 'left', items: [['notebook', 620, 880, 1.15, C.cream], ['clock', 1080, 690, 0.7, C.cream, 7], ['seedling', 1260, 890, 1, C.terra]] },
  'praca-zdalna-granice-domu': { scene: 'room', palette: 'cream', light: 'left', win: { x: 160, y: 150, w: 330, h: 500, view: 'trees', sky: 'cool' }, items: [['table', 900, 930, 1.05, C.wood], ['laptop', 900, 640, 0.65], ['lamp', 1080, 640, 0.45, C.sage, false], ['plant', 1400, 930, 0.55, C.sand]] },
  'rozmowa-o-podwyzce': { scene: 'table', palette: 'clay', light: 'left', items: [['notebook', 600, 880, 1.05, C.cream], ['coins', 980, 880, 0.85], ['cup', 1300, 880, 0.9, C.cream, true]] },
  'jak-znalezc-mentora': { scene: 'room', palette: 'sand', light: 'right', win: { x: 1140, y: 150, w: 320, h: 480, view: 'hills', sky: 'warm' }, items: [['chairsFacing', 640, 930, 0.85]], wall: [['shelf', 640, 470, 0.7]] },

  // Świadome zakupy i usługi
  'dluznik-nie-oddaje-pieniedzy': { scene: 'table', palette: 'mist', light: 'left', items: [['documents', 560, 880, 1.15, true], ['envelope', 960, 900, 0.95, C.cream], ['card', 1240, 900, 0.8, C.blueDeep], ['cup', 1420, 890, 0.6, C.cream, false]] },
  'etykieta-nawozu-jak-czytac': { scene: 'table', palette: 'sage', light: 'right', win: { x: 1160, y: 80, w: 320, h: 460, view: 'hills', sky: 'warm' }, items: [['fertilizer', 560, 880, 1.05, C.cream, C.sage], ['seedling', 860, 890, 0.9, C.terra], ['glasses', 1140, 910, 0.75]] },
  'ratowanie-zywnosci-paczki-z-nadwyzkami': { scene: 'table', palette: 'cream', light: 'left', items: [['bread', 620, 870, 1.1], ['phone', 1080, 900, 0.85, true, 2], ['bowl', 1360, 900, 0.6, C.sand, [C.terra, C.ochre, C.rose, C.ochre]]] },
  'odroczone-platnosci-kup-teraz-zaplac-pozniej': { scene: 'table', palette: 'dusk', light: 'right', items: [['phone', 560, 890, 1.05, true, 3], ['card', 900, 900, 1, C.terra], ['receipt', 1220, 900, 1.05]] },
  'greenwashing-jak-rozpoznac': { scene: 'table', palette: 'sage', light: 'left', items: [['bottle', 520, 870, 0.85, C.sage, C.cream, false], ['tag', 780, 880, 1, C.leaf], ['jar', 1160, 880, 0.95, C.cream, C.sage], ['receipt', 1390, 900, 0.7]] },
};
