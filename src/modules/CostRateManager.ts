/**
 * Custom Cost Rate Table & Multi-Currency Management Module
 * Supports real volume (m³), area (m²), linear length (m), and count (ea) multipliers.
 */

export type QuantityUnit = 'm³' | 'm²' | 'm' | 'ea';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  conversionRate: number; // relative to USD (1.0)
}

export interface CategoryRate {
  category: string;
  displayName: string;
  unit: QuantityUnit;
  unitRate: number; // in active currency
  trade: 'Concrete' | 'Steel' | 'MEP' | 'Finishes' | 'General';
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', conversionRate: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', conversionRate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', conversionRate: 0.79 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', conversionRate: 83.2 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', conversionRate: 3.67 },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal (SAR)', conversionRate: 3.75 },
};

export const DEFAULT_CATEGORY_RATES: Record<string, CategoryRate> = {
  IFCSITE: { category: 'IFCSITE', displayName: 'Site Earthworks & Grading', unit: 'm³', unitRate: 85, trade: 'General' },
  IFCFOOTING: { category: 'IFCFOOTING', displayName: 'Foundations & Footings', unit: 'm³', unitRate: 480, trade: 'Concrete' },
  IFCPILE: { category: 'IFCPILE', displayName: 'Bored & Driven Piles', unit: 'm', unitRate: 320, trade: 'Concrete' },
  IFCCOLUMN: { category: 'IFCCOLUMN', displayName: 'Structural Columns', unit: 'm³', unitRate: 620, trade: 'Concrete' },
  IFCBEAM: { category: 'IFCBEAM', displayName: 'Structural Beams', unit: 'm³', unitRate: 590, trade: 'Steel' },
  IFCSLAB: { category: 'IFCSLAB', displayName: 'Floor Slabs & Decks', unit: 'm³', unitRate: 420, trade: 'Concrete' },
  IFCWALL: { category: 'IFCWALL', displayName: 'Exterior & Interior Walls', unit: 'm²', unitRate: 140, trade: 'Concrete' },
  IFCWALLSTANDARDCASE: { category: 'IFCWALLSTANDARDCASE', displayName: 'Standard Partition Walls', unit: 'm²', unitRate: 125, trade: 'Finishes' },
  IFCSTAIR: { category: 'IFCSTAIR', displayName: 'Stairs & Landings', unit: 'ea', unitRate: 1200, trade: 'Concrete' },
  IFCSTAIRFLIGHT: { category: 'IFCSTAIRFLIGHT', displayName: 'Stair Flights', unit: 'ea', unitRate: 850, trade: 'Concrete' },
  IFCROOF: { category: 'IFCROOF', displayName: 'Roof Deck & Waterproofing', unit: 'm²', unitRate: 110, trade: 'Finishes' },
  IFCDOOR: { category: 'IFCDOOR', displayName: 'Doors & Portals', unit: 'ea', unitRate: 420, trade: 'Finishes' },
  IFCWINDOW: { category: 'IFCWINDOW', displayName: 'Windows & Glazing Units', unit: 'ea', unitRate: 550, trade: 'Finishes' },
  IFCRAILING: { category: 'IFCRAILING', displayName: 'Guardrails & Handrails', unit: 'm', unitRate: 135, trade: 'Steel' },
  IFCCOVERING: { category: 'IFCCOVERING', displayName: 'Wall & Ceiling Cladding', unit: 'm²', unitRate: 75, trade: 'Finishes' },
  IFCFLOWSEGMENT: { category: 'IFCFLOWSEGMENT', displayName: 'MEP Pipes & Ducts', unit: 'm', unitRate: 95, trade: 'MEP' },
  IFCFLOWFITTING: { category: 'IFCFLOWFITTING', displayName: 'MEP Flow Fittings', unit: 'ea', unitRate: 65, trade: 'MEP' },
  IFCFLOWTERMINAL: { category: 'IFCFLOWTERMINAL', displayName: 'MEP Terminals & Outlets', unit: 'ea', unitRate: 180, trade: 'MEP' },
  IFCFURNISHINGELEMENT: { category: 'IFCFURNISHINGELEMENT', displayName: 'Fixtures & Furnishings', unit: 'ea', unitRate: 250, trade: 'Finishes' },
  IFCPLATE: { category: 'IFCPLATE', displayName: 'Structural Metal Plates', unit: 'm²', unitRate: 190, trade: 'Steel' },
  IFCMEMBER: { category: 'IFCMEMBER', displayName: 'Structural Members', unit: 'm', unitRate: 160, trade: 'Steel' },
  OTHER: { category: 'OTHER', displayName: 'General Architectural Works', unit: 'ea', unitRate: 150, trade: 'General' },
};

