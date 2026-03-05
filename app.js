/* =============================================
   TRAVIGMA E-TICKET GENERATOR – APP LOGIC
   ============================================= */

'use strict';

// ── Globals ──────────────────────────────────────────────────────────────────
let currentType = null;   // 'flight' | 'train' | 'bus' | 'hotel'
let passengerCount = 1;
let legCount = 1;
let facilityCount = 1;

const GAS_URL = "https://script.google.com/macros/s/AKfycbzXAq09hoVAhPz0qAjyK4HgKLJFmpQMQn4KHeRri1m5TJ1EOj3DzVyBMBnebca7gBl1Zw/exec";

// ── Utilities ─────────────────────────────────────────────────────────────────
function genBookingId() {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `TRV${yy}${mm}${dd}${rand}`;
}

function genECode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function formatCurrency(val) {
  const num = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  return num.toLocaleString('id-ID');
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Logo Reference ──────────────────────────────────────────────────────────
function getLogoHtml(width = 70) {
  return `<img src="logo.png" width="${width}" alt="Travigma Logo">`;
}

const LOGO_IMG = getLogoHtml(140);
const LOGO_SM_IMG = getLogoHtml(44);

// ── Airline Logo Helper ─────────────────────────────────────────────────────
const AIRLINE_IATA = {
  'garuda': 'GA',
  'lion': 'JT',
  'batik': 'ID',
  'citilink': 'QG',
  'airasia': 'QZ',
  'sriwijaya': 'SJ',
  'super air jet': 'IU',
  'pelita': 'IP',
  'nam': 'IN',
  'wings': 'IW',
  'qatar': 'QR',
  'emirates': 'EK',
  'singapore': 'SQ',
  'cathay': 'CX',
  'ana': 'NH',
  'all nippon': 'NH',
  'jal': 'JL',
  'japan airlines': 'JL',
  'air china': 'CA',
  'cebu pacific': '5J',
  'china airlines': 'CI',
  'china southern': 'CZ',
  'etihad': 'EY',
  'eva': 'BR',
  'jetstar': 'JQ',
  'klm': 'KL',
  'korean': 'KE',
  'kuwait': 'KU',
  'malaysia': 'MH',
  'mihin lanka': 'MJ',
  'philippine': 'PR',
  'qantas': 'QF',
  'royal brunei': 'BI',
  'saudi': 'SV',
  'sichuan': '3U',
  'thai': 'TG',
  'tiger': 'TR',
  'turkish': 'TK',
  'valuair': 'VF',
  'vietnam': 'VN',
  'yemenia': 'IY',
  'merpati': 'MZ',
  'aviastar': 'MV',
  'trigana': 'TN',
  'mandala': 'RI',
  'kalstar': 'KD',
  'airfast': 'FS',
  'express air': 'XN',
  'sky aviation': 'SY',
  'aeroflot': 'SU',
  'aeromexico': 'AM',
  'air canada': 'AC',
  'air france': 'AF',
  'air new zealand': 'NZ',
  'american airlines': 'AA',
  'asiana': 'OZ',
  'british airways': 'BA',
  'copa': 'CM',
  'delta': 'DL',
  'el al': 'LY',
  'egyptair': 'MS',
  'ethiopian': 'ET',
  'flydubai': 'FZ',
  'hainan': 'HU',
  'iberia': 'IB',
  'kenya airways': 'KQ',
  'lufthansa': 'LH',
  'royal air maroc': 'AT',
  'swiss': 'LX',
  'tui airways': 'BY',
  'united airlines': 'UA',
  'virgin atlantic': 'VS',
  'xiamen': 'MF',
  'avianca': 'AV',
  'pelita': 'IP',
  'pelita air': 'IP',
  'transnusa': '8B'
};

function getAirlineLogo(airline) {
  if (!airline) return '';
  const low = airline.toLowerCase();

  if (low.includes('pelita')) {
    return `<div class="airline-logo-box">
      <img src="https://images.kiwi.com/airlines/64/IP.png" alt="Pelita Air" style="object-fit: contain; width: 100%; height: 100%;"
           onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Pelita+Air&background=random&color=fff&rounded=true&bold=true';">
    </div>`;
  }

  if (low === 'transnusa' || low.includes('transnusa')) {
    return `<div class="airline-logo-box">
      <img src="https://images.kiwi.com/airlines/64/8B.png" alt="TransNusa" style="object-fit: contain; width: 100%; height: 100%;"
           onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=TransNusa&background=random&color=fff&rounded=true&bold=true';">
    </div>`;
  }

  let iata = null;

  // Exact match string checking to prevent substring bugs
  for (const key in AIRLINE_IATA) {
    if (low === key || (low.includes(key) && key.length > 2)) {
      iata = AIRLINE_IATA[key];
      break;
    }
  }

  if (iata) {
    // API Gambar Airline Terpercaya & Super Cepat via Aviasales/Travelpayouts CDN
    return `<div class="airline-logo-box">
      <img src="https://pics.avs.io/200/200/${iata}.png" alt="${airline}" style="object-fit: contain;"
           onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(airline)}&background=random&color=fff&rounded=true&bold=true';">
    </div>`;
  }

  // Last Resort Fallback (Jika map nama custom tidak ada di list)
  return `<div class="airline-logo-box">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(airline)}&background=random&color=fff&rounded=true&bold=true" alt="${airline}">
    </div>`;
}


// ── Screen Navigation ──────────────────────────────────────────────────────────
function goHome() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
  pullFromSheet(); // Auto-load history when returning home
}

function showFormScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-form').classList.add('active');
}

function selectType(type) {
  currentType = type;
  passengerCount = 1;
  legCount = 1;
  facilityCount = 1;

  const titles = {
    flight: '✈️ Flight E-ticket',
    train: '🚆 Train E-ticket',
    bus: '🚌 Bus E-ticket',
    hotel: '🏨 Hotel Voucher',
    invoice: '🧾 Invoice Perjalanan'
  };
  document.getElementById('form-title').textContent = titles[type];

  renderForm(type);
  showFormScreen();
}

// ── Form Renderers ─────────────────────────────────────────────────────────────
function renderForm(type) {
  const c = document.getElementById('form-container');
  if (type === 'flight') c.innerHTML = formFlight();
  else if (type === 'train') c.innerHTML = formTrain();
  else if (type === 'bus') c.innerHTML = formBus();
  else if (type === 'hotel') c.innerHTML = formHotel();
  else if (type === 'invoice') c.innerHTML = formInvoice();
}

// ─ INVOICE ─
function formInvoice() {
  return `
  <div class="form-section">
    <h3>📋 Invoice Info</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Invoice Number</label>
        <input type="text" id="inv-idx" value="${genECode(8)}" />
      </div>
      <div class="form-group">
        <label>Date Issued</label>
        <input type="date" id="inv-date" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group form-full">
        <label>Ditujukan Kepada (To)</label>
        <input type="text" id="inv-to" placeholder="cth: LPP TVRI Jakarta" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>🧾 Item List (Rincian Tagihan)</h3>
    <div class="passenger-list" id="passenger-list">
      ${passengerRowInvoice(1)}
    </div>
    <button class="add-btn" onclick="addPassenger('invoice')">+ Tambah Item / Penumpang</button>
  </div>

  <div class="form-section">
    <h3>💳 Payment Details</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Nama Rekening</label>
        <input type="text" id="inv-bank-name" value="Enigma Agility Indonesia" />
      </div>
      <div class="form-group">
        <label>Nomor Rekening (BCA)</label>
        <input type="text" id="inv-bank-acc" value="4410-1002309-56-9" />
      </div>
      <div class="form-group">
        <label>Penandatangan (Direktur)</label>
        <input type="text" id="inv-sign-name" value="Muhamad Jayadi" />
      </div>
    </div>
  </div>
  `;
}

