// Minimal dependency-free SVG chart helpers (donut + horizontal bar)

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function renderDonutChart(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const total = items.reduce((sum, i) => sum + i.value, 0);

  if (total <= 0) {
    container.innerHTML = '<p class="empty-msg">データがありません。</p>';
    return;
  }

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;

  const svg = svgEl("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}` });
  let offset = 0;

  items.forEach((item) => {
    const fraction = item.value / total;
    const dash = fraction * circumference;
    const circle = svgEl("circle", {
      cx,
      cy,
      r,
      fill: "none",
      stroke: item.color,
      "stroke-width": strokeWidth,
      "stroke-dasharray": `${dash} ${circumference - dash}`,
      "stroke-dashoffset": -offset,
      transform: `rotate(-90 ${cx} ${cy})`,
    });
    svg.appendChild(circle);
    offset += dash;
  });

  const wrapper = document.createElement("div");
  wrapper.className = "chart-flex";
  wrapper.appendChild(svg);

  const legend = document.createElement("ul");
  legend.className = "chart-legend";
  items.forEach((item) => {
    const li = document.createElement("li");
    const pct = ((item.value / total) * 100).toFixed(1);
    li.innerHTML = `<span class="legend-dot" style="background:${item.color}"></span>${escapeHtml(item.label)}: ${formatYen(item.value)} (${pct}%)`;
    legend.appendChild(li);
  });
  wrapper.appendChild(legend);
  container.appendChild(wrapper);
}

function renderBarChart(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-msg">データがありません。</p>';
    return;
  }

  const max = Math.max(...items.map((i) => i.value), 1);
  const list = document.createElement("div");
  list.className = "bar-chart";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const pct = Math.max((item.value / max) * 100, 2);
    row.innerHTML = `
      <div class="bar-label">${escapeHtml(item.label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${item.color}"></div></div>
      <div class="bar-value">${formatYen(item.value)}</div>
    `;
    list.appendChild(row);
  });

  container.appendChild(list);
}
