// Biblioteka obiektów do kompozycji „fotograficznych” (martwa natura, wnętrza, pejzaże).
// Każda funkcja zwraca fragment SVG. Współrzędne: x – środek obiektu, y – linia podstawy, s – skala.

export const C = {
  terra: '#A66B5B', terraDeep: '#86503F', sage: '#879B82', sageDeep: '#66795F', graphite: '#30352F',
  cream: '#FAF8F5', sand: '#EEE8E1', ochre: '#C9A15B', blue: '#7D97A3', blueDeep: '#5D7884', rose: '#D8A99B',
  white: '#FBF9F6', wood: '#B88D69', woodDeep: '#8E6647', leaf: '#6E8A62', leafDeep: '#4F6847', ink: '#454545',
};

export const PALETTES = {
  cream: { wall: ['#F4EEE7', '#E5D9CC'], floor: ['#CDB8A3', '#B39B84'], tone: '#E9DFD3' },
  sage: { wall: ['#E2E8DC', '#C9D3C3'], floor: ['#AEB8A3', '#909B86'], tone: '#D6DDD0' },
  clay: { wall: ['#EED9CF', '#DDBFB1'], floor: ['#BE907F', '#A27463'], tone: '#E5CBBF' },
  mist: { wall: ['#E4EAEC', '#CCD7DB'], floor: ['#A4B4BA', '#87999F'], tone: '#D8E0E3' },
  sand: { wall: ['#F1E6D3', '#E3D0B4'], floor: ['#CBAB80', '#B19066'], tone: '#E9DAC3' },
  dusk: { wall: ['#DED7E1', '#C6BCCB'], floor: ['#A194A7', '#87798D'], tone: '#D3CAD6' },
  night: { wall: ['#46504C', '#323A37'], floor: ['#5F544B', '#483F37'], tone: '#3C4542' },
};

const g = (id, a, b, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
let uid = 0;
const id = (p) => `${p}${++uid}`;
export const resetIds = () => { uid = 0; };
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16); const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
};
export const shadow = (x, y, w, o = 0.28) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.16}" fill="#2a2420" opacity="${o}" filter="url(#soft)"/>`;
const T = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;

// ---------- naczynia i dekoracje ----------
export function vase(x, y, s = 1, color = C.terra, stems = true) {
  const gi = id('v');
  return shadow(x + 20 * s, y, 95 * s) + T(x, y, s, `<defs>${g(gi, shade(color, 0.18), shade(color, -0.2), false)}</defs>
  ${stems ? `<path d="M-6 -250 C -40 -380 -90 -430 -150 -470" stroke="${C.leafDeep}" stroke-width="5" fill="none"/><path d="M4 -250 C 20 -400 60 -470 120 -520" stroke="${C.leafDeep}" stroke-width="5" fill="none"/>
  ${[[-150, -470, -30], [-100, -430, 20], [-60, -360, -40], [120, -520, 30], [70, -460, -20], [35, -380, 40]].map(([a, b, r]) => `<ellipse cx="${a}" cy="${b}" rx="34" ry="13" fill="${C.leaf}" transform="rotate(${r} ${a} ${b})"/>`).join('')}` : ''}
  <path d="M-40 -260 C -40 -230 -95 -190 -95 -110 C -95 -40 -60 0 0 0 C 60 0 95 -40 95 -110 C 95 -190 40 -230 40 -260 Z" fill="url(#${gi})"/>
  <ellipse cx="0" cy="-260" rx="40" ry="9" fill="${shade(color, -0.35)}"/>
  <path d="M-62 -150 C -66 -100 -54 -50 -30 -24" stroke="#fff" stroke-opacity=".28" stroke-width="10" fill="none" stroke-linecap="round"/>`);
}

export function plant(x, y, s = 1, pot = C.sand) {
  const gi = id('p');
  const leaves = [[-120, -330, -50, 1.1], [-70, -420, -20, 1.2], [10, -460, 5, 1.25], [90, -400, 30, 1.15], [140, -300, 60, 1], [-150, -230, -70, 0.9], [40, -330, 15, 0.9]];
  return shadow(x + 20 * s, y, 110 * s) + T(x, y, s, `<defs>${g(gi, shade(pot, 0.1), shade(pot, -0.22), false)}</defs>
  ${leaves.map(([a, b, r, k]) => `<g transform="translate(${a} ${b}) rotate(${r}) scale(${k})"><path d="M0 70 C -55 30 -55 -45 0 -80 C 55 -45 55 30 0 70 Z" fill="${C.leaf}"/><path d="M0 70 L0 -70" stroke="${C.leafDeep}" stroke-width="3"/></g>`).join('')}
  ${leaves.map(([a, b]) => `<path d="M0 -175 Q ${a / 2} ${b / 2} ${a} ${b + 60}" stroke="${C.leafDeep}" stroke-width="5" fill="none"/>`).join('')}
  <path d="M-105 -185 L105 -185 L84 0 L-84 0 Z" fill="url(#${gi})"/><rect x="-112" y="-200" width="224" height="26" rx="6" fill="${shade(pot, -0.08)}"/>`);
}

