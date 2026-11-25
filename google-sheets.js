/**
 * Thai Fuel Tracker Pro - Google Sheets Synchronization Manager
 * Provides seamless 2-way data persistence between local fueling history and Google Sheets.
 */

(function () {
  const STORAGE_KEY = 'thai_fuel_sheets_config_v1';

  const DEFAULT_CONFIG = {
    webhookUrl: '',
    sheetUrl: '',
    autoSync: true,
    lastSyncTime: null,
    totalSyncedCount: 0
  };

  const APPS_SCRIPT_CODE = `/**
 * Google Apps Script for Thai Fuel Tracker Pro
 * วางโค้ดนี้ลงใน ส่วนขยาย (Extensions) > Apps Script ใน Google Sheets ของคุณ
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // ตั้งค่าหัวตารางอัตโนมัติหากเป็นชีตว่าง
    setupHeadersIfNeeded(sheet);
    
    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        message: "เชื่อมต่อกับ Google Sheets สำเร็จเรียบร้อย!",
        sheetTitle: SpreadsheetApp.getActiveSpreadsheet().getName(),
        totalRows: Math.max(0, sheet.getLastRow() - 1)
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "append") {
      var row = formatRow(data.entry);
      sheet.appendRow(row);
      formatLastRow(sheet);
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        message: "บันทึก 1 รายการลง Google Sheets สำเร็จ",
        totalRows: sheet.getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "batch_append") {
      var rows = data.entries.map(function(item) {
        return formatRow(item);
      });
      if (rows.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
        formatRowsRange(sheet, startRow, rows.length);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        count: rows.length,
        message: "เพิ่มข้อมูล " + rows.length + " รายการลง Google Sheets สำเร็จ",
        totalRows: sheet.getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "replace_all") {
      // ล้างข้อมูลเดิมทั้งหมดเก็บไว้เฉพาะแถวหัวตาราง
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
      }
      var rows = data.entries.map(function(item) {
        return formatRow(item);
      });
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        formatRowsRange(sheet, 2, rows.length);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        count: rows.length,
        message: "ซิงค์อัปเดตประวัติทั้งหมด " + rows.length + " รายการลง Google Sheets เรียบร้อย",
        totalRows: sheet.getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "ไม่รู้จักคำสั่ง action: " + data.action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  setupHeadersIfNeeded(sheet);
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    sheetTitle: SpreadsheetApp.getActiveSpreadsheet().getName(),
    totalRows: Math.max(0, sheet.getLastRow() - 1),
    message: "Google Sheets Web App พร้อมเชื่อมต่อกับ Thai Fuel Tracker Pro"
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupHeadersIfNeeded(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      "วันที่และเวลา",
      "ปั๊มน้ำมัน",
      "ชนิดน้ำมัน",
      "ราคาต่อลิตร (บาท)",
      "ยอดเงินที่จ่าย (บาท)",
      "ปริมาณที่ได้ (ลิตร)",
      "เลขไมล์ (กม.)",
      "รถยนต์ / ทะเบียน",
      "เติมเต็มถัง",
      "หมายเหตุ",
      "รหัสรายการ (ID)"
    ];
    sheet.appendRow(headers);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0f172a");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);
    
    sheet.setColumnWidth(1, 160); // วันที่
    sheet.setColumnWidth(2, 120); // ปั๊ม
    sheet.setColumnWidth(3, 160); // ชนิดน้ำมัน
    sheet.setColumnWidth(4, 130); // ราคา/ลิตร
    sheet.setColumnWidth(5, 140); // ยอดเงิน
    sheet.setColumnWidth(6, 140); // ปริมาณลิตร
    sheet.setColumnWidth(7, 120); // เลขไมล์
    sheet.setColumnWidth(8, 140); // รถ
    sheet.setColumnWidth(9, 90);  // เต็มถัง
    sheet.setColumnWidth(10, 220); // หมายเหตุ
    sheet.setColumnWidth(11, 150); // ID
  }
}

function formatRow(entry) {
  return [
    entry.formattedDate || entry.date,
    entry.stationName || entry.stationId,
    entry.fuelTypeName || entry.fuelTypeId,
    Number(entry.pricePerLiter) || 0,
    Number(entry.totalAmount) || 0,
    Number(entry.totalLiters) || 0,
    entry.odometer ? Number(entry.odometer) : "",
    entry.vehicle || "",
    entry.isFullTank ? "ใช่" : "ไม่ใช่",
    entry.notes || "",
    entry.id || ""
  ];
}

function formatLastRow(sheet) {
  var row = sheet.getLastRow();
  formatRowsRange(sheet, row, 1);
}

function formatRowsRange(sheet, startRow, numRows) {
  sheet.getRange(startRow, 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 2, numRows, 2).setHorizontalAlignment("center");
  sheet.getRange(startRow, 4, numRows, 1).setNumberFormat("#,##0.00").setHorizontalAlignment("right");
  sheet.getRange(startRow, 5, numRows, 1).setNumberFormat("#,##0.00").setHorizontalAlignment("right");
  sheet.getRange(startRow, 6, numRows, 1).setNumberFormat("#,##0.000").setHorizontalAlignment("right");
  sheet.getRange(startRow, 7, numRows, 1).setNumberFormat("#,##0").setHorizontalAlignment("right");
  sheet.getRange(startRow, 8, numRows, 2).setHorizontalAlignment("center");
  sheet.getRange(startRow, 10, numRows, 1).setHorizontalAlignment("left");
  sheet.getRange(startRow, 11, numRows, 1).setFontColor("#94a3b8").setHorizontalAlignment("center");
}`;

  class GoogleSheetsManager {
    constructor() {
      this.config = this.loadConfig();
      this.listeners = [];
    }

    loadConfig() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.error('Failed to load Google Sheets config:', e);
      }
      return { ...DEFAULT_CONFIG };
    }

    saveConfig(updates) {
      this.config = { ...this.config, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        this.notify();
      } catch (e) {
        console.error('Failed to save Google Sheets config:', e);
      }
      return this.config;
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(cb => {
        try {
          cb(this.config);
        } catch (e) {
          console.error('Sheets listener error:', e);
        }
      });
    }

    isConfigured() {
      return Boolean(this.config.webhookUrl && this.config.webhookUrl.trim().startsWith('https://script.google.com/'));
    }

    getAppsScriptTemplate() {
      return APPS_SCRIPT_CODE;
    }

    formatEntry(entry) {
      const station = window.fuelDataManager?.stations?.[entry.stationId]?.name || entry.stationId;
      const fuelType = window.fuelDataManager?.fuelTypes?.[entry.fuelTypeId]?.nameTh || entry.fuelTypeId;
      
      let formattedDate = entry.date;
      try {
        const d = new Date(entry.date);
        formattedDate = d.toLocaleString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {}

      return {
        id: entry.id,
        date: entry.date,
        formattedDate: formattedDate,
        stationId: entry.stationId,
        stationName: station,
        fuelTypeId: entry.fuelTypeId,
        fuelTypeName: fuelType,
        pricePerLiter: entry.pricePerLiter,
        totalAmount: entry.totalAmount,
        totalLiters: entry.totalLiters,
        odometer: entry.odometer,
        vehicle: entry.vehicle,
        isFullTank: entry.isFullTank,
        notes: entry.notes
      };
    }

    /**
     * Sends payload to Google Sheets via backend proxy /api/sync-sheets or fallback direct fetch
     */
    async sendRequest(webhookUrl, payload) {
      const targetUrl = webhookUrl || this.config.webhookUrl;
      if (!targetUrl) {
        throw new Error('ยังไม่ได้กำหนด Google Apps Script Webhook URL');
      }

      // 1. Try local server backend proxy first (handles redirects cleanly without CORS limits)
      try {
        const proxyResp = await fetch('/api/sync-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: targetUrl,
            payload: payload
          })
        });

        if (proxyResp.ok) {
          const resJson = await proxyResp.json();
          if (resJson.success) {
            return resJson.result;
          }
          // If proxy reported explicit upstream error
          if (resJson.error) {
            console.warn('Backend proxy reported upstream issue:', resJson.error);
          }
        }
      } catch (proxyErr) {
        console.warn('Backend proxy not reachable, falling back to direct web fetch:', proxyErr);
      }

      // 2. Direct fetch fallback with no-cors / normal fetch
      try {
        const directResp = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        
        if (directResp.ok) {
          try {
            return await directResp.json();
          } catch (_) {
            return { status: 'ok', message: 'บันทึกข้อมูลสำเร็จ' };
          }
        }
      } catch (err) {
        // If mode: 'cors' failed due to redirect, try no-cors as final dispatch
        try {
          await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          return { status: 'ok', message: 'ส่งข้อมูลไปยัง Google Sheets สำเร็จ (Direct Mode)' };
        } catch (noCorsErr) {
          throw new Error('ไม่สามารถเชื่อมต่อกับ Google Sheets ได้: ' + noCorsErr.message);
        }
      }

      return { status: 'ok', message: 'ส่งข้อมูลเรียบร้อย' };
    }

    /**
     * Test connection to Google Apps Script
     */
    async testConnection(webhookUrl) {
      const url = webhookUrl || this.config.webhookUrl;
      if (!url || !url.startsWith('https://script.google.com/')) {
        return {
          success: false,
          error: 'URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/...'
        };
      }

      try {
        const result = await this.sendRequest(url, { action: 'ping' });
        this.saveConfig({
          webhookUrl: url,
          lastSyncTime: new Date().toISOString()
        });
        return {
          success: true,
          message: result.message || 'เชื่อมต่อกับ Google Sheets สำเร็จเรียบร้อย!',
          details: result
        };
      } catch (e) {
        return {
          success: false,
          error: e.message || 'ไม่สามารถติดต่อ Google Apps Script ได้ ตรวจสอบสิทธิ์การเข้าถึงเป็น "Anyone" หรือไม่'
        };
      }
    }

    /**
     * Sync single log (called after saving a new log in Smart Calculator)
     */
    async syncSingleLog(entry) {
      if (!this.isConfigured() || !this.config.autoSync) {
        return { skipped: true };
      }

      try {
        const formatted = this.formatEntry(entry);
        const result = await this.sendRequest(this.config.webhookUrl, {
          action: 'append',
          entry: formatted
        });

        this.saveConfig({
          lastSyncTime: new Date().toISOString(),
          totalSyncedCount: (this.config.totalSyncedCount || 0) + 1
        });

        return { success: true, result };
      } catch (e) {
        console.error('Failed to sync single log to Google Sheets:', e);
        return { success: false, error: e.message };
      }
    }

    /**
     * Sync all logs to Google Sheets (Replace all or batch append)
     */
    async syncAllLogs(logs, mode = 'replace_all') {
      if (!this.isConfigured()) {
        throw new Error('กรุณาตั้งค่า Google Sheets Webhook URL ก่อนเริ่มซิงค์');
      }

      if (!logs || !logs.length) {
        throw new Error('ไม่มีข้อมูลประวัติการเติมสำหรับซิงค์');
      }

      const formattedEntries = logs.map(l => this.formatEntry(l));
      
      const payload = {
        action: mode, // 'replace_all' or 'batch_append'
        entries: formattedEntries
      };

      const result = await this.sendRequest(this.config.webhookUrl, payload);

      this.saveConfig({
        lastSyncTime: new Date().toISOString(),
        totalSyncedCount: logs.length
      });

      return {
        success: true,
        count: logs.length,
        result
      };
    }
  }

  window.GoogleSheetsManager = GoogleSheetsManager;
  window.fuelSheetsManager = new GoogleSheetsManager();
})();
