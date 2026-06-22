(function () {
  'use strict';

  // -----------------------------
  // Element references
  // -----------------------------
  const principalInput = document.getElementById('principal');
  const principalRange = document.getElementById('principalRange');
  const rateInput = document.getElementById('rate');
  const rateRange = document.getElementById('rateRange');
  const tenureInput = document.getElementById('tenure');
  const tenureRange = document.getElementById('tenureRange');
  const startDateInput = document.getElementById('startDate');
  const currencySelect = document.getElementById('currency');
  const unitButtons = document.querySelectorAll('.unit-btn');
  const viewButtons = document.querySelectorAll('.view-btn');
  const downloadCsvBtn = document.getElementById('downloadCsv');

  const principalError = document.getElementById('principalError');
  const rateError = document.getElementById('rateError');
  const tenureError = document.getElementById('tenureError');

  const emiSymbol = document.getElementById('emiSymbol');
  const emiAmount = document.getElementById('emiAmount');
  const currencySymbolLabel = document.getElementById('currencySymbol');
  const barPrincipal = document.getElementById('barPrincipal');
  const barInterest = document.getElementById('barInterest');
  const totalPrincipalEl = document.getElementById('totalPrincipal');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaymentEl = document.getElementById('totalPayment');
  const totalPaymentsEl = document.getElementById('totalPayments');
  const scheduleHeadRow = document.getElementById('scheduleHeadRow');
  const scheduleBody = document.getElementById('scheduleBody');

  let tenureUnit = 'years';
  let scheduleView = 'yearly';
  let lastSchedule = null; // cached for CSV export

  // -----------------------------
  // Helpers
  // -----------------------------
  function parseNumber(str) {
    if (typeof str !== 'string') return NaN;
    const cleaned = str.replace(/,/g, '').trim();
    if (cleaned === '') return NaN;
    return Number(cleaned);
  }

  function formatNumber(num, decimals = 0) {
    if (!isFinite(num)) return '—';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function currentCurrencySymbol() {
    return currencySelect.value;
  }

  function setFieldError(el, message) {
    el.textContent = message || '';
  }

  // -----------------------------
  // Core EMI math
  // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  // where r = monthly interest rate, n = number of monthly payments
  // -----------------------------
  function calculateEmi(principal, annualRatePercent, months) {
    const monthlyRate = annualRatePercent / 12 / 100;

    if (monthlyRate === 0) {
      return principal / months;
    }

    const factor = Math.pow(1 + monthlyRate, months);
    return (principal * monthlyRate * factor) / (factor - 1);
  }

  function buildAmortizationSchedule(principal, annualRatePercent, months, emi, startDate) {
    const monthlyRate = annualRatePercent / 12 / 100;
    let balance = principal;
    const rows = [];

    for (let month = 1; month <= months; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = emi - interestPayment;

      // Final payment absorbs any rounding remainder so balance hits exactly zero.
      if (month === months) {
        principalPayment = balance;
      }

      balance = Math.max(0, balance - principalPayment);

      let label = `Month ${month}`;
      if (startDate) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + (month - 1), 1);
        label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      rows.push({
        month,
        label,
        principalPayment,
        interestPayment: month === months ? (emi - principalPayment) : interestPayment,
        totalPayment: month === months ? (principalPayment + interestPayment) : emi,
        balance
      });
    }

    return rows;
  }

  function collapseToYearly(monthlyRows) {
    const years = [];
    for (let i = 0; i < monthlyRows.length; i += 12) {
      const chunk = monthlyRows.slice(i, i + 12);
      const yearNumber = Math.floor(i / 12) + 1;
      const principalSum = chunk.reduce((s, r) => s + r.principalPayment, 0);
      const interestSum = chunk.reduce((s, r) => s + r.interestPayment, 0);
      years.push({
        label: `Year ${yearNumber}`,
        principalPayment: principalSum,
        interestPayment: interestSum,
        totalPayment: principalSum + interestSum,
        balance: chunk[chunk.length - 1].balance
      });
    }
    return years;
  }

  // -----------------------------
  // Validation
  // -----------------------------
  function validateInputs(principal, rate, tenureMonths) {
    let valid = true;

    if (!isFinite(principal) || principal <= 0) {
      setFieldError(principalError, 'Enter a loan amount greater than 0.');
      valid = false;
    } else if (principal > 1_000_000_000) {
      setFieldError(principalError, 'That amount looks too large. Try a smaller number.');
      valid = false;
    } else {
      setFieldError(principalError, '');
    }

    if (!isFinite(rate) || rate <= 0) {
      setFieldError(rateError, 'Enter an interest rate greater than 0.');
      valid = false;
    } else if (rate > 50) {
      setFieldError(rateError, 'That rate looks unusually high. Double-check it.');
      valid = false;
    } else {
      setFieldError(rateError, '');
    }

    if (!isFinite(tenureMonths) || tenureMonths <= 0) {
      setFieldError(tenureError, 'Enter a loan term greater than 0.');
      valid = false;
    } else if (tenureMonths > 600) {
      setFieldError(tenureError, 'That term looks too long. Try under 50 years.');
      valid = false;
    } else {
      setFieldError(tenureError, '');
    }

    return valid;
  }

  // -----------------------------
  // Render
  // -----------------------------
  function renderScheduleTable(rows) {
    scheduleBody.innerHTML = '';
    const symbol = currentCurrencySymbol();

    const headLabel = scheduleView === 'yearly' ? 'Year' : 'Month';
    scheduleHeadRow.children[0].textContent = headLabel;

    const fragment = document.createDocumentFragment();
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.label}</td>
        <td>${symbol}${formatNumber(row.principalPayment)}</td>
        <td>${symbol}${formatNumber(row.interestPayment)}</td>
        <td>${symbol}${formatNumber(row.totalPayment)}</td>
        <td>${symbol}${formatNumber(row.balance)}</td>
      `;
      fragment.appendChild(tr);
    });
    scheduleBody.appendChild(fragment);
  }

  function render() {
    const principal = parseNumber(principalInput.value);
    const rate = parseNumber(rateInput.value);
    const tenureRaw = parseNumber(tenureInput.value);
    const tenureMonths = tenureUnit === 'years' ? Math.round(tenureRaw * 12) : Math.round(tenureRaw);

    const symbol = currentCurrencySymbol();
    emiSymbol.textContent = symbol;
    currencySymbolLabel.textContent = symbol;

    const isValid = validateInputs(principal, rate, tenureMonths);

    if (!isValid) {
      emiAmount.textContent = '0';
      totalPrincipalEl.textContent = '—';
      totalInterestEl.textContent = '—';
      totalPaymentEl.textContent = '—';
      totalPaymentsEl.textContent = '—';
      barPrincipal.style.width = '0%';
      barInterest.style.width = '0%';
      scheduleBody.innerHTML = '';
      lastSchedule = null;
      return;
    }

    const emi = calculateEmi(principal, rate, tenureMonths);
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;

    emiAmount.textContent = formatNumber(emi, 2);
    totalPrincipalEl.textContent = `${symbol}${formatNumber(principal)}`;
    totalInterestEl.textContent = `${symbol}${formatNumber(totalInterest)}`;
    totalPaymentEl.textContent = `${symbol}${formatNumber(totalPayment)}`;
    totalPaymentsEl.textContent = `${tenureMonths} payments`;

    const principalPct = Math.max(0, Math.min(100, (principal / totalPayment) * 100));
    barPrincipal.style.width = `${principalPct}%`;
    barInterest.style.width = `${100 - principalPct}%`;

    const startDateValue = startDateInput.value ? new Date(startDateInput.value + '-01') : null;
    const monthlyRows = buildAmortizationSchedule(principal, rate, tenureMonths, emi, startDateValue);
    lastSchedule = { monthlyRows, symbol, principal, rate, tenureMonths };

    const displayRows = scheduleView === 'yearly' ? collapseToYearly(monthlyRows) : monthlyRows;
    renderScheduleTable(displayRows);
  }

  // -----------------------------
  // CSV export
  // -----------------------------
  function downloadCsv() {
    if (!lastSchedule) return;
    const { monthlyRows, symbol } = lastSchedule;

    const header = ['Month', 'Principal Paid', 'Interest Paid', 'Total Paid', 'Balance Remaining'];
    const lines = [header.join(',')];

    monthlyRows.forEach((row) => {
      lines.push([
        row.label,
        row.principalPayment.toFixed(2),
        row.interestPayment.toFixed(2),
        row.totalPayment.toFixed(2),
        row.balance.toFixed(2)
      ].join(','));
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'emi-amortization-schedule.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // -----------------------------
  // Sync helpers between text input and range slider
  // -----------------------------
  function syncPair(textEl, rangeEl, onChange) {
    textEl.addEventListener('input', () => {
      const val = parseNumber(textEl.value);
      if (isFinite(val)) rangeEl.value = String(val);
      onChange();
    });
    rangeEl.addEventListener('input', () => {
      textEl.value = rangeEl.value;
      onChange();
    });
  }

  // -----------------------------
  // Event wiring
  // -----------------------------
  syncPair(principalInput, principalRange, render);
  syncPair(rateInput, rateRange, render);
  syncPair(tenureInput, tenureRange, render);

  currencySelect.addEventListener('change', render);
  startDateInput.addEventListener('change', render);

  unitButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const newUnit = btn.dataset.unit;
      if (newUnit === tenureUnit) return;

      // Convert the current tenure value when switching units so the number stays meaningful.
      const currentVal = parseNumber(tenureInput.value);
      if (isFinite(currentVal)) {
        if (newUnit === 'months' && tenureUnit === 'years') {
          tenureInput.value = String(Math.round(currentVal * 12));
        } else if (newUnit === 'years' && tenureUnit === 'months') {
          tenureInput.value = String(+(currentVal / 12).toFixed(1));
        }
      }

      tenureUnit = newUnit;
      unitButtons.forEach((b) => b.classList.toggle('is-active', b === btn));

      // Adjust slider bounds: years 1-30, months 1-360.
      if (newUnit === 'months') {
        tenureRange.min = '1';
        tenureRange.max = '360';
        tenureRange.step = '1';
      } else {
        tenureRange.min = '1';
        tenureRange.max = '30';
        tenureRange.step = '1';
      }
      tenureRange.value = tenureInput.value;

      render();
    });
  });

  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      scheduleView = btn.dataset.view;
      viewButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      render();
    });
  });

  downloadCsvBtn.addEventListener('click', downloadCsv);

  // Initial render on page load
  render();
})();