export function cup(x, y, s = 1, color = C.cream, steam = true) {
  const gi = id('c');
  return shadow(x + 10 * s, y, 85 * s) + T(x, y, s, `<defs>${g(gi, shade(color, 0.1), shade(color, -0.18), false)}</defs>
  <ellipse cx="0" cy="-4" rx="105" ry="16" fill="${shade(color, -0.12)}"/>
  <path d="M-70 -120 L70 -120 L58 -10 Q0 8 -58 -10 Z" fill="url(#${gi})"/>
  <path d="M68 -100 C 118 -100 118 -40 62 -38" stroke="${shade(color, -0.15)}" stroke-width="14" fill="none"/>
  <ellipse cx="0" cy="-120" rx="70" ry="12" fill="#6b4a37"/>
  ${steam ? `<path d="M-20 -150 C -40 -190 0 -210 -20 -250 M20 -150 C 0 -195 40 -215 20 -265" stroke="#fff" stroke-opacity=".7" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}`);
}

export function books(x, y, s = 1, colors = [C.terra, C.sage, C.cream]) {
  return shadow(x, y, 190 * s) + T(x, y, s, colors.map((c, i) => `<rect x="${-180 + i * 12}" y="${-46 * (i + 1)}" width="${360 - i * 30}" height="44" rx="5" fill="${c}"/><rect x="${-172 + i * 12}" y="${-46 * (i + 1) + 8}" width="${344 - i * 30}" height="6" fill="#fff" opacity=".35"/>`).join(''));
}

export function lamp(x, y, s = 1, color = C.cream, glow = true) {
  return (glow ? `<circle cx="${x}" cy="${y - 360 * s}" r="${300 * s}" fill="url(#glow)" opacity=".75"/>` : '') + shadow(x, y, 110 * s) + T(x, y, s, `
  <ellipse cx="0" cy="-10" rx="85" ry="16" fill="${C.graphite}"/><rect x="-7" y="-300" width="14" height="292" fill="${C.graphite}"/>
  <path d="M-120 -290 L120 -290 L80 -460 L-80 -460 Z" fill="${color}"/><path d="M-120 -290 L120 -290 L80 -460 L-80 -460 Z" fill="#000" opacity=".06"/>`);
}

export function candle(x, y, s = 1, color = C.cream) {
  return `<circle cx="${x}" cy="${y - 190 * s}" r="${120 * s}" fill="url(#glow)"/>` + shadow(x, y, 60 * s) + T(x, y, s, `<rect x="-42" y="-150" width="84" height="150" rx="8" fill="${color}"/><rect x="-42" y="-150" width="84" height="150" rx="8" fill="#000" opacity=".05"/><path d="M0 -150 L0 -168" stroke="${C.graphite}" stroke-width="4"/><path d="M0 -215 C 18 -190 14 -172 0 -168 C -14 -172 -18 -190 0 -215 Z" fill="${C.ochre}"/>`);
}

export function bowl(x, y, s = 1, color = C.cream, fruit = [C.terra, C.ochre, C.sage, C.rose]) {
  return shadow(x, y, 190 * s) + T(x, y, s, `${fruit.map((c, i) => `<circle cx="${-90 + i * 60}" cy="${-110 - (i % 2) * 30}" r="58" fill="${c}"/><circle cx="${-105 + i * 60}" cy="${-128 - (i % 2) * 30}" r="14" fill="#fff" opacity=".3"/>`).join('')}
  <path d="M-200 -100 L200 -100 C 190 -20 110 0 0 0 C -110 0 -190 -20 -200 -100 Z" fill="${color}"/><path d="M-200 -100 L200 -100 C 190 -20 110 0 0 0 C -110 0 -190 -20 -200 -100 Z" fill="#000" opacity=".07"/>`);
}

export function bread(x, y, s = 1) {
  return shadow(x, y, 230 * s) + T(x, y, s, `<rect x="-240" y="-26" width="480" height="26" rx="10" fill="${C.wood}"/><rect x="-240" y="-26" width="480" height="8" rx="4" fill="#fff" opacity=".2"/>
  <path d="M-170 -26 C -180 -120 -60 -170 30 -165 C 140 -160 190 -100 180 -26 Z" fill="#C88E55"/>${[-110, -40, 30, 100].map((a) => `<path d="M${a} -140 Q ${a + 25} -100 ${a + 10} -60" stroke="#A86E3A" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
  <path d="M120 -26 C 110 -80 150 -110 200 -100 C 250 -90 250 -40 230 -26 Z" fill="#D9A46A"/>`);
}

export function jar(x, y, s = 1, color = C.rose, label = C.cream) {
  return shadow(x, y, 80 * s) + T(x, y, s, `<rect x="-70" y="-120" width="140" height="120" rx="18" fill="${color}"/><rect x="-74" y="-150" width="148" height="40" rx="10" fill="${C.graphite}"/><rect x="-50" y="-90" width="100" height="56" rx="6" fill="${label}"/><rect x="-60" y="-112" width="12" height="96" rx="6" fill="#fff" opacity=".25"/>`);
}

export function bottle(x, y, s = 1, color = C.sage, label = C.cream, pump = true) {
  return shadow(x, y, 70 * s) + T(x, y, s, `<rect x="-58" y="-300" width="116" height="300" rx="26" fill="${color}"/><rect x="-42" y="-200" width="84" height="110" rx="6" fill="${label}"/><rect x="-26" y="-182" width="52" height="8" fill="${C.graphite}" opacity=".5"/><rect x="-26" y="-164" width="36" height="6" fill="${C.graphite}" opacity=".35"/>
  ${pump ? `<rect x="-22" y="-350" width="44" height="52" fill="${C.graphite}"/><rect x="-22" y="-372" width="80" height="22" rx="6" fill="${C.graphite}"/>` : `<rect x="-26" y="-345" width="52" height="48" rx="8" fill="${C.graphite}"/>`}<rect x="-46" y="-285" width="14" height="250" rx="7" fill="#fff" opacity=".22"/>`);
}

export function tube(x, y, s = 1, color = C.cream, cap = C.terra) {
  return shadow(x, y, 160 * s) + T(x, y, s, `<path d="M-170 -70 L120 -60 L120 0 L-170 -6 Z" fill="${color}"/><path d="M-170 -70 L120 -60 L120 -40 L-170 -50 Z" fill="#fff" opacity=".35"/><rect x="120" y="-62" width="62" height="62" rx="8" fill="${cap}"/><rect x="-170" y="-74" width="16" height="72" fill="${shade(color, -0.15)}"/><rect x="-100" y="-50" width="120" height="10" fill="${C.sage}"/>`);
}

export function polish(x, y, s = 1, color = C.terra) {
  return shadow(x, y, 45 * s) + T(x, y, s, `<rect x="-45" y="-95" width="90" height="95" rx="16" fill="${color}"/><rect x="-18" y="-190" width="36" height="96" rx="6" fill="${C.graphite}"/><rect x="-34" y="-86" width="12" height="74" rx="6" fill="#fff" opacity=".3"/>`);
}

export function stones(x, y, s = 1) {
  return shadow(x, y, 150 * s) + T(x, y, s, `<ellipse cx="0" cy="-34" rx="150" ry="36" fill="#7D7A73"/><ellipse cx="0" cy="-92" rx="115" ry="30" fill="#93908A"/><ellipse cx="0" cy="-142" rx="80" ry="24" fill="#A9A6A0"/><ellipse cx="-20" cy="-152" rx="40" ry="8" fill="#fff" opacity=".25"/>`);
}

export function towels(x, y, s = 1, colors = [C.cream, C.sage, C.sand]) {
  return shadow(x, y, 170 * s) + T(x, y, s, colors.map((c, i) => `<rect x="-170" y="${-70 * (i + 1)}" width="340" height="66" rx="30" fill="${c}"/><circle cx="130" cy="${-70 * (i + 1) + 33}" r="26" fill="${shade(c, -0.12)}"/><circle cx="130" cy="${-70 * (i + 1) + 33}" r="12" fill="${shade(c, -0.2)}"/>`).join(''));
}

// ---------- technologia i papier ----------
export function phone(x, y, s = 1, lit = true, dots = 3) {
  return shadow(x, y, 120 * s) + T(x, y, s, `<rect x="-130" y="-34" width="260" height="34" rx="10" fill="${C.graphite}"/>
  <g transform="rotate(-8)"><rect x="-80" y="-330" width="160" height="300" rx="22" fill="${C.graphite}"/><rect x="-68" y="-318" width="136" height="276" rx="14" fill="${lit ? '#DCE6E8' : '#3d4542'}"/>
  ${lit ? Array.from({ length: dots }, (_, i) => `<rect x="-56" y="${-300 + i * 52}" width="112" height="40" rx="10" fill="#fff"/><circle cx="-36" cy="${-280 + i * 52}" r="10" fill="${[C.terra, C.sage, C.ochre, C.blue][i % 4]}"/>`).join('') : ''}</g>`);
}

export function laptop(x, y, s = 1) {
  return shadow(x, y, 260 * s) + T(x, y, s, `<path d="M-260 0 L260 0 L230 -24 L-230 -24 Z" fill="#A8ABA6"/><rect x="-200" y="-300" width="400" height="276" rx="14" fill="${C.graphite}"/><rect x="-184" y="-284" width="368" height="240" rx="6" fill="#DCE3E0"/>
  <rect x="-160" y="-260" width="200" height="16" rx="4" fill="${C.sage}"/><rect x="-160" y="-230" width="300" height="10" rx="4" fill="#B9C2BE"/><rect x="-160" y="-210" width="260" height="10" rx="4" fill="#B9C2BE"/><rect x="-160" y="-180" width="140" height="100" rx="8" fill="${C.rose}" opacity=".7"/><rect x="0" y="-180" width="140" height="100" rx="8" fill="${C.blue}" opacity=".5"/>`);
}

export function notebook(x, y, s = 1, color = C.cream) {
  return shadow(x, y, 200 * s) + T(x, y, s, `<g transform="skewX(-28)"><rect x="-150" y="-60" width="300" height="60" rx="6" fill="${shade(color, -0.12)}"/><rect x="-146" y="-64" width="146" height="60" fill="${color}"/><rect x="0" y="-64" width="146" height="60" fill="${shade(color, -0.04)}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="-130" y="${-56 + i * 13}" width="110" height="3" fill="${C.blue}" opacity=".5"/><rect x="18" y="${-56 + i * 13}" width="110" height="3" fill="${C.blue}" opacity=".5"/>`).join('')}</g>
  <rect x="60" y="-80" width="190" height="12" rx="6" fill="${C.terra}" transform="rotate(-12 60 -80)"/>`);
}

export function documents(x, y, s = 1, stamp = true) {
  return shadow(x, y, 190 * s) + T(x, y, s, `<g transform="skewX(-30)"><rect x="-150" y="-48" width="300" height="48" fill="#E9E4DA"/><rect x="-140" y="-56" width="300" height="48" fill="${C.white}"/>
  ${[0, 1, 2].map((i) => `<rect x="-120" y="${-48 + i * 12}" width="${200 - i * 40}" height="4" fill="${C.ink}" opacity=".45"/>`).join('')}${stamp ? `<circle cx="90" cy="-26" r="16" fill="none" stroke="${C.terra}" stroke-width="4"/>` : ''}</g>
  <rect x="120" y="-36" width="150" height="12" rx="6" fill="${C.graphite}" transform="rotate(-8 120 -36)"/>`);
}

export function envelope(x, y, s = 1, color = C.cream) {
  return shadow(x, y, 150 * s) + T(x, y, s, `<g transform="skewX(-30)"><rect x="-140" y="-70" width="280" height="70" fill="${color}"/><path d="M-140 -70 L0 -20 L140 -70" stroke="${shade(color, -0.2)}" stroke-width="4" fill="none"/></g>`);
}

export function clock(x, y, s = 1, color = C.cream, hour = 2) {
  const a = (hour % 12) * 30;
  return T(x, y, s, `<circle cx="0" cy="0" r="120" fill="${C.graphite}"/><circle cx="0" cy="0" r="106" fill="${color}"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-98" width="6" height="${i % 3 ? 10 : 20}" fill="${C.graphite}" transform="rotate(${i * 30})"/>`).join('')}
  <rect x="-5" y="-62" width="10" height="66" rx="5" fill="${C.graphite}" transform="rotate(${a})"/><rect x="-3" y="-86" width="6" height="90" rx="3" fill="${C.terra}" transform="rotate(60)"/><circle r="9" fill="${C.graphite}"/>`);
}

export function glasses(x, y, s = 1) {
  return shadow(x, y, 120 * s, 0.2) + T(x, y, s, `<g fill="none" stroke="${C.graphite}" stroke-width="9"><ellipse cx="-62" cy="-26" rx="54" ry="24"/><ellipse cx="62" cy="-26" rx="54" ry="24"/><path d="M-8 -30 Q0 -40 8 -30"/><path d="M-116 -30 L-170 -46 M116 -30 L170 -46"/></g>`);
}

export function headphones(x, y, s = 1, color = C.graphite) {
  return shadow(x, y, 140 * s) + T(x, y, s, `<path d="M-110 -60 C -110 -260 110 -260 110 -60" stroke="${color}" stroke-width="22" fill="none"/><rect x="-150" y="-120" width="70" height="120" rx="30" fill="${color}"/><rect x="80" y="-120" width="70" height="120" rx="30" fill="${color}"/><rect x="-140" y="-108" width="18" height="96" rx="9" fill="${C.terra}"/><rect x="122" y="-108" width="18" height="96" rx="9" fill="${C.terra}"/>`);
}

export function card(x, y, s = 1, color = C.blueDeep) {
  return shadow(x, y, 130 * s, 0.22) + T(x, y, s, `<g transform="skewX(-30)"><rect x="-130" y="-40" width="260" height="40" rx="6" fill="${color}"/><rect x="-110" y="-30" width="40" height="12" rx="3" fill="${C.ochre}"/></g>`);
}

export function coins(x, y, s = 1) {
  return shadow(x, y, 120 * s) + T(x, y, s, `${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="-40" cy="${-12 - i * 18}" rx="56" ry="16" fill="${C.ochre}" stroke="#A9843F" stroke-width="3"/>`).join('')}${[0, 1, 2].map((i) => `<ellipse cx="60" cy="${-12 - i * 18}" rx="56" ry="16" fill="#D8B46D" stroke="#A9843F" stroke-width="3"/>`).join('')}`);
}

