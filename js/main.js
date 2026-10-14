document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- 테마 (라이트/다크) ---------- */
const root = document.documentElement;

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* 저장 불가 환경 무시 */ }
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.dataset.theme = storageGet("theme") || (prefersDark ? "dark" : "light");

document.getElementById("themeToggle").addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  storageSet("theme", root.dataset.theme);
});

/* ---------- 내비게이션 ---------- */
const nav = document.getElementById("nav");
const burger = document.getElementById("navBurger");
const toTop = document.getElementById("toTop");

function closeMenu() {
  nav.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
}
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav__menu a").forEach((a) => a.addEventListener("click", closeMenu));

window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 20);
  toTop.classList.toggle("is-show", window.scrollY > 600);
}, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// 현재 섹션을 메뉴에 표시 (데이터 섹션은 '솔루션' 메뉴로 묶음)
const menuLinks = [...document.querySelectorAll(".nav__menu a")];
const sectionToMenu = { data: "solution" };
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = sectionToMenu[entry.target.id] || entry.target.id;
    menuLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => activeObserver.observe(s));

/* ---------- 스크롤 등장 + 숫자 카운트업 ---------- */
function countUp(el) {
  const to = Number(el.dataset.to);
  const duration = 1200;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased).toLocaleString("ko-KR");
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    entry.target.querySelectorAll(".count").forEach(countUp);
    if (entry.target.contains(document.getElementById("growthChart"))) drawChart();
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealObserver.observe(el);
});

/* ---------- 히어로 목업 타이핑 ---------- */
const heroQuestions = [
  "목이 불편할 때 전통 문헌에는 어떤 음식이?",
  "『식료찬요』에서 비위를 돕는 음식은?",
  "옛 식재료 이름을 현대 재료로 바꾸면?",
];
const heroTyping = document.getElementById("heroTyping");
let qi = 0, ci = 0, deleting = false;
(function typeLoop() {
  const text = heroQuestions[qi];
  heroTyping.textContent = text.slice(0, ci);
  if (!deleting && ci < text.length) { ci++; setTimeout(typeLoop, 75); }
  else if (!deleting) { deleting = true; setTimeout(typeLoop, 1900); }
  else if (ci > 0) { ci--; setTimeout(typeLoop, 25); }
  else { deleting = false; qi = (qi + 1) % heroQuestions.length; setTimeout(typeLoop, 400); }
})();

/* ---------- 순차 하이라이트 (솔루션 흐름, DB 구축 프로세스) ---------- */
function cycleHighlight(listEl, interval) {
  const items = [...listEl.children];
  let i = 0;
  setInterval(() => {
    items.forEach((li, idx) => li.classList.toggle("is-on", idx === i));
    i = (i + 1) % items.length;
  }, interval);
}
cycleHighlight(document.getElementById("flowSteps"), 1300);
cycleHighlight(document.getElementById("pipeline"), 900);

/* ---------- 데이터 성장 차트 ---------- */
const growth = [
  { month: 2, value: 30 },
  { month: 4, value: 100 },
  { month: 8, value: 500 },
  { month: 12, value: 1000 },
];
let chartDrawn = false;
function drawChart() {
  if (chartDrawn) return;
  chartDrawn = true;
  const svgNS = "http://www.w3.org/2000/svg";
  const x = (m) => 30 + ((m - 1) / 11) * 360;
  const y = (v) => 170 - (v / 1000) * 130;
  const line = document.getElementById("growthLine");
  const dots = document.getElementById("growthDots");
  line.setAttribute("points", growth.map((d) => `${x(d.month)},${y(d.value)}`).join(" "));

  const length = line.getTotalLength();
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;
  line.getBoundingClientRect();
  line.style.transition = "stroke-dashoffset 1.4s ease";
  line.style.strokeDashoffset = 0;

  growth.forEach((d, i) => {
    const g = document.createElementNS(svgNS, "g");
    g.style.opacity = 0;
    g.style.transition = `opacity .4s ${0.3 + i * 0.3}s`;
    g.innerHTML = `
      <circle class="chart__dot" cx="${x(d.month)}" cy="${y(d.value)}" r="7"/>
      <text class="chart__val" x="${x(d.month)}" y="${y(d.value) - 16}">${d.value.toLocaleString("ko-KR")}건</text>
      <text class="chart__lbl" x="${x(d.month)}" y="192">${d.month}개월</text>`;
    dots.appendChild(g);
    requestAnimationFrame(() => (g.style.opacity = 1));
  });
}

/* ---------- 화면 미리보기 데모 ----------
   발표자료(03. Solution)의 예시 화면을 재구성한 프로토타입입니다.
   근거가 없는 질문에는 답을 지어내지 않는 Yak-S의 원칙도 함께 보여줍니다. */
const DEMO_ANSWERS = [
  {
    match: /목|인후|기침|가래|喉/,
    text: "『동의보감』에 따르면, 목이 붓고 아플 때는 배, 무, 꿀을 활용한 식이 도움이 된다고 기록되어 있습니다. 이는 목의 열을 내리고 가래를 완화하는 데 효과가 있는 것으로 설명됩니다.",
    orig: "梨生津潤燥　治嗽喉腫痛",
    book: "東醫寶鑑 (동의보감)",
    item: "卷之三, 喉痺",
    loc: "권3, 165쪽",
    ingredients: [["梨", "배"], ["蔔", "무"], ["蜜", "꿀"]],
  },
];

const demoForm = document.getElementById("demoForm");
const demoInput = document.getElementById("demoInput");
const demoResult = document.getElementById("demoResult");
const chips = document.querySelectorAll(".chip");

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function runDemo(query) {
  const q = query.trim();
  chips.forEach((c) => c.classList.toggle("is-active", c.dataset.q === q));
  if (!q) return;

  const hit = DEMO_ANSWERS.find((a) => a.match.test(q));
  const question = `<div class="ans__q"><b class="ans__label">질문</b><span>${escapeHTML(q)}</span></div>`;

  if (!hit) {
    demoResult.innerHTML = `
      <div class="ans ans--none">
        ${question}
        <p class="ans__label">Yak-S 답변</p>
        <p class="ans__text">검수된 문헌 데이터에서 이 질문의 근거를 찾지 못했습니다.
        Yak-S는 출처가 확인되지 않는 내용은 답하지 않습니다.</p>
      </div>`;
    return;
  }

  demoResult.innerHTML = `
    <div class="ans">
      ${question}
      <p class="ans__label">현대어 풀이</p>
      <p class="ans__text">${hit.text}</p>
      <div class="ans__grid">
        <div>
          <p class="ans__label">원문 및 출처</p>
          <p class="ans__orig">${hit.orig}</p>
          <dl class="ans__meta">
            <dt>문헌명</dt><dd>${hit.book}</dd>
            <dt>항목</dt><dd>${hit.item}</dd>
            <dt>원문위치</dt><dd>${hit.loc}</dd>
          </dl>
        </div>
        <div>
          <p class="ans__label">연관 식재료</p>
          <div class="ingredients">
            ${hit.ingredients.map(([icon, name]) => `<span class="ingredient"><i>${icon}</i>${name}</span>`).join("")}
          </div>
          <p class="ans__safe">🛡 치료·처방이 아닌 교육·참고용 정보입니다.</p>
        </div>
      </div>
    </div>`;
}

demoForm.addEventListener("submit", (e) => { e.preventDefault(); runDemo(demoInput.value); });
chips.forEach((chip) => chip.addEventListener("click", () => {
  demoInput.value = chip.dataset.q;
  runDemo(chip.dataset.q);
}));
