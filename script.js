const API_BASE = "https://phi-lab-server.vercel.app/api/v1/lab";
const ALL_ISSUES = `${API_BASE}/issues`;
const SEARCH_API = `${API_BASE}/issues/search?q=`;

const issuesGrid = document.getElementById("issuesGrid");
const loadingOverlay = document.getElementById("loadingOverlay");
const issueCountEl = document.getElementById("issueCount");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const modal = document.getElementById("issueModal");
const modalTitle = document.getElementById("modalTitle");
const modalStatusBtn = document.getElementById("modalStatusBtn");
const modalOpenedBy = document.getElementById("modalOpenedBy");
const modalCreatedDate = document.getElementById("modalCreatedDate");
const modalLabels = document.getElementById("modalLabels");
const modalDesc = document.getElementById("modalDesc");
const modalAssignee = document.getElementById("modalAssignee");
const modalPriority = document.getElementById("modalPriority");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let currentStatus = "all";

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

function getLabelClass(label) {
  const lower = label.toLowerCase();
  if (lower.includes("bug")) return "label-bug";
  if (lower.includes("enhancement")) return "label-enhancement";
  if (lower.includes("help wanted")) return "label-helpwanted";
  if (lower.includes("good first issue")) return "label-goodfirst";
  if (lower.includes("documentation")) return "label-doc";
  return "label-other";
}

function getPriorityClass(priority) {
  const p = (priority || "medium").toLowerCase();
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
}

function createIssueCard(issue, index) {
  const statusLower = (issue.status || "open").toLowerCase();
  const priorityLower = (issue.priority || "medium").toLowerCase();
  const isOpen = statusLower === "open";
  const labels = issue.labels || [];

  const card = document.createElement("div");
  card.className = `issue-card ${isOpen ? 'card-open' : 'card-closed'}`;

  card.innerHTML = `
    <div class="card-top-border"></div>

    <div class="card-header">
      <img class="status-icon" src="${isOpen ? 'Open-Status.png' : 'Closed.png'}" alt="${isOpen ? 'Open' : 'Closed'}">
      <span class="priority-badge priority-${priorityLower}">${priorityLower.toUpperCase()}</span>
    </div>

    <div class="card-upper">
      <h3 class="issue-title">${issue.title || "Untitled Issue"}</h3>
      <p class="issue-desc">${issue.description || "No description provided."}</p>

      <div class="labels">
        ${labels.map(label => 
          `<span class="label-badge ${getLabelClass(label)}">${label.toUpperCase()}</span>`
        ).join("")}
      </div>
    </div>

    <div class="card-footer">
      <div class="footer-line">
        <span class="issue-number">#${index + 1}</span> by ${issue.author || "unknown"}
        <span>Created: ${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "—"}</span>
        <span>Assignee: ${issue.assignee || "Unassigned"}</span>
        <span>Updated: ${issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : "—"}</span>
      </div>
    </div>
  `;

  card.addEventListener("click", () => {
    modalTitle.textContent = issue.title || "Untitled Issue";

    modalStatusBtn.textContent = isOpen ? "Opened" : "Closed";
    modalStatusBtn.className = `modal-status-btn modal-status-${isOpen ? 'open' : 'closed'}`;

    modalOpenedBy.textContent = `Opened by ${issue.author || "unknown"} • ${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "—"}`;

    modalLabels.innerHTML = labels.map(label => 
      `<span class="modal-label ${getLabelClass(label)}">${label.toUpperCase()}</span>`
    ).join("");

    modalDesc.textContent = issue.description || "No description provided.";

    modalAssignee.textContent = issue.assignee ? issue.assignee : "Unassigned";


    modalPriority.textContent = (issue.priority || "MEDIUM").toUpperCase();
    modalPriority.className = `modal-priority ${getPriorityClass(issue.priority)}`;

    modal.style.display = "flex";
  });

  return card;
}

async function loadIssues(status = "all", query = "") {
  showLoading();
  try {
    let url = query.trim() ? `${SEARCH_API}${encodeURIComponent(query.trim())}` : ALL_ISSUES;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response was not ok");

    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "API error");

    let issues = data.data || [];

    if (!query.trim()) {
      if (status === "open") issues = issues.filter(i => (i.status || "").toLowerCase() === "open");
      if (status === "closed") issues = issues.filter(i => (i.status || "").toLowerCase() === "closed");
    }

    issueCountEl.textContent = `${issues.length} issues`;

    issuesGrid.innerHTML = "";
    if (issues.length === 0) {
      issuesGrid.innerHTML = '<p style="text-align:center; padding:80px 0; color:#586069;">No issues found.</p>';
    } else {
      issues.forEach((issue, i) => {
        issuesGrid.appendChild(createIssueCard(issue, i));
      });
    }
  } catch (err) {
    console.error(err);
    issuesGrid.innerHTML = `<p style="text-align:center; color:#c62828; padding:80px 0;">
      Failed to load issues: ${err.message}
    </p>`;
  } finally {
    hideLoading();
  }
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatus = tab.dataset.status;
    loadIssues(currentStatus, searchInput.value.trim());
  });
});

searchBtn.addEventListener("click", () => loadIssues(currentStatus, searchInput.value.trim()));
searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") loadIssues(currentStatus, searchInput.value.trim());
});

modalCloseBtn.onclick = () => modal.style.display = "none";
modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

loadIssues("all");