export function moneyJar(x, y, s = 1) {
  return shadow(x, y, 100 * s) + T(x, y, s, `<rect x="-90" y="-230" width="180" height="230" rx="30" fill="#DCE6E4" opacity=".75"/>${[0, 1, 2, 3].map((i) => `<ellipse cx="${-30 + (i % 2) * 50}" cy="${-30 - i * 32}" rx="44" ry="13" fill="${C.ochre}"/>`).join('')}<rect x="-98" y="-262" width="196" height="40" rx="10" fill="${C.terra}"/><rect x="-74" y="-212" width="18" height="180" rx="9" fill="#fff" opacity=".4"/>`);
}

export function receipt(x, y, s = 1) {
  return shadow(x, y, 90 * s, 0.2) + T(x, y, s, `<g transform="rotate(-6)"><path d="M-80 -300 L80 -300 L80 0 L60 -14 L40 0 L20 -14 L0 0 L-20 -14 L-40 0 L-60 -14 L-80 0 Z" fill="${C.white}"/>${Array.from({ length: 9 }, (_, i) => `<rect x="-60" y="${-276 + i * 26}" width="${i % 3 === 2 ? 60 : 110}" height="7" fill="${C.ink}" opacity=".35"/>`).join('')}</g>`);
}

export function tag(x, y, s = 1, color = C.sage, leafMark = true) {
  return T(x, y, s, `<path d="M-10 -260 L120 -260 L170 -200 L120 -140 L-10 -140 Z" fill="${color}"/><circle cx="125" cy="-200" r="12" fill="${C.cream}"/><path d="M125 -200 C 160 -230 200 -260 240 -330" stroke="${C.graphite}" stroke-width="3" fill="none"/>${leafMark ? '<path d="M30 -170 C 30 -230 80 -240 95 -235 C 95 -200 70 -170 30 -170 Z" fill="#fff" opacity=".85"/>' : ''}`);
}

