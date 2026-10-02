/* =======================================================
   Mobile Card 7: 남겨진 유산 의의 카드 + 헌법 전문 인용
   - 데이터: /js/data/history-data.js S6_LEGACY, S6_QUOTE (PC section6 기준)
   - details/summary 접기·펼치기
======================================================= */
import { S6_LEGACY, S6_LEGACY_LINK, S6_QUOTE } from "/js/data/history-data.js";

export function initMobileSection6() {
  const container = document.getElementById("mobile-s6-legacy");
  if (!container) return;

  const cards = S6_LEGACY.map(
    (item) => `
    <details class="legacy-item" open>
      <summary class="legacy-head">
        <span class="legacy-num">${item.num}</span>
        <span class="legacy-title">
          <strong>${item.title}</strong>
          <em>${item.en}</em>
        </span>
        <span class="legacy-sign" aria-hidden="true"></span>
      </summary>
      <div class="legacy-body">
        <p>${item.detail}</p>
        <a href="${S6_LEGACY_LINK}" target="_blank" rel="noopener noreferrer" class="legacy-link">한국민족문화대백과사전 원문 ↗</a>
      </div>
    </details>
  `,
  ).join("");

  const quote = `
    <blockquote class="legacy-quote">
      <span class="legacy-quote-year" aria-hidden="true">1919</span>
      <p>"${S6_QUOTE.text}"</p>
      <cite>— ${S6_QUOTE.source}</cite>
    </blockquote>
  `;

  container.innerHTML = cards + quote;
}