const STORAGE_RATES_KEY = 'bim_custom_cost_rates_v1';
const STORAGE_CURRENCY_KEY = 'bim_active_currency_v1';

export class CostRateManager {
  private static instance: CostRateManager | null = null;
  private rates: Map<string, CategoryRate> = new Map();
  private activeCurrencyCode: string = 'USD';
  private modalEl: HTMLElement | null = null;

  private constructor() {
    this.loadState();
  }

  public static getInstance(): CostRateManager {
    if (!CostRateManager.instance) {
      CostRateManager.instance = new CostRateManager();
    }
    return CostRateManager.instance;
  }

  private loadState(): void {
    const savedCurrency = localStorage.getItem(STORAGE_CURRENCY_KEY);
    if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
      this.activeCurrencyCode = savedCurrency;
    }

    try {
      const savedRates = localStorage.getItem(STORAGE_RATES_KEY);
      if (savedRates) {
        const parsed = JSON.parse(savedRates) as Record<string, CategoryRate>;
        for (const [cat, rate] of Object.entries(parsed)) {
          this.rates.set(cat.toUpperCase(), { ...rate });
        }
      }
    } catch (e) {
      console.warn('Could not parse stored cost rates:', e);
    }

    // Populate missing defaults
    for (const [cat, def] of Object.entries(DEFAULT_CATEGORY_RATES)) {
      if (!this.rates.has(cat)) {
        this.rates.set(cat, { ...def });
      }
    }
  }

  public saveState(): void {
    const obj: Record<string, CategoryRate> = {};
    for (const [cat, rate] of this.rates.entries()) {
      obj[cat] = rate;
    }
    localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(obj));
    localStorage.setItem(STORAGE_CURRENCY_KEY, this.activeCurrencyCode);
  }

  public getCurrency(): CurrencyConfig {
    return SUPPORTED_CURRENCIES[this.activeCurrencyCode] || SUPPORTED_CURRENCIES.USD;
  }

  public setCurrency(currencyCode: string): void {
    if (SUPPORTED_CURRENCIES[currencyCode]) {
      this.activeCurrencyCode = currencyCode;
      this.saveState();
    }
  }

  public formatPrice(amount: number): string {
    const curr = this.getCurrency();
    const formattedNum = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${curr.symbol}${formattedNum}`;
  }

  public getRate(category: string): CategoryRate {
    const cleanCat = category.toUpperCase();
    for (const [key, rate] of this.rates.entries()) {
      if (cleanCat.includes(key)) {
        return rate;
      }
    }
    return this.rates.get('OTHER') || DEFAULT_CATEGORY_RATES.OTHER;
  }

  public updateRate(category: string, newRate: number, unit?: QuantityUnit): void {
    const existing = this.getRate(category);
    existing.unitRate = Math.max(0, newRate);
    if (unit) {
      existing.unit = unit;
    }
    this.rates.set(existing.category, existing);
    this.saveState();
  }

  public getAllRates(): CategoryRate[] {
    return Array.from(this.rates.values());
  }

  public resetToDefaults(): void {
    this.rates.clear();
    for (const [cat, def] of Object.entries(DEFAULT_CATEGORY_RATES)) {
      this.rates.set(cat, { ...def });
    }
    this.saveState();
  }

  /**
   * Resolve appropriate quantity multiplier based on rate's required unit (m³, m², m, ea).
   */
  public resolveQuantityForElement(
    category: string,
    qtoProps: { volume?: number; area?: number; length?: number; count?: number } = {},
    bboxSize?: { x: number; y: number; z: number }
  ): { quantity: number; unit: QuantityUnit } {
    const rate = this.getRate(category);
    const unit = rate.unit;

    switch (unit) {
      case 'm³': {
        if (qtoProps.volume && qtoProps.volume > 0) {
          return { quantity: Number(qtoProps.volume.toFixed(2)), unit: 'm³' };
        }
        if (bboxSize && bboxSize.x > 0 && bboxSize.y > 0 && bboxSize.z > 0) {
          const approxVol = bboxSize.x * bboxSize.y * bboxSize.z;
          return { quantity: Number(approxVol.toFixed(2)), unit: 'm³' };
        }
        return { quantity: 1.0, unit: 'm³' };
      }
      case 'm²': {
        if (qtoProps.area && qtoProps.area > 0) {
          return { quantity: Number(qtoProps.area.toFixed(2)), unit: 'm²' };
        }
        if (bboxSize) {
          const dims = [bboxSize.x, bboxSize.y, bboxSize.z].sort((a, b) => b - a);
          const approxArea = dims[0] * dims[1];
          if (approxArea > 0) {
            return { quantity: Number(approxArea.toFixed(2)), unit: 'm²' };
          }
        }
        return { quantity: 1.0, unit: 'm²' };
      }
      case 'm': {
        if (qtoProps.length && qtoProps.length > 0) {
          return { quantity: Number(qtoProps.length.toFixed(2)), unit: 'm' };
        }
        if (bboxSize) {
          const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);
          if (maxDim > 0) {
            return { quantity: Number(maxDim.toFixed(2)), unit: 'm' };
          }
        }
        return { quantity: 1.0, unit: 'm' };
      }
      case 'ea':
      default:
        return { quantity: qtoProps.count && qtoProps.count > 0 ? qtoProps.count : 1, unit: 'ea' };
    }
  }

  /**
   * Opens the interactive Cost Rate Table modal.
   */
  public openCostRateModal(onSave?: () => void): void {
    if (!this.modalEl) {
      this.createModalDOM();
    }
    this.renderModalContent(onSave);
    this.modalEl?.classList.remove('hidden');
  }

  public closeCostRateModal(): void {
    this.modalEl?.classList.add('hidden');
  }

  private createModalDOM(): void {
    const modal = document.createElement('div');
    modal.id = 'cost-rate-table-modal';
    modal.className = 'cost-rate-modal-overlay hidden';
    modal.innerHTML = `
      <div class="cost-rate-modal-container" role="dialog" aria-modal="true" aria-labelledby="cost-modal-title">
        <div class="cost-rate-modal-header">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="cost-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h2 id="cost-modal-title" style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #fff;">Custom Cost Rate Table & Multipliers</h2>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Set baseline unit rates, measurement basis (m³, m², m, ea), and project currency.</span>
            </div>
          </div>
          <button id="btn-close-cost-modal" class="btn-icon-sm" title="Close Modal">✕</button>
        </div>

        <div class="cost-rate-modal-toolbar">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="cost-currency-selector" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">Project Currency:</label>
            <select id="cost-currency-selector" class="cost-currency-select"></select>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button id="btn-cost-rates-reset" class="btn-secondary" style="font-size: 0.68rem; padding: 0.25rem 0.6rem;">Reset Defaults</button>
            <button id="btn-cost-rates-save" class="btn-action-primary" style="font-size: 0.68rem; padding: 0.25rem 0.8rem; background: var(--accent-500); color: #000; font-weight: 800;">Apply Rates</button>
          </div>
        </div>

        <div class="cost-rate-table-wrapper thin-scrollbar">
          <table class="cost-rate-table" id="cost-rate-table">
            <thead>
              <tr>
                <th style="width: 28%;">IFC Category</th>
                <th style="width: 24%;">Trade Group</th>
                <th style="width: 20%;">Unit Basis</th>
                <th style="width: 28%;">Unit Rate (<span id="table-currency-symbol">$</span>)</th>
              </tr>
            </thead>
            <tbody id="cost-rate-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    modal.querySelector('#btn-close-cost-modal')?.addEventListener('click', () => this.closeCostRateModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeCostRateModal();
    });
  }

  private renderModalContent(onSave?: () => void): void {
    if (!this.modalEl) return;

    // Currency selector options
    const currencySelect = this.modalEl.querySelector('#cost-currency-selector') as HTMLSelectElement;
    if (currencySelect) {
      currencySelect.innerHTML = Object.values(SUPPORTED_CURRENCIES)
        .map(
          (c) =>
            `<option value="${c.code}" ${c.code === this.activeCurrencyCode ? 'selected' : ''}>${c.name}</option>`
        )
        .join('');

      currencySelect.onchange = () => {
        this.setCurrency(currencySelect.value);
        const currSym = this.modalEl?.querySelector('#table-currency-symbol');
        if (currSym) currSym.textContent = this.getCurrency().symbol.trim();
      };
    }

    const currSym = this.modalEl.querySelector('#table-currency-symbol');
    if (currSym) currSym.textContent = this.getCurrency().symbol.trim();

    // Table rows
    const tbody = this.modalEl.querySelector('#cost-rate-table-body');
    if (!tbody) return;

    const rates = this.getAllRates();
    tbody.innerHTML = rates
      .map(
        (r) => `
        <tr data-cat="${r.category}">
          <td>
            <div style="font-weight: 700; color: #fff;">${r.displayName}</div>
            <span style="font-family: monospace; font-size: 0.6rem; color: var(--text-muted);">${r.category}</span>
          </td>
          <td>
            <span class="cost-trade-badge trade-${r.trade.toLowerCase()}">${r.trade}</span>
          </td>
          <td>
            <select class="cost-unit-select" data-cat="${r.category}">
              <option value="m³" ${r.unit === 'm³' ? 'selected' : ''}>m³ (Volume)</option>
              <option value="m²" ${r.unit === 'm²' ? 'selected' : ''}>m² (Area)</option>
              <option value="m" ${r.unit === 'm' ? 'selected' : ''}>m (Length)</option>
              <option value="ea" ${r.unit === 'ea' ? 'selected' : ''}>ea (Count)</option>
            </select>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <span style="font-family: monospace; font-weight: 700; color: var(--accent-500);">${this.getCurrency().symbol.trim()}</span>
              <input type="number" min="0" step="1" class="cost-rate-input" data-cat="${r.category}" value="${r.unitRate}" />
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    // Reset button
    const resetBtn = this.modalEl.querySelector('#btn-cost-rates-reset') as HTMLButtonElement | null;
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Reset all category rates and unit types to project defaults?')) {
          this.resetToDefaults();
          this.renderModalContent(onSave);
        }
      };
    }

    // Apply / Save button
    const saveBtn = this.modalEl.querySelector('#btn-cost-rates-save') as HTMLButtonElement | null;
    if (saveBtn) {
      saveBtn.onclick = () => {
        const rows = this.modalEl?.querySelectorAll('#cost-rate-table-body tr');
        rows?.forEach((row) => {
          const cat = (row as HTMLElement).dataset.cat;
          if (!cat) return;
          const unitSel = row.querySelector('.cost-unit-select') as HTMLSelectElement;
          const rateInp = row.querySelector('.cost-rate-input') as HTMLInputElement;
          const rateVal = Number(rateInp?.value) || 0;
          const unitVal = (unitSel?.value as QuantityUnit) || 'ea';
          this.updateRate(cat, rateVal, unitVal);
        });
        this.saveState();
        this.closeCostRateModal();
        if (onSave) onSave();
      };
    }
  }
}