// ---------- ogród ----------
export function wateringCan(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 170 * s) + T(x, y, s, `<path d="M-110 0 L-90 -200 L90 -200 L110 0 Z" fill="${color}"/><path d="M90 -150 L250 -270 L262 -254 L104 -120 Z" fill="${color}"/><ellipse cx="258" cy="-264" rx="20" ry="28" fill="${shade(color, -0.2)}" transform="rotate(-38 258 -264)"/><path d="M-80 -200 C -80 -300 80 -300 80 -200" stroke="${shade(color, -0.25)}" stroke-width="18" fill="none"/><rect x="-96" y="-150" width="16" height="140" rx="8" fill="#fff" opacity=".2"/>`);
}

export function fertilizer(x, y, s = 1, color = C.cream, labelColor = C.sage) {
  return shadow(x, y, 95 * s) + T(x, y, s, `<path d="M-90 0 L-90 -250 C -90 -280 -60 -300 -40 -300 L40 -300 C 60 -300 90 -280 90 -250 L90 0 Z" fill="${color}"/><rect x="-28" y="-350" width="56" height="54" rx="8" fill="${labelColor}"/>
  <rect x="-70" y="-220" width="140" height="150" rx="8" fill="${labelColor}"/><path d="M-30 -110 C -30 -180 30 -200 45 -195 C 45 -150 20 -110 -30 -110 Z" fill="#fff" opacity=".85"/><text x="0" y="-80" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">N·P·K</text><rect x="-80" y="-280" width="16" height="250" rx="8" fill="#fff" opacity=".3"/>`);
}

