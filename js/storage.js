// localStorage backed data store for subscriptions and loans
const STORAGE_KEY = "budget-app-data-v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { subscriptions: [], loans: [] };
    const parsed = JSON.parse(raw);
    return {
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      loans: Array.isArray(parsed.loans) ? parsed.loans : [],
    };
  } catch (e) {
    console.error("Failed to load data", e);
    return { subscriptions: [], loans: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatYen(amount) {
  const rounded = Math.round(amount);
  return "¥" + rounded.toLocaleString("ja-JP");
}

const store = loadData();

function persist() {
  saveData(store);
}
