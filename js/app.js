// App bootstrap: tab switching and init

function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSubscriptionForm();
  initLoanForm();
  renderSubscriptionsTable();
  renderLoansTable();
  renderDashboard();
});