export function seedling(x, y, s = 1, pot = C.terra) {
  return shadow(x, y, 70 * s) + T(x, y, s, `<path d="M0 -100 C 0 -150 0 -170 0 -190" stroke="${C.leafDeep}" stroke-width="6"/><ellipse cx="-34" cy="-200" rx="38" ry="16" fill="${C.leaf}" transform="rotate(-25 -34 -200)"/><ellipse cx="34" cy="-215" rx="38" ry="16" fill="${C.leaf}" transform="rotate(25 34 -215)"/><path d="M-62 -100 L62 -100 L50 0 L-50 0 Z" fill="${pot}"/><rect x="-68" y="-112" width="136" height="20" rx="5" fill="${shade(pot, -0.12)}"/>`);
}

// ---------- podróże ----------
export function suitcase(x, y, s = 1, color = C.terra) {
  return shadow(x, y, 150 * s) + T(x, y, s, `<rect x="-40" y="-420" width="80" height="60" rx="16" fill="none" stroke="${C.graphite}" stroke-width="14"/><rect x="-150" y="-370" width="300" height="350" rx="30" fill="${color}"/>${[-80, 0, 80].map((a) => `<rect x="${a - 5}" y="-360" width="10" height="330" fill="#000" opacity=".1"/>`).join('')}<circle cx="-100" cy="-8" r="16" fill="${C.graphite}"/><circle cx="100" cy="-8" r="16" fill="${C.graphite}"/><rect x="-136" y="-356" width="22" height="300" rx="11" fill="#fff" opacity=".15"/>`);
}

export function ticket(x, y, s = 1, color = C.ochre) {
  return T(x, y, s, `<g transform="rotate(-10)"><rect x="-140" y="-80" width="280" height="80" rx="10" fill="${color}"/><circle cx="60" cy="-80" r="12" fill="${C.sand}"/><circle cx="60" cy="0" r="12" fill="${C.sand}"/><path d="M60 -66 L60 -14" stroke="#fff" stroke-dasharray="6 6" stroke-width="3"/><rect x="-120" y="-60" width="140" height="10" fill="#fff" opacity=".7"/><rect x="-120" y="-38" width="90" height="8" fill="#fff" opacity=".5"/></g>`);
}

export function hat(x, y, s = 1, color = '#D8C29A') {
  return shadow(x, y, 190 * s) + T(x, y, s, `<ellipse cx="0" cy="-20" rx="200" ry="40" fill="${color}"/><path d="M-100 -30 C -100 -150 100 -150 100 -30 Z" fill="${shade(color, 0.08)}"/><rect x="-100" y="-62" width="200" height="22" fill="${C.terra}"/>`);
}

// ---------- dzieci i rodzina ----------
export function blocks(x, y, s = 1) {
  const b = [[-140, 0, C.terra], [-20, 0, C.ochre], [100, 0, C.sage], [-80, -120, C.blue], [40, -120, C.rose], [-20, -240, C.cream]];
  return shadow(x, y, 230 * s) + T(x, y, s, b.map(([a, c, col]) => `<rect x="${a - 58}" y="${c - 116}" width="116" height="116" rx="10" fill="${col}"/><rect x="${a - 58}" y="${c - 116}" width="116" height="22" rx="10" fill="#fff" opacity=".2"/>`).join(''));
}

export function ball(x, y, s = 1, color = C.terra) {
  return shadow(x, y, 90 * s) + T(x, y, s, `<circle cx="0" cy="-100" r="100" fill="${color}"/><path d="M-100 -100 C -40 -60 40 -60 100 -100 M0 -200 C -40 -140 -40 -60 0 0" stroke="#fff" stroke-width="10" fill="none" opacity=".7"/><circle cx="-35" cy="-140" r="24" fill="#fff" opacity=".25"/>`);
}

export function backpack(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 140 * s) + T(x, y, s, `<path d="M-60 -330 C -60 -390 60 -390 60 -330" stroke="${shade(color, -0.3)}" stroke-width="16" fill="none"/><rect x="-140" y="-340" width="280" height="340" rx="70" fill="${color}"/><rect x="-100" y="-170" width="200" height="130" rx="30" fill="${shade(color, -0.12)}"/><rect x="-80" y="-150" width="160" height="10" rx="5" fill="${C.ochre}"/>`);
}

// ---------- ruch ----------
export function mat(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 230 * s) + T(x, y, s, `<rect x="-230" y="-90" width="400" height="90" rx="45" fill="${color}"/><circle cx="170" cy="-45" r="45" fill="${shade(color, -0.15)}"/><circle cx="170" cy="-45" r="22" fill="${shade(color, -0.3)}"/><rect x="-200" y="-80" width="330" height="14" rx="7" fill="#fff" opacity=".2"/>`);
}

export function weights(x, y, s = 1, color = C.graphite) {
  return shadow(x, y, 130 * s) + T(x, y, s, `<rect x="-100" y="-50" width="200" height="22" rx="8" fill="#9DA19B"/><rect x="-150" y="-90" width="60" height="100" rx="14" fill="${color}"/><rect x="90" y="-90" width="60" height="100" rx="14" fill="${color}"/>`);
}

export function shoe(x, y, s = 1, color = C.cream, accent = C.terra) {
  return shadow(x, y, 160 * s) + T(x, y, s, `<path d="M-170 0 L-170 -90 C -150 -130 -90 -150 -40 -110 L40 -60 C 100 -50 170 -40 175 0 Z" fill="${color}"/><rect x="-175" y="-18" width="352" height="20" rx="10" fill="${C.graphite}"/><path d="M-60 -100 L-10 -66 M-40 -120 L10 -84" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><path d="M-170 -60 C -120 -60 -40 -40 175 -12" stroke="${accent}" stroke-width="10" fill="none" opacity=".8"/>`);
}

