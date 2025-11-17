/* ui.js - clean UI wiring (extra buttons visible only in AR) */
(() => {
  const info = document.getElementById('infoText');
  const cleanFill = document.getElementById('cleanFill');
  const healthFill = document.getElementById('healthFill');
  const buttons = Array.from(document.querySelectorAll('.action-btn'));
  const xrBtn = document.getElementById('xrBtn');

  // NEW: references to extra buttons container + buttons
  const extraButtons = document.getElementById('extraButtons');
  const resetBtn = document.getElementById('resetBtn');
  const exitBtn = document.getElementById('exitBtn');

  let toothReady = false;
  let cleanValue = 100;
  let healthValue = 100;

  // counters for repeated actions
  let toothStage = 0;
  let sweetCount = 0;
  let healthyCount = 0;

  // initially action buttons disabled until model placed
  function setButtonsEnabled(enabled) {
    buttons.forEach(b => {
      b.style.opacity = enabled ? '1' : '0.55';
      b.style.pointerEvents = enabled ? 'auto' : 'none';
      b.tabIndex = enabled ? 0 : -1;
      if (enabled) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
    });
    // DO NOT force extraButtons here — visibility is controlled by xr-started/xr-ended
  }
  setButtonsEnabled(false);

  // UI helpers
  function clamp100(v) { return Math.max(0, Math.min(100, Math.round(v * 100) / 100)); }
  function updateBars() {
    if (cleanFill) cleanFill.style.width = clamp100(cleanValue) + "%";
    if (healthFill) healthFill.style.width = clamp100(healthValue) + "%";
  }
  function fadeInfo(text) {
    if (!info) return;
    info.style.opacity = 0;
    setTimeout(() => {
      info.textContent = text;
      info.style.opacity = 1;
    }, 160);
  }

  // show/hide extra buttons (called on xr-started/xr-ended)
  function setExtraButtonsVisible(visible) {
    if (!extraButtons) return;
    if (visible) extraButtons.classList.add('visible');
    else extraButtons.classList.remove('visible');
  }
  // ensure hidden by default
  setExtraButtonsVisible(false);

  // handle clicks -> request animation in index.js
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (!toothReady) {
        fadeInfo("Model belum siap. Arahkan kamera & tunggu model muncul.");
        return;
      }
      // request AR to run interactor anim; UI locks buttons until 'interactor-finished'
      setButtonsEnabled(false);
      fadeInfo("Memainkan animasi...");
      window.dispatchEvent(new CustomEvent('ui-action-request', { detail: { action } }));
    });
  });

  // Reset button -> dispatch reset & update UI state
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // inform AR system to reset scene
      window.dispatchEvent(new CustomEvent('reset'));
      // reset local UI values & lock actions until model placed again
      resetUIState();
    });
  }

  // Exit AR button -> request exit; index.js will handle ending session
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('request-exit-ar'));
      fadeInfo("Meminta keluar AR...");
    });
  }

  // when an interactor animation finished, index.js dispatches this event
  // { action, status }
  window.addEventListener('interactor-finished', (e) => {
    const d = e.detail || {};
    const action = d.action;
    const status = d.status;
    if (status !== 'ok') {
      fadeInfo(status === 'skipped' ? "Animasi tidak dijalankan." : "Terjadi error animasi.");
      // re-enable unless terminal; index.js or other logic may emit health-changed next
      setTimeout(() => {
        setButtonsEnabled(true);
      }, 300);
      return;
    }

    // After a successful animation, UI logic updates local state and tells index.js to swap model
    performActionEffect(action);

    // update bars and inform other systems (index.js listens to health-changed to swap model)
    updateBars();
    window.dispatchEvent(new CustomEvent('health-changed', { detail: { health: healthValue, clean: cleanValue } }));

    // check terminal condition
    if (cleanValue <= 0 && healthValue <= 0) {
      setButtonsEnabled(false);
      fadeInfo("⚠️ Gigi sudah rusak parah — struktur rusak. Perawatan akhir diperlukan (di dunia nyata).");
      // keep Enter AR handled by xr-ended when session ends
    } else {
      setButtonsEnabled(true);
    }
  });

  // enable buttons when model placed
  window.addEventListener('model-placed', () => {
    toothReady = true;
    fadeInfo("Model gigi siap! Pilih aksi di bawah ini.");
    setButtonsEnabled(true);
    updateBars();
  });

  // when XR started: hide Enter AR button + show extra buttons
  window.addEventListener('xr-started', () => {
    if (xrBtn) xrBtn.classList.add('hidden');
    // show reset/exit now AR active
    setExtraButtonsVisible(true);
    fadeInfo("Arahkan kamera ke model dan tekan salah satu aksi.");
  });

  // when XR ended: show Enter AR again, hide extra buttons, and lock UI
  window.addEventListener('xr-ended', () => {
    if (xrBtn) xrBtn.classList.remove('hidden');
    // hide reset/exit after AR ends
    setExtraButtonsVisible(false);
    toothReady = false;
    setButtonsEnabled(false);
    fadeInfo("AR berhenti. Arahkan kamera ke lantai dan tekan Enter AR.");
  });

  // local state changes (if some other part dispatches health-changed directly)
  window.addEventListener('health-changed', (e) => {
    const d = e.detail || {};
    if (typeof d.clean === 'number') cleanValue = d.clean;
    if (typeof d.health === 'number') healthValue = d.health;
    updateBars();
  });

  // apply the "game logic" to UI values AFTER animations finish (called by interactor-finished)
  function performActionEffect(action) {
    switch(action) {
      case 'brush':
        cleanValue = clamp100(cleanValue + 25);
        healthValue = clamp100(healthValue + 25);
        sweetCount = 0; healthyCount = 0; toothStage = 0;
        fadeInfo("🪥 Menggosok gigi: Kebersihan +25%, Kesehatan +25%");
        break;
        case 'sweet':
        // setiap tekan mengurangi kebersihan sedikit
        cleanValue = clamp100(cleanValue - 12.5);

        // pastikan toothStage terdefinisi
        toothStage = (typeof toothStage === 'number') ? toothStage : 0;

        // naik satu tahap per tekan, maksimal 8
        if (toothStage < 8) toothStage++;

        // sesuaikan health setiap 2 tahap supaya model berganti pada 75/50/25/0
        // stage 1 -> health 100, 2 -> 75, 3 -> 75, 4 -> 50, 5 -> 50, 6 -> 25, 7 -> 25, 8 -> 0
        const healthDrops = Math.floor(toothStage / 2); // 0..4
        healthValue = clamp100(100 - (healthDrops * 25));

        // tampilkan pesan sesuai tahap (urutan yang kamu minta)
        switch (toothStage) {
          case 1:
            fadeInfo("Wah, gulanya nempel di gigimu! Hati-hati ya, nanti bisa muncul plak.");
            break;
          case 2:
            fadeInfo("Plaknya makin banyak nih… Yuk kurangi permennya supaya gigimu tetap bersih!");
            break;
          case 3:
            fadeInfo("Plaknya berubah jadi asam yang bisa bikin gigi sakit, hati-hati ya!");
            break;
          case 4:
            fadeInfo("Asamnya makin kuat… nanti gigimu bisa rusak kalau terus makan manis!");
            break;
          case 5:
            fadeInfo("Lapisan pelindung gigimu mulai melemah. Yuk berhenti makan permen dulu!");
            break;
          case 6:
            fadeInfo("Pelindung gigimu makin rapuh… ayo jaga sebelum bolong beneran!");
            break;
          case 7:
            fadeInfo("Aduh, gigimu mulai bolong! Bisa bahaya, kurangi manisnya ya!");
            break;
          case 8:
            fadeInfo("Giginya sudah bolong besar dan nggak bisa diperbaiki… Harus mulai ulang dari awal ya!");
            // (opsional) set kondisi terminal / disable tombol — UI lain sudah cek health<=0
            break;
          default:
            fadeInfo("🍭 Gula menempel — kebersihan sedikit menurun.");
        }
        break;

      case 'healthy':
        cleanValue = clamp100(cleanValue + 12.5);
        healthyCount++;
        if (healthyCount >= 2) {
          healthyCount = 0;
          healthValue = clamp100(healthValue + 25);
          fadeInfo("🥦 Makanan sehat membantu — kesehatan naik 25%!");
        } else {
          fadeInfo("🥗 Makanan sehat menambah kebersihan sedikit.");
        }
        break;
      default:
        console.warn('Unknown action', action);
    }
  }

  // NEW: reset local UI state
  function resetUIState() {
    cleanValue = 100;
    healthValue = 100;
    sweetCount = 0;
    healthyCount = 0;
    toothStage = 0;
    toothReady = false;
    setButtonsEnabled(false);
    updateBars();
    fadeInfo("Model direset, silakan place ulang.");
  }

  // expose for debugging
  window.kariesUI = {
    setButtonsEnabled,
    updateBars,
    fadeInfo,
    _getState: () => ({ cleanValue, healthValue, sweetCount, healthyCount })
  };

  // initial UI
  updateBars();
})();
