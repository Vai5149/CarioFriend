/* ui.js - clean UI wiring (controls visible only in AR) */
(() => {
  const info = document.getElementById('infoText');
  const cleanFill = document.getElementById('cleanFill');
  const healthFill = document.getElementById('healthFill');
  const buttons = Array.from(document.querySelectorAll('.action-btn'));
  const xrBtn = document.getElementById('xrBtn');

  // NEW: Splash screen elements
  const splashScreen = document.getElementById('splashScreen');
  const startBtn = document.getElementById('startBtn');

  // NEW: Tooth status elements
  const toothStatusIcon = document.getElementById('toothStatusIcon');
  const toothStatusText = document.getElementById('toothStatusText');
  const barsContainer = document.getElementById('bars');
  const toothStatusContainer = document.getElementById('toothStatus');
  const buttonsContainer = document.getElementById('buttons');
  const infoContainer = document.getElementById('infoText');

  // NEW extra buttons
  const resetBtn = document.getElementById('resetBtn');
  const exitBtn = document.getElementById('exitBtn');

  // NEW scale buttons
  const scaleUpBtn = document.getElementById('scaleUpBtn');
  const scaleDownBtn = document.getElementById('scaleDownBtn');

  // containers (to toggle visibility)
  const extraButtonsContainer = document.getElementById('extraButtons');
  const scaleButtonsContainer = document.getElementById('scaleButtons');

  let toothReady = false;
  let cleanValue = 100;
  let healthValue = 100;

  // counters for repeated actions
  let sweetCount = 0;
  let healthyCount = 0;

  // track whether currently in XR session
  let inXR = false;

  // NEW: Function to show splash screen
  function showSplashScreen() {
    if (splashScreen) {
      splashScreen.classList.remove('hidden');
    }
    // Reset semua state UI
    resetUIState();
  }

  // NEW: Function to hide splash screen
  function hideSplashScreen() {
    if (splashScreen) {
      splashScreen.classList.add('hidden');
    }
  }

  // NEW: Function to directly request AR session (tanpa lewat tombol Enter AR)
  async function startARSession() {
    try {
      hideSplashScreen();
      if (window.requestXRSession) {
        await window.requestXRSession();
      } else {
        window.dispatchEvent(new CustomEvent('request-ar-session'));
      }
    } catch (error) {
      console.error('Failed to start AR session:', error);
      showSplashScreen();
      alert('Gagal memulai AR: ' + error.message);
    }
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startARSession();
    });
  }

  // NEW: Function to update tooth status
  function updateToothStatus(healthKey = null) {
    if (!toothReady || healthKey === null) {
      toothStatusIcon.src = 'odontogram/odontogram_hilang.png';
      toothStatusText.textContent = 'Gigi tidak ada';
      return;
    }

    switch (healthKey) {
      case 100:
      case 75:
        toothStatusIcon.src = 'odontogram/odontogram_normal.png';
        toothStatusText.textContent = 'Odontogram: Gigi sehat';
        break;
      case 50:
      case 25:
        toothStatusIcon.src = 'odontogram/odontogram_karang.png';
        toothStatusText.textContent = 'Odontogram: Gigi karang';
        break;
      case 0:
        toothStatusIcon.src = 'odontogram/odontogram_karies.png';
        toothStatusText.textContent = 'Odontogram: Gigi karies';
        break;
      default:
        toothStatusIcon.src = 'odontogram/odontogram_hilang.png';
        toothStatusText.textContent = 'Tidak ada gigi';
    }
  }

  function showARUI(show) {
    const elements = [barsContainer, toothStatusContainer, buttonsContainer, infoContainer];
    elements.forEach(el => {
      if (!el) return;
      if (show) el.classList.add('visible-ar');
      else el.classList.remove('visible-ar');
    });
  }

  function setButtonsEnabled(enabled) {
    buttons.forEach(btn => {
      btn.style.opacity = enabled ? '1' : '0.55';
      btn.style.pointerEvents = enabled ? 'auto' : 'none';
      btn.tabIndex = enabled ? 0 : -1;
      if (enabled) btn.removeAttribute('aria-disabled');
      else btn.setAttribute('aria-disabled', 'true');
    });

    [scaleUpBtn, scaleDownBtn].forEach(b => {
      if (!b) return;
      b.style.opacity = enabled ? '1' : '0.55';
      b.style.pointerEvents = enabled ? 'auto' : 'none';
      b.tabIndex = enabled ? 0 : -1;
      if (enabled) b.removeAttribute('aria-disabled');
      else b.setAttribute('aria-disabled', 'true');
    });
  }

  setButtonsEnabled(false);

  function showARControls(show) {
    inXR = !!show;

    if (show) {
      extraButtonsContainer.classList.add('visible-controls');
      scaleButtonsContainer.classList.add('visible-controls');
      showARUI(true);
    } else {
      extraButtonsContainer.classList.remove('visible-controls');
      scaleButtonsContainer.classList.remove('visible-controls');
      showARUI(false);
    }
  }

  function clamp100(v) {
    return Math.max(0, Math.min(100, Math.round(v * 100) / 100));
  }

  function updateBars() {
    cleanFill.style.width = clamp100(cleanValue) + '%';
    healthFill.style.width = clamp100(healthValue) + '%';
  }

  function fadeInfo(text) {
    info.style.opacity = 0;
    setTimeout(() => {
      info.textContent = text;
      info.style.opacity = 1;
    }, 160);
  }

  // Action buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!toothReady) {
        fadeInfo('Model belum siap. Arahkan kamera & tunggu model muncul.');
        return;
      }

      const action = btn.dataset.action;
      setButtonsEnabled(false);
      fadeInfo('Memainkan animasi...');
      window.dispatchEvent(new CustomEvent('ui-action-request', { detail: { action } }));
    });
  });

  // Scale buttons
  if (scaleUpBtn) {
    scaleUpBtn.addEventListener('click', () => {
      if (!toothReady) {
        fadeInfo('Tempatkan model terlebih dahulu untuk mengubah ukuran.');
        return;
      }
      window.dispatchEvent(new CustomEvent('scale-request', { detail: { dir: +1 } }));
    });
  }

  if (scaleDownBtn) {
    scaleDownBtn.addEventListener('click', () => {
      if (!toothReady) {
        fadeInfo('Tempatkan model terlebih dahulu untuk mengubah ukuran.');
        return;
      }
      window.dispatchEvent(new CustomEvent('scale-request', { detail: { dir: -1 } }));
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!inXR) {
        fadeInfo('Fitur ini hanya tersedia saat berada di AR.');
        return;
      }
      window.dispatchEvent(new CustomEvent('reset'));
      resetUIState();
    });
  }

  // Exit AR button
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (!inXR) {
        fadeInfo('Fitur ini hanya tersedia saat berada di AR.');
        return;
      }
      window.dispatchEvent(new CustomEvent('request-exit-ar'));
      fadeInfo('Keluar AR...');
      showSplashScreen();
    });
  }

  // Interactor finished
  window.addEventListener('interactor-finished', e => {
    const { action, status } = e.detail || {};

    if (status !== 'ok') {
      fadeInfo(status === 'skipped' ? 'Animasi tidak dijalankan.' : 'Terjadi error animasi.');
      setTimeout(() => setButtonsEnabled(true), 300);
      return;
    }

    window.dispatchEvent(new CustomEvent('ui-last-action', { detail: { action } }));

    performActionEffect(action);
    updateBars();

    window.dispatchEvent(
      new CustomEvent('health-changed', { detail: { health: healthValue, clean: cleanValue } })
    );

    if (cleanValue <= 0 && healthValue <= 0) {
      setButtonsEnabled(false);
      fadeInfo(
        '⚠️ Gigi sudah rusak parah dan terinfeksi. Segera konsultasikan ke dokter gigi! Tekan tombol RESET untuk memulai ulang.'
      );
    } else {
      setButtonsEnabled(true);
    }
  });

  window.addEventListener('model-placed', () => {
    toothReady = true;
    fadeInfo('Model gigi siap! Pilih aksi di bawah ini.');
    setButtonsEnabled(true);
    updateBars();
    updateToothStatus(100);
  });

  window.addEventListener('xr-started', () => {
    fadeInfo(
      'Arahkan kamera ke lantai hingga muncul lingkaran hijau dan tekan lingkaran untuk memunculkan gigi!.'
    );
    showARControls(true);
  });

  window.addEventListener('xr-ended', () => {
    toothReady = false;
    setButtonsEnabled(false);
    showARControls(false);
    updateToothStatus(null);
    showSplashScreen();
  });

  window.addEventListener('health-changed', e => {
    const d = e.detail || {};
    if (typeof d.health === 'number') {
      healthValue = d.health;
      updateToothStatus(getHealthKeyFromValue(healthValue));
    }
    if (typeof d.clean === 'number') cleanValue = d.clean;
    updateBars();
  });

  function getHealthKeyFromValue(health) {
    if (health >= 100) return 100;
    if (health >= 75) return 75;
    if (health >= 50) return 50;
    if (health >= 25) return 25;
    return 0;
  }

  function performActionEffect(action) {
    switch (action) {
      case 'brush':
        cleanValue = clamp100(cleanValue + 25);
        healthValue = clamp100(healthValue + 25);
        sweetCount = 0;
        healthyCount = 0;
        fadeInfo('🪥 Menggosok gigi: Kebersihan +25%, Kesehatan +25%');
        break;

      case 'sweet':
        cleanValue = clamp100(cleanValue - 12.5);
        sweetCount++;
        if (sweetCount >= 2) {
          sweetCount = 0;
          healthValue = clamp100(healthValue - 25);
          fadeInfo('🍭 Terlalu sering makan manis — kesehatan turun 25%!');
        } else {
          fadeInfo('🍭 Gula menempel — kebersihan sedikit menurun.');
        }
        break;

      case 'healthy':
        cleanValue = clamp100(cleanValue + 12.5);
        healthyCount++;
        if (healthyCount >= 2) {
          healthyCount = 0;
          healthValue = clamp100(healthValue + 25);
          fadeInfo('🥦 Makanan sehat membantu — kesehatan naik 25%!');
        } else {
          fadeInfo('🥗 Makanan sehat menambah kebersihan sedikit.');
        }
        break;
    }
  }

  function resetUIState() {
    cleanValue = 100;
    healthValue = 100;
    sweetCount = 0;
    healthyCount = 0;
    toothReady = false;
    setButtonsEnabled(false);
    updateBars();
    updateToothStatus(null);
  }

  window.kariesUI = {
    setButtonsEnabled,
    updateBars,
    fadeInfo,
    updateToothStatus,
    startARSession
  };

  /* ---------------- Odontogram Modal wiring ---------------- */
  (() => {
    const odontModal = document.getElementById('odontModal');
    const odontBackdrop = document.getElementById('odontBackdrop');
    const odontModalImg = document.getElementById('odontModalImg');
    const odontModalText = document.getElementById('odontModalText');
    const modalClose = document.getElementById('modalClose');

    if (!odontModal) return;

    function openOdontogram() {
      odontModal.setAttribute('aria-hidden', 'false');
      toothStatusIcon.setAttribute('aria-expanded', 'true');
      modalClose.focus();
    }

    function closeOdontogram() {
      odontModal.setAttribute('aria-hidden', 'true');
      toothStatusIcon.setAttribute('aria-expanded', 'false');
      toothStatusIcon.focus();
    }

    toothStatusIcon.setAttribute('role', 'button');
    toothStatusIcon.setAttribute('tabindex', '0');
    toothStatusIcon.setAttribute('aria-controls', 'odontModal');
    toothStatusIcon.setAttribute('aria-expanded', 'false');

    toothStatusIcon.addEventListener('click', () => {
      odontModalImg.src = toothStatusIcon.src;
      odontModalText.textContent = toothStatusText.textContent;
      openOdontogram();
    });

    toothStatusIcon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        odontModalImg.src = toothStatusIcon.src;
        odontModalText.textContent = toothStatusText.textContent;
        openOdontogram();
      }
    });

    odontBackdrop.addEventListener('click', closeOdontogram);
    modalClose.addEventListener('click', closeOdontogram);

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && odontModal.getAttribute('aria-hidden') === 'false') {
        closeOdontogram();
      }
    });

    // Keep modal content synced with icon updates
    if (typeof window.kariesUI.updateToothStatus === 'function') {
      const original = window.kariesUI.updateToothStatus;
      window.kariesUI.updateToothStatus = healthKey => {
        original.call(this, healthKey);
        odontModalImg.src = toothStatusIcon.src;
        odontModalText.textContent = toothStatusText.textContent;
      };
    }
  })();

  updateBars();
  showARControls(false);
  updateToothStatus(null);
})();