// ---------- meble i elementy wnętrz (skala w scenie „room”) ----------
export function windowView(x, y, w, h, view = 'sky', light = 'warm') {
  const sky = { warm: ['#F6E3CF', '#EBC9A9'], cool: ['#DCE7EC', '#BFD3DB'], dusk: ['#E8D3DA', '#C9B3C7'], night: ['#2E3A47', '#4C5A66'] }[light];
  const gid = id('sky');
  const views = {
    sky: `<circle cx="${w * 0.7}" cy="${h * 0.35}" r="${w * 0.12}" fill="#fff" opacity=".7"/>`,
    sea: `<rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="${C.blue}"/><rect x="0" y="${h * 0.62}" width="${w}" height="6" fill="#fff" opacity=".5"/><circle cx="${w * 0.3}" cy="${h * 0.45}" r="${w * 0.1}" fill="#fff" opacity=".75"/>`,
    hills: `<path d="M0 ${h * 0.7} C ${w * 0.3} ${h * 0.45} ${w * 0.55} ${h * 0.55} ${w} ${h * 0.5} L${w} ${h} L0 ${h} Z" fill="${C.sage}"/><path d="M0 ${h * 0.82} C ${w * 0.4} ${h * 0.65} ${w * 0.7} ${h * 0.8} ${w} ${h * 0.72} L${w} ${h} L0 ${h} Z" fill="${C.sageDeep}"/>`,
    trees: `${[0.15, 0.35, 0.6, 0.82].map((k, i) => `<path d="M${w * k} ${h * 0.4 + i * 10} L${w * k - 60} ${h} L${w * k + 60} ${h} Z" fill="${i % 2 ? C.leafDeep : C.leaf}"/>`).join('')}`,
    city: `${[0.05, 0.22, 0.4, 0.58, 0.76].map((k, i) => `<rect x="${w * k}" y="${h * (0.45 + (i % 3) * 0.1)}" width="${w * 0.15}" height="${h}" fill="${i % 2 ? '#B7A79A' : '#C9BBAE'}"/>`).join('')}`,
    mountains: `<path d="M0 ${h * 0.8} L${w * 0.3} ${h * 0.35} L${w * 0.5} ${h * 0.6} L${w * 0.72} ${h * 0.3} L${w} ${h * 0.75} L${w} ${h} L0 ${h} Z" fill="#8FA0A6"/><path d="M${w * 0.3} ${h * 0.35} L${w * 0.24} ${h * 0.45} L${w * 0.36} ${h * 0.45} Z M${w * 0.72} ${h * 0.3} L${w * 0.66} ${h * 0.4} L${w * 0.78} ${h * 0.4} Z" fill="#fff"/><path d="M0 ${h * 0.9} C ${w * 0.4} ${h * 0.75} ${w * 0.6} ${h * 0.85} ${w} ${h * 0.8} L${w} ${h} L0 ${h} Z" fill="${C.sageDeep}"/>`,
    night: `<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${w * 0.09}" fill="#F3E9D2"/><circle cx="${w * 0.68}" cy="${h * 0.27}" r="${w * 0.09}" fill="${sky[0]}"/>${[[0.2, 0.2], [0.35, 0.4], [0.5, 0.15], [0.15, 0.55], [0.85, 0.6]].map(([a, b]) => `<circle cx="${w * a}" cy="${h * b}" r="4" fill="#fff" opacity=".8"/>`).join('')}`,
  };
  return `<g transform="translate(${x} ${y})"><defs>${g(gid, sky[0], sky[1])}<clipPath id="${gid}c"><path d="M0 ${h} L0 ${w / 2} A ${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2} L${w} ${h} Z"/></clipPath></defs>
  <path d="M-22 ${h + 22} L-22 ${w / 2} A ${w / 2 + 22} ${w / 2 + 22} 0 0 1 ${w + 22} ${w / 2} L${w + 22} ${h + 22} Z" fill="${C.white}"/>
  <g clip-path="url(#${gid}c)"><rect width="${w}" height="${h}" fill="url(#${gid})"/>${views[view] || ''}</g>
  <path d="M${w / 2} ${h} L${w / 2} 0 M0 ${h * 0.62} L${w} ${h * 0.62}" stroke="${C.white}" stroke-width="12"/><rect x="-40" y="${h + 10}" width="${w + 80}" height="24" rx="6" fill="${C.white}"/></g>`;
}

export function sofa(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 380 * s, 0.25) + T(x, y, s, `<rect x="-380" y="-300" width="760" height="190" rx="50" fill="${shade(color, -0.08)}"/><rect x="-420" y="-200" width="840" height="150" rx="40" fill="${color}"/><rect x="-460" y="-250" width="110" height="220" rx="45" fill="${shade(color, -0.04)}"/><rect x="350" y="-250" width="110" height="220" rx="45" fill="${shade(color, -0.04)}"/>
  <rect x="-260" y="-290" width="170" height="130" rx="34" fill="${C.cream}" transform="rotate(-8 -175 -225)"/><rect x="100" y="-280" width="150" height="120" rx="30" fill="${C.terra}" transform="rotate(6 175 -220)"/><rect x="-400" y="-40" width="18" height="40" fill="${C.woodDeep}"/><rect x="382" y="-40" width="18" height="40" fill="${C.woodDeep}"/>`);
}

export function armchair(x, y, s = 1, color = C.terra, flip = false) {
  return shadow(x, y, 190 * s, 0.25) + T(x, y, s, `<g transform="scale(${flip ? -1 : 1} 1)"><path d="M-160 -360 C -160 -420 120 -420 140 -340 L150 -170 L-170 -170 Z" fill="${shade(color, -0.08)}"/><rect x="-200" y="-200" width="380" height="130" rx="40" fill="${color}"/><rect x="-230" y="-250" width="80" height="200" rx="34" fill="${shade(color, -0.03)}"/><rect x="140" y="-230" width="70" height="180" rx="30" fill="${shade(color, -0.03)}"/><rect x="-190" y="-60" width="16" height="60" fill="${C.woodDeep}"/><rect x="160" y="-60" width="16" height="60" fill="${C.woodDeep}"/></g>`);
}