function passengerRowInvoice(n) {
  return `<div class="passenger-row" id="pax-${n}">
    <div class="form-group">
      <label>Nama Penumpang / Item</label>
      <input type="text" id="pax-name-${n}" placeholder="cth: Brigita Sandra Kwee" />
    </div>
    <div class="form-group">
      <label>Maskapai / Layanan</label>
      <input type="text" id="pax-carrier-${n}" placeholder="cth: Batik Air" />
    </div>
    <div class="form-group">
      <label>E-ticket / PNR</label>
      <input type="text" id="pax-ticket-${n}" placeholder="cth: UXLAGJ" />
    </div>
    <div class="form-group">
      <label>Tgl Berangkat</label>
      <input type="text" id="pax-date-${n}" placeholder="cth: 28-Dec-25" />
    </div>
    <div class="form-group">
      <label>Harga (Rp)</label>
      <input type="text" id="pax-price-${n}" placeholder="cth: 4897186" />
    </div>
    ${n > 1 ? `<button class="remove-btn" onclick="removePax(${n})">✕</button>` : '<div></div>'}
  </div>`;
}

// ─ FLIGHT ─
function formFlight() {
  return `
  <div class="form-section">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0;">📋 Booking Info</h3>
      <button onclick="fillDummyFlight()" style="background-color: #f59e0b; color: white; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">⚡ Isi Data Cepat (Testing)</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Travigma Booking ID</label>
        <input type="text" id="f-booking-id" value="${genBookingId()}" />
      </div>
      <div class="form-group">
        <label>Date Issued</label>
        <input type="date" id="f-date-issued" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>Airline Booking Code / PNR (Pergi)</label>
        <input type="text" id="f-pnr" placeholder="cth: MNBP7B" />
      </div>
      <div class="form-group">
        <label>Airline Booking Code / PNR (Pulang) – opsional</label>
        <input type="text" id="f-pnr-return" placeholder="cth: RZNBUY" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>👥 Passenger Detail</h3>
    <div class="passenger-list" id="passenger-list">
      ${passengerRowFlight(1)}
    </div>
    <button class="add-btn" onclick="addPassenger('flight')">+ Tambah Penumpang</button>
  </div>

  <div class="form-section">
    <h3>✈️ Flight Detail</h3>
    <div id="leg-list">
      ${flightLeg(1)}
    </div>
    <button class="add-btn" onclick="addLeg()">+ Tambah Leg Penerbangan</button>
  </div>

  <div class="form-section">
    <h3>🧳 Flight Facilities</h3>
    <div class="facility-list" id="facility-list">
      ${facilityRow(1)}
    </div>
    <button class="add-btn" onclick="addFacility()">+ Tambah Fasilitas</button>
  </div>

  <div class="form-section">
    <h3>💳 Payment Detail</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Total Cost (Rp)</label>
        <input type="text" id="f-total" placeholder="cth: 12567548" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>ℹ️ Important Information</h3>
    <div class="form-group">
      <label>Informasi Penting (satu per baris)</label>
      <textarea id="f-important" rows="6">Airline Booking Code bisa digunakan untuk check-in, memilih kursi, membeli makanan dan bagasi.
Semua tanggal dan waktu keberangkatan dan kedatangan ditampilkan sesuai waktu setempat.
Tiket harus digunakan sesuai urutan yang ditentukan dalam pemesanan.
Mohon tiba dibandara paling lambat 3 Jam sebelum keberangkatan untuk memastikan Anda punya cukup waktu check-in.
Bukti identitas Anda harus valid untuk minimal 6 bulan setelah pemesanan Anda.
Visa transit mungkin diperlukan untuk transit di negara ketiga. Kami menyarankan Anda mengkonfirmasi detail visa dengan kedutaan negara yang relevan.</textarea>
    </div>
  </div>`;
}

function passengerRowFlight(n) {
  return `<div class="passenger-row" id="pax-${n}">
    <div class="form-group">
      <label>Nama Penumpang</label>
      <input type="text" id="pax-name-${n}" placeholder="cth: Mrs. Eva Zulia" />
    </div>
    <div class="form-group">
      <label>Kategori</label>
      <select id="pax-cat-${n}">
        <option>Dewasa</option><option>Anak</option><option>Bayi</option>
      </select>
    </div>
    <div class="form-group">
      <label>Kelas</label>
      <select id="pax-class-${n}">
        <option>Economy</option><option>Business</option><option>First</option>
      </select>
    </div>
    <div class="form-group">
      <label>Ticket Number</label>
      <input type="text" id="pax-ticket-${n}" placeholder="cth: 7783007499185" />
    </div>
    ${n > 1 ? `<button class="remove-btn" onclick="removePax(${n})">✕</button>` : '<div></div>'}
  </div>`;
}

function flightLeg(n) {
  return `<div class="leg-card" id="leg-${n}">
    <div class="leg-header">
      <span>Leg ${n}</span>
      ${n > 1 ? `<button class="remove-btn" onclick="removeLeg(${n})">✕</button>` : ''}
    </div>
    <div class="form-grid cols-3">
      <div class="form-group">
        <label>Maskapai</label>
        <input type="text" id="leg-airline-${n}" placeholder="cth: Citilink" />
      </div>
      <div class="form-group">
        <label>Kode Penerbangan</label>
        <input type="text" id="leg-flightnum-${n}" placeholder="cth: QG-952" />
      </div>
      <div class="form-group">
        <label>Bagasi Terdaftar (kg)</label>
        <input type="text" id="leg-baggage-${n}" placeholder="cth: 20 Kg" />
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Kota Asal</label>
        <input type="text" id="leg-from-city-${n}" placeholder="Jakarta" />
      </div>
      <div class="form-group">
        <label>Kota Tujuan</label>
        <input type="text" id="leg-to-city-${n}" placeholder="Padang" />
      </div>
      <div class="form-group">
        <label>Bandara Asal (lengkap)</label>
        <input type="text" id="leg-from-airport-${n}" placeholder="Soekarno Hatta International Airport" />
      </div>
      <div class="form-group">
        <label>Bandara Tujuan (lengkap)</label>
        <input type="text" id="leg-to-airport-${n}" placeholder="Minangkabau International Airport" />
      </div>
      <div class="form-group">
        <label>Kode IATA Asal</label>
        <input type="text" id="leg-from-iata-${n}" maxlength="3" placeholder="CGK" />
      </div>
      <div class="form-group">
        <label>Kode IATA Tujuan</label>
        <input type="text" id="leg-to-iata-${n}" maxlength="3" placeholder="PDG" />
      </div>
      <div class="form-group">
        <label>Waktu Berangkat</label>
        <input type="time" id="leg-dep-time-${n}" />
      </div>
      <div class="form-group">
        <label>Waktu Tiba</label>
        <input type="time" id="leg-arr-time-${n}" />
      </div>
      <div class="form-group">
        <label>Tanggal Berangkat</label>
        <input type="date" id="leg-dep-date-${n}" />
      </div>
      <div class="form-group">
        <label>Tanggal Tiba</label>
        <input type="date" id="leg-arr-date-${n}" />
      </div>
    </div>
  </div>`;
}

function facilityRow(n) {
  return `<div class="facility-row" id="fac-${n}">
    <input type="text" id="fac-text-${n}" placeholder="cth: 7 Kg Dimensi bagasi mengikuti kebijakan maskapai" />
    ${n > 1 ? `<button class="remove-btn" onclick="removeFac(${n})">✕</button>` : ''}
  </div>`;
}

