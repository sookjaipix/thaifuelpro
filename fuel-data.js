/**
 * Thai Fuel Tracker Pro - Fuel Data & Real-time Sync Engine
 * Supports: PTT, Bangchak, Shell, PT, Caltex, Susco
 * Covers: Gasohol 95, 91, E20, E85, Diesel B7, Diesel, Premium Diesel, Premium Gasohol 95/97, Benzine 95, NGV
 */

const STATIONS_METADATA = {
  ptt: {
    id: 'ptt',
    name: 'PTT Station',
    nameTh: 'พีทีที สเตชั่น (ปตท.)',
    shortName: 'PTT',
    brandColor: '#0066b2',
    accentColor: '#00b0ff',
    badgeBg: 'rgba(0, 102, 178, 0.2)',
    badgeBorder: '#0066b2',
    icon: '⛽',
    logoText: 'PTT'
  },
  bcp: {
    id: 'bcp',
    name: 'Bangchak',
    nameTh: 'บางจาก (BCP)',
    shortName: 'บางจาก',
    brandColor: '#00a651',
    accentColor: '#34d399',
    badgeBg: 'rgba(0, 166, 81, 0.2)',
    badgeBorder: '#00a651',
    icon: '🍃',
    logoText: 'BCP'
  },
  shell: {
    id: 'shell',
    name: 'Shell',
    nameTh: 'เชลล์ (Shell)',
    shortName: 'เชลล์',
    brandColor: '#ffcc00',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(255, 204, 0, 0.15)',
    badgeBorder: '#d97706',
    icon: '🐚',
    logoText: 'SHELL'
  },
  pt: {
    id: 'pt',
    name: 'PT',
    nameTh: 'พีที (PT Station)',
    shortName: 'พีที',
    brandColor: '#00843d',
    accentColor: '#4ade80',
    badgeBg: 'rgba(0, 132, 61, 0.2)',
    badgeBorder: '#00843d',
    icon: '⚡',
    logoText: 'PT'
  },
  caltex: {
    id: 'caltex',
    name: 'Caltex',
    nameTh: 'คาลเท็กซ์ (Caltex)',
    shortName: 'คาลเท็กซ์',
    brandColor: '#00838f',
    accentColor: '#22d3ee',
    badgeBg: 'rgba(0, 131, 143, 0.2)',
    badgeBorder: '#00838f',
    icon: '⭐',
    logoText: 'CALTEX'
  },
  susco: {
    id: 'susco',
    name: 'Susco',
    nameTh: 'ซัสโก้ (Susco)',
    shortName: 'ซัสโก้',
    brandColor: '#f59e0b',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeBorder: '#f59e0b',
    icon: '🟡',
    logoText: 'SUSCO'
  }
};

