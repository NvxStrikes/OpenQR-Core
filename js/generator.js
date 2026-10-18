/**
 * OpenQR Core Generator Engine
 * 100% Client-Side QR & Barcode Generation
 * License: MIT (c) 2026 NovaStrikes
 */

(function(window) {
  'use strict';

  let currentType = 'url';
  let currentGenMode = 'qr';
  let currentFrame = 'none';
  let currentFrameText = 'SCAN ME';
  let genDebounceTimer = null;
  let lastQRData = null;

  function getContrastTextColor(hex) {
    if (!hex || hex === 'transparent') return '#111827';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return '#ffffff';
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 148 ? '#111827' : '#ffffff';
  }

  // 2. Sticker Frame Compositing Engine
  function createStickerCanvas(rawCanvasOrImg, frameType, fgColor, bgColor, isTransparent, customLabel) {
  const qrW = rawCanvasOrImg.width || 300;
  const qrH = rawCanvasOrImg.height || 300;
  const scale = qrW / 1000;
  const text = (customLabel !== undefined && customLabel !== null && customLabel.trim() !== '') 
                ? customLabel.trim().toUpperCase() 
                : (currentFrameText || 'SCAN ME').toUpperCase();

  if (frameType === 'none') {
    const canvas = document.createElement('canvas');
    canvas.width = qrW;
    canvas.height = qrH;
    const ctx = canvas.getContext('2d');
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, qrW, qrH);
    }
    ctx.drawImage(rawCanvasOrImg, 0, 0);
    return canvas;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. BOTTOM PILL / TAG (Classic high-converting scan tag)
  if (frameType === 'bottom-pill' || frameType === 'bar-below') {
    const margin = Math.round(qrW * 0.08);
    const pillH = Math.round(qrW * 0.22);
    const gap = Math.round(6 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + pillH + gap;
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, W, H, Math.round(16 * scale));
      else ctx.rect(0, 0, W, H);
      ctx.fill();
    }

    ctx.drawImage(rawCanvasOrImg, margin, margin);

    const pillY = margin + qrH + gap;
    const pillX = margin;
    const pillW = qrW;
    const rx = Math.round(pillH * 0.32);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, rx);
    else ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(12, Math.round(pillH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 2. TOP BANNER (Header ribbon above QR code)
  if (frameType === 'top-banner' || frameType === 'banner-above') {
    const margin = Math.round(qrW * 0.08);
    const bannerH = Math.round(qrW * 0.22);
    const gap = Math.round(6 * scale);
    const W = qrW + margin * 2;
    const H = bannerH + margin * 2 + qrH + gap;
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, W, H, Math.round(16 * scale));
      else ctx.rect(0, 0, W, H);
      ctx.fill();
    }

    const bannerX = margin;
    const bannerY = margin;
    const bannerW = qrW;
    const rx = Math.round(bannerH * 0.30);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, rx);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(12, Math.round(bannerH * 0.42)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bannerX + bannerW / 2, bannerY + bannerH / 2 + Math.max(1, Math.round(1 * scale)));

    const qrY = bannerY + bannerH + gap;
    ctx.drawImage(rawCanvasOrImg, margin, qrY);

    return canvas;
  }

  // 3. SMARTPHONE DEVICE MOCKUP
  if (frameType === 'phone-mockup') {
    const padX = Math.round(qrW * 0.12);
    const padTop = Math.round(qrW * 0.24);
    const padBot = Math.round(qrW * 0.28);
    const W = qrW + padX * 2;
    const H = qrH + padTop + padBot;
    const lw = Math.max(3, Math.round(qrW * 0.032));
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, W, H, Math.round(32 * scale));
      else ctx.rect(0, 0, W, H);
      ctx.fill();
    }

    // Outer Phone Body Bezel
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lw, lw, W - lw * 2, H - lw * 2, Math.round(28 * scale));
    else ctx.rect(lw, lw, W - lw * 2, H - lw * 2);
    ctx.stroke();

    // Speaker / Dynamic Island Top Notch Pill
    const notchW = Math.round(W * 0.28);
    const notchH = Math.max(6, Math.round(padTop * 0.24));
    const notchX = (W - notchW) / 2;
    const notchY = Math.round(padTop * 0.38);
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(notchX, notchY, notchW, notchH, notchH / 2);
    else ctx.rect(notchX, notchY, notchW, notchH);
    ctx.fill();

    // Screen area QR
    ctx.drawImage(rawCanvasOrImg, padX, padTop);

    // Bottom CTA Home Bar Strip
    const barW = Math.round(qrW * 0.90);
    const barH = Math.round(qrW * 0.18);
    const barX = (W - barW) / 2;
    const barY = padTop + qrH + Math.round((padBot - barH) / 2);
    const rx = Math.round(barH * 0.35);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, rx);
    else ctx.rect(barX, barY, barW, barH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(barH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, barY + barH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 4. VIEWFINDER / FOCUS BRACKETS
  if (frameType === 'viewfinder' || frameType === 'corner-brackets') {
    const margin = Math.round(qrW * 0.12);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2;
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.drawImage(rawCanvasOrImg, margin, margin);

    const arm = Math.round(qrW * 0.22);
    const pad = Math.round(margin * 0.30);
    const lw = Math.max(3, Math.round(qrW * 0.035));
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(margin - pad, margin - pad + arm);
    ctx.lineTo(margin - pad, margin - pad);
    ctx.lineTo(margin - pad + arm, margin - pad);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(W - margin + pad - arm, margin - pad);
    ctx.lineTo(W - margin + pad, margin - pad);
    ctx.lineTo(W - margin + pad, margin - pad + arm);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(margin - pad, H - margin + pad - arm);
    ctx.lineTo(margin - pad, H - margin + pad);
    ctx.lineTo(margin - pad + arm, H - margin + pad);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(W - margin + pad - arm, H - margin + pad);
    ctx.lineTo(W - margin + pad, H - margin + pad);
    ctx.lineTo(W - margin + pad, H - margin + pad - arm);
    ctx.stroke();

    return canvas;
  }

  // 5. TICKET STUB / COUPON PASS
  if (frameType === 'ticket-stub') {
    const margin = Math.round(qrW * 0.08);
    const headerH = Math.round(qrW * 0.20);
    const gap = Math.round(12 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + headerH + gap;
    const lw = Math.max(2, Math.round(qrW * 0.024));
    const notchR = Math.round(qrW * 0.06);
    const outerR = Math.round(14 * scale);
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, W, H, outerR);
      else ctx.rect(0, 0, W, H);
      ctx.fill();
    }

    // Ticket Outline with side circular notch cutouts
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    const tearY = margin + headerH + Math.round(6 * scale);

    ctx.beginPath();
    ctx.moveTo(outerR, 0);
    ctx.lineTo(W - outerR, 0);
    ctx.arcTo(W, 0, W, outerR, outerR);
    ctx.lineTo(W, tearY - notchR);
    ctx.arc(W, tearY, notchR, -Math.PI / 2, Math.PI / 2, true); // right notch
    ctx.lineTo(W, H - outerR);
    ctx.arcTo(W, H, W - outerR, H, outerR);
    ctx.lineTo(outerR, H);
    ctx.arcTo(0, H, 0, H - outerR, outerR);
    ctx.lineTo(0, tearY + notchR);
    ctx.arc(0, tearY, notchR, Math.PI / 2, -Math.PI / 2, true); // left notch
    ctx.lineTo(0, outerR);
    ctx.arcTo(0, 0, outerR, 0, outerR);
    ctx.closePath();
    ctx.stroke();

    // Dashed Tear Line across ticket
    ctx.beginPath();
    ctx.setLineDash([Math.max(2, Math.round(6 * scale)), Math.max(2, Math.round(4 * scale))]);
    ctx.moveTo(notchR + Math.round(4 * scale), tearY);
    ctx.lineTo(W - notchR - Math.round(4 * scale), tearY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Header Fill
    const headerW = qrW;
    const headerX = margin;
    const headerY = margin;
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(headerX, headerY, headerW, headerH - Math.round(4 * scale), Math.round(8 * scale));
    else ctx.rect(headerX, headerY, headerW, headerH - Math.round(4 * scale));
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(headerH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, headerY + (headerH - Math.round(4 * scale)) / 2 + Math.max(1, Math.round(1 * scale)));

    // QR in lower ticket body
    ctx.drawImage(rawCanvasOrImg, margin, tearY + Math.round(8 * scale));

    return canvas;
  }

  // 6. MINIMAL DOUBLE BORDER CARD
  if (frameType === 'minimal-card') {
    const margin = Math.round(qrW * 0.08);
    const pillH = Math.round(qrW * 0.18);
    const gap = Math.round(10 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + pillH + gap;
    const lw = Math.max(2, Math.round(qrW * 0.024));
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, W, H, Math.round(14 * scale));
      else ctx.rect(0, 0, W, H);
      ctx.fill();
    }

    // Outer Card Border
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lw, lw, W - lw * 2, H - lw * 2, Math.round(12 * scale));
    else ctx.rect(lw, lw, W - lw * 2, H - lw * 2);
    ctx.stroke();

    // Inner Delicate Dashed Frame
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.setLineDash([Math.max(2, Math.round(4 * scale)), Math.max(1, Math.round(3 * scale))]);
    ctx.beginPath();
    const pad = Math.round(4 * scale);
    if (ctx.roundRect) ctx.roundRect(margin - pad, margin - pad, qrW + pad * 2, qrH + pad * 2, Math.round(8 * scale));
    else ctx.rect(margin - pad, margin - pad, qrW + pad * 2, qrH + pad * 2);
    ctx.stroke();
    ctx.restore();

    ctx.drawImage(rawCanvasOrImg, margin, margin);

    // Bottom Elegant Pill
    const pillW = Math.round(qrW * 0.85);
    const pillX = (W - pillW) / 2;
    const pillY = margin + qrH + Math.round(8 * scale);
    const rx = Math.round(pillH * 0.35);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, rx);
    else ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(pillH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + pillH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 7. CHAT BUBBLE FRAME
  if (frameType === 'chat-bubble') {
    const margin = Math.round(qrW * 0.08);
    const headerH = Math.round(qrW * 0.18);
    const tailH = Math.round(qrW * 0.10);
    const gap = Math.round(4 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + headerH + tailH + gap;
    const lw = Math.max(2, Math.round(qrW * 0.026));
    const r = Math.round(20 * scale);
    canvas.width = W;
    canvas.height = H;

    const bubbleH = H - tailH;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    // Draw speech bubble body with pointer tail
    ctx.strokeStyle = fgColor;
    ctx.fillStyle = isTransparent ? 'transparent' : bgColor;
    ctx.lineWidth = lw;

    const tailX1 = Math.round(55 * scale);
    const tailTip = Math.round(35 * scale);
    const tailX2 = Math.round(38 * scale);

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(W - r, 0);
    ctx.arcTo(W, 0, W, r, r);
    ctx.lineTo(W, bubbleH - r);
    ctx.arcTo(W, bubbleH, W - r, bubbleH, r);
    ctx.lineTo(tailX1, bubbleH);
    ctx.lineTo(tailTip, bubbleH + tailH); // tail tip
    ctx.lineTo(tailX2, bubbleH);
    ctx.lineTo(r, bubbleH);
    ctx.arcTo(0, bubbleH, 0, bubbleH - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    if (!isTransparent) ctx.fill();
    ctx.stroke();

    // Top CTA strip
    const pillW = qrW;
    const pillX = margin;
    const pillY = margin;
    const rx = Math.round(headerH * 0.32);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, headerH, rx);
    else ctx.rect(pillX, pillY, pillW, headerH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(headerH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + headerH / 2 + Math.max(1, Math.round(1 * scale)));

    ctx.drawImage(rawCanvasOrImg, margin, pillY + headerH + Math.round(6 * scale));

    return canvas;
  }

  // 8. CIRCULAR BADGE / STAMP
  if (frameType === 'circle-badge') {
    const pad = Math.round(qrW * 0.16);
    const pillH = Math.round(qrW * 0.18);
    const diameter = qrW + pad * 2;
    const W = diameter;
    const H = diameter + Math.round(pillH * 0.7);
    const lw = Math.max(2, Math.round(qrW * 0.024));
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2;
    const cy = diameter / 2;
    const radius = diameter / 2 - lw;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer Circle Ring
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Accent Circle Ring
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.arc(cx, cy, radius - Math.round(6 * scale), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.drawImage(rawCanvasOrImg, (W - qrW) / 2, (diameter - qrH) / 2);

    // Bottom Badge Pill
    const pillW = Math.round(qrW * 0.76);
    const pillX = (W - pillW) / 2;
    const pillY = diameter - Math.round(pillH * 0.65);
    const rx = Math.round(pillH * 0.35);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, rx);
    else ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(10, Math.round(pillH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + pillH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 9. RETRO POLAROID SNAPSHOT
  if (frameType === 'retro-polaroid') {
    const marginSide = Math.round(qrW * 0.08);
    const marginTop = Math.round(qrW * 0.08);
    const marginBot = Math.round(qrW * 0.30);
    const W = qrW + marginSide * 2;
    const H = qrH + marginTop + marginBot;
    const lw = Math.max(1, Math.round(qrW * 0.015));
    canvas.width = W;
    canvas.height = H;

    // Polaroid Photo Card
    ctx.fillStyle = isTransparent ? 'transparent' : (bgColor === 'transparent' ? '#ffffff' : bgColor);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, W, H, Math.round(6 * scale));
    else ctx.rect(0, 0, W, H);
    if (!isTransparent) ctx.fill();

    // Subtle Card Border
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    ctx.drawImage(rawCanvasOrImg, marginSide, marginTop);

    // Handwritten / Clean Label in Bottom Margin
    ctx.fillStyle = fgColor;
    ctx.font = 'bold ' + Math.max(13, Math.round(marginBot * 0.28)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, marginTop + qrH + marginBot / 2 + Math.max(1, Math.round(2 * scale)));

    return canvas;
  }

  // 10. APPAREL / PRODUCT HANGTAG
  if (frameType === 'tag-hangtag') {
    const margin = Math.round(qrW * 0.08);
    const topH = Math.round(qrW * 0.22);
    const botH = Math.round(qrW * 0.18);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + topH + botH;
    const chamfer = Math.round(W * 0.20);
    const lw = Math.max(2, Math.round(qrW * 0.024));
    const cornerR = Math.round(10 * scale);
    canvas.width = W;
    canvas.height = H;

    // Tag outline with chamfered top shoulders
    ctx.beginPath();
    ctx.moveTo(chamfer, 0);
    ctx.lineTo(W - chamfer, 0);
    ctx.lineTo(W, chamfer);
    ctx.lineTo(W, H - cornerR);
    ctx.arcTo(W, H, W - cornerR, H, cornerR);
    ctx.lineTo(cornerR, H);
    ctx.arcTo(0, H, 0, H - cornerR, cornerR);
    ctx.lineTo(0, chamfer);
    ctx.closePath();

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Top Grommet Metal Ring Hole
    const holeR = Math.round(qrW * 0.04);
    const holeY = Math.round(chamfer * 0.45);
    ctx.beginPath();
    ctx.arc(W / 2, holeY, holeR, 0, Math.PI * 2);
    ctx.stroke();

    // QR centered
    ctx.drawImage(rawCanvasOrImg, margin, topH + margin);

    // Bottom Tag Pill
    const pillW = Math.round(qrW * 0.88);
    const pillX = (W - pillW) / 2;
    const pillY = topH + margin + qrH + Math.round(8 * scale);
    const rx = Math.round(botH * 0.32);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, botH, rx);
    else ctx.rect(pillX, pillY, pillW, botH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(botH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + botH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 11. HANGING STOREFRONT SIGN
  if (frameType === 'store-sign') {
    const margin = Math.round(qrW * 0.08);
    const topChainH = Math.round(qrW * 0.20);
    const pillH = Math.round(qrW * 0.18);
    const gap = Math.round(6 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + topChainH + pillH + gap;
    const lw = Math.max(2, Math.round(qrW * 0.026));
    canvas.width = W;
    canvas.height = H;

    // 2 Top Hanging Rings & Chains
    const ringY = Math.round(topChainH * 0.3);
    const ringL = Math.round(W * 0.28);
    const ringR = Math.round(W * 0.72);
    const signTopY = topChainH;
    const ringRadius = Math.round(6 * scale);

    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(ringL, ringY, ringRadius, 0, Math.PI * 2);
    ctx.arc(ringR, ringY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Chains dropping down to board
    ctx.beginPath();
    ctx.moveTo(ringL, ringY + ringRadius);
    ctx.lineTo(ringL, signTopY);
    ctx.moveTo(ringR, ringY + ringRadius);
    ctx.lineTo(ringR, signTopY);
    ctx.stroke();

    // Signboard Body
    const boardH = H - signTopY;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lw, signTopY, W - lw * 2, boardH - lw, Math.round(14 * scale));
    else ctx.rect(lw, signTopY, W - lw * 2, boardH - lw);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.stroke();

    ctx.drawImage(rawCanvasOrImg, margin, signTopY + margin);

    // Bottom Scan Pill
    const pillW = Math.round(qrW * 0.85);
    const pillX = (W - pillW) / 2;
    const pillY = signTopY + margin + qrH + gap;
    const rx = Math.round(pillH * 0.35);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, rx);
    else ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(pillH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + pillH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 12. LAPTOP / DESKTOP SCREEN MOCKUP
  if (frameType === 'laptop-screen') {
    const padX = Math.round(qrW * 0.12);
    const padTop = Math.round(qrW * 0.20);
    const baseH = Math.round(qrW * 0.16);
    const W = qrW + padX * 2;
    const H = qrH + padTop + baseH + Math.round(16 * scale);
    const lw = Math.max(2, Math.round(qrW * 0.026));
    canvas.width = W;
    canvas.height = H;

    const screenH = padTop + qrH + Math.round(10 * scale);
    const rTop = Math.round(12 * scale);
    const padSide = Math.round(8 * scale);

    // Display Screen Frame
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(padX - padSide, Math.round(4 * scale), qrW + padSide * 2, screenH, [rTop, rTop, 0, 0]);
    else ctx.rect(padX - padSide, Math.round(4 * scale), qrW + padSide * 2, screenH);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Webcam dot at top
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.arc(W / 2, Math.round(padTop * 0.35), 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(rawCanvasOrImg, padX, padTop);

    // Laptop Lower Base Deck
    const baseY = screenH + Math.round(4 * scale);
    const rBase = Math.round(8 * scale);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(Math.round(2 * scale), baseY, W - Math.round(4 * scale), baseH, [0, 0, rBase, rBase]);
    else ctx.rect(Math.round(2 * scale), baseY, W - Math.round(4 * scale), baseH);
    ctx.fillStyle = fgColor;
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(10, Math.round(baseH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, baseY + baseH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // 13. AWARD / CERTIFICATE RIBBON SEAL
  if (frameType === 'badge-ribbon') {
    const margin = Math.round(qrW * 0.08);
    const headerH = Math.round(qrW * 0.20);
    const ribbonTailH = Math.round(qrW * 0.20);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + headerH + ribbonTailH;
    const lw = Math.max(2, Math.round(qrW * 0.026));
    canvas.width = W;
    canvas.height = H;

    const sealH = H - ribbonTailH;

    // Dual Hanging Ribbon Tails at bottom
    ctx.fillStyle = fgColor;
    const ribbonW = Math.round(W * 0.24);
    
    // Left ribbon tail
    ctx.beginPath();
    ctx.moveTo(W * 0.26, sealH - Math.round(6 * scale));
    ctx.lineTo(W * 0.26, H);
    ctx.lineTo(W * 0.26 + ribbonW / 2, H - Math.round(12 * scale));
    ctx.lineTo(W * 0.26 + ribbonW, H);
    ctx.lineTo(W * 0.26 + ribbonW, sealH - Math.round(6 * scale));
    ctx.closePath();
    ctx.fill();

    // Right ribbon tail
    ctx.beginPath();
    ctx.moveTo(W * 0.50, sealH - Math.round(6 * scale));
    ctx.lineTo(W * 0.50, H);
    ctx.lineTo(W * 0.50 + ribbonW / 2, H - Math.round(12 * scale));
    ctx.lineTo(W * 0.50 + ribbonW, H);
    ctx.lineTo(W * 0.50 + ribbonW, sealH - Math.round(6 * scale));
    ctx.closePath();
    ctx.fill();

    // Main Badge Container
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lw, lw, W - lw * 2, sealH - lw * 2, Math.round(16 * scale));
    else ctx.rect(lw, lw, W - lw * 2, sealH - lw * 2);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Header Banner
    const pillW = qrW;
    const pillX = margin;
    const pillY = margin;
    const rx = Math.round(headerH * 0.30);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, headerH, rx);
    else ctx.rect(pillX, pillY, pillW, headerH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(headerH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + headerH / 2 + Math.max(1, Math.round(1 * scale)));

    ctx.drawImage(rawCanvasOrImg, margin, pillY + headerH + Math.round(6 * scale));

    return canvas;
  }

  // 14. ACRYLIC TABLE TENT / STAND
  if (frameType === 'table-tent') {
    const margin = Math.round(qrW * 0.08);
    const topH = Math.round(qrW * 0.18);
    const footH = Math.round(qrW * 0.16);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + topH + footH;
    const lw = Math.max(2, Math.round(qrW * 0.026));
    canvas.width = W;
    canvas.height = H;

    const standH = H - footH;

    // Slanted Acrylic Stand Body
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lw, lw, W - lw * 2, standH, [Math.round(10 * scale), Math.round(10 * scale), 0, 0]);
    else ctx.rect(lw, lw, W - lw * 2, standH);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Top Category Header Pill
    const pillW = Math.round(qrW * 0.88);
    const pillX = (W - pillW) / 2;
    const pillY = margin;
    const rx = Math.round(topH * 0.32);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, topH, rx);
    else ctx.rect(pillX, pillY, pillW, topH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(topH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + topH / 2 + Math.max(1, Math.round(1 * scale)));

    ctx.drawImage(rawCanvasOrImg, margin, pillY + topH + Math.round(6 * scale));

    // 3D Perspective Stand Base Feet
    const footY = standH;
    const footInset = Math.round(12 * scale);
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.moveTo(0, footY + footH);
    ctx.lineTo(W, footY + footH);
    ctx.lineTo(W - footInset, footY);
    ctx.lineTo(footInset, footY);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  // 15. CYBER / HIGH-TECH HUD FRAME
  if (frameType === 'neon-glow') {
    const margin = Math.round(qrW * 0.10);
    const pillH = Math.round(qrW * 0.18);
    const gap = Math.round(10 * scale);
    const W = qrW + margin * 2;
    const H = qrH + margin * 2 + pillH + gap;
    const lw = Math.max(2, Math.round(qrW * 0.026));
    const cut = Math.round(qrW * 0.08);
    canvas.width = W;
    canvas.height = H;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    // Chamfered / Sliced Tech HUD Outer Frame
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cut, 0);
    ctx.lineTo(W - cut, 0);
    ctx.lineTo(W, cut);
    ctx.lineTo(W, H - cut);
    ctx.lineTo(W - cut, H);
    ctx.lineTo(cut, H);
    ctx.lineTo(0, H - cut);
    ctx.lineTo(0, cut);
    ctx.closePath();
    ctx.stroke();

    // Corner Tech Accent Blocks
    const th = Math.max(1, Math.round(4 * scale));
    ctx.fillStyle = fgColor;
    ctx.fillRect(0, 0, cut, th);
    ctx.fillRect(0, 0, th, cut);
    ctx.fillRect(W - cut, 0, cut, th);
    ctx.fillRect(W - th, 0, th, cut);
    ctx.fillRect(0, H - cut, cut, th);
    ctx.fillRect(0, H - th, th, cut);
    ctx.fillRect(W - th, H - cut, th, cut);
    ctx.fillRect(W - cut, H - th, cut, th);

    ctx.drawImage(rawCanvasOrImg, margin, margin);

    // Tech Center Label Pill
    const pillW = Math.round(qrW * 0.85);
    const pillX = (W - pillW) / 2;
    const pillY = margin + qrH + Math.round(8 * scale);

    ctx.fillStyle = fgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, Math.max(1, Math.round(4 * scale)));
    else ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = getContrastTextColor(fgColor);
    ctx.font = 'bold ' + Math.max(11, Math.round(pillH * 0.44)) + 'px "DM Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, pillY + pillH / 2 + Math.max(1, Math.round(1 * scale)));

    return canvas;
  }

  // Fallback for any other frame
  return rawCanvasOrImg;
}

  // 3. Build CustomQRCode Options from Style Object
  

  // URL normalization (exact implementation from openqr-main/app.js)
  function normalizeUrlInput(raw) {
    if (raw === null || raw === undefined) return { ok: false, url: null, reason: null };
    const trimmed = String(raw).trim();
    if (!trimmed) return { ok: false, url: null, reason: null };

    const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    let candidate = trimmed;

    if (schemeMatch) {
      const scheme = schemeMatch[1].toLowerCase();
      if (scheme === 'http' || scheme === 'https') {
        candidate = trimmed;
      } else {
        return {
          ok: false,
          url: null,
          reason: 'Only http(s) links are supported for URL QR codes'
        };
      }
    } else if (trimmed.startsWith('//')) {
      candidate = 'https:' + trimmed;
    } else {
      candidate = 'https://' + trimmed;
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          ok: false,
          url: null,
          reason: 'Only http(s) links are supported for URL QR codes'
        };
      }
      const hostname = parsed.hostname;
      if (!hostname || !hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
        return {
          ok: false,
          url: null,
          reason: 'Please enter a valid domain (e.g. example.com)'
        };
      }
      return { ok: true, url: candidate, reason: null };
    } catch(e) {
      return {
        ok: false,
        url: null,
        reason: 'Please enter a valid URL'
      };
    }
  }

  // QR Options Builder - Pure Free Defaults
  function buildCustomQrOptions(data, width, height) {
    const fg = document.getElementById('colorFg')?.value || '#000000';
    const bg = document.getElementById('colorBg')?.value || '#ffffff';
    const isTransparent = !!document.getElementById('transparentBg')?.checked;
    const errLevel = document.getElementById('errorLevel')?.value || 'M';

    return {
      width: width,
      height: height,
      margin: Math.max(8, Math.round(width * 0.1)),
      data: data,
      dotsOptions: {
        color: fg,
        type: 'square'
      },
      backgroundOptions: {
        color: isTransparent ? 'transparent' : bg
      },
      cornersSquareOptions: {
        color: fg,
        type: 'square'
      },
      cornersDotOptions: {
        color: fg,
        type: 'square'
      },
      qrOptions: {
        errorCorrectionLevel: errLevel
      }
    };
  }

  // Extract Payload by QR Type
  function getQRData() {
    switch (currentType) {
      case 'url': {
        const val = document.getElementById('url-input')?.value;
        const norm = normalizeUrlInput(val);
        return norm.ok ? norm.url : null;
      }
      case 'text':
        return document.getElementById('text-input')?.value.trim() || null;
      case 'wifi': {
        const ssid = document.getElementById('wifi-ssid')?.value.trim();
        if (!ssid) return null;
        const pass = document.getElementById('wifi-pass')?.value || '';
        const enc = document.getElementById('wifi-enc')?.value || 'WPA';
        const hidden = document.getElementById('wifi-hidden')?.checked ? 'true' : 'false';
        return 'WIFI:S:' + ssid + ';T:' + enc + ';P:' + pass + ';H:' + hidden + ';;';
      }
      case 'vcard': {
        const fn = document.getElementById('vcard-fn')?.value.trim();
        if (!fn) return null;
        const org = document.getElementById('vcard-org')?.value.trim();
        const title = document.getElementById('vcard-title')?.value.trim();
        const phone = document.getElementById('vcard-phone')?.value.trim();
        const email = document.getElementById('vcard-email')?.value.trim();
        const url = document.getElementById('vcard-url')?.value.trim();
        let v = 'BEGIN:VCARD\nVERSION:3.0\n';
        v += 'FN:' + fn + '\n';
        if (org) v += 'ORG:' + org + '\n';
        if (title) v += 'TITLE:' + title + '\n';
        if (phone) v += 'TEL:' + phone + '\n';
        if (email) v += 'EMAIL:' + email + '\n';
        if (url) v += 'URL:' + url + '\n';
        v += 'END:VCARD';
        return v;
      }
      case 'email': {
        const to = document.getElementById('email-to')?.value.trim();
        if (!to) return null;
        const sub = document.getElementById('email-sub')?.value.trim();
        const body = document.getElementById('email-body')?.value.trim();
        let uri = 'mailto:' + encodeURIComponent(to);
        const params = [];
        if (sub) params.push('subject=' + encodeURIComponent(sub));
        if (body) params.push('body=' + encodeURIComponent(body));
        if (params.length) uri += '?' + params.join('&');
        return uri;
      }
      case 'sms': {
        const num = document.getElementById('sms-num')?.value.trim();
        if (!num) return null;
        const msg = document.getElementById('sms-msg')?.value.trim();
        let uri = 'smsto:' + num;
        if (msg) uri += ':' + msg;
        return uri;
      }
      case 'location': {
        const lat = document.getElementById('loc-lat')?.value.trim();
        const lng = document.getElementById('loc-lng')?.value.trim();
        if (!lat || !lng) return null;
        return 'geo:' + lat + ',' + lng;
      }
      case 'event': {
        const title = document.getElementById('event-title')?.value.trim();
        if (!title) return null;
        const start = document.getElementById('event-start')?.value.trim();
        const end = document.getElementById('event-end')?.value.trim();
        const loc = document.getElementById('event-loc')?.value.trim();
        let ics = 'BEGIN:VEVENT\n';
        ics += 'SUMMARY:' + title + '\n';
        if (start) ics += 'DTSTART:' + start.replace(/[-:]/g, '') + '\n';
        if (end) ics += 'DTEND:' + end.replace(/[-:]/g, '') + '\n';
        if (loc) ics += 'LOCATION:' + loc + '\n';
        ics += 'END:VEVENT';
        return ics;
      }
      default:
        return null;
    }
  }

  // Composited Canvas Generation (Free frame compositing)
  async function getCompositedCanvas(targetSize) {
    const data = getQRData();
    if (!data || !window.CustomQRCode) return null;

    const size = targetSize || 400;
    const options = buildCustomQrOptions(data, size, size);

    const isTransparent = document.getElementById('transparentBg')?.checked;
    const fgColor = document.getElementById('colorFg')?.value || '#000000';
    const bgColor = isTransparent ? 'transparent' : (document.getElementById('colorBg')?.value || '#ffffff');
    const frameText = document.getElementById('frameTextInput')?.value || currentFrameText || 'SCAN ME';

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = size + 'px';
    tempContainer.style.height = size + 'px';
    document.body.appendChild(tempContainer);

    try {
      const tempInstance = new window.CustomQRCode(options);
      if (typeof tempInstance.append === 'function') {
        await tempInstance.append(tempContainer);
      }
      if (tempInstance._canvasDrawingPromise) {
        await tempInstance._canvasDrawingPromise;
      } else if (tempInstance._svgDrawingPromise) {
        await tempInstance._svgDrawingPromise;
      }

      let sourceElement = tempContainer.querySelector('canvas') || tempContainer.querySelector('svg');
      if (!sourceElement && typeof tempInstance.toDataURL === 'function') {
        const rawDataUrl = await tempInstance.toDataURL('png');
        if (rawDataUrl) {
          const img = new Image();
          await new Promise(r => { img.onload = r; img.onerror = r; img.src = rawDataUrl; });
          sourceElement = img;
        }
      }

      if (!sourceElement) {
        if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
        return null;
      }

      const composited = createStickerCanvas(sourceElement, currentFrame, fgColor, bgColor, isTransparent, frameText);
      if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
      return composited;
    } catch(err) {
      if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
      console.error('getCompositedCanvas error:', err);
      return null;
    }
  }

  // Main QR Code Generation
  async function generateQRCode() {
    const data = getQRData();
    const container = document.getElementById('previewQr');
    if (!container) return;

    if (!data) {
      container.innerHTML = '<div class="preview-placeholder"><span>Enter details to preview QR</span></div>';
      return;
    }

    if (!window.CustomQRCode) {
      setTimeout(generateQRCode, 100);
      return;
    }

    try {
      const composited = await getCompositedCanvas(260);
      if (composited) {
        container.innerHTML = '';
        container.appendChild(composited);
      }
      lastQRData = data;
    } catch (e) {
      console.error('QR Gen error:', e);
      container.innerHTML = '<div class="preview-placeholder"><span>Error generating QR code</span></div>';
    }
  }

  function updateUrlErrorDisplay() {
    const input = document.getElementById('url-input');
    const errorEl = document.getElementById('url-error');
    if (!input || !errorEl) return;
    const raw = input.value.trim();
    if (!raw) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
      return;
    }
    const norm = normalizeUrlInput(raw);
    if (!norm.ok && norm.reason) {
      errorEl.textContent = norm.reason;
      errorEl.style.display = 'block';
    } else {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  // Debounced generator trigger
  function scheduleGen() {
    clearTimeout(genDebounceTimer);
    genDebounceTimer = setTimeout(() => {
      if (currentType === 'url') updateUrlErrorDisplay();
      if (currentGenMode === 'qr') generateQRCode();
      else generateBarcode();
    }, 180);
  }

  // Barcode Generation
  function generateBarcode() {
    const container = document.getElementById('previewBarcode');
    if (!container) return;
    const raw = document.getElementById('barcode-value')?.value.trim();
    const format = document.getElementById('barcode-format')?.value || 'CODE128';

    if (!raw) {
      container.innerHTML = '<div class="preview-placeholder"><span>Enter barcode value</span></div>';
      return;
    }

    try {
      container.innerHTML = '<svg id="barcodeSvg"></svg>';
      const svg = document.getElementById('barcodeSvg');
      if (window.JsBarcode) {
        window.JsBarcode(svg, raw, {
          format: format,
          lineColor: document.getElementById('barcodeColor')?.value || '#000000',
          background: document.getElementById('barcodeBg')?.value || '#ffffff',
          width: 2,
          height: 100,
          displayValue: true,
          font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });
      }
    } catch (e) {
      container.innerHTML = '<div class="preview-placeholder"><span>Invalid characters for format</span></div>';
    }
  }

  // Download Handler (PNG / SVG / PDF)
  async function downloadQR(format) {
    const data = getQRData();
    if (!data) {
      alert('Please enter details to generate a QR code first.');
      return;
    }

    const filename = 'openqr-' + Date.now();

    if (format === 'png') {
      const canvas = await getCompositedCanvas(2000);
      if (canvas) {
        canvas.toBlob(blob => {
          if (!blob) return;
          const a = document.createElement('a');
          a.download = filename + '.png';
          a.href = URL.createObjectURL(blob);
          a.click();
          URL.revokeObjectURL(a.href);
        }, 'image/png');
      }
      return;
    }

    if (format === 'svg') {
      const options = buildCustomQrOptions(data, 1000, 1000);
      options.type = 'svg';
      const qr = new window.CustomQRCode(options);
      const rawBlob = await qr.getRawData('svg');
      if (rawBlob) {
        const a = document.createElement('a');
        a.download = filename + '.svg';
        a.href = URL.createObjectURL(rawBlob);
        a.click();
        URL.revokeObjectURL(a.href);
      }
      return;
    }

    if (format === 'pdf') {
      const canvas = await getCompositedCanvas(1200);
      if (canvas && window.jspdf && window.jspdf.jsPDF) {
        const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 35, 40, 140, (140 * canvas.height) / canvas.width);
        pdf.save(filename + '.pdf');
      }
      return;
    }
  }

  function downloadBarcode(format) {
    const svg = document.getElementById('barcodeSvg');
    if (!svg) {
      alert('Please generate a barcode first.');
      return;
    }
    const filename = 'barcode-' + Date.now();

    if (format === 'svg') {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.download = filename + '.svg';
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }

    if (format === 'png') {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          const a = document.createElement('a');
          a.download = filename + '.png';
          a.href = URL.createObjectURL(blob);
          a.click();
          URL.revokeObjectURL(a.href);
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      return;
    }

    if (format === 'pdf') {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 35, 40, 140, (140 * canvas.height) / canvas.width);
        pdf.save(filename + '.pdf');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      return;
    }
  }

  // UI Handlers
  window.setType = function(type, el) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.type-panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById('panel-' + type);
    if (panel) panel.style.display = 'block';
    scheduleGen();
  };

  window.switchGenMode = function(mode) {
    currentGenMode = mode;
    const qrLayout = document.getElementById('genQrLayout');
    const barcodeLayout = document.getElementById('genBarcodeLayout');
    const tabQr = document.getElementById('tabModeQr');
    const tabBarcode = document.getElementById('tabModeBarcode');
    if (mode === 'qr') {
      if (qrLayout) qrLayout.style.display = 'grid';
      if (barcodeLayout) barcodeLayout.style.display = 'none';
      tabQr?.classList.add('active');
      tabBarcode?.classList.remove('active');
      scheduleGen();
    } else {
      if (qrLayout) qrLayout.style.display = 'none';
      if (barcodeLayout) barcodeLayout.style.display = 'grid';
      tabQr?.classList.remove('active');
      tabBarcode?.classList.add('active');
      generateBarcode();
    }
  };

  window.selectStickerFrame = function(frame) {
    currentFrame = frame;
    document.querySelectorAll('#stickerFrameChips .sticker-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.frame === frame);
    });
    const frameWrap = document.getElementById('frameTextWrap');
    if (frameWrap) {
      frameWrap.style.display = (frame === 'none') ? 'none' : 'block';
    }
    scheduleGen();
  };

  window.updateFrameText = function(text) {
    currentFrameText = text || 'SCAN ME';
    scheduleGen();
  };

  window.toggleTransparentBg = function() {
    const isTransparent = document.getElementById('transparentBg')?.checked;
    const bgWrap = document.getElementById('colorBgWrap');
    if (bgWrap) {
      if (isTransparent) bgWrap.classList.add('disabled');
      else bgWrap.classList.remove('disabled');
    }
    scheduleGen();
  };

  // Hero Live Card
  window.generateHeroQR = function(urlToEncode) {
    const container = document.getElementById('heroQr');
    if (!container || !window.CustomQRCode) return;
    try {
      container.innerHTML = '';
      const isMobile = window.innerWidth <= 600;
      const qrSize = isMobile ? 160 : 224;
      const data = urlToEncode || 'https://openqr.tech';
      const options = buildCustomQrOptions(data, qrSize, qrSize);
      const hero = new window.CustomQRCode(options);
      hero.append(container);
    } catch(e) {}
  };

  let heroDebounce = null;
  window.handleHeroLiveInput = function(e) {
    clearTimeout(heroDebounce);
    const raw = e.target.value;
    heroDebounce = setTimeout(() => {
      const trimmed = raw ? raw.trim() : '';
      const lbl = document.getElementById('heroQrLabel');
      if (!trimmed) {
        generateHeroQR('https://openqr.tech');
        if (lbl) lbl.textContent = 'openqr.tech';
        return;
      }
      const norm = normalizeUrlInput(trimmed);
      if (norm.ok && norm.url) {
        generateHeroQR(norm.url);
        if (lbl) {
          try { lbl.textContent = new URL(norm.url).hostname || norm.url; }
          catch(_) { lbl.textContent = trimmed; }
        }
      } else {
        generateHeroQR('https://openqr.tech');
        if (lbl) lbl.textContent = 'openqr.tech';
      }
    }, 200);
  };

  window.customizeFromHero = function() {
    const input = document.getElementById('heroLinkInput');
    const raw = input ? input.value.trim() : '';
    const norm = normalizeUrlInput(raw);
    const valueToUse = norm.ok && norm.url ? raw : 'https://openqr.tech';

    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      urlInput.value = valueToUse;
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      setType('url', document.querySelector('.type-btn[data-type="url"]'));
      switchGenMode('qr');
      setTimeout(generateQRCode, 100);
    }
    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    generateHeroQR();
    scheduleGen();
  });

  // Exported utilities
  window.scheduleGen = scheduleGen;
  window.generateQRCode = generateQRCode;
  window.generateBarcode = generateBarcode;
  window.downloadQR = downloadQR;
  window.downloadBarcode = downloadBarcode;
  window.normalizeUrlInput = normalizeUrlInput;
  window.buildCustomQrOptions = buildCustomQrOptions;
  window.getQRData = getQRData;
  window.getCompositedCanvas = getCompositedCanvas;

})(typeof window !== 'undefined' ? window : this);