// ─ TRAIN ─
function formTrain() {
  return `
  <div class="form-section">
    <h3>📋 Booking Info</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Travigma Booking ID</label>
        <input type="text" id="t-booking-id" value="${genBookingId()}" />
      </div>
      <div class="form-group">
        <label>Date Issued</label>
        <input type="date" id="t-date-issued" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>Kode Booking (E-Code)</label>
        <input type="text" id="t-ecode" value="${genECode()}" placeholder="cth: RS39XTG" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>👥 Passenger Detail</h3>
    <div class="passenger-list" id="passenger-list">
      ${passengerRowTrain(1)}
    </div>
    <button class="add-btn" onclick="addPassenger('train')">+ Tambah Penumpang</button>
  </div>

  <div class="form-section">
    <h3>🚆 Train Detail</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Kota Asal</label>
        <input type="text" id="t-from-city" placeholder="Jakarta" />
      </div>
      <div class="form-group">
        <label>Kota Tujuan</label>
        <input type="text" id="t-to-city" placeholder="Yogyakarta" />
      </div>
      <div class="form-group">
        <label>Nama Kereta</label>
        <input type="text" id="t-train-name" placeholder="cth: Taksaka" />
      </div>
      <div class="form-group">
        <label>Kelas / Jumlah Kursi</label>
        <input type="text" id="t-class" placeholder="cth: Eksekutif (46)" />
      </div>
      <div class="form-group">
        <label>Stasiun Asal</label>
        <input type="text" id="t-from-station" placeholder="cth: Sta. Gambir" />
      </div>
      <div class="form-group">
        <label>Stasiun Tujuan</label>
        <input type="text" id="t-to-station" placeholder="cth: Sta. Yogyakarta" />
      </div>
      <div class="form-group">
        <label>Waktu Berangkat</label>
        <input type="time" id="t-dep-time" />
      </div>
      <div class="form-group">
        <label>Waktu Tiba</label>
        <input type="time" id="t-arr-time" />
      </div>
      <div class="form-group">
        <label>Tanggal Berangkat</label>
        <input type="date" id="t-dep-date" />
      </div>
      <div class="form-group">
        <label>Tanggal Tiba</label>
        <input type="date" id="t-arr-date" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>🧳 Facilities</h3>
    <div class="facility-list" id="facility-list">
      ${facilityRow(1)}
    </div>
    <button class="add-btn" onclick="addFacility()">+ Tambah Fasilitas</button>
  </div>

  <div class="form-section">
    <h3>💳 Payment Detail</h3>
    <div class="form-group">
      <label>Total Payment (Rp)</label>
      <input type="text" id="t-total" placeholder="cth: 2714000" />
    </div>
  </div>

  <div class="form-section">
    <h3>ℹ️ Important Information</h3>
    <div class="form-group">
      <textarea id="t-important" rows="5">E-ticket ini harus digunakan untuk boarding pass di stasiun, dan 7x24 jam sebelum keberangkatan.
Untuk boarding, tunjukkan tanda pengenal resmi yang sesuai digunakan pada saat pemesanan.
Mohon tiba di stasiun setidaknya 60 menit sebelum keberangkatan.
Pengambilan jadwal dilakukan di loket stasiun keberangkatan Anda, hingga 60 Menit sebelum keberangkatan.</textarea>
    </div>
  </div>`;
}

function passengerRowTrain(n) {
  return `<div class="passenger-row" id="pax-${n}">
    <div class="form-group">
      <label>Nama Penumpang</label>
      <input type="text" id="pax-name-${n}" placeholder="cth: Tn. Edho Ferdihansah" />
    </div>
    <div class="form-group">
      <label>Kategori</label>
      <select id="pax-cat-${n}">
        <option>Dewasa</option><option>Anak</option><option>Bayi</option>
      </select>
    </div>
    <div class="form-group">
      <label>Nomor Kursi</label>
      <input type="text" id="pax-seat-${n}" placeholder="cth: Eksekutif 4/Kursi 8A" />
    </div>
    <div class="form-group">
      <label>ID Number (KTP/Passport)</label>
      <input type="text" id="pax-id-${n}" placeholder="317407100781000" />
    </div>
    ${n > 1 ? `<button class="remove-btn" onclick="removePax(${n})">✕</button>` : '<div></div>'}
  </div>`;
}

// ─ BUS ─
function formBus() {
  return `
  <div class="form-section">
    <h3>📋 Booking Info</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Travigma Booking ID</label>
        <input type="text" id="b-booking-id" value="${genBookingId()}" />
      </div>
      <div class="form-group">
        <label>Date Issued</label>
        <input type="date" id="b-date-issued" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>Kode Booking</label>
        <input type="text" id="b-ecode" value="${genECode()}" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>👥 Passenger Detail</h3>
    <div class="passenger-list" id="passenger-list">
      ${passengerRowBus(1)}
    </div>
    <button class="add-btn" onclick="addPassenger('bus')">+ Tambah Penumpang</button>
  </div>

  <div class="form-section">
    <h3>🚌 Bus / Travel Detail</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Kota Asal</label>
        <input type="text" id="b-from-city" placeholder="Jakarta" />
      </div>
      <div class="form-group">
        <label>Kota Tujuan</label>
        <input type="text" id="b-to-city" placeholder="Bandung" />
      </div>
      <div class="form-group">
        <label>Nama Operator / PO</label>
        <input type="text" id="b-operator" placeholder="cth: Primajasa" />
      </div>
      <div class="form-group">
        <label>Kelas / Tipe Bus</label>
        <input type="text" id="b-class" placeholder="cth: Executive SCANIA" />
      </div>
      <div class="form-group">
        <label>Terminal / Pool Asal</label>
        <input type="text" id="b-from-terminal" placeholder="cth: Pool Blok M" />
      </div>
      <div class="form-group">
        <label>Terminal / Pool Tujuan</label>
        <input type="text" id="b-to-terminal" placeholder="cth: Terminal Leuwipanjang" />
      </div>
      <div class="form-group">
        <label>Waktu Berangkat</label>
        <input type="time" id="b-dep-time" />
      </div>
      <div class="form-group">
        <label>Waktu Tiba (estimasi)</label>
        <input type="time" id="b-arr-time" />
      </div>
      <div class="form-group">
        <label>Tanggal Berangkat</label>
        <input type="date" id="b-dep-date" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>🧳 Facilities</h3>
    <div class="facility-list" id="facility-list">${facilityRow(1)}</div>
    <button class="add-btn" onclick="addFacility()">+ Tambah Fasilitas</button>
  </div>

  <div class="form-section">
    <h3>💳 Payment Detail</h3>
    <div class="form-group">
      <label>Total Payment (Rp)</label>
      <input type="text" id="b-total" placeholder="cth: 500000" />
    </div>
  </div>

  <div class="form-section">
    <h3>ℹ️ Important Information</h3>
    <div class="form-group">
      <textarea id="b-important" rows="4">Harap tiba di terminal/pool minimal 30 menit sebelum keberangkatan.
Bawa identitas diri yang valid sesuai data pemesanan.
Bagasi yang diizinkan sesuai kebijakan operator.
Keterlambatan tidak ditanggung apabila bukan kesalahan operator.</textarea>
    </div>
  </div>`;
}

function passengerRowBus(n) {
  return `<div class="passenger-row" id="pax-${n}">
    <div class="form-group">
      <label>Nama Penumpang</label>
      <input type="text" id="pax-name-${n}" placeholder="cth: Tn. Budi Santoso" />
    </div>
    <div class="form-group">
      <label>Kategori</label>
      <select id="pax-cat-${n}">
        <option>Dewasa</option><option>Anak</option>
      </select>
    </div>
    <div class="form-group">
      <label>Nomor Kursi</label>
      <input type="text" id="pax-seat-${n}" placeholder="cth: 12A" />
    </div>
    <div class="form-group">
      <label>ID Number</label>
      <input type="text" id="pax-id-${n}" placeholder="KTP / Passport No." />
    </div>
    ${n > 1 ? `<button class="remove-btn" onclick="removePax(${n})">✕</button>` : '<div></div>'}
  </div>`;
}

