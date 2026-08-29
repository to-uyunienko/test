// Loan CRUD + amortization calculations

function loanMonthlyRate(loan) {
  return loan.annualRate / 100 / 12;
}

function loanMonthlyPayment(loan) {
  const r = loanMonthlyRate(loan);
  const n = loan.termMonths;
  if (r === 0) return loan.principal / n;
  const factor = Math.pow(1 + r, n);
  return (loan.principal * r * factor) / (factor - 1);
}

function loanElapsedMonths(loan) {
  const start = new Date(loan.startDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let months =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());
  if (today.getDate() < start.getDate()) months -= 1;
  return Math.min(Math.max(months, 0), loan.termMonths);
}

function loanRemainingBalance(loan) {
  const r = loanMonthlyRate(loan);
  const k = loanElapsedMonths(loan);
  const payment = loanMonthlyPayment(loan);
  if (r === 0) return Math.max(loan.principal - payment * k, 0);
  const factor = Math.pow(1 + r, k);
  const balance = loan.principal * factor - payment * ((factor - 1) / r);
  return Math.max(balance, 0);
}

function loanPayoffDate(loan) {
  const start = new Date(loan.startDate + "T00:00:00");
  const payoff = new Date(start);
  payoff.setMonth(payoff.getMonth() + loan.termMonths);
  return payoff;
}

function loanIsActive(loan) {
  return loanElapsedMonths(loan) < loan.termMonths;
}

function loanNextPaymentDate(loan) {
  const start = new Date(loan.startDate + "T00:00:00");
  const k = loanElapsedMonths(loan);
  const next = new Date(start);
  next.setMonth(next.getMonth() + k + 1);
  return next;
}

function renderLoansTable() {
  const tbody = document.querySelector("#loan-table tbody");
  const emptyMsg = document.getElementById("loan-empty");
  tbody.innerHTML = "";

  if (store.loans.length === 0) {
    emptyMsg.hidden = false;
  } else {
    emptyMsg.hidden = true;
  }

  const sorted = [...store.loans].sort((a, b) => a.name.localeCompare(b.name, "ja"));

  for (const loan of sorted) {
    const payment = loanMonthlyPayment(loan);
    const remaining = loanRemainingBalance(loan);
    const payoff = loanPayoffDate(loan);
    const active = loanIsActive(loan);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(loan.name)}</td>
      <td>${formatYen(loan.principal)}</td>
      <td>${loan.annualRate}%</td>
      <td>${loan.termMonths}ヶ月</td>
      <td>${formatYen(payment)}</td>
      <td>${formatYen(remaining)}</td>
      <td>${payoff.toISOString().slice(0, 10)}</td>
      <td><span class="badge ${active ? "active" : "paid-off"}">${active ? "返済中" : "完済"}</span></td>
      <td class="row-actions">
        <button class="edit-btn" data-id="${loan.id}">編集</button>
        <button class="delete-btn" data-id="${loan.id}">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => startEditLoan(btn.dataset.id))
  );
  tbody.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteLoan(btn.dataset.id))
  );
}

function startEditLoan(id) {
  const loan = store.loans.find((l) => l.id === id);
  if (!loan) return;
  document.getElementById("loan-id").value = loan.id;
  document.getElementById("loan-name").value = loan.name;
  document.getElementById("loan-principal").value = loan.principal;
  document.getElementById("loan-rate").value = loan.annualRate;
  document.getElementById("loan-term").value = loan.termMonths;
  document.getElementById("loan-start").value = loan.startDate;
  document.getElementById("loan-note").value = loan.note || "";
  document.getElementById("loan-form-title").textContent = "ローンを編集";
  document.getElementById("loan-submit-btn").textContent = "更新";
  document.getElementById("loan-cancel-btn").hidden = false;
  document.getElementById("loan-name").focus();
}

function resetLoanForm() {
  document.getElementById("loan-form").reset();
  document.getElementById("loan-id").value = "";
  document.getElementById("loan-rate").value = 0;
  document.getElementById("loan-form-title").textContent = "ローンを追加";
  document.getElementById("loan-submit-btn").textContent = "追加";
  document.getElementById("loan-cancel-btn").hidden = true;
}

function deleteLoan(id) {
  if (!confirm("このローンを削除しますか？")) return;
  store.loans = store.loans.filter((l) => l.id !== id);
  persist();
  renderLoansTable();
  renderDashboard();
}

function initLoanForm() {
  const form = document.getElementById("loan-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("loan-id").value;
    const name = document.getElementById("loan-name").value.trim();
    const principal = parseFloat(document.getElementById("loan-principal").value);
    const annualRate = parseFloat(document.getElementById("loan-rate").value);
    const termMonths = parseInt(document.getElementById("loan-term").value, 10);
    const startDate = document.getElementById("loan-start").value;
    const note = document.getElementById("loan-note").value.trim();

    if (!name || isNaN(principal) || principal < 0 || isNaN(annualRate) || annualRate < 0) return;
    if (isNaN(termMonths) || termMonths < 1 || !startDate) return;

    if (id) {
      const loan = store.loans.find((l) => l.id === id);
      if (loan) {
        Object.assign(loan, { name, principal, annualRate, termMonths, startDate, note });
      }
    } else {
      store.loans.push({
        id: genId(),
        name,
        principal,
        annualRate,
        termMonths,
        startDate,
        note,
      });
    }

    persist();
    resetLoanForm();
    renderLoansTable();
    renderDashboard();
  });

  document.getElementById("loan-cancel-btn").addEventListener("click", resetLoanForm);
}
