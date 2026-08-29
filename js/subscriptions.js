// Subscription CRUD + rendering

function subMonthlyEquivalent(sub) {
  return sub.cycle === "annual" ? sub.amount / 12 : sub.amount;
}

function subAnnualEquivalent(sub) {
  return sub.cycle === "annual" ? sub.amount : sub.amount * 12;
}

function nextOccurrence(dateStr, cycle) {
  // Advance the stored next-billing date forward until it is today or later,
  // so past dates still show a sensible upcoming occurrence.
  let d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(d.getTime())) return null;
  while (d < today) {
    if (cycle === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function renderCategoryDatalist() {
  const list = document.getElementById("category-list");
  const categories = [...new Set(store.subscriptions.map((s) => s.category).filter(Boolean))];
  list.innerHTML = categories.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderSubscriptionsTable() {
  const tbody = document.querySelector("#sub-table tbody");
  const emptyMsg = document.getElementById("sub-empty");
  tbody.innerHTML = "";

  if (store.subscriptions.length === 0) {
    emptyMsg.hidden = false;
  } else {
    emptyMsg.hidden = true;
  }

  const sorted = [...store.subscriptions].sort((a, b) => a.name.localeCompare(b.name, "ja"));

  for (const sub of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(sub.name)}</td>
      <td>${escapeHtml(sub.category) || "-"}</td>
      <td>${formatYen(sub.amount)}</td>
      <td>${sub.cycle === "annual" ? "年次" : "月次"}</td>
      <td>${formatYen(subMonthlyEquivalent(sub))}</td>
      <td>${sub.nextBillingDate}</td>
      <td class="row-actions">
        <button class="edit-btn" data-id="${sub.id}">編集</button>
        <button class="delete-btn" data-id="${sub.id}">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => startEditSubscription(btn.dataset.id))
  );
  tbody.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteSubscription(btn.dataset.id))
  );

  renderCategoryDatalist();
}

function startEditSubscription(id) {
  const sub = store.subscriptions.find((s) => s.id === id);
  if (!sub) return;
  document.getElementById("sub-id").value = sub.id;
  document.getElementById("sub-name").value = sub.name;
  document.getElementById("sub-category").value = sub.category || "";
  document.getElementById("sub-amount").value = sub.amount;
  document.getElementById("sub-cycle").value = sub.cycle;
  document.getElementById("sub-next-date").value = sub.nextBillingDate;
  document.getElementById("sub-note").value = sub.note || "";
  document.getElementById("sub-form-title").textContent = "サブスクを編集";
  document.getElementById("sub-submit-btn").textContent = "更新";
  document.getElementById("sub-cancel-btn").hidden = false;
  document.getElementById("sub-name").focus();
}

function resetSubscriptionForm() {
  document.getElementById("sub-form").reset();
  document.getElementById("sub-id").value = "";
  document.getElementById("sub-form-title").textContent = "サブスクを追加";
  document.getElementById("sub-submit-btn").textContent = "追加";
  document.getElementById("sub-cancel-btn").hidden = true;
}

function deleteSubscription(id) {
  if (!confirm("このサブスクを削除しますか？")) return;
  store.subscriptions = store.subscriptions.filter((s) => s.id !== id);
  persist();
  renderSubscriptionsTable();
  renderDashboard();
}

function initSubscriptionForm() {
  const form = document.getElementById("sub-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("sub-id").value;
    const name = document.getElementById("sub-name").value.trim();
    const category = document.getElementById("sub-category").value.trim();
    const amount = parseFloat(document.getElementById("sub-amount").value);
    const cycle = document.getElementById("sub-cycle").value;
    const nextBillingDate = document.getElementById("sub-next-date").value;
    const note = document.getElementById("sub-note").value.trim();

    if (!name || isNaN(amount) || amount < 0 || !nextBillingDate) return;

    if (id) {
      const sub = store.subscriptions.find((s) => s.id === id);
      if (sub) {
        Object.assign(sub, { name, category, amount, cycle, nextBillingDate, note });
      }
    } else {
      store.subscriptions.push({
        id: genId(),
        name,
        category,
        amount,
        cycle,
        nextBillingDate,
        note,
      });
    }

    persist();
    resetSubscriptionForm();
    renderSubscriptionsTable();
    renderDashboard();
  });

  document.getElementById("sub-cancel-btn").addEventListener("click", resetSubscriptionForm);
}