// ─ HOTEL ─
function formHotel() {
  return `
  <div class="form-section">
    <h3>📋 Booking Info</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>Travigma Booking ID</label>
        <input type="text" id="h-booking-id" value="${genBookingId()}" />
      </div>
      <div class="form-group">
        <label>Date Issued</label>
        <input type="date" id="h-date-issued" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>Booking Ref / Voucher Code</label>
        <input type="text" id="h-ref" value="${genECode(8)}" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>👥 Guest Detail</h3>
    <div class="passenger-list" id="passenger-list">
      ${passengerRowHotel(1)}
    </div>
    <button class="add-btn" onclick="addPassenger('hotel')">+ Tambah Tamu</button>
  </div>

  <div class="form-section">
    <h3>🏨 Hotel Detail</h3>
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Nama Hotel</label>
        <input type="text" id="h-name" placeholder="cth: The Westin Jakarta" />
      </div>
      <div class="form-group form-full">
        <label>Alamat Hotel</label>
        <input type="text" id="h-address" placeholder="Jl. HR Rasuna Said, Kuningan, Jakarta" />
      </div>
      <div class="form-group">
        <label>Kota</label>
        <input type="text" id="h-city" placeholder="Jakarta" />
      </div>
      <div class="form-group">
        <label>Tipe Kamar</label>
        <input type="text" id="h-room-type" placeholder="cth: Deluxe King Room" />
      </div>
      <div class="form-group">
        <label>Jumlah Kamar</label>
        <input type="number" id="h-room-count" value="1" min="1" />
      </div>
      <div class="form-group">
        <label>Basis Kamar</label>
        <select id="h-meal-plan">
          <option>Room Only</option>
          <option>Breakfast Included</option>
          <option>Half Board</option>
          <option>Full Board</option>
          <option>All Inclusive</option>
        </select>
      </div>
      <div class="form-group">
        <label>Check-in</label>
        <input type="date" id="h-checkin" />
      </div>
      <div class="form-group">
        <label>Check-out</label>
        <input type="date" id="h-checkout" />
      </div>
      <div class="form-group">
        <label>Jumlah Malam</label>
        <input type="number" id="h-nights" value="1" min="1" />
      </div>
      <div class="form-group">
        <label>No. Telepon Hotel</label>
        <input type="text" id="h-phone" placeholder="+62 21 xxxxxxx" />
      </div>
    </div>
  </div>

  <div class="form-section">
    <h3>🛎️ Facilities / Inclusions</h3>
    <div class="facility-list" id="facility-list">${facilityRow(1)}</div>
    <button class="add-btn" onclick="addFacility()">+ Tambah Fasilitas</button>
  </div>

  <div class="form-section">
    <h3>💳 Payment Detail</h3>
    <div class="form-group">
      <label>Total Payment (Rp)</label>
      <input type="text" id="h-total" placeholder="cth: 4500000" />
    </div>
  </div>

  <div class="form-section">
    <h3>ℹ️ Important Information</h3>
    <div class="form-group">
      <textarea id="h-important" rows="5">Check-in mulai pukul 14:00 dan check-out sebelum pukul 12:00.
Harap tunjukkan identitas diri yang valid saat check-in.
Permintaan khusus bergantung ketersediaan dan tidak dijamin.
Voucher ini harus ditunjukkan kepada pihak hotel pada saat check-in.
Pembatalan dikenakan biaya sesuai kebijakan hotel.</textarea>
    </div>
  </div>`;
}

function passengerRowHotel(n) {
  return `<div class="passenger-row hotel-row" id="pax-${n}">
    <div class="form-group">
      <label>Nama Tamu</label>
      <input type="text" id="pax-name-${n}" placeholder="cth: Mr. Budi Santoso" />
    </div>
    <div class="form-group">
      <label>Kategori</label>
      <select id="pax-cat-${n}">
        <option>Dewasa</option><option>Anak</option>
      </select>
    </div>
    ${n > 1 ? `<button class="remove-btn" onclick="removePax(${n})">✕</button>` : '<div></div>'}
  </div>`;
}

// ── Dynamic Add / Remove ───────────────────────────────────────────────────────
function addPassenger(type) {
  passengerCount++;
  const list = document.getElementById('passenger-list');
  const div = document.createElement('div');
  if (type === 'flight') div.innerHTML = passengerRowFlight(passengerCount);
  else if (type === 'train') div.innerHTML = passengerRowTrain(passengerCount);
  else if (type === 'bus') div.innerHTML = passengerRowBus(passengerCount);
  else if (type === 'hotel') div.innerHTML = passengerRowHotel(passengerCount);
  else if (type === 'invoice') div.innerHTML = passengerRowInvoice(passengerCount);
  list.appendChild(div.firstElementChild);
}

function removePax(n) {
  const el = document.getElementById(`pax-${n}`);
  if (el) el.remove();
}

function addLeg() {
  legCount++;
  const list = document.getElementById('leg-list');
  const div = document.createElement('div');
  div.innerHTML = flightLeg(legCount);
  list.appendChild(div.firstElementChild);
}

function removeLeg(n) {
  const el = document.getElementById(`leg-${n}`);
  if (el) el.remove();
}

function addFacility() {
  facilityCount++;
  const list = document.getElementById('facility-list');
  const div = document.createElement('div');
  div.innerHTML = facilityRow(facilityCount);
  list.appendChild(div.firstElementChild);
}

function removeFac(n) {
  const el = document.getElementById(`fac-${n}`);
  if (el) el.remove();
}

// ── Ticket Generator ───────────────────────────────────────────────────────────
function generateTicket() {
  let html = '';
  if (currentType === 'flight') html = buildFlightTicket();
  else if (currentType === 'train') html = buildTrainTicket();
  else if (currentType === 'bus') html = buildBusTicket();
  else if (currentType === 'hotel') html = buildHotelTicket();
  else if (currentType === 'invoice') html = buildInvoiceTicket();

  document.getElementById('ticket-output').innerHTML = html;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-preview').classList.add('active');
}