export function table(x, y, s = 1, color = C.wood) {
  return shadow(x, y, 260 * s, 0.22) + T(x, y, s, `<rect x="-260" y="-300" width="520" height="34" rx="10" fill="${color}"/><rect x="-220" y="-266" width="20" height="266" fill="${shade(color, -0.25)}"/><rect x="200" y="-266" width="20" height="266" fill="${shade(color, -0.25)}"/>`);
}

export function shelf(x, y, s = 1) {
  const items = [[C.terra, 50], [C.sage, 40], [C.cream, 60], [C.ochre, 34], [C.blue, 46]];
  return T(x, y, s, `${[0, 1, 2].map((r) => `<rect x="-260" y="${-r * 170}" width="520" height="18" fill="${C.wood}"/>${items.map(([c, w], i) => `<rect x="${-240 + i * 70 + r * 14}" y="${-r * 170 - 120 + (i % 2) * 20}" width="${w}" height="${120 - (i % 2) * 20}" rx="4" fill="${c}"/>`).join('')}<rect x="${120 - r * 30}" y="${-r * 170 - 90}" width="110" height="90" rx="8" fill="${r % 2 ? '#CDB49A' : '#B9C4B3'}"/>`).join('')}`);
}

export function boxes(x, y, s = 1) {
  return shadow(x, y, 220 * s, 0.22) + T(x, y, s, `${[[-140, 0, '#CDB49A'], [10, 0, '#D9C6B0'], [150, 0, '#C2A98F'], [-70, -150, '#E2D3C2'], [80, -150, '#CDB49A']].map(([a, b, c]) => `<rect x="${a - 70}" y="${b - 145}" width="140" height="145" rx="8" fill="${c}"/><rect x="${a - 26}" y="${b - 110}" width="52" height="18" rx="9" fill="#000" opacity=".15"/>`).join('')}`);
}

export function bed(x, y, s = 1, color = C.cream, cover = C.sage) {
  return shadow(x, y, 420 * s, 0.25) + T(x, y, s, `<rect x="-440" y="-420" width="40" height="420" rx="10" fill="${C.woodDeep}"/><rect x="-420" y="-230" width="860" height="160" rx="20" fill="${color}"/><path d="M-120 -240 L440 -240 L440 -70 L-160 -70 C -150 -140 -150 -200 -120 -240 Z" fill="${cover}"/>
  <rect x="-390" y="-300" width="220" height="90" rx="40" fill="${C.white}"/><rect x="-330" y="-330" width="200" height="90" rx="40" fill="${C.sand}"/><rect x="-420" y="-70" width="860" height="40" fill="${C.wood}"/>`);
}

export function acUnit(x, y, s = 1) {
  return T(x, y, s, `<rect x="-260" y="-110" width="520" height="140" rx="26" fill="${C.white}"/><rect x="-260" y="-110" width="520" height="140" rx="26" fill="#000" opacity=".04"/><rect x="-230" y="0" width="460" height="10" rx="5" fill="#C9CCC7"/><circle cx="210" cy="-70" r="7" fill="${C.sage}"/>
  ${[0, 1, 2].map((i) => `<path d="M${-160 + i * 120} 50 C ${-180 + i * 120} 110 ${-140 + i * 120} 150 ${-170 + i * 120} 210" stroke="${C.blue}" stroke-width="8" fill="none" opacity=".45" stroke-linecap="round"/>`).join('')}`);
}

export function wallPanels(x, y, w, h, color = C.sand, variant = 'stone') {
  const cols = 4; const pw = w / cols;
  const deco = variant === 'stone' ? (i) => `<path d="M${i * pw + 30} ${h * 0.3} C ${i * pw + pw * 0.5} ${h * 0.2} ${i * pw + pw * 0.7} ${h * 0.5} ${i * pw + pw - 20} ${h * 0.45}" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none"/>` : (i) => `${[0.2, 0.4, 0.6, 0.8].map((k) => `<rect x="${i * pw + 10}" y="${h * k}" width="${pw - 20}" height="3" fill="#000" opacity=".06"/>`).join('')}`;
  return `<g transform="translate(${x} ${y})">${Array.from({ length: cols }, (_, i) => `<rect x="${i * pw}" y="0" width="${pw - 4}" height="${h}" fill="${i % 2 ? shade(color, -0.04) : color}"/>${deco(i)}`).join('')}<rect x="0" y="${h - 16}" width="${w}" height="16" fill="${C.graphite}" opacity=".5"/></g>`;
}

export function mirror(x, y, s = 1) {
  return T(x, y, s, `<ellipse cx="0" cy="0" rx="150" ry="200" fill="${C.ochre}"/><ellipse cx="0" cy="0" rx="134" ry="184" fill="#DCE6E8"/><path d="M-70 -110 L40 -160 M-90 -40 L70 -110" stroke="#fff" stroke-width="16" opacity=".6"/>`);
}

export function sink(x, y, s = 1) {
  return shadow(x, y, 220 * s, 0.2) + T(x, y, s, `<rect x="-240" y="-60" width="480" height="60" rx="8" fill="${C.wood}"/><path d="M-170 -60 L170 -60 C 160 -150 -160 -150 -170 -60 Z" fill="${C.white}"/><rect x="-14" y="-200" width="28" height="80" rx="8" fill="${C.graphite}"/><rect x="-14" y="-200" width="80" height="22" rx="8" fill="${C.graphite}"/>`);
}

export function swatches(x, y, s = 1) {
  const cols = [C.terra, C.rose, C.sand, C.sage, C.blue, C.ochre];
  return shadow(x, y, 160 * s, 0.2) + T(x, y, s, cols.map((c, i) => `<g transform="rotate(${-60 + i * 22})"><rect x="-26" y="-300" width="52" height="300" rx="12" fill="${c}"/><rect x="-18" y="-290" width="36" height="20" rx="4" fill="#fff" opacity=".5"/></g>`).join('') + `<circle cx="0" cy="-10" r="14" fill="${C.graphite}"/>`);
}

