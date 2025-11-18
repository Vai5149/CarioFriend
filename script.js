(function () {
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".nav-link");
  const navbar = document.querySelector(".navbar");

  function goTo(id) {
    sections.forEach(s => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");

    // Hide navbar ONLY in welcome & mode
    if (id === "welcome","mode") {
      navbar.style.display = "none";
    } else {
      navbar.style.display = "flex";
    }

    // Update nav highlight
    navLinks.forEach(link => {
      link.classList.toggle("active", link.dataset.target === id);
    });
  }

  // Welcome page → klik bebas untuk masuk main
  const welcomeEl = document.getElementById("welcome");
  if (welcomeEl) {
    welcomeEl.addEventListener("click", (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'button' || tag === 'a') return;
      goTo("main");
    });
  }

  // data-action="goto"
  document.querySelectorAll("[data-action='goto']").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      goTo(btn.dataset.target);
    });
  });

  // Volume toggle
  const btnVolume = document.getElementById("btnVolume");
  let vol = true;
  if (btnVolume) {
    btnVolume.addEventListener("click", (ev) => {
      ev.stopPropagation();
      vol = !vol;
      btnVolume.textContent = vol ? "🔊" : "🔇";
    });
  }

  /* --------------------------
     CREDIT PANEL (FINAL)
  ---------------------------*/
  const btnCredit = document.getElementById("btnCredit");
  const creditPanel = document.getElementById("creditPanel");
  const closeCredit = document.getElementById("closeCredit");

  if (btnCredit && creditPanel && closeCredit) {
    btnCredit.addEventListener("click", (ev) => {
      ev.stopPropagation();
      creditPanel.classList.add("active");
    });

    closeCredit.addEventListener("click", () => {
      creditPanel.classList.remove("active");
    });

    // klik area gelap tutup panel
    creditPanel.addEventListener("click", (e) => {
      if (e.target === creditPanel) {
        creditPanel.classList.remove("active");
      }
    });
  }

  // Start page (hash aware)
  (function init() {
    const fromHash = (location.hash || "").replace("#", "");
    const start = fromHash || "welcome";
    goTo(start);
  })();

  // SETTINGS PANEL
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const toggleDark = document.getElementById("toggleDark");

btnSettings.addEventListener("click", (ev) => {
  ev.stopPropagation();
  settingsPanel.classList.add("active");
});

// Close button
closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("active");
});

// Click outside to close
settingsPanel.addEventListener("click", (e) => {
  if (e.target === settingsPanel) {
    settingsPanel.classList.remove("active");
  }
});

/* ========== DARK MODE ========== */
toggleDark.addEventListener("change", () => {
  if (toggleDark.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("darkmode", "on");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("darkmode", "off");
  }
});

// Load saved theme
if (localStorage.getItem("darkmode") === "on") {
  document.body.classList.add("dark");
  toggleDark.checked = true;
}


})();