// ── Dummy Data Injector ───────────────────────────────────────────────────────
function fillDummyFlight() {
  function sv(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

  sv('f-pnr', 'XYZ987');
  sv('f-pnr-return', 'ABC123');
  sv('f-total', '2.500.000');

  sv('pax-name-1', 'Bapak Testing Terbang');
  sv('pax-cat-1', 'Dewasa');
  sv('pax-class-1', 'Economy');
  sv('pax-ticket-1', '999123456');

  sv('leg-airline-1', 'Citilink');
  sv('leg-flightnum-1', 'QG-999');
  sv('leg-baggage-1', '20 Kg');
  sv('leg-from-city-1', 'Jakarta');
  sv('leg-to-city-1', 'Bali');
  sv('leg-from-airport-1', 'Soekarno Hatta Airport');
  sv('leg-to-airport-1', 'Ngurah Rai Airport');
  sv('leg-from-iata-1', 'CGK');
  sv('leg-to-iata-1', 'DPS');

  // Set date times relative to today
  const today = new Date();
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  const ds = tmr.toISOString().split('T')[0];

  sv('leg-dep-date-1', ds);
  sv('leg-arr-date-1', ds);
  sv('leg-dep-time-1', '08:00');
  sv('leg-arr-time-1', '10:30');

  sv('fac-text-1', '20 Kg Baggage, Meals Included');
}

// ─ Shared helpers ─
function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function ticketHeader(bookingId, dateIssuedRaw, extraRows = '') {
  const dateValue = dateIssuedRaw || new Date().toISOString().split('T')[0];
  const fmtIssued = fmtDate(dateValue) || today();
  return `
  <div class="ticket-inner">
    <div class="t-watermark"><img src="bag_watermark.png" alt="Travigma"></div>
    <div class="t-header">
      <div>
        <div class="t-logo-area">
          <div class="t-logo-circle">${LOGO_IMG}</div>
        </div>
        <div class="t-meta" style="margin-top:10px;">
          <table>
            <tr><td>Travigma Booking ID</td><td>: <strong>${bookingId}</strong></td></tr>
            ${extraRows}
            <tr><td>Date Issued</td><td>: ${fmtIssued}</td></tr>
          </table>
        </div>
      </div>
      <div class="t-headline">
        <h1>Itinerary E-ticket</h1>
        <div class="booking-code">${bookingId.slice(-6)}</div>
      </div>
    </div>`;
}

function passengerTableFlight(passengers) {
  let rows = passengers.map((p, i) => `
    <tr>
      <td>${i + 1}. ${p.name}</td>
      <td>${p.cat}</td>
      <td>${p.cls}</td>
      <td>${p.ticket}</td>
    </tr>`).join('');
  return `
    <table class="t-table">
      <thead>
        <tr>
          <th>Passenger Detail</th><th>Category</th><th>Class</th><th>Ticket Number</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function passengerTableTrainBus(passengers, seatLabel = 'Number Seat') {
  let rows = passengers.map((p, i) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.cat}</td>
      <td>${p.seat}</td>
      <td>${p.id}</td>
    </tr>`).join('');
  return `
    <table class="t-table">
      <thead>
        <tr>
          <th>Passenger Detail</th><th>Category</th><th>${seatLabel}</th><th>ID Number</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function passengerTableHotel(guests) {
  let rows = guests.map(g => `
    <tr><td>${g.name}</td><td>${g.cat}</td></tr>`).join('');
  return `
    <table class="t-table">
      <thead><tr><th>Guest Name</th><th>Category</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function facilitiesBlock(facs) {
  if (!facs.length) return '';
  const items = facs.map(f => `<li>${f}</li>`).join('');
  return `
    <div class="t-section-label">🧳 Facilities</div>
    <div class="t-facilities">
      <ul>${items}</ul>
    </div>`;
}

function importantBlock(text) {
  if (!text) return '';
  const items = text.split('\n').filter(l => l.trim()).map(l => `<li>${l.trim()}</li>`).join('');
  return `
    <div class="t-important">
      <h4>Important Information</h4>
      <ul>${items}</ul>
    </div>`;
}

function paymentBlock(total, label = 'Total Payment') {
  return `
    <div class="t-payment">
      <span class="pay-label">${label}</span>
      <span class="pay-amount">Rp ${formatCurrency(total)}</span>
    </div>`;
}

function ticketFooter() {
  return `</div>
  <div class="t-footer">
    PT. Enigma Agility Indonesia &nbsp;&nbsp;|&nbsp;&nbsp; Jl. Cendana III No. 26 Cipondoh, Kota Tangerang 15148
  </div>`;
}

// ─ INVOICE TICKET ─
function buildInvoiceTicket() {
  const invNo = gv('inv-idx');
  const dateStr = gv('inv-date');
  const to = gv('inv-to');
  const bankName = gv('inv-bank-name');
  const bankAcc = gv('inv-bank-acc');
  const signName = gv('inv-sign-name');

  const items = [];
  document.querySelectorAll('[id^="pax-name-"]').forEach(el => {
    const n = el.id.split('-').pop();
    if (!document.getElementById(`pax-${n}`)) return;
    items.push({
      name: gv(`pax-name-${n}`),
      carrier: gv(`pax-carrier-${n}`),
      ticket: gv(`pax-ticket-${n}`),
      date: gv(`pax-date-${n}`),
      price: parseFloat(gv(`pax-price-${n}`)) || 0
    });
  });

  const total = items.reduce((sum, it) => sum + it.price, 0);

  let rowsHtml = items.map((it, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${it.name}</td>
      <td>${it.carrier}</td>
      <td>${it.ticket}</td>
      <td>${it.date}</td>
      <td style="text-align:right">Rp ${formatCurrency(it.price)}</td>
    </tr>
    `).join('');

  return `
  <div class="ticket-page">
    <div class="ticket-inner">
      <div class="t-watermark"><img src="bag_watermark.png" alt="Travigma"></div>
      <div class="t-header">
        <div>
          <div class="t-logo-area">
            <div class="t-logo-circle">${LOGO_IMG}</div>
            <div class="t-brand-name">Trav<em>igma</em><sup style="font-size:9px">®</sup></div>
          </div>
          <div class="t-meta" style="margin-top:10px">
            <table>
              <tr><td>Invoice No</td><td>: <strong>${invNo}</strong></td></tr>
              <tr><td>Date</td><td>: ${fmtDate(dateStr) || today()}</td></tr>
            </table>
          </div>
        </div>
        <div class="t-headline">
          <h1 style="font-size:24px; color:var(--navy)">INVOICE</h1>
        </div>
      </div>

      <div style="margin: 20px 0;">
        <div style="font-weight:700; color:var(--gray-text); font-size:10px; text-transform:uppercase;">To:</div>
        <div style="font-size:14px; font-weight:700; color:var(--navy);">${to}</div>
      </div>

      <table class="t-table">
        <thead>
          <tr>
            <th style="width:30px">No</th>
            <th>Nama</th>
            <th>Maskapai</th>
            <th>E-Ticket</th>
            <th>Tgl Berangkat</th>
            <th style="text-align:right">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background:#f4f6f9; font-weight:700;">
            <td colspan="5" style="text-align:right">Total Biaya</td>
            <td style="text-align:right">Rp ${formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; display: flex; justify-content: space-between;">
        <div style="font-size:11px;">
          <div style="font-weight:700; margin-bottom:4px;">Rekening Pembayaran:</div>
          <div style="color:var(--navy); font-weight:600;">${bankName}</div>
          <div style="color:var(--orange); font-weight:700; font-size:13px;">BCA ${bankAcc}</div>
          <div style="margin-top:10px; font-style:italic; color:var(--gray-text);">Terima kasih telah menggunakan layanan kami</div>
        </div>
        <div style="text-align:center; min-width:180px;">
          <div style="margin-bottom:60px;">Direktur PT. Enigma Agility Indonesia</div>
          <div style="font-weight:800; text-decoration:underline;">${signName}</div>
        </div>
      </div>
    </div>
    <div class="t-footer">
      PT. Enigma Agility Indonesia &nbsp;&nbsp;|&nbsp;&nbsp; Jl. Cendana III No. 26 Cipondoh, Kota Tangerang 15148
    </div>
  </div>`;
}


function collectPassengers(hasId = true, hasClass = false, hasSeat = false) {
  const passengers = [];
  const rows = document.querySelectorAll('[id^="pax-name-"]');
  rows.forEach(el => {
    const n = el.id.split('-').pop();
    if (!document.getElementById(`pax-${n}`)) return; // removed
    const p = { name: gv(`pax-name-${n}`), cat: gv(`pax-cat-${n}`) };
    if (hasClass) p.cls = gv(`pax-class-${n}`);
    if (hasSeat) p.seat = gv(`pax-seat-${n}`);
    if (hasId) p.id = gv(`pax-id-${n}`);
    p.ticket = gv(`pax-ticket-${n}`) || '';
    passengers.push(p);
  });
  return passengers;
}

function collectFacilities() {
  const facs = [];
  const rows = document.querySelectorAll('[id^="fac-text-"]');
  rows.forEach(el => {
    const n = el.id.split('-').pop();
    if (!document.getElementById(`fac-${n}`)) return;
    const val = gv(`fac-text-${n}`).trim();
    if (val) facs.push(val);
  });
  return facs;
}

// ── Google Sheets Sync Logic ──────────────────────────────────────────────────

async function pushToSheet() {
  const btn = document.getElementById('save-cloud-btn');
  if (btn.classList.contains('syncing')) return;

  const data = collectFullFormData();
  const payload = {
    id: data.id,
    type: currentType,
    client: data.client,
    amount: data.amount,
    fullData: data
  };

  try {
    btn.innerHTML = "⏳ Menyimpa...";
    btn.classList.add('syncing');

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const res = await response.json();
    if (res.status === "success") {
      btn.innerHTML = "✅ Tersimpan!";
      setTimeout(() => {
        btn.innerHTML = "☁️ Simpan ke Cloud";
        btn.classList.remove('syncing');
      }, 3000);
    } else {
      throw new Error(res.message);
    }
  } catch (err) {
    console.error("DEBUG - PUSH ERROR:", err);
    btn.innerHTML = "❌ Gagal Simpan";
    alert("Gagal simpan ke cloud: " + err.message);
    setTimeout(() => {
      btn.innerHTML = "☁️ Simpan ke Cloud";
      btn.classList.remove('syncing');
    }, 3000);
  }
}

console.log("TRAVIGMA - App Logic Loaded Successfully");
console.log("GAS_URL:", GAS_URL);

async function pullFromSheet() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<div class="loading-state">Mengambil data dari cloud...</div>';

  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();

    if (!data || data.length === 0) {
      list.innerHTML = '<div class="loading-state">Belum ada riwayat data.</div>';
      return;
    }

    list.innerHTML = '';
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const date = new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="history-info">
          <div class="history-id">${item.id}</div>
          <div class="history-meta">${item.client || 'No Name'} | ${date}</div>
        </div>
        <div style="text-align:right">
          <div class="history-type">${item.type}</div>
          <div style="font-size:11px; font-weight:700; margin-top:4px;">Rp ${formatCurrency(item.amount)}</div>
        </div>
      `;
      card.onclick = () => loadFromCloud(item.fullData, item.type);
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = '<div class="loading-state" style="color:#ef4444">Gagal mengambil data: ' + err.message + '</div>';
  }
}

function loadFromCloud(data, type) {
  selectType(type);

  // Wait for form to render then populate
  setTimeout(() => {
    if (type === 'flight') {
      document.getElementById('f-booking-id').value = data.id;
      document.getElementById('f-date-issued').value = data.dateIssued;
      document.getElementById('f-pnr').value = data.pnr;
      document.getElementById('f-pnr-return').value = data.pnrReturn;
      document.getElementById('f-total').value = data.amount;
      document.getElementById('f-important').value = data.important;

      // Clear defaults before adding
      document.getElementById('passenger-list').innerHTML = '';
      data.passengers.forEach((p, i) => {
        addPassenger('flight');
        const idx = i + 1;
        document.getElementById(`pax-name-${idx}`).value = p.name;
        document.getElementById(`pax-cat-${idx}`).value = p.cat;
        document.getElementById(`pax-class-${idx}`).value = p.cls;
        document.getElementById(`pax-ticket-${idx}`).value = p.ticket;
      });

      document.getElementById('leg-list').innerHTML = '';
      data.legs.forEach((l, i) => {
        addLeg();
        const idx = i + 1;
        document.getElementById(`leg-airline-${idx}`).value = l.airline;
        document.getElementById(`leg-flightnum-${idx}`).value = l.flightNum;
        document.getElementById(`leg-baggage-${idx}`).value = l.baggage;
        document.getElementById(`leg-from-city-${idx}`).value = l.fromCity;
        document.getElementById(`leg-to-city-${idx}`).value = l.toCity;
        document.getElementById(`leg-from-airport-${idx}`).value = l.fromAirport;
        document.getElementById(`leg-to-airport-${idx}`).value = l.toAirport;
        document.getElementById(`leg-from-iata-${idx}`).value = l.fromIata;
        document.getElementById(`leg-to-iata-${idx}`).value = l.toIata;
        document.getElementById(`leg-dep-time-${idx}`).value = l.depTime;
        document.getElementById(`leg-arr-time-${idx}`).value = l.arrTime;
        document.getElementById(`leg-dep-date-${idx}`).value = l.depDate;
        document.getElementById(`leg-arr-date-${idx}`).value = l.arrDate;
      });
    }
    else if (type === 'invoice') {
      document.getElementById('inv-idx').value = data.id;
      document.getElementById('inv-date').value = data.date;
      document.getElementById('inv-to').value = data.client;
      document.getElementById('inv-bank-name').value = data.bankName;
      document.getElementById('inv-bank-acc').value = data.bankAcc;
      document.getElementById('inv-sign-name').value = data.signName;

      document.getElementById('passenger-list').innerHTML = '';
      data.items.forEach((it, i) => {
        addPassenger('invoice');
        const idx = i + 1;
        document.getElementById(`pax-name-${idx}`).value = it.name;
        document.getElementById(`pax-carrier-${idx}`).value = it.carrier;
        document.getElementById(`pax-ticket-${idx}`).value = it.ticket;
        document.getElementById(`pax-date-${idx}`).value = it.date;
        document.getElementById(`pax-price-${idx}`).value = it.price;
      });
    }
    else if (type === 'train') {
      document.getElementById('t-booking-id').value = data.id;
      document.getElementById('t-date-issued').value = data.dateIssued;
      document.getElementById('t-ecode').value = data.ecode;
      document.getElementById('t-from-city').value = data.fromCity;
      document.getElementById('t-to-city').value = data.toCity;
      document.getElementById('t-train-name').value = data.trainName;
      document.getElementById('t-class').value = data.trainClass;
      document.getElementById('t-from-station').value = data.fromStation;
      document.getElementById('t-to-station').value = data.toStation;
      document.getElementById('t-dep-time').value = data.depTime;
      document.getElementById('t-arr-time').value = data.arrTime;
      document.getElementById('t-dep-date').value = data.depDate;
      document.getElementById('t-arr-date').value = data.arrDate;
      document.getElementById('t-total').value = data.amount;
      document.getElementById('t-important').value = data.important;

      document.getElementById('passenger-list').innerHTML = '';
      data.passengers.forEach((p, i) => {
        addPassenger('train');
        const idx = i + 1;
        document.getElementById(`pax-name-${idx}`).value = p.name;
        document.getElementById(`pax-cat-${idx}`).value = p.cat;
        document.getElementById(`pax-seat-${idx}`).value = p.seat;
        document.getElementById(`pax-id-${idx}`).value = p.id;
      });
    }
    else if (type === 'bus') {
      document.getElementById('b-booking-id').value = data.id;
      document.getElementById('b-date-issued').value = data.dateIssued;
      document.getElementById('b-ecode').value = data.ecode;
      document.getElementById('b-from-city').value = data.fromCity;
      document.getElementById('b-to-city').value = data.toCity;
      document.getElementById('b-operator').value = data.operator;
      document.getElementById('b-class').value = data.busClass;
      document.getElementById('b-from-terminal').value = data.fromTerminal;
      document.getElementById('b-to-terminal').value = data.toTerminal;
      document.getElementById('b-dep-time').value = data.depTime;
      document.getElementById('b-arr-time').value = data.arrTime;
      document.getElementById('b-dep-date').value = data.depDate;
      document.getElementById('b-total').value = data.amount;
      document.getElementById('b-important').value = data.important;

      document.getElementById('passenger-list').innerHTML = '';
      data.passengers.forEach((p, i) => {
        addPassenger('bus');
        const idx = i + 1;
        document.getElementById(`pax-name-${idx}`).value = p.name;
        document.getElementById(`pax-cat-${idx}`).value = p.cat;
        document.getElementById(`pax-seat-${idx}`).value = p.seat;
        document.getElementById(`pax-id-${idx}`).value = p.id;
      });
    }
    else if (type === 'hotel') {
      document.getElementById('h-booking-id').value = data.id;
      document.getElementById('h-date-issued').value = data.dateIssued;
      document.getElementById('h-ref').value = data.ref;
      document.getElementById('h-name').value = data.name;
      document.getElementById('h-address').value = data.address;
      document.getElementById('h-city').value = data.city;
      document.getElementById('h-room-type').value = data.roomType;
      document.getElementById('h-room-count').value = data.roomCount;
      document.getElementById('h-meal-plan').value = data.mealPlan;
      document.getElementById('h-checkin').value = data.checkin;
      document.getElementById('h-checkout').value = data.checkout;
      document.getElementById('h-nights').value = data.nights;
      document.getElementById('h-phone').value = data.phone;
      document.getElementById('h-total').value = data.amount;
      document.getElementById('h-important').value = data.important;

      document.getElementById('passenger-list').innerHTML = '';
      data.passengers.forEach((p, i) => {
        addPassenger('hotel');
        const idx = i + 1;
        document.getElementById(`pax-name-${idx}`).value = p.name;
        document.getElementById(`pax-cat-${idx}`).value = p.cat;
      });
    }
  }, 100);
}

function collectFullFormData() {
  if (currentType === 'flight') {
    return {
      id: gv('f-booking-id'),
      dateIssued: gv('f-date-issued'),
      pnr: gv('f-pnr'),
      pnrReturn: gv('f-pnr-return'),
      amount: gv('f-total'),
      client: (collectPassengers(false)[0]?.name || 'N/A'),
      passengers: collectPassengers(false, true, false),
      legs: Array.from(document.querySelectorAll('.leg-card')).map(card => {
        const n = card.id.split('-').pop();
        return {
          airline: gv(`leg-airline-${n}`),
          flightNum: gv(`leg-flightnum-${n}`),
          baggage: gv(`leg-baggage-${n}`),
          fromCity: gv(`leg-from-city-${n}`),
          toCity: gv(`leg-to-city-${n}`),
          fromAirport: gv(`leg-from-airport-${n}`),
          toAirport: gv(`leg-to-airport-${n}`),
          fromIata: gv(`leg-from-iata-${n}`),
          toIata: gv(`leg-to-iata-${n}`),
          depTime: gv(`leg-dep-time-${n}`),
          arrTime: gv(`leg-arr-time-${n}`),
          depDate: gv(`leg-dep-date-${n}`),
          arrDate: gv(`leg-arr-date-${n}`)
        };
      }),
      important: gv('f-important'),
      facilities: collectFacilities()
    };
  }
  else if (currentType === 'train') {
    return {
      id: gv('t-booking-id'),
      dateIssued: gv('t-date-issued'),
      ecode: gv('t-ecode'),
      fromCity: gv('t-from-city'),
      toCity: gv('t-to-city'),
      trainName: gv('t-train-name'),
      trainClass: gv('t-class'),
      fromStation: gv('t-from-station'),
      toStation: gv('t-to-station'),
      depTime: gv('t-dep-time'),
      arrTime: gv('t-arr-time'),
      depDate: gv('t-dep-date'),
      arrDate: gv('t-arr-date'),
      amount: gv('t-total'),
      important: gv('t-important'),
      client: (collectPassengers(true, false, true)[0]?.name || 'N/A'),
      passengers: collectPassengers(true, false, true),
      facilities: collectFacilities()
    };
  }
  else if (currentType === 'bus') {
    return {
      id: gv('b-booking-id'),
      dateIssued: gv('b-date-issued'),
      ecode: gv('b-ecode'),
      fromCity: gv('b-from-city'),
      toCity: gv('b-to-city'),
      operator: gv('b-operator'),
      busClass: gv('b-class'),
      fromTerminal: gv('b-from-terminal'),
      toTerminal: gv('b-to-terminal'),
      depTime: gv('b-dep-time'),
      arrTime: gv('b-arr-time'),
      depDate: gv('b-dep-date'),
      amount: gv('b-total'),
      important: gv('b-important'),
      client: (collectPassengers(true, false, true)[0]?.name || 'N/A'),
      passengers: collectPassengers(true, false, true),
      facilities: collectFacilities()
    };
  }
  else if (currentType === 'hotel') {
    return {
      id: gv('h-booking-id'),
      dateIssued: gv('h-date-issued'),
      ref: gv('h-ref'),
      name: gv('h-name'),
      address: gv('h-address'),
      city: gv('h-city'),
      roomType: gv('h-room-type'),
      roomCount: gv('h-room-count'),
      mealPlan: gv('h-meal-plan'),
      checkin: gv('h-checkin'),
      checkout: gv('h-checkout'),
      nights: gv('h-nights'),
      phone: gv('h-phone'),
      amount: gv('h-total'),
      important: gv('h-important'),
      client: (collectPassengers(false)[0]?.name || 'N/A'),
      passengers: collectPassengers(false),
      facilities: collectFacilities()
    };
  }
  else if (currentType === 'invoice') {
    const items = [];
    document.querySelectorAll('[id^="pax-name-"]').forEach(el => {
      const n = el.id.split('-').pop();
      if (!document.getElementById(`pax-${n}`)) return;
      items.push({
        name: gv(`pax-name-${n}`),
        carrier: gv(`pax-carrier-${n}`),
        ticket: gv(`pax-ticket-${n}`),
        date: gv(`pax-date-${n}`),
        price: gv(`pax-price-${n}`)
      });
    });
    return {
      id: gv('inv-idx'),
      date: gv('inv-date'),
      client: gv('inv-to'),
      bankName: gv('inv-bank-name'),
      bankAcc: gv('inv-bank-acc'),
      signName: gv('inv-sign-name'),
      items: items,
      amount: items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0)
    };
  }
  // Fallback
  return { id: genBookingId(), client: 'Unknown', amount: 0 };
}

// Ensure history loads on start
window.onload = () => {
  pullFromSheet();
};


// ─ FLIGHT TICKET ─
function buildFlightTicket() {
  const bookingId = gv('f-booking-id') || genBookingId();
  const dateIssued = gv('f-date-issued');
  const pnr = gv('f-pnr');
  const pnrReturn = gv('f-pnr-return');
  const total = gv('f-total');
  const important = gv('f-important');

  const passengers = collectPassengers(false, true, false);
  // override ticket number
  document.querySelectorAll('[id^="pax-name-"]').forEach(el => {
    const n = el.id.split('-').pop();
    if (document.getElementById(`pax-${n}`)) {
      const p = passengers.find(px => px.name === gv(`pax-name-${n}`));
      if (p) p.ticket = gv(`pax-ticket-${n}`);
    }
  });

  const facs = collectFacilities();

  // Collect legs
  const legs = [];
  document.querySelectorAll('[id^="leg-"]').forEach(el => {
    if (!el.id.match(/^leg-\d+$/) || !document.getElementById(el.id)) return;
    const n = el.id.split('-').pop();
    if (legs.some(l => l.n === n)) return;
    legs.push({ n });
  });

  let legsHtml = '';
  const seenLegs = new Set();
  const allBaggages = [];

  document.querySelectorAll('.leg-card').forEach(card => {
    const n = card.id.split('-').pop();
    if (seenLegs.has(n)) return;
    seenLegs.add(n);
    const fromCity = gv(`leg-from-city-${n}`);
    const toCity = gv(`leg-to-city-${n}`);
    const airline = gv(`leg-airline-${n}`);
    const flightNum = gv(`leg-flightnum-${n}`);
    const fromIata = gv(`leg-from-iata-${n}`).toUpperCase();
    const toIata = gv(`leg-to-iata-${n}`).toUpperCase();
    const depTime = gv(`leg-dep-time-${n}`);
    const arrTime = gv(`leg-arr-time-${n}`);
    const depDate = fmtDate(gv(`leg-dep-date-${n}`));
    const arrDate = fmtDate(gv(`leg-arr-date-${n}`));
    const fromAirport = gv(`leg-from-airport-${n}`);
    const toAirport = gv(`leg-to-airport-${n}`);
    const baggage = gv(`leg-baggage-${n}`);

    if (baggage) allBaggages.push(baggage);

    legsHtml += `
      <div class="t-section-label">✈️ Flight Detail</div>
      <div class="t-journey"><span>${fromCity}</span><span class="arrow">→</span><span>${toCity}</span></div>
      <div class="t-leg">
        <div class="t-leg-row">
          <div class="t-leg-airline">
            ${getAirlineLogo(airline)}
            <div>
              <div class="airline-code">${airline}</div>
              <div class="flight-num">${flightNum}</div>
            </div>
          </div>
          <div class="t-leg-route">
            <div class="t-leg-point">
              <div class="iata">${fromIata}</div>
              <div class="time">${depTime}</div>
              <div class="date">${depDate}</div>
              <div class="airport">${fromAirport}</div>
            </div>
            <div class="t-leg-arrow">→</div>
            <div class="t-leg-point">
              <div class="iata">${toIata}</div>
              <div class="time">${arrTime}</div>
              <div class="date">${arrDate}</div>
              <div class="airport">${toAirport}</div>
            </div>
          </div>
        </div>
      </div>`;
  });

  let extraRows = '';
  if (pnr) extraRows += `<tr><td>Airline Booking Code (PNR)</td><td>: <strong>${pnr}</strong></td></tr>`;
  if (pnrReturn) extraRows += `<tr><td>Airline Booking Code (PNR) Return</td><td>: <strong>${pnrReturn}</strong></td></tr>`;

  // Custom Flight Facilities Block combining "Bagasi Kabin" (from facs) and "Bagasi Terdaftar" (from legs)
  let flightFacilitiesHtml = '';
  if (facs.length > 0 || allBaggages.length > 0) {
    let kabinHtml = '';
    if (facs.length > 0) {
      kabinHtml = `
        <div style="font-weight:600; margin-bottom: 4px; color: var(--navy);">Bagasi Kabin:</div>
        <ul style="margin: 0 0 12px 0; padding-left: 20px; font-size: 11px; color: #333; list-style-type: disc;">
          ${facs.map(f => `<li>${f}</li>`).join('')}
        </ul>`;
    }

    let terdaftarHtml = '';
    if (allBaggages.length > 0) {
      // remove duplicates if same baggage string across legs
      const uniqueBaggages = [...new Set(allBaggages)];
      terdaftarHtml = `
        <div style="font-weight:600; margin-bottom: 4px; color: var(--navy);">Bagasi Terdaftar:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #333; list-style-type: disc;">
          ${uniqueBaggages.map(b => `<li>${b}</li>`).join('')}
        </ul>`;
    }

    flightFacilitiesHtml = `
      <div class="t-section-label">Flight Facilities</div>
      <div style="margin: 10px 0 15px 0;">
        ${kabinHtml}
        ${terdaftarHtml}
      </div>`;
  }

  return `<div class="ticket-page">
    ${ticketHeader(bookingId, dateIssued, extraRows)}
    <hr class="t-divider">
    ${passengerTableFlight(passengers)}
    <hr class="t-divider">
    ${legsHtml}
    <hr class="t-divider">
    ${flightFacilitiesHtml}
    ${paymentBlock(total, 'Total Cost')}
    ${importantBlock(important)}
    ${ticketFooter()}
  </div>`;
}

// ─ TRAIN TICKET ─
function buildTrainTicket() {
  const bookingId = gv('t-booking-id') || genBookingId();
  const dateIssued = gv('t-date-issued');
  const ecode = gv('t-ecode');
  const fromCity = gv('t-from-city');
  const toCity = gv('t-to-city');
  const trainName = gv('t-train-name');
  const trainClass = gv('t-class');
  const fromStation = gv('t-from-station');
  const toStation = gv('t-to-station');
  const depTime = gv('t-dep-time');
  const arrTime = gv('t-arr-time');
  const depDate = fmtDate(gv('t-dep-date'));
  const total = gv('t-total');
  const important = gv('t-important');

  const passengers = collectPassengers(true, false, true);
  const facs = collectFacilities();

  const extraRows = `<tr><td>Kode Booking</td><td>: <strong>${ecode}</strong></td></tr>`;

  return `<div class="ticket-page">
    ${ticketHeader(bookingId, dateIssued, extraRows)}
    <hr class="t-divider">
    ${passengerTableTrainBus(passengers, 'Number Seat')}
    <hr class="t-divider">
    <div class="t-section-label">🚆 Detail</div>
    <div class="t-journey"><span>${fromCity}</span><span class="arrow">→</span><span>${toCity}</span></div>
    <div class="t-leg">
      <div class="t-leg-row">
        <div class="t-leg-airline">
          <div>
            <div class="airline-code" style="color:#cc0000;">KAI</div>
            <div class="flight-num">${trainName}</div>
            <div style="font-size:10px;color:#666;margin-top:2px;">${trainClass}</div>
          </div>
        </div>
        <div class="t-leg-route">
          <div class="t-leg-point">
            <div class="iata" style="font-size:13px;">${fromStation}</div>
            <div class="time">${depTime}</div>
            <div class="date">${depDate}</div>
          </div>
          <div class="t-leg-arrow">→</div>
          <div class="t-leg-point">
            <div class="iata" style="font-size:13px;">${toStation}</div>
            <div class="time">${arrTime}</div>
            <div class="date">${depDate}</div>
          </div>
        </div>
      </div>
    </div>
    <hr class="t-divider">
    ${facilitiesBlock(facs)}
    ${paymentBlock(total, 'Total Payment')}
    ${importantBlock(important)}
    ${ticketFooter()}
  </div>`;
}

// ─ BUS TICKET ─
function buildBusTicket() {
  const bookingId = gv('b-booking-id') || genBookingId();
  const dateIssued = gv('b-date-issued');
  const ecode = gv('b-ecode');
  const fromCity = gv('b-from-city');
  const toCity = gv('b-to-city');
  const operator = gv('b-operator');
  const busClass = gv('b-class');
  const fromTerminal = gv('b-from-terminal');
  const toTerminal = gv('b-to-terminal');
  const depTime = gv('b-dep-time');
  const arrTime = gv('b-arr-time');
  const depDate = fmtDate(gv('b-dep-date'));
  const total = gv('b-total');
  const important = gv('b-important');

  const passengers = collectPassengers(true, false, true);
  const facs = collectFacilities();

  const extraRows = `<tr><td>Kode Booking</td><td>: <strong>${ecode}</strong></td></tr>`;

  return `<div class="ticket-page">
    ${ticketHeader(bookingId, dateIssued, extraRows)}
    <hr class="t-divider">
    ${passengerTableTrainBus(passengers, 'Nomor Kursi')}
    <hr class="t-divider">
    <div class="t-section-label">🚌 Bus Detail</div>
    <div class="t-journey"><span>${fromCity}</span><span class="arrow">→</span><span>${toCity}</span></div>
    <div class="t-leg">
      <div class="t-leg-row">
        <div class="t-leg-airline">
          <div>
            <div class="airline-code">${operator}</div>
            <div class="flight-num">${busClass}</div>
          </div>
        </div>
        <div class="t-leg-route">
          <div class="t-leg-point">
            <div class="iata" style="font-size:12px;">${fromTerminal}</div>
            <div class="time">${depTime}</div>
            <div class="date">${depDate}</div>
          </div>
          <div class="t-leg-arrow">→</div>
          <div class="t-leg-point">
            <div class="iata" style="font-size:12px;">${toTerminal}</div>
            <div class="time">${arrTime}</div>
            <div class="date">${depDate}</div>
          </div>
        </div>
      </div>
    </div>
    <hr class="t-divider">
    ${facilitiesBlock(facs)}
    ${paymentBlock(total, 'Total Payment')}
    ${importantBlock(important)}
    ${ticketFooter()}
  </div>`;
}

// ─ HOTEL TICKET ─
function buildHotelTicket() {
  const bookingId = gv('h-booking-id') || genBookingId();
  const dateIssued = gv('h-date-issued');
  const ref = gv('h-ref');
  const hotelName = gv('h-name');
  const hotelAddress = gv('h-address');
  const hotelCity = gv('h-city');
  const hotelPhone = gv('h-phone');
  const roomType = gv('h-room-type');
  const roomCount = gv('h-room-count') || '1';
  const mealPlan = gv('h-meal-plan');
  const checkin = fmtDate(gv('h-checkin'));
  const checkout = fmtDate(gv('h-checkout'));
  const nights = gv('h-nights') || '1';
  const total = gv('h-total');
  const important = gv('h-important');

  const guests = collectPassengers(false, false, false);
  const facs = collectFacilities();

  const extraRows = `<tr><td>Voucher / Booking Ref</td><td>: <strong>${ref}</strong></td></tr>`;

  const checkinRaw = gv('h-checkin');
  const checkoutRaw = gv('h-checkout');
  let nightsCalc = nights;
  if (checkinRaw && checkoutRaw) {
    const ci = new Date(checkinRaw), co = new Date(checkoutRaw);
    const diff = Math.round((co - ci) / 86400000);
    if (diff > 0) nightsCalc = diff;
  }

  return `<div class="ticket-page">
    ${ticketHeader(bookingId, dateIssued, extraRows)}
    <hr class="t-divider">
    <div class="t-section-label">👥 Guest Detail</div>
    ${passengerTableHotel(guests)}
    <hr class="t-divider">
    <div class="t-section-label">🏨 Hotel Detail</div>
    <div class="t-hotel-card">
      <div class="t-hotel-name">${hotelName}</div>
      <div style="font-size:11px;color:#666;margin-top:3px;">${hotelAddress}${hotelCity ? ` – ${hotelCity}` : ''}</div>
      ${hotelPhone ? `<div style="font-size:11px;color:#666;margin-top:2px;">📞 ${hotelPhone}</div>` : ''}
      <div class="t-hotel-grid">
        <div class="lbl">Tipe Kamar</div><div class="val">${roomType}</div>
        <div class="lbl">Jumlah Kamar</div><div class="val">${roomCount} Kamar</div>
        <div class="lbl">Meal Plan</div><div class="val">${mealPlan}</div>
        <div class="lbl">Jumlah Malam</div><div class="val">${nightsCalc} Malam</div>
        <div class="lbl">Check-in</div><div class="val">${checkin}</div>
        <div class="lbl">Check-out</div><div class="val">${checkout}</div>
      </div>
    </div>
    <hr class="t-divider">
    ${facilitiesBlock(facs)}
    ${paymentBlock(total, 'Total Payment')}
    ${importantBlock(important)}
    ${ticketFooter()}
  </div>`;
}