const FUEL_TYPES_METADATA = {
  gasohol_95: {
    id: 'gasohol_95',
    nameTh: 'แก๊สโซฮอล์ 95',
    nameEn: 'Gasohol 95',
    category: 'gasohol',
    categoryTh: 'แก๊สโซฮอล์',
    color: '#10b981',
    bgBadge: 'rgba(16, 185, 129, 0.15)',
    borderBadge: '#10b981',
    octane: '95',
    description: 'น้ำมันเบนซินผสมเอทานอล 10% ค่าออกเทน 95 ยอดนิยมที่สุด'
  },
  gasohol_91: {
    id: 'gasohol_91',
    nameTh: 'แก๊สโซฮอล์ 91',
    nameEn: 'Gasohol 91',
    category: 'gasohol',
    categoryTh: 'แก๊สโซฮอล์',
    color: '#06b6d4',
    bgBadge: 'rgba(6, 182, 212, 0.15)',
    borderBadge: '#06b6d4',
    octane: '91',
    description: 'น้ำมันเบนซินผสมเอทานอล 10% ค่าออกเทน 91 ประหยัดคุ้มค่า'
  },
  gasohol_e20: {
    id: 'gasohol_e20',
    nameTh: 'แก๊สโซฮอล์ E20',
    nameEn: 'Gasohol E20',
    category: 'gasohol',
    categoryTh: 'แก๊สโซฮอล์',
    color: '#84cc16',
    bgBadge: 'rgba(132, 204, 22, 0.15)',
    borderBadge: '#84cc16',
    octane: '95+',
    description: 'น้ำมันเบนซินผสมเอทานอล 20% ช่วยลดมลพิษและประหยัด'
  },
  gasohol_e85: {
    id: 'gasohol_e85',
    nameTh: 'แก๊สโซฮอล์ E85',
    nameEn: 'Gasohol E85',
    category: 'gasohol',
    categoryTh: 'แก๊สโซฮอล์',
    color: '#3b82f6',
    bgBadge: 'rgba(59, 130, 246, 0.15)',
    borderBadge: '#3b82f6',
    octane: '105',
    description: 'น้ำมันเบนซินผสมเอทานอล 85% พลังงานสะอาดเพื่อสิ่งแวดล้อม'
  },
  benzine: {
    id: 'benzine',
    nameTh: 'เบนซิน 95 (เพียว)',
    nameEn: 'Benzine 95',
    category: 'benzine',
    categoryTh: 'เบนซิน',
    color: '#eab308',
    bgBadge: 'rgba(234, 179, 8, 0.15)',
    borderBadge: '#eab308',
    octane: '95',
    description: 'น้ำมันเบนซินบริสุทธิ์ไม่ผสมเอทานอล เหมาะกับเครื่องจักรและรถคลาสสิก'
  },
  premium_gasohol_95: {
    id: 'premium_gasohol_95',
    nameTh: 'พรีเมียม แก๊สโซฮอล์ 95 / 97',
    nameEn: 'Premium Gasohol 95/97',
    category: 'premium',
    categoryTh: 'เกรดพรีเมียม',
    color: '#a855f7',
    bgBadge: 'rgba(168, 85, 247, 0.2)',
    borderBadge: '#a855f7',
    octane: '97-100',
    description: 'เกรดพรีเมียมสารเพิ่มพลังปกป้องเครื่องยนต์ (Super Power 95, Hi-Premium 97, V-Power 95)'
  },
  diesel_b7: {
    id: 'diesel_b7',
    nameTh: 'ดีเซล B7',
    nameEn: 'Diesel B7',
    category: 'diesel',
    categoryTh: 'ดีเซล',
    color: '#f97316',
    bgBadge: 'rgba(249, 115, 22, 0.15)',
    borderBadge: '#f97316',
    octane: 'B7',
    description: 'น้ำมันดีเซลผสมไบโอดีเซล 7% มาตรฐานรถยนต์ดีเซลทุกรุ่นในไทย'
  },
  diesel_b20: {
    id: 'diesel_b20',
    nameTh: 'ดีเซล B20',
    nameEn: 'Diesel B20',
    category: 'diesel',
    categoryTh: 'ดีเซล',
    color: '#e11d48',
    bgBadge: 'rgba(225, 29, 72, 0.15)',
    borderBadge: '#e11d48',
    octane: 'B20',
    description: 'น้ำมันดีเซลผสมไบโอดีเซล 20% สำหรับรถบรรทุกและรถเชิงพาณิชย์ ลดมลพิษและต้นทุน'
  },
  premium_diesel: {
    id: 'premium_diesel',
    nameTh: 'ซุปเปอร์ดีเซล (พรีเมียม B7)',
    nameEn: 'Super Diesel / Premium B7',
    category: 'premium',
    categoryTh: 'เกรดพรีเมียม / ซุปเปอร์',
    color: '#ec4899',
    bgBadge: 'rgba(236, 72, 153, 0.2)',
    borderBadge: '#ec4899',
    octane: 'Super+',
    description: 'น้ำมันซุปเปอร์ดีเซลเกรดพรีเมียม (Super Power Diesel, V-Power Diesel, Hi-Premium Diesel S) ค่าซีเทนสูง เพิ่มแรงบิด ปกป้องหัวฉีด'
  },
  diesel: {
    id: 'diesel',
    nameTh: 'ดีเซลธรรมดา',
    nameEn: 'Standard Diesel',
    category: 'diesel',
    categoryTh: 'ดีเซล',
    color: '#f59e0b',
    bgBadge: 'rgba(245, 158, 11, 0.15)',
    borderBadge: '#f59e0b',
    octane: 'ดีเซล',
    description: 'น้ำมันดีเซลมาตรฐานใช้งานทั่วไป คุ้มค่าประหยัด'
  },
  ngv: {
    id: 'ngv',
    nameTh: 'ก๊าซธรรมชาติ NGV',
    nameEn: 'NGV / CNG',
    category: 'gas',
    categoryTh: 'ก๊าซธรรมชาติ',
    color: '#14b8a6',
    bgBadge: 'rgba(20, 184, 166, 0.15)',
    borderBadge: '#14b8a6',
    octane: 'NGV',
    description: 'ก๊าซธรรมชาติอัดสำหรับยานพาหนะ ประหยัดต้นทุนพลังงาน'
  }
};

