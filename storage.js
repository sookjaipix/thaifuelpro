/**
 * Fuel Tracker Pro - Storage & Fuel Log Accumulator Engine
 * Handles records, separate metrics for total liters & total money,
 * filtering, analytics, CSV/JSON export/import.
 */

class FuelStorageManager {
  constructor() {
    this.storageKey = 'thai_fuel_logs_records_v1';
    this.deletedKey = 'thai_fuel_deleted_ids_v1';
    this.listeners = [];
    this.syncListeners = [];
    this.logs = this.loadLogs();
    this.deletedIds = this.loadDeletedIds();
    this.isSyncing = false;
    this.lastServerSync = null;
  }

  loadDeletedIds() {
    try {
      const data = localStorage.getItem(this.deletedKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  saveDeletedIds() {
    try {
      localStorage.setItem(this.deletedKey, JSON.stringify(this.deletedIds.slice(-500)));
    } catch (e) {}
  }

  subscribeSyncStatus(listener) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  notifySyncStatus(status, message) {
    this.syncListeners.forEach(cb => {
      try { cb(status, message); } catch (e) {}
    });
  }

  loadLogs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
      }
    } catch (e) {
      console.error('Failed to load logs from localStorage:', e);
    }
    return [];
  }

  saveLogs(skipServerPush = false) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      this.notify();
      if (!skipServerPush) {
        this.syncWithServer();
      }
    } catch (e) {
      console.error('Failed to save logs to localStorage:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.logs, this.getAccumulatedStats());
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
  }

  addLog(entry) {
    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: entry.date || new Date().toISOString(),
      stationId: entry.stationId || 'ptt',
      fuelTypeId: entry.fuelTypeId || 'gasohol_95',
      pricePerLiter: Number(parseFloat(entry.pricePerLiter).toFixed(2)),
      totalAmount: Number(parseFloat(entry.totalAmount).toFixed(2)),
      totalLiters: Number(parseFloat(entry.totalLiters).toFixed(3)),
      odometer: entry.odometer ? Number(entry.odometer) : null,
      vehicle: entry.vehicle ? entry.vehicle.trim() : '',
      isFullTank: Boolean(entry.isFullTank),
      notes: entry.notes ? entry.notes.trim() : '',
      createdAt: new Date().toISOString()
    };

    this.logs.unshift(newEntry);
    this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveLogs();
    return newEntry;
  }

  updateLog(id, updatedFields) {
    const index = this.logs.findIndex(l => l.id === id);
    if (index !== -1) {
      this.logs[index] = {
        ...this.logs[index],
        ...updatedFields,
        pricePerLiter: Number(parseFloat(updatedFields.pricePerLiter).toFixed(2)),
        totalAmount: Number(parseFloat(updatedFields.totalAmount).toFixed(2)),
        totalLiters: Number(parseFloat(updatedFields.totalLiters).toFixed(3)),
        odometer: updatedFields.odometer ? Number(updatedFields.odometer) : null,
        updatedAt: new Date().toISOString()
      };
      this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveLogs();
      return this.logs[index];
    }
    return null;
  }

  deleteLog(id) {
    const initialLen = this.logs.length;
    this.logs = this.logs.filter(l => l.id !== id);
    if (this.logs.length !== initialLen) {
      if (!this.deletedIds.includes(id)) {
        this.deletedIds.push(id);
        this.saveDeletedIds();
      }
      this.saveLogs();
      return true;
    }
    return false;
  }

  clearAllLogs() {
    this.logs.forEach(l => {
      if (l.id && !this.deletedIds.includes(l.id)) {
        this.deletedIds.push(l.id);
      }
    });
    this.saveDeletedIds();
    this.logs = [];
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      this.notify();
      this.syncWithServer({ clearAll: true });
    } catch (e) {}
  }

  /**
   * Calculates distinct accumulated metrics:
   * 1. Total Liters Accumulated (แยกชัดเจน)
   * 2. Total Money Spent (แยกชัดเจน)
   * 3. Averages, Fuel type breakdowns, Station breakdowns
   */
  getAccumulatedStats(filteredLogs = null) {
    const items = filteredLogs || this.logs;

    let totalSpent = 0;
    let totalLiters = 0;
    const byFuelType = {};
    const byStation = {};
    const monthlyData = {};

    items.forEach(log => {
      const amount = Number(log.totalAmount) || 0;
      const liters = Number(log.totalLiters) || 0;

      totalSpent += amount;
      totalLiters += liters;

      // Group by fuel type
      if (!byFuelType[log.fuelTypeId]) {
        byFuelType[log.fuelTypeId] = {
          fuelTypeId: log.fuelTypeId,
          totalAmount: 0,
          totalLiters: 0,
          count: 0
        };
      }
      byFuelType[log.fuelTypeId].totalAmount += amount;
      byFuelType[log.fuelTypeId].totalLiters += liters;
      byFuelType[log.fuelTypeId].count += 1;

      // Group by station
      if (!byStation[log.stationId]) {
        byStation[log.stationId] = {
          stationId: log.stationId,
          totalAmount: 0,
          totalLiters: 0,
          count: 0
        };
      }
      byStation[log.stationId].totalAmount += amount;
      byStation[log.stationId].totalLiters += liters;
      byStation[log.stationId].count += 1;

      // Group by Month (YYYY-MM)
      const d = new Date(log.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthKey,
          label: d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
          totalAmount: 0,
          totalLiters: 0,
          count: 0
        };
      }
      monthlyData[monthKey].totalAmount += amount;
      monthlyData[monthKey].totalLiters += liters;
      monthlyData[monthKey].count += 1;
    });

    const averagePricePerLiter = totalLiters > 0 ? (totalSpent / totalLiters) : 0;
    const averageSpentPerFill = items.length > 0 ? (totalSpent / items.length) : 0;
    const averageLitersPerFill = items.length > 0 ? (totalLiters / items.length) : 0;

    // Calculate Odometer distance and efficiency if logs have odometer
    const sortedByDateAsc = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalDistanceKm = 0;
    let minOdo = null;
    let maxOdo = null;

    sortedByDateAsc.forEach(l => {
      if (typeof l.odometer === 'number' && l.odometer > 0) {
        if (minOdo === null || l.odometer < minOdo) minOdo = l.odometer;
        if (maxOdo === null || l.odometer > maxOdo) maxOdo = l.odometer;
      }
    });

    if (minOdo !== null && maxOdo !== null && maxOdo > minOdo) {
      totalDistanceKm = maxOdo - minOdo;
    }

    const kmPerLiter = (totalDistanceKm > 0 && totalLiters > 0) ? (totalDistanceKm / totalLiters) : 0;
    const bahtPerKm = (totalDistanceKm > 0 && totalSpent > 0) ? (totalSpent / totalDistanceKm) : 0;

    return {
      totalCount: items.length,
      // 2 Distinct Primary Metrics
      totalSpent: Number(totalSpent.toFixed(2)),
      totalLiters: Number(totalLiters.toFixed(3)),
      // Secondary Indicators
      averagePricePerLiter: Number(averagePricePerLiter.toFixed(2)),
      averageSpentPerFill: Number(averageSpentPerFill.toFixed(2)),
      averageLitersPerFill: Number(averageLitersPerFill.toFixed(2)),
      totalDistanceKm: Math.round(totalDistanceKm),
      kmPerLiter: Number(kmPerLiter.toFixed(2)),
      bahtPerKm: Number(bahtPerKm.toFixed(2)),
      byFuelType,
      byStation,
      monthlyData
    };
  }

  /**
   * Generates detailed monthly report separating total fuel usage (Liters)
   * and total expenses (THB) for each month, with month-over-month comparison.
   */
  getMonthlyDetailedStats() {
    const monthlyMap = {};
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    this.logs.forEach(log => {
      const d = new Date(log.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!monthlyMap[monthKey]) {
        const thaiYear = year + 543;
        const monthName = `${thaiMonthNames[month - 1]} ${thaiYear}`;
        const shortName = `${thaiMonthNames[month - 1].slice(0, 3)}. ${String(thaiYear).slice(-2)}`;

        monthlyMap[monthKey] = {
          monthKey,
          year,
          month,
          monthName,
          shortName,
          totalAmount: 0,
          totalLiters: 0,
          count: 0,
          byFuelType: {},
          byStation: {},
          logs: []
        };
      }

      const m = monthlyMap[monthKey];
      const amount = Number(log.totalAmount) || 0;
      const liters = Number(log.totalLiters) || 0;

      m.totalAmount += amount;
      m.totalLiters += liters;
      m.count += 1;
      m.logs.push(log);

      // By Fuel Type
      if (!m.byFuelType[log.fuelTypeId]) {
        m.byFuelType[log.fuelTypeId] = {
          fuelTypeId: log.fuelTypeId,
          totalAmount: 0,
          totalLiters: 0,
          count: 0
        };
      }
      m.byFuelType[log.fuelTypeId].totalAmount += amount;
      m.byFuelType[log.fuelTypeId].totalLiters += liters;
      m.byFuelType[log.fuelTypeId].count += 1;

      // By Station
      if (!m.byStation[log.stationId]) {
        m.byStation[log.stationId] = {
          stationId: log.stationId,
          totalAmount: 0,
          totalLiters: 0,
          count: 0
        };
      }
      m.byStation[log.stationId].totalAmount += amount;
      m.byStation[log.stationId].totalLiters += liters;
      m.byStation[log.stationId].count += 1;
    });

    const sortedKeys = Object.keys(monthlyMap).sort().reverse();
    const result = sortedKeys.map((key, idx) => {
      const item = monthlyMap[key];
      item.totalAmount = Number(item.totalAmount.toFixed(2));
      item.totalLiters = Number(item.totalLiters.toFixed(3));
      item.avgPrice = item.totalLiters > 0 ? Number((item.totalAmount / item.totalLiters).toFixed(2)) : 0;
      item.avgPerFill = item.count > 0 ? Number((item.totalAmount / item.count).toFixed(2)) : 0;
      item.avgLitersPerFill = item.count > 0 ? Number((item.totalLiters / item.count).toFixed(3)) : 0;

      const prevKey = sortedKeys[idx + 1];
      if (prevKey && monthlyMap[prevKey]) {
        const prev = monthlyMap[prevKey];
        const amountDiff = item.totalAmount - prev.totalAmount;
        const amountDiffPct = prev.totalAmount > 0 ? (amountDiff / prev.totalAmount) * 100 : 0;
        const litersDiff = item.totalLiters - prev.totalLiters;
        const litersDiffPct = prev.totalLiters > 0 ? (litersDiff / prev.totalLiters) * 100 : 0;

        item.comparison = {
          hasPrev: true,
          prevMonthName: prev.monthName,
          amountDiff: Number(amountDiff.toFixed(2)),
          amountDiffPct: Number(amountDiffPct.toFixed(1)),
          litersDiff: Number(litersDiff.toFixed(3)),
          litersDiffPct: Number(litersDiffPct.toFixed(1))
        };
      } else {
        item.comparison = { hasPrev: false };
      }

      return item;
    });

    return result;
  }

  filterLogs({ period = 'all', station = 'all', fuelType = 'all', search = '' }) {
    const now = new Date();
    return this.logs.filter(log => {
      const logDate = new Date(log.date);

      // Period filter
      if (period === 'this_month') {
        if (logDate.getMonth() !== now.getMonth() || logDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (logDate.getMonth() !== lastMonth.getMonth() || logDate.getFullYear() !== lastMonth.getFullYear()) {
          return false;
        }
      } else if (period === 'this_year') {
        if (logDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // Station filter
      if (station !== 'all' && log.stationId !== station) {
        return false;
      }

      // Fuel Type filter
      if (fuelType !== 'all' && log.fuelTypeId !== fuelType) {
        return false;
      }

      // Text search
      if (search) {
        const q = search.toLowerCase();
        const text = `${log.vehicle || ''} ${log.notes || ''} ${log.stationId} ${log.fuelTypeId}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }

  exportToCSV(logsToExport = null) {
    const items = logsToExport || this.logs;
    if (!items.length) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'วันที่และเวลา',
      'ปั๊มน้ำมัน',
      'ชนิดน้ำมัน',
      'ราคาต่อลิตร (บาท)',
      'จำนวนเงินที่จ่าย (บาท)',
      'จำนวนลิตรที่ได้ (ลิตร)',
      'เลขไมล์ (กม.)',
      'ทะเบียน/รถ',
      'เต็มถัง',
      'หมายเหตุ'
    ];

    const rows = items.map(l => {
      const d = new Date(l.date).toLocaleString('th-TH');
      const st = STATIONS_METADATA[l.stationId]?.shortName || l.stationId;
      const ft = FUEL_TYPES_METADATA[l.fuelTypeId]?.nameTh || l.fuelTypeId;
      return [
        `"${d}"`,
        `"${st}"`,
        `"${ft}"`,
        l.pricePerLiter.toFixed(2),
        l.totalAmount.toFixed(2),
        l.totalLiters.toFixed(3),
        l.odometer || '',
        `"${l.vehicle || ''}"`,
        l.isFullTank ? 'ใช่' : 'ไม่ใช่',
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `บันทึกค่าน้ำมัน_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportToJSON() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_fuel_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importFromJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        // Validate and merge
        let addedCount = 0;
        parsed.forEach(item => {
          if (item.totalAmount && item.totalLiters) {
            const exists = this.logs.some(l => l.id === item.id);
            if (!exists) {
              this.logs.push(item);
              addedCount++;
            }
          }
        });
        this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.saveLogs();
        return { success: true, count: addedCount };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
    return { success: false, error: 'รูปแบบไฟล์ JSON ไม่ถูกต้อง' };
  }

  loadSampleData() {
    const sample = [
      {
        id: 'sample_1',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        stationId: 'ptt',
        fuelTypeId: 'gasohol_95',
        pricePerLiter: 38.25,
        totalAmount: 1200.00,
        totalLiters: 31.372,
        odometer: 54200,
        vehicle: 'กข-9999 กทม.',
        isFullTank: true,
        notes: 'เดินทางไปต่างจังหวัด ขับนิ่ม'
      },
      {
        id: 'sample_2',
        date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        stationId: 'bcp',
        fuelTypeId: 'gasohol_e20',
        pricePerLiter: 36.14,
        totalAmount: 800.00,
        totalLiters: 22.136,
        odometer: 53750,
        vehicle: 'กข-9999 กทม.',
        isFullTank: false,
        notes: 'เติมแวะทำธุระก่อนกลับบ้าน'
      },
      {
        id: 'sample_3',
        date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        stationId: 'shell',
        fuelTypeId: 'premium_gasohol_95',
        pricePerLiter: 50.44,
        totalAmount: 1500.00,
        totalLiters: 29.738,
        odometer: 53280,
        vehicle: 'กข-9999 กทม.',
        isFullTank: true,
        notes: 'ลองเติม V-Power อัตราเร่งดีเยี่ยม'
      },
      {
        id: 'sample_4',
        date: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
        stationId: 'pt',
        fuelTypeId: 'diesel_b7',
        pricePerLiter: 32.94,
        totalAmount: 1000.00,
        totalLiters: 30.358,
        odometer: 52800,
        vehicle: 'รถกระบะส่งของ',
        isFullTank: true,
        notes: 'เติมดีเซล B7 มาตรฐาน งานส่งของประจำสัปดาห์'
      },
      {
        id: 'sample_5',
        date: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
        stationId: 'caltex',
        fuelTypeId: 'gasohol_95',
        pricePerLiter: 38.25,
        totalAmount: 1000.00,
        totalLiters: 26.143,
        odometer: 52350,
        vehicle: 'กข-9999 กทม.',
        isFullTank: true,
        notes: 'เติม Caltex Techron'
      },
      {
        id: 'sample_6',
        date: new Date(Date.now() - 32 * 24 * 3600 * 1000).toISOString(),
        stationId: 'bcp',
        fuelTypeId: 'diesel_b20',
        pricePerLiter: 32.94,
        totalAmount: 1500.00,
        totalLiters: 45.537,
        odometer: 51800,
        vehicle: 'รถบรรทุก 6 ล้อ',
        isFullTank: true,
        notes: 'เติมดีเซล B20 สำหรับงานขนส่งระยะไกล ประหยัดต้นทุน'
      },
      {
        id: 'sample_7',
        date: new Date(Date.now() - 36 * 24 * 3600 * 1000).toISOString(),
        stationId: 'ptt',
        fuelTypeId: 'premium_diesel',
        pricePerLiter: 44.94,
        totalAmount: 1800.00,
        totalLiters: 40.053,
        odometer: 51200,
        vehicle: 'รถ SUV ครอบครัว',
        isFullTank: true,
        notes: 'เติมซุปเปอร์ดีเซล Super Power Diesel B7 อัตราเร่งดีเยี่ยม หัวฉีดสะอาด'
      }
    ];

    sample.forEach(s => {
      if (!this.logs.some(l => l.id === s.id)) {
        this.logs.push(s);
      }
    });

    this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveLogs();
    return sample.length;
  }

  /**
   * Synchronize local logs & settings with the host server (/api/sync-data)
   * so that desktop and mobile devices on the same network stay 100% in sync.
   */
  async syncWithServer(options = {}) {
    if (this.isSyncing) return null;
    this.isSyncing = true;
    this.notifySyncStatus('syncing', 'กำลังซิงค์ข้อมูล...');

    try {
      const sheetsConfig = window.fuelSheetsManager ? window.fuelSheetsManager.config : null;
      const payload = {
        logs: this.logs,
        deletedIds: this.deletedIds,
        clearAll: Boolean(options.clearAll)
      };
      if (sheetsConfig && sheetsConfig.webhookUrl) {
        payload.sheetsConfig = sheetsConfig;
      }

      const resp = await fetch('/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error('Sync HTTP ' + resp.status);
      const json = await resp.json();

      if (json.success && json.data) {
        const serverLogs = Array.isArray(json.data.logs) ? json.data.logs : [];
        const serverDeleted = Array.isArray(json.data.deletedIds) ? json.data.deletedIds : [];

        // Update deletedIds
        const deletedSet = new Set([...this.deletedIds, ...serverDeleted]);
        this.deletedIds = Array.from(deletedSet).slice(-500);
        this.saveDeletedIds();

        // Check if server logs differ from local logs
        const localStr = JSON.stringify(this.logs);
        const serverStr = JSON.stringify(serverLogs);
        if (localStr !== serverStr) {
          this.logs = serverLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
          localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
          this.notify();
        }

        // Apply synced Google Sheets config if local doesn't have one yet
        if (json.data.sheetsConfig && json.data.sheetsConfig.webhookUrl && window.fuelSheetsManager) {
          const localUrl = window.fuelSheetsManager.config.webhookUrl;
          if (!localUrl || localUrl !== json.data.sheetsConfig.webhookUrl) {
            window.fuelSheetsManager.saveConfig(json.data.sheetsConfig, true);
          }
        }

        this.lastServerSync = new Date();
        this.notifySyncStatus('synced', `ซิงค์ตรงกันแล้ว (${this.logs.length} รายการ)`);
        return json.data;
      }
    } catch (e) {
      this.notifySyncStatus('offline', 'โหมดออฟไลน์ (บันทึกในเครื่อง)');
    } finally {
      this.isSyncing = false;
    }
    return null;
  }

  startAutoSync(intervalMs = 6000) {
    this.syncWithServer();
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.syncWithServer();
      }
    }, intervalMs);

    window.addEventListener('focus', () => this.syncWithServer());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncWithServer();
      }
    });
  }

  mergeExternalLogs(externalEntries) {
    if (!Array.isArray(externalEntries) || !externalEntries.length) return 0;
    let added = 0;
    externalEntries.forEach(item => {
      if (item && item.id && !this.deletedIds.includes(item.id)) {
        const exists = this.logs.some(l => l.id === item.id);
        if (!exists && item.totalAmount > 0 && item.totalLiters > 0) {
          this.logs.push(item);
          added++;
        }
      }
    });
    if (added > 0) {
      this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveLogs();
    }
    return added;
  }
}

// Global instance
window.fuelStorageManager = new FuelStorageManager();
