/**
 * Fuel Tracker Pro - Storage & Fuel Log Accumulator Engine
 * Handles records, separate metrics for total liters & total money,
 * filtering, analytics, CSV/JSON export/import.
 */

class FuelStorageManager {
  constructor() {
    // Strictly remove any legacy browser storage (Google Sheets-only mode)
    try {
      localStorage.removeItem('thai_fuel_logs_records_v1');
      localStorage.removeItem('thai_fuel_deleted_ids_v1');
    } catch (e) {}

    this.listeners = [];
    this.syncListeners = [];
    this.logs = [];
    this.isSyncing = false;
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

  setLogsFromSheets(entries) {
    this.logs = Array.isArray(entries)
      ? entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];
    this.notify();
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

  async addLog(entry) {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      throw new Error('กรุณาเชื่อมต่อ Google Sheets ก่อนบันทึกข้อมูล');
    }

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

    this.notifySyncStatus('syncing', 'กำลังบันทึกลง Google Sheets...');
    await window.fuelSheetsManager.syncSingleLog(newEntry);

    this.logs.unshift(newEntry);
    this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.notify();
    this.notifySyncStatus('synced', `จัดเก็บบน Google Sheets (${this.logs.length} รายการ)`);
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
      this.notify();
      if (window.fuelSheetsManager && window.fuelSheetsManager.isConfigured()) {
        window.fuelSheetsManager.syncAllLogs(this.logs, 'replace_all').catch(() => {});
      }
      return this.logs[index];
    }
    return null;
  }

  async deleteLog(id) {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      throw new Error('กรุณาเชื่อมต่อ Google Sheets ก่อนลบข้อมูล');
    }
    this.notifySyncStatus('syncing', 'กำลังลบจาก Google Sheets...');
    await window.fuelSheetsManager.deleteLogOnSheets(id);

    const initialLen = this.logs.length;
    this.logs = this.logs.filter(l => l.id !== id);
    if (this.logs.length !== initialLen) {
      this.notify();
    }
    this.notifySyncStatus('synced', `จัดเก็บบน Google Sheets (${this.logs.length} รายการ)`);
    return true;
  }

  async clearAllLogs() {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      throw new Error('กรุณาเชื่อมต่อ Google Sheets ก่อนล้างข้อมูล');
    }
    this.notifySyncStatus('syncing', 'กำลังล้างข้อมูลบน Google Sheets...');
    await window.fuelSheetsManager.clearAllOnSheets();
    this.logs = [];
    this.notify();
    this.notifySyncStatus('synced', 'จัดเก็บบน Google Sheets (0 รายการ)');
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

  async importFromJSON(jsonText) {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      return { success: false, error: 'กรุณาเชื่อมต่อ Google Sheets ก่อนนำเข้าข้อมูล' };
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        const toAdd = [];
        parsed.forEach(item => {
          if (item.totalAmount && item.totalLiters) {
            const exists = this.logs.some(l => l.id === item.id);
            if (!exists) {
              toAdd.push(item);
              this.logs.push(item);
            }
          }
        });
        if (toAdd.length > 0) {
          this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
          await window.fuelSheetsManager.syncAllLogs(this.logs, 'replace_all');
          this.notify();
        }
        return { success: true, count: toAdd.length };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
    return { success: false, error: 'รูปแบบไฟล์ JSON ไม่ถูกต้อง' };
  }

  async loadSampleData() {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      throw new Error('กรุณาเชื่อมต่อ Google Sheets ก่อนเพิ่มข้อมูลตัวอย่าง');
    }
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

    const added = [];
    sample.forEach(s => {
      if (!this.logs.some(l => l.id === s.id)) {
        this.logs.push(s);
        added.push(s);
      }
    });

    this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (added.length > 0) {
      await window.fuelSheetsManager.syncAllLogs(this.logs, 'replace_all');
    }
    this.notify();
    return added.length;
  }

  /**
   * Load fueling logs exclusively from Google Sheets
   */
  async loadFromGoogleSheets() {
    if (!window.fuelSheetsManager || !window.fuelSheetsManager.isConfigured()) {
      this.notifySyncStatus('offline', 'ยังไม่ได้เชื่อมต่อ Google Sheets');
      return null;
    }
    if (this.isSyncing) return null;
    this.isSyncing = true;
    this.notifySyncStatus('syncing', 'กำลังดึงข้อมูลจาก Google Sheets...');

    try {
      const res = await window.fuelSheetsManager.fetchFromSheets();
      this.notifySyncStatus('synced', `จัดเก็บบน Google Sheets (${this.logs.length} รายการ)`);
      return res;
    } catch (e) {
      this.notifySyncStatus('offline', 'ซิงค์ Google Sheets ขัดข้อง');
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(intervalMs = 15000) {
    this.loadFromGoogleSheets();
    setInterval(() => {
      if (document.visibilityState === 'visible' && window.fuelSheetsManager?.isConfigured()) {
        this.loadFromGoogleSheets();
      }
    }, intervalMs);

    window.addEventListener('focus', () => {
      if (window.fuelSheetsManager?.isConfigured()) {
        this.loadFromGoogleSheets();
      }
    });
  }
}

// Global instance
window.fuelStorageManager = new FuelStorageManager();
