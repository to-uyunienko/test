// Dashboard aggregation and chart rendering

const PALETTE = ["#4f6df5", "#f5a524", "#1a9c53", "#e5484d", "#8b5cf6", "#0891b2", "#db2777", "#65a30d"];

function colorForIndex(i) {
  return PALETTE[i % PALETTE.length];
}

function renderSummaryCards() {
  const subMonthlyTotal = store.subscriptions.reduce((sum, s) => sum + subMonthlyEquivalent(s), 0);
  const subAnnualTotal = store.subscriptions.reduce((sum, s) => sum + subAnnualEquivalent(s), 0);
  const activeLoans = store.loans.filter(loanIsActive);
  const loanMonthlyTotal = activeLoans.reduce((sum, l) => sum + loanMonthlyPayment(l), 0);

  document.getElementById("summary-monthly-total").textContent = formatYen(subMonthlyTotal + loanMonthlyTotal);
  document.getElementById("summary-sub-total").textContent = formatYen(subMonthlyTotal);
  document.getElementById("summary-sub-count").textContent = `${store.subscriptions.length}件`;
  document.getElementById("summary-loan-total").textContent = formatYen(loanMonthlyTotal);
  document.getElementById("summary-loan-count").textContent = `${activeLoans.length}件(返済中)`;
  document.getElementById("summary-annual-total").textContent = formatYen(subAnnualTotal + loanMonthlyTotal * 12);
}

function renderBreakdownChart() {
  const subMonthlyTotal = store.subscriptions.reduce((sum, s) => sum + subMonthlyEquivalent(s), 0);
  const loanMonthlyTotal = store.loans.filter(loanIsActive).reduce((sum, l) => sum + loanMonthlyPayment(l), 0);

  renderDonutChart("chart-breakdown", [
    { label: "サブスク", value: subMonthlyTotal, color: colorForIndex(0) },
    { label: "ローン返済", value: loanMonthlyTotal, color: colorForIndex(1) },
  ]);
}

function renderCategoryChart() {
  const totals = new Map();
  for (const sub of store.subscriptions) {
    const cat = sub.category || "未分類";
    totals.set(cat, (totals.get(cat) || 0) + subMonthlyEquivalent(sub));
  }

  const items = [...totals.entries()].map(([label, value], i) => ({
    label,
    value,
    color: colorForIndex(i),
  }));

  renderBarChart("chart-category", items);
}

function renderUpcomingPayments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);

  const items = [];

  for (const sub of store.subscriptions) {
    const date = nextOccurrence(sub.nextBillingDate, sub.cycle);
    if (date && date <= horizon) {
      items.push({ date, type: "サブスク", name: sub.name, amount: sub.amount });
    }
  }

  for (const loan of store.loans) {
    if (!loanIsActive(loan)) continue;
    const date = loanNextPaymentDate(loan);
    if (date <= horizon) {
      items.push({ date, type: "ローン返済", name: loan.name, amount: loanMonthlyPayment(loan) });
    }
  }

  items.sort((a, b) => a.date - b.date);

  const tbody = document.querySelector("#upcoming-table tbody");
  const emptyMsg = document.getElementById("upcoming-empty");
  tbody.innerHTML = "";

  if (items.length === 0) {
    emptyMsg.hidden = false;
  } else {
    emptyMsg.hidden = true;
  }

  const soonThreshold = new Date(today);
  soonThreshold.setDate(soonThreshold.getDate() + 7);

  for (const item of items) {
    const isSoon = item.date <= soonThreshold;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.date.toISOString().slice(0, 10)}${isSoon ? '<span class="badge-soon">まもなく</span>' : ""}</td>
      <td>${item.type}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${formatYen(item.amount)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderDashboard() {
  renderSummaryCards();
  renderBreakdownChart();
  renderCategoryChart();
  renderUpcomingPayments();
}
