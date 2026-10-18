# OpenQR Core

OpenQR Core is a free, static, 100% client-side QR code and barcode generator and scanner.

Generation and decoding run in your browser. The page loads open-source libraries from CDNs, and the scanner's barcode lookup contacts Open Food Facts / Open Beauty Facts directly.

---

## Features

- **Static QR Code Generation**:
  - Types: Plain Text, Website URL, Wi-Fi Network, Contact Card (vCard 3.0), Email, SMS, Geo Coordinates, Calendar Event.
  - Free default styling: Square modules, square corner eyes, custom foreground and background colors, transparent background toggle, and error correction levels (L, M, Q, H).
  - 14 free canvas sticker frames & borders with editable label text.
- **Barcode Generation**:
  - Symbologies: Code 128, Code 39, UPC-A, EAN-13 via JsBarcode.
- **Exports**:
  - Raster: PNG (standard and high-resolution 2000px).
  - Vector: Clean SVG.
  - Document: Printable PDF via jsPDF.
- **Client-Side Scanner**:
  - Live camera scanning and file drop decoding via html5-qrcode.
  - Local scan history saved in `localStorage`.
  - Direct client-to-API lookup via Open Food Facts / Open Beauty Facts for retail barcodes.

---

## Differences from openqr.tech

This repository contains a standalone, point-in-time snapshot of the core static generation engine powering [openqr.tech](https://openqr.tech).

The hosted deployment at openqr.tech includes additional hosted and commercial features not present in this static core:
- Dynamic QR codes with cloud-backed editable destinations and redirect analytics
- User accounts and cloud scan synchronization
- Pro stylized patterns (dots, rounded, classy corners, and gradient fills)
- Pro pattern showcase animations
- Integrated marketing poster/flyer canvas designer

---

## Quick Start

OpenQR Core requires no backend, Node.js runtime, build step, or database:

1. Clone this repository:
   ```bash
   git clone https://github.com/NvxStrikes/OpenQR-Core.git
   ```
2. Serve the directory with any static web server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your web browser.

---

## Trademark & Branding Notice

The MIT License covers the underlying code and scripts in this repository.

The names **"OpenQR"**, **"OpenQR Core"**, the OpenQR logo, and openqr.tech branding are trademarks of NovaStrikes and are not covered by the code license. You may not use NovaStrikes branding for commercial forks without permission.

---

## Third-Party Software

This repository loads third-party open-source libraries from CDNs with pinned versions and Subresource Integrity (SRI) hashes where supported:
- **html5-qrcode** (Apache-2.0)
- **JsBarcode** (MIT)
- **jsPDF** (MIT)
- **custom-qr-code** (MIT)

Full license texts and copyright attributions are available in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
