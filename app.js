/**
 * Thai Fuel Tracker Pro - Main Application Controller
 * Handles Navigation, Real-time Price Rendering, Smart Calculator,
 * Accumulation Dashboard, Logs Management, and Analytics Charts.
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    activeTab: 'tab-prices',
    selectedStation: 'all',
    selectedCategory: 'all',
    calcMode: 'money_to_liters', // 'money_to_liters' | 'liters_to_money' | 'full_tank'
    editingStationId: null,
    editingFuelTypeId: null,
    selectedMonthKey: null,
    charts: {
      monthly: null,
      fuelShare: null
    }
  };

  // DOM Elements
  const dom = {
    // Nav & Dock
    dockItems: document.querySelectorAll('.dock-item[data-tab]'),
    dockBtnOpenSheets: document.getElementById('dockBtnOpenSheets'),
    viewSections: document.querySelectorAll('.view-section'),
    liveSyncStatus: document.getElementById('liveSyncStatus'),
    liveStatusText: document.getElementById('liveStatusText'),
    btnRefreshPrices: document.getElementById('btnRefreshPrices'),
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    themeToggleIcon: document.getElementById('themeToggleIcon'),
    themeToggleText: document.getElementById('themeToggleText'),
    priceLastUpdatedBanner: document.getElementById('priceLastUpdatedBanner'),

    // Station View
    stationPills: document.querySelectorAll('.station-pill-btn'),
    categoryFilterBtns: document.querySelectorAll('#fuelCategoryFilterTags .tag-btn'),
    stationCardView: document.getElementById('stationCardView'),
    stationMatrixView: document.getElementById('stationMatrixView'),
    fuelCardsGrid: document.getElementById('fuelCardsGrid'),
    matrixTableBody: document.getElementById('matrixTableBody'),

    // KPIs
    kpiTotalSpent: document.getElementById('kpiTotalSpent'),
    kpiSpentSubtext: document.getElementById('kpiSpentSubtext'),
    kpiTotalLiters: document.getElementById('kpiTotalLiters'),
    kpiLitersSubtext: document.getElementById('kpiLitersSubtext'),
    kpiAvgPrice: document.getElementById('kpiAvgPrice'),
    kpiAvgSubtext: document.getElementById('kpiAvgSubtext'),
    kpiFillCountBadge: document.getElementById('kpiFillCountBadge'),
    kpiEfficiency: document.getElementById('kpiEfficiency'),
    kpiEfficiencyUnit: document.getElementById('kpiEfficiencyUnit'),
    kpiEfficiencySubtext: document.getElementById('kpiEfficiencySubtext'),

    // Calculator
    btnModeMoneyToLiters: document.getElementById('btnModeMoneyToLiters'),
    btnModeLitersToMoney: document.getElementById('btnModeLitersToMoney'),
    btnModeFullTank: document.getElementById('btnModeFullTank'),
    calcStationSelect: document.getElementById('calcStationSelect'),
    calcFuelTypeSelect: document.getElementById('calcFuelTypeSelect'),
    bannerFuelTitle: document.getElementById('bannerFuelTitle'),
    bannerPriceValue: document.getElementById('bannerPriceValue'),
    inputGroupMoneyToLiters: document.getElementById('inputGroupMoneyToLiters'),
    inputGroupLitersToMoney: document.getElementById('inputGroupLitersToMoney'),
    inputGroupFullTank: document.getElementById('inputGroupFullTank'),
    inputMoneyAmount: document.getElementById('inputMoneyAmount'),
    inputLitersAmount: document.getElementById('inputLitersAmount'),
    tankCapacityInput: document.getElementById('tankCapacityInput'),
    fuelGaugeSelect: document.getElementById('fuelGaugeSelect'),
    resultHeroLabel: document.getElementById('resultHeroLabel'),
    resultHeroMainNumber: document.getElementById('resultHeroMainNumber'),
    resultHeroUnit: document.getElementById('resultHeroUnit'),
    resultFormulaText: document.getElementById('resultFormulaText'),
    formSaveToLog: document.getElementById('formSaveToLog'),
    saveDateTime: document.getElementById('saveDateTime'),
    saveVehicle: document.getElementById('saveVehicle'),
    saveOdometer: document.getElementById('saveOdometer'),
    saveNotes: document.getElementById('saveNotes'),
    saveIsFullTank: document.getElementById('saveIsFullTank'),

    // Logs & Accumulator
    logPeriodFilter: document.getElementById('logPeriodFilter'),
    logStationFilter: document.getElementById('logStationFilter'),
    logFuelFilter: document.getElementById('logFuelFilter'),
    logsTableBody: document.getElementById('logsTableBody'),
    mobileLogsList: document.getElementById('mobileLogsList'),
    logsEmptyState: document.getElementById('logsEmptyState'),
    fuelTypeBreakdownList: document.getElementById('fuelTypeBreakdownList'),
    stationBreakdownList: document.getElementById('stationBreakdownList'),
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnExportJSON: document.getElementById('btnExportJSON'),
    inputImportJSON: document.getElementById('inputImportJSON'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnEmptyAddSample: document.getElementById('btnEmptyAddSample'),
    btnClearLogs: document.getElementById('btnClearLogs'),

    // Monthly View DOM
    monthChipsContainer: document.getElementById('monthChipsContainer'),
    selectedMonthBadgeMoney: document.getElementById('selectedMonthBadgeMoney'),
    selectedMonthBadgeLiters: document.getElementById('selectedMonthBadgeLiters'),
    monthlyTotalSpent: document.getElementById('monthlyTotalSpent'),
    monthlySpentDiff: document.getElementById('monthlySpentDiff'),
    monthlyTotalLiters: document.getElementById('monthlyTotalLiters'),
    monthlyLitersDiff: document.getElementById('monthlyLitersDiff'),
    monthlyAvgPrice: document.getElementById('monthlyAvgPrice'),
    monthlyAvgSubtext: document.getElementById('monthlyAvgSubtext'),
    monthlyFillCountBadge: document.getElementById('monthlyFillCountBadge'),
    monthlyAvgPerFill: document.getElementById('monthlyAvgPerFill'),
    monthlyFillSubtext: document.getElementById('monthlyFillSubtext'),
    monthlyFuelBreakdownList: document.getElementById('monthlyFuelBreakdownList'),
    monthlyStationBreakdownList: document.getElementById('monthlyStationBreakdownList'),
    allMonthsTableBody: document.getElementById('allMonthsTableBody'),
    mobileMonthlyCardsList: document.getElementById('mobileMonthlyCardsList'),

    // Modals & Toast
    editPriceModal: document.getElementById('editPriceModal'),
    editPriceModalTitle: document.getElementById('editPriceModalTitle'),
    editPriceItemName: document.getElementById('editPriceItemName'),
    editPriceValue: document.getElementById('editPriceValue'),
    formEditPrice: document.getElementById('formEditPrice'),
    btnCloseEditPriceModal: document.getElementById('btnCloseEditPriceModal'),
    btnCancelEditPrice: document.getElementById('btnCancelEditPrice'),
    toastContainer: document.getElementById('toastContainer'),

    // Google Sheets Integration DOM
    btnOpenSheetsModal: document.getElementById('btnOpenSheetsModal'),
    btnQuickSyncSheets: document.getElementById('btnQuickSyncSheets'),
    quickSyncIcon: document.getElementById('quickSyncIcon'),
    sheetsStatusDot: document.getElementById('sheetsStatusDot'),
    saveAutoSyncSheets: document.getElementById('saveAutoSyncSheets'),
    calcSheetsNotice: document.getElementById('calcSheetsNotice'),
    calcSheetsDot: document.getElementById('calcSheetsDot'),
    calcSheetsStatusText: document.getElementById('calcSheetsStatusText'),
    btnEmptyConnectSheets: document.getElementById('btnEmptyConnectSheets'),
    btnCopyAppShareUrl: document.getElementById('btnCopyAppShareUrl'),
    googleSheetsModal: document.getElementById('googleSheetsModal'),
    btnCloseSheetsModal: document.getElementById('btnCloseSheetsModal'),
    sheetsStatusBanner: document.getElementById('sheetsStatusBanner'),
    bannerStatusCircle: document.getElementById('bannerStatusCircle'),
    bannerStatusTitle: document.getElementById('bannerStatusTitle'),
    bannerStatusSub: document.getElementById('bannerStatusSub'),
    btnOpenGoogleSheetLink: document.getElementById('btnOpenGoogleSheetLink'),
    formSheetsConfig: document.getElementById('formSheetsConfig'),
    sheetsWebhookUrl: document.getElementById('sheetsWebhookUrl'),
    sheetsDocUrl: document.getElementById('sheetsDocUrl'),
    sheetsAutoSyncCheck: document.getElementById('sheetsAutoSyncCheck'),
    btnTestSheetsConnection: document.getElementById('btnTestSheetsConnection'),
    btnSyncAllToSheets: document.getElementById('btnSyncAllToSheets'),
    btnPullFromSheets: document.getElementById('btnPullFromSheets'),
    testIcon: document.getElementById('testIcon'),
    syncAllIcon: document.getElementById('syncAllIcon'),
    deviceSyncStatusPill: document.getElementById('deviceSyncStatusPill'),
    deviceSyncStatusText: document.getElementById('deviceSyncStatusText'),
    btnToggleGuide: document.getElementById('btnToggleGuide'),
    guideContent: document.getElementById('guideContent'),
    guideToggleArrow: document.getElementById('guideToggleArrow'),
    btnCopyAppsScriptCode: document.getElementById('btnCopyAppsScriptCode'),
    btnClearSheetsConfig: document.getElementById('btnClearSheetsConfig'),
    saveSuccessMobileModal: document.getElementById('saveSuccessMobileModal'),
    summaryStationName: document.getElementById('summaryStationName'),
    summaryFuelName: document.getElementById('summaryFuelName'),
    summaryLitersVal: document.getElementById('summaryLitersVal'),
    summaryAmountVal: document.getElementById('summaryAmountVal'),
    btnModalGoToLogsView: document.getElementById('btnModalGoToLogsView'),
    btnModalCopyMobileLink: document.getElementById('btnModalCopyMobileLink'),
    btnModalCloseSuccess: document.getElementById('btnModalCloseSuccess')
  };

  // =========================================================================
  // 1. Initial Setup & Event Listeners
  // =========================================================================

  function init() {
    // Clear any obsolete price cache so current live market prices take effect immediately
    try {
      localStorage.removeItem('thai_fuel_prices_cache');
      localStorage.removeItem('thai_fuel_prices_cache_v1');
      localStorage.removeItem('thai_fuel_prices_cache_v2');
      localStorage.removeItem('thai_fuel_prices_cache_v3');
    } catch (e) {}

    setupThemeToggle();
    setupDateTimeDefault();
    setupNavigation();
    setupStationPills();
    setupCategoryFilters();
    setupCalculator();
    setupLogsAndStorage();
    setupGoogleSheetsSync();
    setupModals();

    // Subscribe to data managers
    window.fuelDataManager.subscribe(onFuelDataChanged);
    window.fuelStorageManager.subscribe(onStorageChanged);
    window.fuelStorageManager.subscribeSyncStatus((status, msg) => {
      if (dom.deviceSyncStatusPill && dom.deviceSyncStatusText) {
        dom.deviceSyncStatusPill.className = 'device-sync-pill ' + status;
        dom.deviceSyncStatusText.textContent = msg;
      }
    });

    // Initial render
    renderPrices();
    updateKPIDisplay();
    renderLogs();
    renderBreakdowns();
    renderMonthlyView();

    // Start cross-device LAN sync (Mobile <-> Desktop) & live fuel prices
    window.fuelStorageManager.startAutoSync(6000);
    refreshRealtimePrices();
  }

  function setupThemeToggle() {
    const savedTheme = localStorage.getItem('thai_fuel_theme') || 'dark-gray';
    applyTheme(savedTheme);

    if (dom.btnToggleTheme) {
      dom.btnToggleTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark-gray';
        const newTheme = currentTheme === 'dark-gray' ? 'white-gray' : 'dark-gray';
        applyTheme(newTheme);
        showToast(newTheme === 'dark-gray' ? 'สลับเป็นโหมด ดำ-เทา เรียบร้อย' : 'สลับเป็นโหมด ขาว-เทา เรียบร้อย', 'info');
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('thai_fuel_theme', theme);

    if (dom.themeToggleIcon && dom.themeToggleText) {
      if (theme === 'dark-gray') {
        dom.themeToggleIcon.textContent = '☀️';
        dom.themeToggleText.textContent = 'ขาว-เทา';
        if (dom.btnToggleTheme) dom.btnToggleTheme.title = 'สลับเป็นโหมด ขาว-เทา';
      } else {
        dom.themeToggleIcon.textContent = '🌙';
        dom.themeToggleText.textContent = 'ดำ-เทา';
        if (dom.btnToggleTheme) dom.btnToggleTheme.title = 'สลับเป็นโหมด ดำ-เทา';
      }
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark-gray' ? '#121316' : '#f8fafc');
    }

    // Refresh charts if already initialized
    if (state.charts.monthly || state.charts.fuelShare) {
      renderAnalytics();
    }
  }

  function setupDateTimeDefault() {
    // Set local ISO datetime for input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dom.saveDateTime.value = now.toISOString().slice(0, 16);
  }

  // =========================================================================
  // 2. Navigation
  // =========================================================================

  function setupNavigation() {
    const switchTab = (tabId) => {
      state.activeTab = tabId;

      // Update Dock items
      dom.dockItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
      });

      // Switch views
      dom.viewSections.forEach(section => {
        section.classList.toggle('active', section.id === tabId);
      });

      // If switching to monthly view, render monthly breakdown
      if (tabId === 'tab-monthly') {
        renderMonthlyView();
      }

      // If switching to analytics, re-render charts
      if (tabId === 'tab-analytics') {
        setTimeout(renderAnalyticsCharts, 100);
      }
    };

    dom.dockItems.forEach(item => {
      item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    if (dom.dockBtnOpenSheets) {
      dom.dockBtnOpenSheets.addEventListener('click', () => {
        openSheetsModal();
      });
    }
  }

  // =========================================================================
  // 3. Fuel Prices & Realtime Sync Engine
  // =========================================================================

  async function refreshRealtimePrices() {
    dom.btnRefreshPrices.classList.add('spinning');
    dom.liveStatusText.textContent = 'กำลังดึงข้อมูลเรียลไทม์...';

    const result = await window.fuelDataManager.fetchRealtimePrices();
    dom.btnRefreshPrices.classList.remove('spinning');

    if (result.source === 'realtime') {
      dom.liveStatusText.textContent = 'ออนไลน์ • ข้อมูลเรียลไทม์';
      dom.liveSyncStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      showToast('อัปเดตราคาน้ำมันเรียลไทม์ล่าสุดเรียบร้อย', 'success');
    } else {
      dom.liveStatusText.textContent = 'ออฟไลน์ • ใช้ราคาฐานล่าสุด';
      dom.liveSyncStatus.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }

    updatePriceLastUpdated();
  }

  dom.btnRefreshPrices.addEventListener('click', refreshRealtimePrices);

  function updatePriceLastUpdated() {
    const d = window.fuelDataManager.lastUpdated;
    if (d) {
      const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      dom.priceLastUpdatedBanner.textContent = `อัปเดตราคา: ${dateStr} เวลา ${timeStr} น.`;
    }
  }

  function onFuelDataChanged() {
    renderPrices();
    populateFuelSelectOptions();
    calculateOutput();
    updateKPIDisplay();
    updatePriceLastUpdated();
  }

  function setupStationPills() {
    dom.stationPills.forEach(pill => {
      pill.addEventListener('click', () => {
        dom.stationPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.selectedStation = pill.dataset.station;

        if (state.selectedStation === 'all') {
          dom.stationMatrixView.style.display = 'block';
          dom.stationCardView.style.display = 'none';
          renderMatrix();
        } else {
          dom.stationMatrixView.style.display = 'none';
          dom.stationCardView.style.display = 'block';
          renderStationCards(state.selectedStation);
        }
      });
    });
  }

  function setupCategoryFilters() {
    dom.categoryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.categoryFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedCategory = btn.dataset.cat;

        if (state.selectedStation === 'all') {
          renderMatrix();
        } else {
          renderStationCards(state.selectedStation);
        }
      });
    });
  }

  function renderPrices() {
    if (state.selectedStation === 'all') {
      renderMatrix();
    } else {
      renderStationCards(state.selectedStation);
    }
  }

  // Render All Stations Comparison Table
  function renderMatrix() {
    const fuelTypes = window.fuelDataManager.fuelTypes;
    const stations = window.fuelDataManager.stations;
    const tbody = dom.matrixTableBody;
    tbody.innerHTML = '';

    const fuelKeys = Object.keys(fuelTypes).filter(k => {
      if (state.selectedCategory === 'all') return true;
      if (state.selectedCategory === 'diesel') {
        return fuelTypes[k].category === 'diesel' || k === 'premium_diesel';
      }
      return fuelTypes[k].category === state.selectedCategory;
    });

    fuelKeys.forEach(fuelKey => {
      const fuel = fuelTypes[fuelKey];
      const tr = document.createElement('tr');

      // Find lowest price among stations
      let minPrice = Infinity;
      Object.keys(stations).forEach(stKey => {
        const p = window.fuelDataManager.getPrice(stKey, fuelKey);
        if (typeof p === 'number' && p > 0 && p < minPrice) {
          minPrice = p;
        }
      });

      let stationCellsHtml = '';
      Object.keys(stations).forEach(stKey => {
        const info = window.fuelDataManager.getPriceInfo(stKey, fuelKey);
        if (!info || info.current === null || isNaN(info.current)) {
          stationCellsHtml += `<td style="color: var(--text-muted);">-</td>`;
        } else {
          const isBest = (info.current === minPrice && minPrice < Infinity);
          let diffHtml = '';
          if (info.status === 'up') {
            diffHtml = `<span class="matrix-diff-up" title="ราคาปรับขึ้น +${info.diff.toFixed(2)} ฿ (จากเดิม ${info.previous.toFixed(2)} ฿)"><span class="trend-icon">▲</span> +${info.diff.toFixed(2)}</span>`;
          } else if (info.status === 'down') {
            diffHtml = `<span class="matrix-diff-down" title="ราคาปรับลดลง -${Math.abs(info.diff).toFixed(2)} ฿ (จากเดิม ${info.previous.toFixed(2)} ฿)"><span class="trend-icon">▼</span> -${Math.abs(info.diff).toFixed(2)}</span>`;
          } else {
            diffHtml = `<span class="matrix-diff-steady" title="ราคาคงที่ 0.00 ฿"><span class="trend-icon">—</span> 0.00</span>`;
          }

          stationCellsHtml += `
            <td>
              <div class="matrix-cell-content">
                <span class="${isBest ? 'matrix-best-price' : 'matrix-price-val'}">
                  ${info.current.toFixed(2)}
                </span>
                <div class="matrix-sub-row">
                  <span class="matrix-prev-price">เดิม ${info.previous.toFixed(2)}</span>
                  ${diffHtml}
                </div>
              </div>
            </td>
          `;
        }
      });

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${fuel.nameTh}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${fuel.nameEn}</div>
        </td>
        ${stationCellsHtml}
        <td>
          <button class="btn-secondary btn-quick-calc-matrix" data-fuel="${fuelKey}" style="padding: 4px 10px; font-size: 0.75rem;">
            คำนวณ
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach click handlers to quick calc buttons
    document.querySelectorAll('.btn-quick-calc-matrix').forEach(btn => {
      btn.addEventListener('click', () => {
        const fuelKey = btn.dataset.fuel;
        openCalculatorWithFuel('ptt', fuelKey);
      });
    });
  }

  // Render Fuel Cards for a single station
  function renderStationCards(stationId) {
    const fuelTypes = window.fuelDataManager.fuelTypes;
    const grid = dom.fuelCardsGrid;
    grid.innerHTML = '';

    const fuelKeys = Object.keys(fuelTypes).filter(k => {
      if (state.selectedCategory === 'all') return true;
      if (state.selectedCategory === 'diesel') {
        return fuelTypes[k].category === 'diesel' || k === 'premium_diesel';
      }
      return fuelTypes[k].category === state.selectedCategory;
    });

    fuelKeys.forEach(fuelKey => {
      const fuel = fuelTypes[fuelKey];
      const info = window.fuelDataManager.getPriceInfo(stationId, fuelKey);
      if (!info || info.current === null) return; // Station does not sell this fuel

      let trendTagHtml = '';
      if (info.status === 'up') {
        trendTagHtml = `<span class="price-trend-tag up"><span class="trend-icon">▲</span> ปรับขึ้น +${info.diff.toFixed(2)} ฿</span>`;
      } else if (info.status === 'down') {
        trendTagHtml = `<span class="price-trend-tag down"><span class="trend-icon">▼</span> ปรับลดลง -${Math.abs(info.diff).toFixed(2)} ฿</span>`;
      } else {
        trendTagHtml = `<span class="price-trend-tag steady"><span class="trend-icon">—</span> ราคาคงที่ (0.00 ฿)</span>`;
      }

      const card = document.createElement('div');
      card.className = 'fuel-price-card';

      card.innerHTML = `
        <div>
          <div class="fuel-card-top">
            <div class="fuel-card-name-group">
              <span class="fuel-card-name-th">${fuel.nameTh}</span>
              <span class="fuel-card-name-en">${fuel.nameEn}</span>
            </div>
            <span class="fuel-card-octane" style="border: 1px solid ${fuel.borderBadge}; color: ${fuel.color};">
              ${fuel.octane}
            </span>
          </div>

          <div class="fuel-card-price-row">
            <div>
              <span class="price-display-huge">${info.current.toFixed(2)}</span>
              <span class="price-currency">฿/ลิตร</span>
            </div>
            ${trendTagHtml}
          </div>

          <!-- ข้อมูลราคาก่อนหน้าและสัดส่วนส่วนต่าง -->
          <div class="fuel-card-prev-row">
            <div class="prev-price-label">
              <span>ราคาก่อนหน้า:</span>
              <strong>${info.previous.toFixed(2)} ฿</strong>
            </div>
            <div class="diff-tag-pill ${info.status}">
              ${info.status === 'up' 
                ? `<span class="trend-icon">▲</span> ปรับขึ้น +${info.diff.toFixed(2)} ฿ (+${Math.abs(info.diffPct)}%)` 
                : (info.status === 'down' 
                  ? `<span class="trend-icon">▼</span> ปรับลดลง -${Math.abs(info.diff).toFixed(2)} ฿ (-${Math.abs(info.diffPct)}%)` 
                  : `<span class="trend-icon">—</span> ราคาคงที่ (0.00 ฿)`)}
            </div>
          </div>

          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 16px;">
            ${fuel.description}
          </p>
        </div>

        <div class="fuel-card-actions">
          <button class="btn-card-calc" data-station="${stationId}" data-fuel="${fuelKey}">
            <span>🧮</span> คำนวณน้ำมันชนิดนี้
          </button>
          <button class="btn-card-edit-price" data-station="${stationId}" data-fuel="${fuelKey}" title="ปรับแต่งราคาเฉพาะพื้นที่">
            ✏️
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach card action handlers
    grid.querySelectorAll('.btn-card-calc').forEach(btn => {
      btn.addEventListener('click', () => {
        openCalculatorWithFuel(btn.dataset.station, btn.dataset.fuel);
      });
    });

    grid.querySelectorAll('.btn-card-edit-price').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditPriceModal(btn.dataset.station, btn.dataset.fuel);
      });
    });
  }

  function openCalculatorWithFuel(stationId, fuelTypeId) {
    dom.calcStationSelect.value = stationId;
    populateFuelSelectOptions();
    dom.calcFuelTypeSelect.value = fuelTypeId;

    // Switch to calculator tab
    const calcTabBtn = document.querySelector('.nav-tab-btn[data-tab="tab-calc"]');
    if (calcTabBtn) calcTabBtn.click();

    updateCalculatorBanner();
    calculateOutput();
  }

  // =========================================================================
  // 4. Smart Real-Time Calculator
  // =========================================================================

  function setupCalculator() {
    populateFuelSelectOptions();
    updateCalculatorBanner();
    calculateOutput();

    // Mode Switcher
    dom.btnModeMoneyToLiters.addEventListener('click', () => setCalcMode('money_to_liters'));
    dom.btnModeLitersToMoney.addEventListener('click', () => setCalcMode('liters_to_money'));
    dom.btnModeFullTank.addEventListener('click', () => setCalcMode('full_tank'));

    // Station & Fuel changes
    dom.calcStationSelect.addEventListener('change', () => {
      populateFuelSelectOptions();
      updateCalculatorBanner();
      calculateOutput();
    });

    dom.calcFuelTypeSelect.addEventListener('change', () => {
      updateCalculatorBanner();
      calculateOutput();
    });

    // Inputs
    dom.inputMoneyAmount.addEventListener('input', calculateOutput);
    dom.inputLitersAmount.addEventListener('input', calculateOutput);
    dom.tankCapacityInput.addEventListener('input', calculateOutput);
    dom.fuelGaugeSelect.addEventListener('change', calculateOutput);

    // Preset buttons for Money
    document.querySelectorAll('#inputGroupMoneyToLiters .preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.inputMoneyAmount.value = btn.dataset.amount;
        calculateOutput();
      });
    });

    // Preset buttons for Liters
    document.querySelectorAll('#inputGroupLitersToMoney .preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.inputLitersAmount.value = btn.dataset.liters;
        calculateOutput();
      });
    });

    // Save To Log Form Submit
    dom.formSaveToLog.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCurrentCalculationToLog();
    });
  }

  function setCalcMode(mode) {
    state.calcMode = mode;
    dom.btnModeMoneyToLiters.classList.toggle('active', mode === 'money_to_liters');
    dom.btnModeLitersToMoney.classList.toggle('active', mode === 'liters_to_money');
    dom.btnModeFullTank.classList.toggle('active', mode === 'full_tank');

    dom.inputGroupMoneyToLiters.style.display = (mode === 'money_to_liters') ? 'block' : 'none';
    dom.inputGroupLitersToMoney.style.display = (mode === 'liters_to_money') ? 'block' : 'none';
    dom.inputGroupFullTank.style.display = (mode === 'full_tank') ? 'block' : 'none';

    calculateOutput();
  }

  function populateFuelSelectOptions() {
    const stationId = dom.calcStationSelect.value;
    const currentFuel = dom.calcFuelTypeSelect.value || 'gasohol_95';
    dom.calcFuelTypeSelect.innerHTML = '';

    const fuelTypes = window.fuelDataManager.fuelTypes;
    Object.keys(fuelTypes).forEach(fuelKey => {
      const price = window.fuelDataManager.getPrice(stationId, fuelKey);
      if (price !== null) {
        const opt = document.createElement('option');
        opt.value = fuelKey;
        opt.textContent = `${fuelTypes[fuelKey].nameTh} (${price.toFixed(2)} ฿/ลิตร)`;
        dom.calcFuelTypeSelect.appendChild(opt);
      }
    });

    // Restore selected if still available
    if (dom.calcFuelTypeSelect.querySelector(`option[value="${currentFuel}"]`)) {
      dom.calcFuelTypeSelect.value = currentFuel;
    }
  }

  function updateCalculatorBanner() {
    const stationId = dom.calcStationSelect.value;
    const fuelKey = dom.calcFuelTypeSelect.value;
    const station = window.fuelDataManager.stations[stationId];
    const fuel = window.fuelDataManager.fuelTypes[fuelKey];
    const price = window.fuelDataManager.getPrice(stationId, fuelKey);

    if (fuel && station && price) {
      dom.bannerFuelTitle.textContent = `${fuel.nameTh} • ${station.nameTh}`;
      dom.bannerPriceValue.textContent = price.toFixed(2);
    }
  }

  function calculateOutput() {
    const stationId = dom.calcStationSelect.value;
    const fuelKey = dom.calcFuelTypeSelect.value;
    const unitPrice = window.fuelDataManager.getPrice(stationId, fuelKey);

    if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
      dom.resultHeroMainNumber.textContent = '0.00';
      dom.resultFormulaText.textContent = 'ไม่พบราคาน้ำมันที่เลือก';
      return;
    }

    if (state.calcMode === 'money_to_liters') {
      const money = parseFloat(dom.inputMoneyAmount.value) || 0;
      const liters = (money > 0 && unitPrice > 0) ? (money / unitPrice) : 0;

      dom.resultHeroLabel.textContent = 'จำนวนลิตรน้ำมันที่จะได้รับโดยอัตโนมัติ';
      dom.resultHeroMainNumber.textContent = liters.toFixed(3);
      dom.resultHeroUnit.textContent = 'ลิตร (L)';
      dom.resultFormulaText.textContent = `สูตรคำนวณ: ${formatMoney(money)} บาท ÷ ${unitPrice.toFixed(2)} บาท/ลิตร = ${liters.toFixed(3)} ลิตร`;

    } else if (state.calcMode === 'liters_to_money') {
      const liters = parseFloat(dom.inputLitersAmount.value) || 0;
      const money = liters * unitPrice;

      dom.resultHeroLabel.textContent = 'ยอดเงินค่าน้ำมันที่ต้องจ่าย';
      dom.resultHeroMainNumber.textContent = formatMoney(money);
      dom.resultHeroUnit.textContent = 'บาท (THB)';
      dom.resultFormulaText.textContent = `สูตรคำนวณ: ${liters.toFixed(3)} ลิตร × ${unitPrice.toFixed(2)} บาท/ลิตร = ${formatMoney(money)} บาท`;

    } else if (state.calcMode === 'full_tank') {
      const capacity = parseFloat(dom.tankCapacityInput.value) || 50;
      const gauge = parseFloat(dom.fuelGaugeSelect.value) || 0;
      const neededLiters = capacity * (1 - gauge);
      const money = neededLiters * unitPrice;

      dom.resultHeroLabel.textContent = `เติมเต็มถัง: ต้องการ ${neededLiters.toFixed(2)} ลิตร รวมเป็นเงิน`;
      dom.resultHeroMainNumber.textContent = formatMoney(money);
      dom.resultHeroUnit.textContent = 'บาท (THB)';
      dom.resultFormulaText.textContent = `ขนาดถัง ${capacity}L (เหลือ ${(gauge * 100).toFixed(0)}%) ต้องเติมอีก ${neededLiters.toFixed(2)}L × ${unitPrice.toFixed(2)} ฿/L`;
    }
  }

  async function saveCurrentCalculationToLog() {
    const stationId = dom.calcStationSelect.value;
    const fuelKey = dom.calcFuelTypeSelect.value;
    const unitPrice = window.fuelDataManager.getPrice(stationId, fuelKey);

    let amount = 0;
    let liters = 0;

    if (state.calcMode === 'money_to_liters') {
      amount = parseFloat(dom.inputMoneyAmount.value) || 0;
      liters = unitPrice > 0 ? (amount / unitPrice) : 0;
    } else if (state.calcMode === 'liters_to_money') {
      liters = parseFloat(dom.inputLitersAmount.value) || 0;
      amount = liters * unitPrice;
    } else if (state.calcMode === 'full_tank') {
      const capacity = parseFloat(dom.tankCapacityInput.value) || 50;
      const gauge = parseFloat(dom.fuelGaugeSelect.value) || 0;
      liters = capacity * (1 - gauge);
      amount = liters * unitPrice;
    }

    if (amount <= 0 || liters <= 0) {
      showToast('กรุณาระบุจำนวนเงินหรือจำนวนลิตรที่ถูกต้องก่อนบันทึก', 'error');
      return;
    }

    // Google Sheets is the STRICT & ONLY storage system
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      showToast('⚠️ กรุณาเชื่อมต่อ Google Sheets ก่อนบันทึกข้อมูล (ระบบจัดเก็บบน Google Sheets เท่านั้น)', 'error');
      openSheetsModal();
      return;
    }

    const logEntry = {
      date: dom.saveDateTime.value ? new Date(dom.saveDateTime.value).toISOString() : new Date().toISOString(),
      stationId: stationId,
      fuelTypeId: fuelKey,
      pricePerLiter: unitPrice,
      totalAmount: amount,
      totalLiters: liters,
      odometer: dom.saveOdometer.value ? parseFloat(dom.saveOdometer.value) : null,
      vehicle: dom.saveVehicle.value || '',
      isFullTank: dom.saveIsFullTank.checked,
      notes: dom.saveNotes.value || ''
    };

    showToast('กำลังบันทึกตรงสู่ Google Sheets...', 'info');
    try {
      await window.fuelStorageManager.addLog(logEntry);
      showToast(`บันทึกตรงสู่ Google Sheets สำเร็จ! 📊 สะสม ${liters.toFixed(3)} L (฿${formatMoney(amount)})`, 'success');

      // Populate & open the Save Success Mobile Modal with direct links to mobile
      if (dom.saveSuccessMobileModal) {
        const stationObj = window.fuelDataManager.stations[stationId];
        const fuelObj = window.fuelDataManager.fuelTypes[fuelKey];
        if (dom.summaryStationName) dom.summaryStationName.textContent = stationObj?.nameTh || stationId;
        if (dom.summaryFuelName) dom.summaryFuelName.textContent = fuelObj?.nameTh || fuelKey;
        if (dom.summaryLitersVal) dom.summaryLitersVal.textContent = liters.toFixed(3) + ' L';
        if (dom.summaryAmountVal) dom.summaryAmountVal.textContent = '฿' + formatMoney(amount);

        dom.saveSuccessMobileModal.classList.add('active');
      } else {
        // Fallback: switch to logs tab directly
        const logsTabBtn = document.querySelector('.nav-tab-btn[data-tab="tab-logs"]') || document.querySelector('.mobile-nav-btn[data-tab="tab-logs"]');
        if (logsTabBtn) logsTabBtn.click();
      }
    } catch (err) {
      showToast('บันทึกลง Google Sheets ไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  // =========================================================================
  // 5. Accumulation KPI Display & Logs Management
  // =========================================================================

  function setupLogsAndStorage() {
    // Filters
    dom.logPeriodFilter.addEventListener('change', renderLogs);
    dom.logStationFilter.addEventListener('change', renderLogs);
    dom.logFuelFilter.addEventListener('change', renderLogs);

    // Export/Import
    dom.btnExportCSV.addEventListener('click', () => {
      const filtered = getFilteredLogs();
      window.fuelStorageManager.exportToCSV(filtered);
    });

    dom.btnExportJSON.addEventListener('click', () => {
      window.fuelStorageManager.exportToJSON();
    });

    dom.inputImportJSON.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = window.fuelStorageManager.importFromJSON(event.target.result);
          if (res.success) {
            showToast(`นำเข้าสำเร็จ ${res.count} รายการ`, 'success');
          } else {
            showToast(`เกิดข้อผิดพลาด: ${res.error}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    });

    dom.btnLoadSample.addEventListener('click', async () => {
      if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
        showToast('⚠️ กรุณาเชื่อมต่อ Google Sheets ก่อนโหลดข้อมูลจำลอง (ระบบจัดเก็บบน Google Sheets เท่านั้น)', 'error');
        openSheetsModal();
        return;
      }
      showToast('กำลังโหลดข้อมูลจำลองลง Google Sheets...', 'info');
      try {
        const count = await window.fuelStorageManager.loadSampleData();
        showToast(`โหลดข้อมูลจำลองลง Google Sheets แล้ว ${count} รายการ`, 'success');
      } catch (err) {
        showToast('โหลดข้อมูลจำลองไม่สำเร็จ: ' + err.message, 'error');
      }
    });

    dom.btnEmptyAddSample.addEventListener('click', async () => {
      if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
        showToast('⚠️ กรุณาเชื่อมต่อ Google Sheets ก่อนโหลดข้อมูลจำลอง (ระบบจัดเก็บบน Google Sheets เท่านั้น)', 'error');
        openSheetsModal();
        return;
      }
      showToast('กำลังโหลดข้อมูลจำลองลง Google Sheets...', 'info');
      try {
        const count = await window.fuelStorageManager.loadSampleData();
        showToast(`โหลดข้อมูลจำลองลง Google Sheets แล้ว ${count} รายการ`, 'success');
      } catch (err) {
        showToast('โหลดข้อมูลจำลองไม่สำเร็จ: ' + err.message, 'error');
      }
    });

    dom.btnClearLogs.addEventListener('click', async () => {
      if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
        showToast('⚠️ กรุณาเชื่อมต่อ Google Sheets ก่อนดำเนินการ', 'error');
        openSheetsModal();
        return;
      }
      if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการเติมน้ำมันทั้งหมดบน Google Sheets?')) {
        showToast('กำลังล้างประวัติบน Google Sheets...', 'info');
        try {
          await window.fuelStorageManager.clearAllLogs();
          showToast('ล้างประวัติทั้งหมดบน Google Sheets เรียบร้อย', 'success');
        } catch (err) {
          showToast('ล้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        }
      }
    });
  }

  function onStorageChanged() {
    updateKPIDisplay();
    renderLogs();
    renderBreakdowns();
    renderMonthlyView();
    if (state.activeTab === 'tab-analytics') {
      renderAnalyticsCharts();
    }
  }

  function updateKPIDisplay() {
    const stats = window.fuelStorageManager.getAccumulatedStats();

    // 1. Total Spent (ยอดเงินรวมสะสม - แยกชัดเจน)
    dom.kpiTotalSpent.textContent = formatMoney(stats.totalSpent);
    dom.kpiSpentSubtext.textContent = stats.totalCount > 0 
      ? `เฉลี่ย ฿${formatMoney(stats.averageSpentPerFill)} / ครั้ง`
      : 'ยังไม่มีประวัติการเติม';

    // 2. Total Liters (จำนวนลิตรสะสม - แยกชัดเจน)
    dom.kpiTotalLiters.textContent = stats.totalLiters.toFixed(3);
    dom.kpiLitersSubtext.textContent = stats.totalCount > 0
      ? `เฉลี่ย ${stats.averageLitersPerFill.toFixed(3)} L / ครั้ง`
      : 'ยังไม่มีประวัติการเติม';

    // 3. Average Unit Price
    dom.kpiAvgPrice.textContent = stats.averagePricePerLiter.toFixed(2);
    dom.kpiAvgSubtext.textContent = stats.totalCount > 0
      ? `คิดจาก ยอดเงินรวม ÷ ลิตรสะสม`
      : 'อิงตามข้อมูลจริง';

    // 4. Fill Count & Efficiency
    dom.kpiFillCountBadge.textContent = `${stats.totalCount} ครั้ง`;
    if (stats.kmPerLiter > 0) {
      dom.kpiEfficiency.textContent = stats.kmPerLiter.toFixed(2);
      dom.kpiEfficiencyUnit.textContent = 'กม./ลิตร';
      dom.kpiEfficiencySubtext.textContent = `ต้นทุน ~${stats.bahtPerKm.toFixed(2)} ฿/กม. (ระยะทาง ${stats.totalDistanceKm} กม.)`;
    } else {
      dom.kpiEfficiency.textContent = stats.totalCount.toString();
      dom.kpiEfficiencyUnit.textContent = 'รายการ';
      dom.kpiEfficiencySubtext.textContent = 'ระบุเลขไมล์เพื่อคำนวณ กม./ลิตร';
    }
  }

  function getFilteredLogs() {
    return window.fuelStorageManager.filterLogs({
      period: dom.logPeriodFilter.value,
      station: dom.logStationFilter.value,
      fuelType: dom.logFuelFilter.value
    });
  }

  function renderLogs() {
    const items = getFilteredLogs();
    const tbody = dom.logsTableBody;
    const mobileList = dom.mobileLogsList;
    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    if (items.length === 0) {
      dom.logsEmptyState.style.display = 'block';
      dom.logsTableBody.closest('.data-table-responsive').style.display = 'none';
      dom.mobileLogsList.style.display = 'none';
      return;
    }

    dom.logsEmptyState.style.display = 'none';
    if (window.innerWidth >= 768) {
      dom.logsTableBody.closest('.data-table-responsive').style.display = 'block';
      dom.mobileLogsList.style.display = 'none';
    } else {
      dom.logsTableBody.closest('.data-table-responsive').style.display = 'none';
      dom.mobileLogsList.style.display = 'flex';
    }

    items.forEach(log => {
      const station = window.fuelDataManager.stations[log.stationId] || { shortName: log.stationId, brandColor: '#38bdf8' };
      const fuel = window.fuelDataManager.fuelTypes[log.fuelTypeId] || { nameTh: log.fuelTypeId, color: '#10b981' };
      const d = new Date(log.date);
      const dateFormatted = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      // Table Row for Desktop
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">📅 ${dateFormatted}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">🕒 เวลา ${timeFormatted} น.</div>
        </td>
        <td>
          <span class="cell-station-badge" style="background: ${station.badgeBg || 'rgba(56, 189, 248, 0.15)'}; border: 1px solid ${station.badgeBorder || station.brandColor};">
            ${station.icon || '⛽'} ${station.shortName}
          </span>
        </td>
        <td>
          <span class="cell-fuel-badge" style="background: ${fuel.bgBadge || 'rgba(16, 185, 129, 0.15)'}; border: 1px solid ${fuel.borderBadge || fuel.color};">
            ${fuel.nameTh}
          </span>
        </td>
        <td style="font-family: var(--font-mono);">${log.pricePerLiter.toFixed(2)}</td>
        <td class="cell-money">฿${formatMoney(log.totalAmount)}</td>
        <td class="cell-liters">${log.totalLiters.toFixed(3)} L</td>
        <td style="font-family: var(--font-mono); color: var(--text-secondary);">
          ${log.odometer ? log.odometer.toLocaleString() + ' กม.' : '-'}
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-primary);">${log.vehicle || '-'}</div>
          ${log.notes ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${log.notes}</div>` : ''}
        </td>
        <td>
          <button class="btn-row-action btn-delete-log" data-id="${log.id}" title="ลบรายการนี้">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);

      // Card for Mobile
      const card = document.createElement('div');
      card.className = 'mobile-log-card';
      card.innerHTML = `
        <div class="mobile-card-header">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="cell-station-badge" style="background: ${station.badgeBg || 'rgba(56, 189, 248, 0.15)'}; border: 1px solid ${station.badgeBorder || station.brandColor};">
              ${station.icon || '⛽'} ${station.shortName}
            </span>
            <span class="cell-fuel-badge" style="background: ${fuel.bgBadge || 'rgba(16, 185, 129, 0.15)'}; border: 1px solid ${fuel.borderBadge || fuel.color};">
              ${fuel.nameTh}
            </span>
          </div>
          <button class="btn-row-action btn-delete-log" data-id="${log.id}" title="ลบรายการ">
            🗑️
          </button>
        </div>

        <div class="mobile-card-datetime">
          <span>📅 ${dateFormatted}</span>
          <span>🕒 เวลา ${timeFormatted} น.</span>
        </div>

        <div class="mobile-card-metrics">
          <div class="mobile-metric-item">
            <span class="mobile-metric-label">ยอดเงินที่จ่าย</span>
            <span class="mobile-metric-val" style="color: var(--kpi-money);">฿${formatMoney(log.totalAmount)}</span>
          </div>
          <div class="mobile-metric-item">
            <span class="mobile-metric-label">จำนวนลิตรที่ได้</span>
            <span class="mobile-metric-val" style="color: var(--kpi-liters);">${log.totalLiters.toFixed(3)} L</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
          <span>ราคา ฿${log.pricePerLiter.toFixed(2)}/ลิตร ${log.vehicle ? '• ' + log.vehicle : ''}</span>
          <span>${log.odometer ? log.odometer.toLocaleString() + ' กม.' : ''}</span>
        </div>
      `;
      mobileList.appendChild(card);
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
          showToast('⚠️ กรุณาเชื่อมต่อ Google Sheets ก่อนดำเนินการลบ', 'error');
          openSheetsModal();
          return;
        }
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจาก Google Sheets?')) {
          showToast('กำลังลบรายการจาก Google Sheets...', 'info');
          try {
            await window.fuelStorageManager.deleteLog(btn.dataset.id);
            showToast('ลบรายการออกจาก Google Sheets เรียบร้อย', 'success');
          } catch (err) {
            showToast('ลบรายการไม่สำเร็จ: ' + err.message, 'error');
          }
        }
      });
    });
  }

  window.addEventListener('resize', () => {
    if (dom.logsEmptyState.style.display !== 'block') {
      if (window.innerWidth >= 768) {
        dom.logsTableBody.closest('.data-table-responsive').style.display = 'block';
        dom.mobileLogsList.style.display = 'none';
        if (dom.allMonthsTableBody) {
          dom.allMonthsTableBody.closest('.data-table-responsive').style.display = 'block';
          dom.mobileMonthlyCardsList.style.display = 'none';
        }
      } else {
        dom.logsTableBody.closest('.data-table-responsive').style.display = 'none';
        dom.mobileLogsList.style.display = 'flex';
        if (dom.allMonthsTableBody) {
          dom.allMonthsTableBody.closest('.data-table-responsive').style.display = 'none';
          dom.mobileMonthlyCardsList.style.display = 'flex';
        }
      }
    }
  });

  // Render Category Breakdown (Fuel Type and Station)
  function renderBreakdowns() {
    const stats = window.fuelStorageManager.getAccumulatedStats();
    const fuelList = dom.fuelTypeBreakdownList;
    const stationList = dom.stationBreakdownList;
    fuelList.innerHTML = '';
    stationList.innerHTML = '';

    if (stats.totalCount === 0) {
      fuelList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem;">ยังไม่มีข้อมูลสะสม</div>';
      stationList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem;">ยังไม่มีข้อมูลสะสม</div>';
      return;
    }

    // Fuel Type Breakdown
    Object.keys(stats.byFuelType).forEach(fuelKey => {
      const item = stats.byFuelType[fuelKey];
      const fuel = window.fuelDataManager.fuelTypes[fuelKey] || { nameTh: fuelKey, color: '#38bdf8' };
      const pctSpent = stats.totalSpent > 0 ? (item.totalAmount / stats.totalSpent * 100) : 0;

      const div = document.createElement('div');
      div.className = 'progress-item';
      div.innerHTML = `
        <div class="progress-item-header">
          <span style="font-weight: 600; color: var(--text-primary);">${fuel.nameTh} (${item.count} ครั้ง)</span>
          <span style="color: var(--text-secondary); font-family: var(--font-mono);">
            ${item.totalLiters.toFixed(2)} L • <strong style="color: var(--kpi-money);">฿${formatMoney(item.totalAmount)}</strong> (${pctSpent.toFixed(1)}%)
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pctSpent}%; background-color: ${fuel.color};"></div>
        </div>
      `;
      fuelList.appendChild(div);
    });

    // Station Breakdown
    Object.keys(stats.byStation).forEach(stKey => {
      const item = stats.byStation[stKey];
      const station = window.fuelDataManager.stations[stKey] || { shortName: stKey, brandColor: '#0284c7' };
      const pctSpent = stats.totalSpent > 0 ? (item.totalAmount / stats.totalSpent * 100) : 0;

      const div = document.createElement('div');
      div.className = 'progress-item';
      div.innerHTML = `
        <div class="progress-item-header">
          <span style="font-weight: 600; color: var(--text-primary);">${station.shortName} (${item.count} ครั้ง)</span>
          <span style="color: var(--text-secondary); font-family: var(--font-mono);">
            ${item.totalLiters.toFixed(2)} L • <strong style="color: var(--kpi-money);">฿${formatMoney(item.totalAmount)}</strong> (${pctSpent.toFixed(1)}%)
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pctSpent}%; background-color: ${station.brandColor};"></div>
        </div>
      `;
      stationList.appendChild(div);
    });
  }

  // =========================================================================
  // 5.5 Monthly Breakdown & Monthly Accumulator Engine
  // =========================================================================

  function renderMonthlyView() {
    const monthlyStats = window.fuelStorageManager.getMonthlyDetailedStats();
    const chipsContainer = dom.monthChipsContainer;
    chipsContainer.innerHTML = '';

    if (monthlyStats.length === 0) {
      chipsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem; padding: 4px 0;">ยังไม่มีข้อมูลประวัติการเติม</span>';
      dom.selectedMonthBadgeMoney.textContent = 'ไม่มีข้อมูล';
      dom.selectedMonthBadgeLiters.textContent = 'ไม่มีข้อมูล';
      dom.monthlyTotalSpent.textContent = '0.00';
      dom.monthlyTotalLiters.textContent = '0.000';
      dom.monthlyAvgPrice.textContent = '0.00';
      dom.monthlyAvgPerFill.textContent = '0.00';
      dom.monthlySpentDiff.innerHTML = '<span>เทียบเดือนก่อนหน้า: -</span>';
      dom.monthlyLitersDiff.innerHTML = '<span>เทียบเดือนก่อนหน้า: -</span>';
      dom.monthlyFuelBreakdownList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem;">ยังไม่มีข้อมูล</div>';
      dom.monthlyStationBreakdownList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem;">ยังไม่มีข้อมูล</div>';
      dom.allMonthsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">ยังไม่มีข้อมูลสรุปรายเดือน</td></tr>';
      dom.mobileMonthlyCardsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">ยังไม่มีข้อมูลสรุปรายเดือน</div>';
      return;
    }

    // Set default selected month if not set or invalid
    if (!state.selectedMonthKey || !monthlyStats.some(m => m.monthKey === state.selectedMonthKey)) {
      state.selectedMonthKey = monthlyStats[0].monthKey;
    }

    // Render month selector chips
    monthlyStats.forEach(m => {
      const chip = document.createElement('button');
      chip.className = `month-chip ${m.monthKey === state.selectedMonthKey ? 'active' : ''}`;
      chip.innerHTML = `<span>📅 ${m.monthName}</span>`;
      chip.addEventListener('click', () => {
        state.selectedMonthKey = m.monthKey;
        renderMonthlyView();
      });
      chipsContainer.appendChild(chip);
    });

    // Find currently selected month
    const cur = monthlyStats.find(m => m.monthKey === state.selectedMonthKey) || monthlyStats[0];

    // Update KPIs for selected month (Separate Money and Liters clearly)
    dom.selectedMonthBadgeMoney.textContent = cur.shortName;
    dom.selectedMonthBadgeLiters.textContent = cur.shortName;
    dom.monthlyTotalSpent.textContent = formatMoney(cur.totalAmount);
    dom.monthlyTotalLiters.textContent = cur.totalLiters.toFixed(3);
    dom.monthlyAvgPrice.textContent = cur.avgPrice.toFixed(2);
    dom.monthlyAvgSubtext.textContent = `คิดจาก ฿${formatMoney(cur.totalAmount)} ÷ ${cur.totalLiters.toFixed(2)} L`;
    dom.monthlyFillCountBadge.textContent = `${cur.count} ครั้ง`;
    dom.monthlyAvgPerFill.textContent = formatMoney(cur.avgPerFill);
    dom.monthlyFillSubtext.textContent = `เฉลี่ย ${cur.avgLitersPerFill.toFixed(2)} ลิตร / ครั้ง`;

    // Comparisons with previous month
    if (cur.comparison && cur.comparison.hasPrev) {
      const amtDiff = cur.comparison.amountDiff;
      const amtPct = cur.comparison.amountDiffPct;
      const litDiff = cur.comparison.litersDiff;
      const litPct = cur.comparison.litersDiffPct;

      if (amtDiff > 0.001) {
        dom.monthlySpentDiff.innerHTML = `<span class="diff-badge-up"><span class="trend-icon">▲</span> จ่ายเพิ่มขึ้น +฿${formatMoney(amtDiff)} (+${amtPct}%)</span>`;
      } else if (amtDiff < -0.001) {
        dom.monthlySpentDiff.innerHTML = `<span class="diff-badge-down"><span class="trend-icon">▼</span> ประหยัดลง -฿${formatMoney(Math.abs(amtDiff))} (-${Math.abs(amtPct)}%)</span>`;
      } else {
        dom.monthlySpentDiff.innerHTML = `<span class="diff-badge-neutral"><span class="trend-icon">—</span> ยอดเท่ากับเดือนก่อน</span>`;
      }

      if (litDiff > 0.001) {
        dom.monthlyLitersDiff.innerHTML = `<span class="diff-badge-up"><span class="trend-icon">▲</span> ใช้น้ำมันเพิ่ม +${litDiff.toFixed(2)} L (+${litPct}%)</span>`;
      } else if (litDiff < -0.001) {
        dom.monthlyLitersDiff.innerHTML = `<span class="diff-badge-down"><span class="trend-icon">▼</span> ใช้น้ำมันลดลง -${Math.abs(litDiff).toFixed(2)} L (-${Math.abs(litPct)}%)</span>`;
      } else {
        dom.monthlyLitersDiff.innerHTML = `<span class="diff-badge-neutral"><span class="trend-icon">—</span> ปริมาณเท่ากับเดือนก่อน</span>`;
      }
    } else {
      dom.monthlySpentDiff.innerHTML = `<span class="diff-badge-neutral">เดือนแรกที่มีการบันทึก</span>`;
      dom.monthlyLitersDiff.innerHTML = `<span class="diff-badge-neutral">เดือนแรกที่มีการบันทึก</span>`;
    }

    // Render Fuel Breakdown for this month
    const fuelList = dom.monthlyFuelBreakdownList;
    fuelList.innerHTML = '';
    Object.keys(cur.byFuelType).forEach(fuelKey => {
      const item = cur.byFuelType[fuelKey];
      const fuel = window.fuelDataManager.fuelTypes[fuelKey] || { nameTh: fuelKey, color: '#38bdf8' };
      const pct = cur.totalAmount > 0 ? (item.totalAmount / cur.totalAmount * 100) : 0;

      const div = document.createElement('div');
      div.className = 'progress-item';
      div.innerHTML = `
        <div class="progress-item-header">
          <span style="font-weight: 600; color: var(--text-primary);">${fuel.nameTh} (${item.count} ครั้ง)</span>
          <span style="color: var(--text-secondary); font-family: var(--font-mono);">
            ${item.totalLiters.toFixed(2)} L • <strong style="color: var(--kpi-money);">฿${formatMoney(item.totalAmount)}</strong> (${pct.toFixed(1)}%)
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%; background-color: ${fuel.color};"></div>
        </div>
      `;
      fuelList.appendChild(div);
    });

    // Render Station Breakdown for this month
    const stList = dom.monthlyStationBreakdownList;
    stList.innerHTML = '';
    Object.keys(cur.byStation).forEach(stKey => {
      const item = cur.byStation[stKey];
      const station = window.fuelDataManager.stations[stKey] || { shortName: stKey, brandColor: '#0284c7' };
      const pct = cur.totalAmount > 0 ? (item.totalAmount / cur.totalAmount * 100) : 0;

      const div = document.createElement('div');
      div.className = 'progress-item';
      div.innerHTML = `
        <div class="progress-item-header">
          <span style="font-weight: 600; color: var(--text-primary);">${station.shortName} (${item.count} ครั้ง)</span>
          <span style="color: var(--text-secondary); font-family: var(--font-mono);">
            ${item.totalLiters.toFixed(2)} L • <strong style="color: var(--kpi-money);">฿${formatMoney(item.totalAmount)}</strong> (${pct.toFixed(1)}%)
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%; background-color: ${station.brandColor};"></div>
        </div>
      `;
      stList.appendChild(div);
    });

    // Render All-Months Comparison Table and Mobile Cards
    const tbody = dom.allMonthsTableBody;
    const mobileCards = dom.mobileMonthlyCardsList;
    tbody.innerHTML = '';
    mobileCards.innerHTML = '';

    monthlyStats.forEach(m => {
      let diffHtml = '<span style="color: var(--text-muted);">-</span>';
      if (m.comparison && m.comparison.hasPrev) {
        const amtDiff = m.comparison.amountDiff;
        const amtPct = m.comparison.amountDiffPct;
        if (amtDiff > 0.001) {
          diffHtml = `<span class="diff-badge-up"><span class="trend-icon">▲</span> +฿${formatMoney(amtDiff)} (+${amtPct}%)</span>`;
        } else if (amtDiff < -0.001) {
          diffHtml = `<span class="diff-badge-down"><span class="trend-icon">▼</span> -฿${formatMoney(Math.abs(amtDiff))} (-${Math.abs(amtPct)}%)</span>`;
        } else {
          diffHtml = `<span class="diff-badge-neutral"><span class="trend-icon">—</span> 0.00 ฿</span>`;
        }
      }

      const isCurrentSelected = m.monthKey === state.selectedMonthKey;
      const tr = document.createElement('tr');
      if (isCurrentSelected) {
        tr.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
      }

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${m.monthName}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${m.year + 543}</div>
        </td>
        <td class="cell-money">฿${formatMoney(m.totalAmount)}</td>
        <td class="cell-liters">${m.totalLiters.toFixed(3)} L</td>
        <td style="font-family: var(--font-mono);">${m.avgPrice.toFixed(2)} ฿/L</td>
        <td>${m.count} ครั้ง</td>
        <td style="font-family: var(--font-mono); color: var(--text-secondary);">฿${formatMoney(m.avgPerFill)}</td>
        <td>${diffHtml}</td>
      `;
      tbody.appendChild(tr);

      // Mobile card for each month
      const card = document.createElement('div');
      card.className = 'mobile-log-card';
      if (isCurrentSelected) {
        card.style.borderColor = 'var(--accent-cyan)';
      }

      card.innerHTML = `
        <div class="mobile-card-header">
          <span style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">📅 ${m.monthName}</span>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">${m.count} ครั้ง</span>
        </div>
        <div class="mobile-card-metrics">
          <div class="mobile-metric-item">
            <span class="mobile-metric-label">ยอดเงินรวม</span>
            <span class="mobile-metric-val" style="color: #34d399;">฿${formatMoney(m.totalAmount)}</span>
          </div>
          <div class="mobile-metric-item">
            <span class="mobile-metric-label">ปริมาณน้ำมันรวม</span>
            <span class="mobile-metric-val" style="color: #38bdf8;">${m.totalLiters.toFixed(3)} L</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
          <span>ราคาเฉลี่ย: ฿${m.avgPrice.toFixed(2)}/L</span>
          <span>${diffHtml}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        state.selectedMonthKey = m.monthKey;
        renderMonthlyView();
      });
      mobileCards.appendChild(card);
    });

    // Responsive toggle between table and mobile cards
    if (window.innerWidth >= 768) {
      dom.allMonthsTableBody.closest('.data-table-responsive').style.display = 'block';
      dom.mobileMonthlyCardsList.style.display = 'none';
    } else {
      dom.allMonthsTableBody.closest('.data-table-responsive').style.display = 'none';
      dom.mobileMonthlyCardsList.style.display = 'flex';
    }
  }

  // =========================================================================
  // 6. Analytics Charts (Chart.js)
  // =========================================================================

  function renderAnalyticsCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet');
      return;
    }

    const stats = window.fuelStorageManager.getAccumulatedStats();

    // Chart 1: Monthly Spending & Liters
    const monthlyKeys = Object.keys(stats.monthlyData).sort();
    const monthlyLabels = monthlyKeys.map(k => stats.monthlyData[k].label);
    const monthlyAmounts = monthlyKeys.map(k => stats.monthlyData[k].totalAmount);
    const monthlyLiters = monthlyKeys.map(k => stats.monthlyData[k].totalLiters);

    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark-gray') === 'dark-gray';
    const textColor = isDark ? '#e5e7eb' : '#334155';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const doughnutBorder = isDark ? '#1c1e24' : '#ffffff';

    const ctx1 = document.getElementById('monthlyTrendChart');
    if (ctx1) {
      if (state.charts.monthly) state.charts.monthly.destroy();

      state.charts.monthly = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: monthlyLabels.length ? monthlyLabels : ['ปัจจุบัน'],
          datasets: [
            {
              label: 'ยอดเงินค่าน้ำมัน (บาท)',
              data: monthlyAmounts.length ? monthlyAmounts : [0],
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              label: 'ปริมาณน้ำมัน (ลิตร)',
              data: monthlyLiters.length ? monthlyLiters : [0],
              type: 'line',
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              borderWidth: 2,
              pointRadius: 4,
              fill: false,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { family: 'Prompt' } }
            }
          },
          scales: {
            x: {
              ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Prompt' } },
              grid: { color: gridColor }
            },
            y: {
              type: 'linear',
              position: 'left',
              ticks: { color: '#059669', font: { family: 'Prompt' } },
              grid: { color: gridColor }
            },
            y1: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#0284c7', font: { family: 'Prompt' } }
            }
          }
        }
      });
    }

    // Chart 2: Fuel Type Share Doughnut
    const ctx2 = document.getElementById('fuelShareChart');
    if (ctx2) {
      if (state.charts.fuelShare) state.charts.fuelShare.destroy();

      const fuelShareKeys = Object.keys(stats.byFuelType);
      const fuelShareLabels = fuelShareKeys.map(k => window.fuelDataManager.fuelTypes[k]?.nameTh || k);
      const fuelShareData = fuelShareKeys.map(k => stats.byFuelType[k].totalLiters);
      const fuelShareColors = fuelShareKeys.map(k => window.fuelDataManager.fuelTypes[k]?.color || '#0284c7');

      state.charts.fuelShare = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: fuelShareLabels.length ? fuelShareLabels : ['ไม่มีข้อมูล'],
          datasets: [{
            data: fuelShareData.length ? fuelShareData : [1],
            backgroundColor: fuelShareColors.length ? fuelShareColors : ['#cbd5e1'],
            borderWidth: 2,
            borderColor: doughnutBorder
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Prompt' }, boxWidth: 12 }
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // 7. Modals & Utilities
  // =========================================================================

  function setupModals() {
    dom.btnCloseEditPriceModal.addEventListener('click', closeEditPriceModal);
    dom.btnCancelEditPrice.addEventListener('click', closeEditPriceModal);

    dom.formEditPrice.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPrice = parseFloat(dom.editPriceValue.value);
      if (state.editingStationId && state.editingFuelTypeId && newPrice > 0) {
        window.fuelDataManager.updateCustomPrice(state.editingStationId, state.editingFuelTypeId, newPrice);
        closeEditPriceModal();
        showToast('อัปเดตราคาเฉพาะพื้นที่เรียบร้อย', 'success');
      }
    });

    dom.editPriceModal.addEventListener('click', (e) => {
      if (e.target === dom.editPriceModal) {
        closeEditPriceModal();
      }
    });

    // Save Success Mobile Modal Listeners
    if (dom.btnModalGoToLogsView) {
      dom.btnModalGoToLogsView.addEventListener('click', () => {
        if (dom.saveSuccessMobileModal) dom.saveSuccessMobileModal.classList.remove('active');
        const logsDock = document.querySelector('.dock-item[data-tab="tab-logs"]');
        if (logsDock) logsDock.click();
      });
    }

    if (dom.btnModalCopyMobileLink) {
      dom.btnModalCopyMobileLink.addEventListener('click', async () => {
        const shareUrl = window.fuelSheetsManager ? window.fuelSheetsManager.getShareableUrl() : window.location.href;
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('คัดลอกลิงก์แอปสำหรับเปิดบนโทรศัพท์มือถือเรียบร้อย! 📱', 'success');
        } catch (e) {
          prompt('คัดลอกลิงก์เปิดบนมือถือ:', shareUrl);
        }
      });
    }

    if (dom.btnModalCloseSuccess) {
      dom.btnModalCloseSuccess.addEventListener('click', () => {
        if (dom.saveSuccessMobileModal) dom.saveSuccessMobileModal.classList.remove('active');
        const logsDock = document.querySelector('.dock-item[data-tab="tab-logs"]');
        if (logsDock) logsDock.click();
      });
    }

    if (dom.saveSuccessMobileModal) {
      dom.saveSuccessMobileModal.addEventListener('click', (e) => {
        if (e.target === dom.saveSuccessMobileModal) {
          dom.saveSuccessMobileModal.classList.remove('active');
        }
      });
    }
  }

  function openEditPriceModal(stationId, fuelTypeId) {
    state.editingStationId = stationId;
    state.editingFuelTypeId = fuelTypeId;

    const station = window.fuelDataManager.stations[stationId];
    const fuel = window.fuelDataManager.fuelTypes[fuelKeyId(fuelTypeId)];
    const curPrice = window.fuelDataManager.getPrice(stationId, fuelTypeId);

    dom.editPriceItemName.value = `${station?.shortName || stationId} - ${fuel?.nameTh || fuelTypeId}`;
    dom.editPriceValue.value = curPrice ? curPrice.toFixed(2) : '';

    dom.editPriceModal.classList.add('active');
  }

  function fuelKeyId(id) {
    return id;
  }

  function closeEditPriceModal() {
    dom.editPriceModal.classList.remove('active');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatMoney(num) {
    if (isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // =========================================================================
  // 8. Google Sheets Synchronization Handlers
  // =========================================================================

  function setupGoogleSheetsSync() {
    updateSheetsUI();

    // Subscribe to sheets manager changes
    if (window.fuelSheetsManager) {
      window.fuelSheetsManager.subscribe(() => {
        updateSheetsUI();
      });
    }

    // Open Sheets Modal
    if (dom.btnOpenSheetsModal) {
      dom.btnOpenSheetsModal.addEventListener('click', () => {
        openSheetsModal();
      });
    }

    // Close Sheets Modal
    if (dom.btnCloseSheetsModal) {
      dom.btnCloseSheetsModal.addEventListener('click', () => {
        closeSheetsModal();
      });
    }
    if (dom.googleSheetsModal) {
      dom.googleSheetsModal.addEventListener('click', (e) => {
        if (e.target === dom.googleSheetsModal) closeSheetsModal();
      });
    }

    // Save Configuration Form
    if (dom.formSheetsConfig) {
      dom.formSheetsConfig.addEventListener('submit', (e) => {
        e.preventDefault();
        const webhookUrl = dom.sheetsWebhookUrl ? dom.sheetsWebhookUrl.value.trim() : '';
        const docUrl = dom.sheetsDocUrl ? dom.sheetsDocUrl.value.trim() : '';
        const autoSync = dom.sheetsAutoSyncCheck ? dom.sheetsAutoSyncCheck.checked : true;

        window.fuelSheetsManager.saveConfig({
          webhookUrl,
          sheetUrl: docUrl,
          autoSync
        });

        showToast('บันทึกการตั้งค่า Google Sheets เรียบร้อย', 'success');
        updateSheetsUI();
      });
    }

    // Test Connection Button
    if (dom.btnTestSheetsConnection) {
      dom.btnTestSheetsConnection.addEventListener('click', async () => {
        const webhookUrl = dom.sheetsWebhookUrl.value.trim();
        if (!webhookUrl) {
          showToast('กรุณาระบุ Webhook URL ก่อนกดทดสอบ', 'error');
          return;
        }

        const prevHtml = dom.btnTestSheetsConnection.innerHTML;
        dom.btnTestSheetsConnection.disabled = true;
        dom.btnTestSheetsConnection.innerHTML = '<span>⏳</span> กำลังทดสอบ...';

        try {
          const res = await window.fuelSheetsManager.testConnection(webhookUrl);
          if (res.success) {
            showToast(res.message || 'เชื่อมต่อกับ Google Sheets สำเร็จ!', 'success');
          } else {
            showToast('เชื่อมต่อไม่สำเร็จ: ' + res.error, 'error');
          }
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการทดสอบ: ' + err.message, 'error');
        } finally {
          dom.btnTestSheetsConnection.disabled = false;
          dom.btnTestSheetsConnection.innerHTML = prevHtml;
          updateSheetsUI();
        }
      });
    }

    // Sync All Logs Button (Inside Modal)
    if (dom.btnSyncAllToSheets) {
      dom.btnSyncAllToSheets.addEventListener('click', async () => {
        const logs = window.fuelStorageManager.logs;
        if (!logs.length) {
          showToast('ไม่มีข้อมูลประวัติสำหรับการซิงค์', 'warning');
          return;
        }

        if (!window.fuelSheetsManager.isConfigured()) {
          showToast('กรุณากำหนดและบันทึก Webhook URL ก่อนเริ่มซิงค์', 'error');
          return;
        }

        const prevHtml = dom.btnSyncAllToSheets.innerHTML;
        dom.btnSyncAllToSheets.disabled = true;
        dom.btnSyncAllToSheets.innerHTML = '<span>⏳</span> กำลังซิงค์...';

        try {
          const res = await window.fuelSheetsManager.syncAllLogs(logs, 'replace_all');
          if (res.success) {
            showToast(`ซิงค์ข้อมูลทั้งหมด ${res.count} รายการลง Google Sheets สำเร็จ! 📊`, 'success');
          } else {
            showToast('ซิงค์ไม่สำเร็จ: ' + (res.error || 'โปรดลองใหม่อีกครั้ง'), 'error');
          }
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการซิงค์: ' + err.message, 'error');
        } finally {
          dom.btnSyncAllToSheets.disabled = false;
          dom.btnSyncAllToSheets.innerHTML = prevHtml;
          updateSheetsUI();
        }
      });
    }

    // Pull From Google Sheets Button (Inside Modal)
    if (dom.btnPullFromSheets) {
      dom.btnPullFromSheets.addEventListener('click', async () => {
        if (!window.fuelSheetsManager.isConfigured()) {
          showToast('กรุณากำหนดและบันทึก Webhook URL ก่อนดึงข้อมูล', 'error');
          return;
        }

        const prevHtml = dom.btnPullFromSheets.innerHTML;
        dom.btnPullFromSheets.disabled = true;
        dom.btnPullFromSheets.innerHTML = '<span>⏳</span> กำลังดึงข้อมูล...';

        try {
          const res = await window.fuelSheetsManager.fetchFromSheets();
          if (res.success) {
            showToast(`ดึงข้อมูลจาก Sheets สำเร็จ (พบ ${res.totalFound} รายการ, เพิ่มใหม่ ${res.addedCount} รายการ)`, 'success');
          }
        } catch (err) {
          showToast('ดึงข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        } finally {
          dom.btnPullFromSheets.disabled = false;
          dom.btnPullFromSheets.innerHTML = prevHtml;
          updateSheetsUI();
        }
      });
    }

    // Quick Sync Button on Logs Toolbar
    if (dom.btnQuickSyncSheets) {
      dom.btnQuickSyncSheets.addEventListener('click', async () => {
        if (!window.fuelSheetsManager.isConfigured()) {
          showToast('ยังไม่ได้ตั้งค่า Google Sheets กรุณาตั้งค่าก่อนซิงค์', 'info');
          openSheetsModal();
          return;
        }

        const logs = window.fuelStorageManager.logs;
        if (!logs.length) {
          showToast('ไม่มีข้อมูลประวัติสำหรับการซิงค์', 'warning');
          return;
        }

        if (dom.quickSyncIcon) dom.quickSyncIcon.textContent = '⏳';
        dom.btnQuickSyncSheets.disabled = true;

        try {
          const res = await window.fuelSheetsManager.syncAllLogs(logs, 'replace_all');
          if (res.success) {
            showToast(`ซิงค์ข้อมูล ${res.count} รายการไปยัง Google Sheets เรียบร้อย! 📊`, 'success');
          } else {
            showToast('ซิงค์ขัดข้อง: ' + (res.error || 'ตรวจสอบ URL'), 'error');
          }
        } catch (err) {
          showToast('ซิงค์ขัดข้อง: ' + err.message, 'error');
        } finally {
          if (dom.quickSyncIcon) dom.quickSyncIcon.textContent = '⚡';
          dom.btnQuickSyncSheets.disabled = false;
          updateSheetsUI();
        }
      });
    }

    // Toggle Guide Accordion
    if (dom.btnToggleGuide && dom.guideContent) {
      dom.btnToggleGuide.addEventListener('click', () => {
        const isCollapsed = dom.guideContent.classList.toggle('collapsed');
        if (dom.guideToggleArrow) {
          dom.guideToggleArrow.textContent = isCollapsed ? '▶' : '▼';
        }
      });
    }

    // Copy Apps Script Code Button
    if (dom.btnCopyAppsScriptCode) {
      dom.btnCopyAppsScriptCode.addEventListener('click', async () => {
        const code = window.fuelSheetsManager.getAppsScriptTemplate();
        try {
          await navigator.clipboard.writeText(code);
          const origText = dom.btnCopyAppsScriptCode.innerHTML;
          dom.btnCopyAppsScriptCode.innerHTML = '<span>✅</span> คัดลอกโค้ดสำเร็จ! นำไปวางใน Google Sheets ได้เลย';
          dom.btnCopyAppsScriptCode.style.borderColor = '#10b981';
          dom.btnCopyAppsScriptCode.style.color = '#10b981';
          setTimeout(() => {
            dom.btnCopyAppsScriptCode.innerHTML = origText;
            dom.btnCopyAppsScriptCode.style.borderColor = '';
            dom.btnCopyAppsScriptCode.style.color = '';
          }, 3000);
        } catch (e) {
          // Fallback if clipboard API is restricted
          prompt('กด Ctrl+C / Cmd+C เพื่อคัดลอกโค้ด Google Apps Script:', code);
        }
      });
    }

    // Copy App Share URL Button (Share URL pre-filled with Google Sheet ID)
    if (dom.btnCopyAppShareUrl) {
      dom.btnCopyAppShareUrl.addEventListener('click', async () => {
        const shareUrl = window.fuelSheetsManager.getShareableUrl();
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('คัดลอกลิงก์แอปพร้อมตั้งค่าแล้ว! เปิดบนมือถือได้ทันที 📱', 'success');
        } catch (e) {
          prompt('คัดลอกลิงก์แอปสำหรับเปิดบนมือถือ:', shareUrl);
        }
      });
    }

    // Click on Calculator Sheets Notice badge
    if (dom.calcSheetsNotice) {
      dom.calcSheetsNotice.addEventListener('click', () => {
        openSheetsModal();
      });
    }

    // Click on Empty State Connect Sheets button
    if (dom.btnEmptyConnectSheets) {
      dom.btnEmptyConnectSheets.addEventListener('click', () => {
        openSheetsModal();
      });
    }

    // Click on Header Device Sync Status Pill
    if (dom.deviceSyncStatusPill) {
      dom.deviceSyncStatusPill.addEventListener('click', () => {
        openSheetsModal();
      });
    }

    // Clear Google Sheets Config Button
    if (dom.btnClearSheetsConfig) {
      dom.btnClearSheetsConfig.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างการตั้งค่าเชื่อมต่อ Google Sheets ที่บันทึกไว้?')) {
          if (window.fuelSheetsManager) {
            window.fuelSheetsManager.clearConfig();
          }
          if (dom.sheetsWebhookUrl) dom.sheetsWebhookUrl.value = '';
          if (dom.sheetsDocUrl) dom.sheetsDocUrl.value = '';
          updateSheetsUI();
          showToast('ล้างการตั้งค่าเชื่อมต่อเรียบร้อย', 'info');
        }
      });
    }
  }

  function updateSheetsUI() {
    if (!window.fuelSheetsManager) return;
    const config = window.fuelSheetsManager.config;
    const isConfigured = window.fuelSheetsManager.isConfigured();

    // Update Status Dot in Logs Toolbar
    if (dom.sheetsStatusDot) {
      dom.sheetsStatusDot.className = 'sheets-status-dot' + (isConfigured ? ' connected' : '');
    }

    // Update Calculator Sheet Notice Pill
    if (dom.calcSheetsDot) {
      dom.calcSheetsDot.className = 'sheets-status-dot' + (isConfigured ? ' connected' : '');
    }
    if (dom.calcSheetsStatusText) {
      dom.calcSheetsStatusText.textContent = isConfigured
        ? 'บันทึกตรงสู่ Google Sheets 🟢'
        : 'ยังไม่ได้เชื่อมต่อ Google Sheets ⚪ (คลิกเพื่อเชื่อมต่อ)';
    }

    // Update Header Sync Pill
    if (dom.deviceSyncStatusPill && dom.deviceSyncStatusText) {
      if (isConfigured) {
        dom.deviceSyncStatusPill.className = 'device-sync-pill connected';
        dom.deviceSyncStatusText.textContent = 'Google Sheets: เชื่อมต่อแล้ว 🟢';
      } else {
        dom.deviceSyncStatusPill.className = 'device-sync-pill';
        dom.deviceSyncStatusText.textContent = 'Google Sheets: ยังไม่เชื่อมต่อ ⚪';
      }
    }

    // Update Modal Inputs
    if (dom.sheetsWebhookUrl) {
      dom.sheetsWebhookUrl.value = config.webhookUrl || '';
    }
    if (dom.sheetsDocUrl) {
      dom.sheetsDocUrl.value = config.sheetUrl || '';
    }
    if (dom.sheetsAutoSyncCheck) {
      dom.sheetsAutoSyncCheck.checked = config.autoSync !== false;
    }
    if (dom.saveAutoSyncSheets) {
      dom.saveAutoSyncSheets.checked = config.autoSync !== false;
    }

    // Update Modal Banner
    if (dom.sheetsStatusBanner) {
      if (isConfigured) {
        dom.sheetsStatusBanner.classList.add('connected');
        if (dom.bannerStatusTitle) {
          dom.bannerStatusTitle.textContent = 'สถานะ: เชื่อมต่อกับ Google Sheets เรียบร้อย 🟢';
        }
        if (dom.bannerStatusSub) {
          const lastTime = config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString('th-TH') : 'ยังไม่มีการซิงค์';
          dom.bannerStatusSub.textContent = `ซิงค์ล่าสุด: ${lastTime} (รวมสะสม ${config.totalSyncedCount || 0} รายการ)`;
        }
      } else {
        dom.sheetsStatusBanner.classList.remove('connected');
        if (dom.bannerStatusTitle) {
          dom.bannerStatusTitle.textContent = 'สถานะ: ยังไม่ได้เชื่อมต่อ Google Sheets ⚪';
        }
        if (dom.bannerStatusSub) {
          dom.bannerStatusSub.textContent = 'ใส่ Webhook URL ด้านล่างเพื่อเริ่มการซิงค์ข้อมูลอัตโนมัติ';
        }
      }
    }

    // Update Open Link button
    if (dom.btnOpenGoogleSheetLink) {
      if (config.sheetUrl && config.sheetUrl.startsWith('http')) {
        dom.btnOpenGoogleSheetLink.href = config.sheetUrl;
        dom.btnOpenGoogleSheetLink.style.display = 'inline-flex';
      } else {
        dom.btnOpenGoogleSheetLink.style.display = 'none';
      }
    }
  }

  function openSheetsModal() {
    if (dom.googleSheetsModal) {
      updateSheetsUI();
      dom.googleSheetsModal.classList.add('active');
    }
  }

  function closeSheetsModal() {
    if (dom.googleSheetsModal) {
      dom.googleSheetsModal.classList.remove('active');
    }
  }

  // Start app
  init();
});
