/**
 * OpenQR Core Scanner Engine
 * Camera & Image File Scanner with Local History & Product Lookup
 * License: MIT (c) 2026 NovaStrikes
 */

(function(window) {
  'use strict';

  let html5QrCode = null;
  let isScanning = false;
  let currentCameraId = null;

  // Local Storage Scan History
  function getScanHistory() {
    try {
      const stored = localStorage.getItem('oqr_scan_history');
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  function saveScan(text, format) {
    try {
      const history = getScanHistory();
      const entry = {
        id: 'scan_' + Date.now(),
        text: text,
        format: format || 'QR_CODE',
        timestamp: new Date().toISOString()
      };
      history.unshift(entry);
      if (history.length > 50) history.pop();
      localStorage.setItem('oqr_scan_history', JSON.stringify(history));
      renderScanHistory();
    } catch(e) {}
  }

  function clearHistory() {
    try {
      localStorage.removeItem('oqr_scan_history');
      renderScanHistory();
    } catch(e) {}
  }

  function renderScanHistory() {
    const list = document.getElementById('scanHistoryList');
    if (!list) return;
    const history = getScanHistory();
    if (!history || history.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;">No scans recorded yet.</div>';
      return;
    }

    list.innerHTML = history.map(item => {
      const isUrl = /^https?:\/\//i.test(item.text);
      const displayVal = item.text.length > 60 ? item.text.slice(0, 57) + '...' : item.text;
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border);font-size:13px;">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:12px;">
            ${isUrl ? `<a href="${item.text}" target="_blank" rel="noopener noreferrer" style="color:var(--green);text-decoration:none;">${displayVal}</a>` : `<span>${displayVal}</span>`}
            <div style="font-size:11px;color:var(--text3);">${item.format} &middot; ${timeStr}</div>
          </div>
          <button type="button" class="btn-outline btn-sm" onclick="navigator.clipboard.writeText('${item.text.replace(/'/g, "\\'")}').then(() => alert('Copied!'))" style="font-size:11px;padding:4px 8px;">Copy</button>
        </div>
      `;
    }).join('');
  }

  // Open Food Facts / Open Beauty Facts direct client lookup
  async function lookupBarcode(barcode) {
    const num = barcode.trim();
    if (!/^\d{6,14}$/.test(num)) return null;
    const card = document.getElementById('productCard');
    if (!card) return null;

    card.style.display = 'block';
    card.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:13px;">Looking up product details...</div>';

    try {
      let res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(num)}.json`, {
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      let data = res && res.ok ? await res.json() : null;
      let product = data && data.status === 1 ? data.product : null;

      if (!product) {
        let bRes = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(num)}.json`, {
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        let bData = bRes && bRes.ok ? await bRes.json() : null;
        if (bData && bData.status === 1) product = bData.product;
      }

      if (product) {
        const name = product.product_name || product.product_name_en || 'Unknown Product';
        const brand = product.brands || 'Unknown Brand';
        const img = product.image_url || product.image_front_small_url || '';
        card.innerHTML = `
          <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;">
            ${img ? `<img src="${img}" alt="${name}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" />` : ''}
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--text);">${name}</div>
              <div style="font-size:12px;color:var(--text3);">${brand}</div>
            </div>
          </div>
        `;
        return product;
      } else {
        card.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:12px;">No product found in open databases.</div>';
        return null;
      }
    } catch(err) {
      card.innerHTML = '';
      card.style.display = 'none';
      return null;
    }
  }

  // Handle Scan Detection
  async function handleScanSuccess(decodedText, decodedResult) {
    const format = decodedResult?.result?.format?.formatName || 'QR_CODE';
    saveScan(decodedText, format);

    const resultWrap = document.getElementById('scanResultWrap');
    const resultText = document.getElementById('scanResultText');
    const actionBtn = document.getElementById('scanResultAction');

    if (resultWrap && resultText) {
      resultWrap.style.display = 'block';
      resultText.textContent = decodedText;

      const isUrl = /^https?:\/\//i.test(decodedText);
      if (actionBtn) {
        if (isUrl) {
          actionBtn.style.display = 'inline-block';
          actionBtn.textContent = 'Open Link';
          actionBtn.onclick = () => window.open(decodedText, '_blank', 'noopener,noreferrer');
        } else {
          actionBtn.style.display = 'none';
        }
      }
    }

    if (/^\d{6,14}$/.test(decodedText.trim())) {
      lookupBarcode(decodedText.trim());
    }
  }

  // Start Camera Scanning
  async function startScanner() {
    const readerEl = document.getElementById('reader');
    if (!readerEl || !window.Html5Qrcode) return;

    if (isScanning && html5QrCode) {
      await stopScanner();
    }

    html5QrCode = new window.Html5Qrcode('reader');
    try {
      const devices = await window.Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        alert('No camera detected on this device.');
        return;
      }

      currentCameraId = devices[0].id;
      // Prefer back camera on mobile
      const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
      if (backCam) currentCameraId = backCam.id;

      await html5QrCode.start(
        currentCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        handleScanSuccess,
        () => {} // silent on frame errors
      );

      isScanning = true;
      const startBtn = document.getElementById('btnStartScan');
      const stopBtn = document.getElementById('btnStopScan');
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-block';
    } catch(err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera: ' + (err.message || err));
    }
  }

  // Stop Camera Scanning
  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
        isScanning = false;
        const startBtn = document.getElementById('btnStartScan');
        const stopBtn = document.getElementById('btnStopScan');
        if (startBtn) startBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
      } catch(err) {
        console.error('Stop scanner error:', err);
      }
    }
  }

  // File Upload Scan
  async function scanFile(file) {
    if (!file || !window.Html5Qrcode) return;
    const scanner = new window.Html5Qrcode('file-scan-temp', false);
    try {
      const res = await scanner.scanFile(file, true);
      handleScanSuccess(res, { result: { format: { formatName: 'FILE_IMAGE' } } });
    } catch(err) {
      alert('Could not decode a QR code or barcode from this image.');
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    renderScanHistory();
    const fileInput = document.getElementById('scanFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          scanFile(e.target.files[0]);
        }
      });
    }
  });

  window.startScanner = startScanner;
  window.stopScanner = stopScanner;
  window.scanFile = scanFile;
  window.clearHistory = clearHistory;
  window.lookupBarcode = lookupBarcode;

})(typeof window !== 'undefined' ? window : this);