// Baseline fallback prices (Thai Baht per Liter)
const BASELINE_PRICES = {
  ptt: {
    gasohol_95: 38.25,
    gasohol_91: 37.08,
    gasohol_e20: 36.14,
    gasohol_e85: 35.89,
    benzine: 46.54,
    premium_gasohol_95: 49.44,
    diesel_b7: 32.94,
    diesel_b20: 32.94,
    diesel: 32.94,
    premium_diesel: 44.94,
    ngv: 17.59
  },
  bcp: {
    gasohol_95: 38.25,
    gasohol_91: 37.08,
    gasohol_e20: 36.14,
    gasohol_e85: 35.89,
    benzine: null,
    premium_gasohol_95: 49.84, // Hi-Premium 97
    diesel_b7: 32.94,
    diesel_b20: 32.94,
    diesel: 32.94,
    premium_diesel: 44.94,
    ngv: null
  },
  shell: {
    gasohol_95: 38.85,
    gasohol_91: 37.48,
    gasohol_e20: 36.54,
    gasohol_e85: null,
    benzine: null,
    premium_gasohol_95: 50.44, // V-Power 95
    diesel_b7: 33.44,
    diesel_b20: null,
    diesel: 33.44,
    premium_diesel: 49.94, // V-Power Diesel
    ngv: null
  },
  pt: {
    gasohol_95: 38.25,
    gasohol_91: 37.08,
    gasohol_e20: 36.14,
    gasohol_e85: null,
    benzine: 46.54,
    premium_gasohol_95: 49.44,
    diesel_b7: 32.94,
    diesel_b20: 32.94,
    diesel: 32.94,
    premium_diesel: 44.94,
    ngv: null
  },
  caltex: {
    gasohol_95: 38.25,
    gasohol_91: 37.08,
    gasohol_e20: 36.14,
    gasohol_e85: null,
    benzine: 46.54,
    premium_gasohol_95: 49.74,
    diesel_b7: 32.94,
    diesel_b20: 32.94,
    diesel: 32.94,
    premium_diesel: 44.94,
    ngv: null
  },
  susco: {
    gasohol_95: 38.25,
    gasohol_91: 37.08,
    gasohol_e20: 36.14,
    gasohol_e85: null,
    benzine: 46.54,
    premium_gasohol_95: null,
    diesel_b7: 32.94,
    diesel_b20: 32.94,
    diesel: 32.94,
    premium_diesel: null,
    ngv: 17.59
  }
};