export function paintCan(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 110 * s) + T(x, y, s, `<rect x="-110" y="-200" width="220" height="200" rx="14" fill="#C9CCC7"/><rect x="-110" y="-150" width="220" height="90" fill="${color}"/><ellipse cx="0" cy="-200" rx="110" ry="22" fill="${color}"/><path d="M-110 -200 C -110 -320 110 -320 110 -200" stroke="${C.graphite}" stroke-width="8" fill="none"/>`);
}

export function rug(x, y, w, color = C.terra) {
  return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.14}" fill="${color}" opacity=".55"/><ellipse cx="${x}" cy="${y}" rx="${w * 0.8}" ry="${w * 0.1}" fill="none" stroke="${C.cream}" stroke-width="6" opacity=".6"/>`;
}

export function floorLamp(x, y, s = 1, glow = true) {
  return (glow ? `<circle cx="${x}" cy="${y - 640 * s}" r="${360 * s}" fill="url(#glow)" opacity=".8"/>` : '') + shadow(x, y, 90 * s) + T(x, y, s, `<ellipse cx="0" cy="-8" rx="80" ry="16" fill="${C.graphite}"/><rect x="-6" y="-600" width="12" height="595" fill="${C.graphite}"/><path d="M-110 -580 L110 -580 L70 -730 L-70 -730 Z" fill="${C.cream}"/>`);
}

export function pendant(x, y, s = 1) {
  return `<circle cx="${x}" cy="${y + 120 * s}" r="${260 * s}" fill="url(#glow)" opacity=".85"/>` + T(x, y, s, `<rect x="-3" y="-400" width="6" height="400" fill="${C.graphite}"/><path d="M-110 90 C -110 -20 110 -20 110 90 Z" fill="${C.terra}"/><ellipse cx="0" cy="92" rx="40" ry="10" fill="#FFF3D6"/>`);
}

export function chairsFacing(x, y, s = 1) {
  return armchair(x - 330 * s, y, s * 0.85, C.sage) + armchair(x + 330 * s, y, s * 0.85, C.terra, true) + table(x, y, s * 0.45, C.woodDeep);
}

export function bubbles(x, y, s = 1) {
  return T(x, y, s, `<path d="M-260 -200 C -260 -300 -40 -300 -40 -200 C -40 -120 -150 -110 -190 -110 L-240 -60 L-225 -120 C -250 -135 -260 -160 -260 -200 Z" fill="${C.cream}"/><path d="M40 -260 C 40 -360 260 -360 260 -260 C 260 -200 220 -175 180 -170 L200 -110 L130 -170 C 70 -170 40 -210 40 -260 Z" fill="${C.sage}"/>${[0, 1, 2].map((i) => `<circle cx="${-200 + i * 50}" cy="-200" r="10" fill="${C.terra}"/>`).join('')}`);
}

export function stroller(x, y, s = 1, color = C.sage) {
  return shadow(x, y, 170 * s) + T(x, y, s, `<path d="M-160 -330 C -160 -180 -60 -120 120 -120 L120 -230 C 40 -230 -40 -270 -60 -330 Z" fill="${color}"/><path d="M-160 -330 L-60 -330 C -40 -270 40 -230 120 -230 L120 -120 C -60 -120 -160 -180 -160 -330" fill="#000" opacity=".06"/><path d="M120 -230 L190 -330" stroke="${C.graphite}" stroke-width="10"/><circle cx="-90" cy="-40" r="40" fill="none" stroke="${C.graphite}" stroke-width="12"/><circle cx="90" cy="-40" r="40" fill="none" stroke="${C.graphite}" stroke-width="12"/>`);
}

export function trainWindow(x, y, w, h, view = 'hills') {
  return `<g transform="translate(${x} ${y})"><rect x="-40" y="-40" width="${w + 80}" height="${h + 80}" rx="60" fill="#5C6460"/>` + windowRect(0, 0, w, h, view) + `</g>`;
}
function windowRect(x, y, w, h, view) {
  const gid = id('tw');
  return `<defs>${g(gid, '#F5DEC8', '#E9C3A3')}<clipPath id="${gid}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="44"/></clipPath></defs><g clip-path="url(#${gid}c)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${gid})"/>
  <circle cx="${x + w * 0.75}" cy="${y + h * 0.3}" r="${h * 0.12}" fill="#FFF6E6"/>${view === 'night' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#26303C" opacity=".85"/>${[[0.2, 0.2], [0.4, 0.35], [0.6, 0.15], [0.3, 0.5]].map(([a, b]) => `<circle cx="${x + w * a}" cy="${y + h * b}" r="4" fill="#fff"/>`).join('')}<circle cx="${x + w * 0.78}" cy="${y + h * 0.28}" r="${h * 0.08}" fill="#F3E9D2"/>` : ''}
  <path d="M${x} ${y + h * 0.7} C ${x + w * 0.3} ${y + h * 0.5} ${x + w * 0.6} ${y + h * 0.62} ${x + w} ${y + h * 0.55} L${x + w} ${y + h} L${x} ${y + h} Z" fill="${view === 'night' ? '#2F3B37' : C.sage}"/><path d="M${x} ${y + h * 0.85} C ${x + w * 0.4} ${y + h * 0.72} ${x + w * 0.7} ${y + h * 0.86} ${x + w} ${y + h * 0.78} L${x + w} ${y + h} L${x} ${y + h} Z" fill="${view === 'night' ? '#222b28' : C.sageDeep}"/></g>`;
}

export const KIT = { vase, plant, cup, books, lamp, candle, bowl, bread, jar, bottle, tube, polish, stones, towels, phone, laptop, notebook, documents, envelope, clock, glasses, headphones, card, coins, moneyJar, receipt, tag, wateringCan, fertilizer, seedling, suitcase, ticket, hat, blocks, ball, backpack, mat, weights, shoe, sofa, armchair, table, shelf, boxes, bed, acUnit, mirror, sink, swatches, paintCan, floorLamp, pendant, chairsFacing, bubbles, stroller };