class FuelDataManager {
  constructor() {
    this.stations = STATIONS_METADATA;
    this.fuelTypes = FUEL_TYPES_METADATA;
    this.prices = JSON.parse(JSON.stringify(BASELINE_PRICES));
    this.lastUpdated = null;
    this.source = 'baseline'; // 'realtime' | 'cache' | 'baseline'
    this.priceChanges = {}; // difference compared to yesterday: e.g. +0.50, -0.30
    this.listeners = [];
    this.init();
  }

  init() {
    // 1. Try reading cached prices from localStorage
    try {
      const cached = localStorage.getItem('thai_fuel_prices_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.prices) {
          this.prices = parsed.prices;
          this.lastUpdated = new Date(parsed.lastUpdated || Date.now());
          this.source = 'cache';
          this.priceChanges = parsed.priceChanges || {};
        }
      }
    } catch (e) {
      console.warn('Could not read cached prices:', e);
    }

    if (!this.lastUpdated) {
      this.lastUpdated = new Date();
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
        listener(this.getState());
      } catch (e) {
        console.error('Error in fuel data listener:', e);
      }
    });
  }

  getState() {
    return {
      stations: this.stations,
      fuelTypes: this.fuelTypes,
      prices: this.prices,
      lastUpdated: this.lastUpdated,
      source: this.source,
      priceChanges: this.priceChanges
    };
  }

  getPrice(stationId, fuelTypeId) {
    if (this.prices[stationId] && typeof this.prices[stationId][fuelTypeId] === 'number') {
      return this.prices[stationId][fuelTypeId];
    }
    // If specific station doesn't have it, look up PTT standard as fallback
    if (this.prices.ptt && typeof this.prices.ptt[fuelTypeId] === 'number') {
      return this.prices.ptt[fuelTypeId];
    }
    return null;
  }

  async fetchRealtimePrices() {
    console.log('Fetching real-time fuel prices...');
    let success = false;
    let fetchedData = null;

    // API Primary: chnwt thai-oil-api
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://api.chnwt.dev/thai-oil-api/latest', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && (json.response || json.stations)) {
          fetchedData = this.parseChnwtResponse(json);
          success = true;
          this.source = 'realtime';
        }
      }
    } catch (e) {
      console.warn('Primary fuel API failed or aborted:', e.message);
    }

    // Secondary fallback: kapook gasprice if primary fails
    if (!success) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://gasprice.kapook.com/gasprice.json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json) {
            fetchedData = this.parseKapookResponse(json);
            success = true;
            this.source = 'realtime';
          }
        }
      } catch (e) {
        console.warn('Secondary fuel API failed:', e.message);
      }
    }

    if (success && fetchedData) {
      this.mergePrices(fetchedData);
      this.lastUpdated = new Date();
      this.saveCache();
    } else {
      console.log('Using baseline / cached data with today timestamp.');
      this.lastUpdated = new Date();
    }

    this.notify();
    return {
      success,
      source: this.source,
      lastUpdated: this.lastUpdated
    };
  }

  parseChnwtResponse(json) {
    const root = json.response || json;
    const stationsData = root.stations || root;
    const result = {};

    const keyMap = {
      gasohol_95: ['gasohol_95', 'gasohol95', 'g95'],
      gasohol_91: ['gasohol_91', 'gasohol91', 'g91'],
      gasohol_e20: ['gasohol_e20', 'gasohole20', 'e20'],
      gasohol_e85: ['gasohol_e85', 'gasohole85', 'e85'],
      benzine: ['benzine', 'benzine95', 'benzin', 'gasoline95'],
      premium_gasohol_95: ['premium_gasohol_95', 'supercar_97', 'superpower_gasohol_95', 'vpower_gasohol_95'],
      diesel_b7: ['diesel_b7', 'dieselb7'],
      diesel_b20: ['diesel_b20', 'dieselb20', 'b20'],
      premium_diesel: ['premium_diesel', 'superpower_diesel_b7', 'super_diesel', 'vpower_diesel', 'hi_premium_diesel'],
      diesel: ['diesel', 'diesel_b10'],
      ngv: ['ngv', 'cng']
    };

    Object.keys(STATIONS_METADATA).forEach(stationKey => {
      const stationObj = stationsData[stationKey] || stationsData[stationKey.toUpperCase()];
      if (stationObj) {
        result[stationKey] = {};
        Object.keys(keyMap).forEach(fuelKey => {
          const possibleKeys = keyMap[fuelKey];
          for (const k of possibleKeys) {
            if (stationObj[k]) {
              const raw = stationObj[k].price || stationObj[k];
              const parsed = parseFloat(raw);
              if (!isNaN(parsed) && parsed > 0) {
                result[stationKey][fuelKey] = parsed;
                break;
              }
            }
          }
        });
      }
    });

    return result;
  }

  parseKapookResponse(json) {
    // Kapook parser
    const result = {};
    try {
      const stationMap = {
        ptt: 'PTT',
        bcp: 'BCP',
        shell: 'SHELL',
        pt: 'PT',
        caltex: 'CALTEX',
        susco: 'SUSCO'
      };

      Object.entries(stationMap).forEach(([id, kapookKey]) => {
        const item = json[kapookKey] || json[kapookKey.toLowerCase()];
        if (item && item.fuel) {
          result[id] = {};
          item.fuel.forEach(f => {
            const name = (f.name || '').toLowerCase();
            const price = parseFloat(f.price);
            if (!isNaN(price) && price > 0) {
              if (name.includes('95') && name.includes('พรีเมียม')) result[id].premium_gasohol_95 = price;
              else if (name.includes('95') && (name.includes('แก๊สโซฮอล์') || name.includes('gasohol'))) result[id].gasohol_95 = price;
              else if (name.includes('91')) result[id].gasohol_91 = price;
              else if (name.includes('e20')) result[id].gasohol_e20 = price;
              else if (name.includes('e85')) result[id].gasohol_e85 = price;
              else if (name.includes('เบนซิน') || name.includes('benzine')) result[id].benzine = price;
              else if (name.includes('ดีเซล') && (name.includes('พรีเมียม') || name.includes('ซูเปอร์') || name.includes('super') || name.includes('v-power'))) result[id].premium_diesel = price;
              else if (name.includes('b20')) result[id].diesel_b20 = price;
              else if (name.includes('b7')) result[id].diesel_b7 = price;
              else if (name.includes('ดีเซล')) result[id].diesel = price;
              else if (name.includes('ngv')) result[id].ngv = price;
            }
          });
        }
      });
    } catch (e) {
      console.warn('Kapook parse error:', e);
    }
    return result;
  }

  mergePrices(incoming) {
    Object.keys(incoming).forEach(stationKey => {
      if (!this.prices[stationKey]) this.prices[stationKey] = {};
      Object.keys(incoming[stationKey]).forEach(fuelKey => {
        const val = incoming[stationKey][fuelKey];
        if (typeof val === 'number' && val > 0) {
          this.prices[stationKey][fuelKey] = val;
        }
      });
    });
  }

  saveCache() {
    try {
      localStorage.setItem('thai_fuel_prices_cache', JSON.stringify({
        prices: this.prices,
        lastUpdated: this.lastUpdated.toISOString(),
        source: this.source,
        priceChanges: this.priceChanges
      }));
    } catch (e) {
      console.warn('Failed to save price cache:', e);
    }
  }

  updateCustomPrice(stationId, fuelTypeId, newPrice) {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed > 0) {
      if (!this.prices[stationId]) this.prices[stationId] = {};
      this.prices[stationId][fuelTypeId] = parsed;
      this.saveCache();
      this.notify();
      return true;
    }
    return false;
  }

  resetToDefault() {
    this.prices = JSON.parse(JSON.stringify(BASELINE_PRICES));
    this.lastUpdated = new Date();
    this.source = 'baseline';
    this.saveCache();
    this.notify();
  }
}

// Global instance
window.fuelDataManager = new FuelDataManager();
