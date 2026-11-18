import { escapeMarkup as xmlEscape } from './http.js';
/**
 * DHL Express SOAP Service
 * Wraps Rate, CreateShipment, SchedulePickup, and Track calls.
 * All credentials come from process.env — never exposed to the browser.
 *
 * TLS certificates are verified; configure NODE_EXTRA_CA_CERTS if required.
 */

import https from 'node:https';
import path  from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const SANDBOX_ENDPOINTS = {
    rate:     'https://wsbexpress.dhl.com:443/sndpt/expressRateBook',
    shipment: 'https://wsbexpress.dhl.com:443/sndpt/expressRateBook',
    pickup:   'https://wsbexpress.dhl.com:443/sndpt/requestPickup',
    track:    'https://wsbexpress.dhl.com:443/sndpt/glDHLExpressTrack',
};

export function dhlEndpoint(service) {
    const mode = process.env.DHL_MODE || 'sandbox';
    if (!Object.hasOwn(SANDBOX_ENDPOINTS, service)) throw new Error('Unknown DHL service');
    if (mode === 'sandbox') return SANDBOX_ENDPOINTS[service];
    if (mode !== 'live') throw new Error('Set DHL_MODE to sandbox or live');
    // Production endpoints are supplied by DHL after account certification.
    const configured = process.env[`DHL_${service.toUpperCase()}_ENDPOINT`];
    let url;
    try { url = new URL(configured); } catch { throw new Error('DHL production endpoint is not configured'); }
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.dhl.com') || url.username || url.password || url.search || url.hash || url.pathname.includes('/sndpt/')) throw new Error('Invalid DHL production endpoint');
    return url.href;
}


// ─── SOAP transport ──────────────────────────────────────────────────────────

function soapPost(url, xmlBody, label = 'DHL') {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const body = Buffer.from(xmlBody, 'utf8');

        const options = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: 'POST',
            rejectUnauthorized: true,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Content-Length': body.length,
                'SOAPAction': '',
            },
        };

        console.log(`[${label}] → POST ${url}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; if (data.length > 10 * 1024 * 1024) req.destroy(new Error('DHL response too large')); });
            res.on('error', reject);
            res.on('aborted', () => reject(new Error('DHL response interrupted')));
            res.on('end', () => {
                console.log(`[${label}] ← HTTP ${res.statusCode} | Length: ${data.length}`);
                if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error('DHL service request failed'));
                resolve({ body: data });
            });
        });

        req.on('error', (err) => {
            console.error(`[${label}] Network error:`, err.message);
            reject(err);
        });
        req.setTimeout(15000, () => req.destroy(new Error('DHL request timed out')));
        req.write(body);
        req.end();
    });
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

function buildWsseHeader() {
    if (!process.env.DHL_USERNAME || !process.env.DHL_PASSWORD || !process.env.DHL_ACCOUNT_NUMBER) throw new Error('DHL is not configured');
    return `<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soapenv:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>${xmlEscape(process.env.DHL_USERNAME)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(process.env.DHL_PASSWORD)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>`;
}

/**
 * DHL Express SOAP timestamp format: YYYY-MM-DDTHH:MM:SS GMT+HH:MM
 * The space before GMT is mandatory — DHL rejects ISO Z format.
 */
function shipTimestamp(offsetMinutes = 120) {
    const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    // DHL requires NO space before GMT — their working template confirms this format
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00GMT+00:00`;
}

/**
 * Required by DHL for every SOAP call — unique reference per request.
 * Must be 28-32 characters.
 */
function msgRef() {
    return `SLK${Date.now()}SHIP`.substring(0, 28).padEnd(28, '0');
}

function extractTag(xml, tag) {
    // (?![\w-]) ensures 'Message' doesn't match 'MessageTime' etc.
    const re = new RegExp(`<(?:[^:>]+:)?${tag}(?![\\w-])[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'i');
    const m = xml.match(re);
    return m ? m[1].trim() : null;
}

function extractAllTags(xml, tag) {
    // (?![\w-]) ensures e.g. 'ConditionData' doesn't match 'Condition'
    const re = new RegExp(`<(?:[^:>]+:)?${tag}(?![\\w-])[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'gi');
    const results = [];
    let m;
    while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
    return results;
}

/** Extract all numeric values of a given tag, return the first one found */
function extractAmount(xml, tag) {
    const all = extractAllTags(xml, tag);
    for (const v of all) {
        const n = parseFloat(v.replace(/[^0-9.]/g, ''));
        if (!isNaN(n) && n > 0) return n;
    }
    return 0;
}

/** Extract the most helpful error message from a DHL SOAP fault/condition */
function extractDHLError(xml) {
    // Try SOAP fault first
    const faultString = extractTag(xml, 'faultstring') || extractTag(xml, 'Fault');
    if (faultString) return faultString;
    // Try condition blocks
    const conditionData = extractAllTags(xml, 'ConditionData');
    if (conditionData.length > 0) return conditionData.join('; ');
    const condition = extractTag(xml, 'Condition');
    if (condition) return condition;
    const message = extractTag(xml, 'Message');
    if (message) return message;
    return null;
}

/**
 * DHL validates PostalCode format per country.
 * When the user hasn't filled it in yet, use a known-good default
 * so the schema validation passes and we get a rate back.
 */
const DEFAULT_POSTAL = {
    // Americas
    US: '10001',   CA: 'M5H2N2',  BR: '01310100',MX: '06600',  AR: 'C1001',
    CL: '8320000', CO: '110111',  PE: '15001',   UY: '11300',  VE: '1010',
    BO: '0000',    PY: '1000',    EC: '170101',  PA: '0000',   CR: '10101',
    GT: '01001',   HN: '11101',   SV: '01101',   NI: '14000',  DO: '10101',
    JM: '00001',   TT: '000000',  BB: '11000',   GY: '00001',  SR: '00001',
    BZ: '00001',   BS: '00001',   AG: '00001',   LC: '00001',  VC: '00001',
    GD: '00001',   KN: '00001',   DM: '00001',   KY: '00001',  TC: '00001',
    VG: '00001',   VI: '00100',
    // Europe
    GB: 'SW1A1AA', DE: '10115',   FR: '75001',   IT: '00100',  ES: '28001',
    PT: '1000001', NL: '1011',    BE: '1000',    CH: '8001',   AT: '1010',
    SE: '11120',   NO: '0150',    DK: '1000',    FI: '00100',  GR: '10431',
    IE: 'D02X285', PL: '00001',   CZ: '11000',   HU: '1011',   RO: '010011',
    BG: '1000',    RS: '11000',   HR: '10000',   SK: '81101',  SI: '1000',
    EE: '10001',   LV: 'LV1050',  LT: '01001',   LU: '1009',   MT: 'VLT1000',
    CY: '1010',    IS: '101',     AL: '1001',    BA: '71000',  ME: '81000',
    LI: '9490',    MC: '98000',   SM: '47890',   VA: '00120',
    GI: 'GX111AA', GG: 'GY11AA',  JE: 'JE23QR',  FO: '100',    GL: '3900',
    // Asia Pacific
    CN: '100000',  JP: '1000001', IN: '110001',  ID: '10110',  SG: '018989',
    MY: '50000',   TH: '10200',   VN: '100000',  PH: '1000',   KR: '03000',
    HK: '999077',  TW: '100',     BD: '1000',    PK: '44000',  LK: '00100',
    MM: '11141',   KH: '12000',   LA: '01000',   MN: '14191',  NP: '44600',
    BT: '11001',   MV: '20026',   BN: 'BS8811',  TL: '00000',  MO: '000000',
    PG: '00001',   FJ: '00001',   WS: '00001',   TO: '00001',  VU: '00001',
    KI: '00001',   NR: '00001',   PW: '96940',   MH: '96960',  FM: '96941',
    SB: '00001',   TV: '00001',   CK: '00001',   PF: '98714',  NC: '98800',
    GU: '96910',   NZ: '1010',    AU: '2000',
    // Middle East
    AE: '00000',   SA: '11564',   QA: '00000',   KW: '13001',  BH: '317',
    OM: '100',     JO: '11118',   IL: '10000',   LB: '00000',  IQ: '10001',
    YE: '00001',
    // Central Asia
    KZ: '050000',  UZ: '100000',  AZ: '1000',    GE: '0179',   AM: '0001',
    TM: '744000',  TJ: '734025',  KG: '720001',
    // Africa
    ZA: '0001',    EG: '11511',   NG: '100001',  KE: '00100',  GH: '00233',
    ET: '1000',    TZ: '00501',   UG: '256',     SN: '12000',  CI: '00225',
    CM: '00000',   ZM: '10101',   ZW: '00263',   MZ: '1100',   MG: '101',
    AO: '00000',   MU: '00001',   RW: '00001',   BW: '00001',  NA: '00001',
    SL: '00001',   LR: '00001',   GM: '00001',   GN: '00001',  ML: '00001',
    BF: '00001',   NE: '00001',   TD: '00001',   ER: '00001',  DJ: '00001',
    SO: '00001',   SS: '00001',   SD: '11111',   LY: '00001',  TN: '1000',
    DZ: '16000',   MA: '10000',   SC: '00001',   MR: '00001',  BJ: '00001',
    TG: '00001',   GW: '00001',   CV: '00001',   ST: '00001',  GQ: '00001',
    CF: '00001',   CD: '00243',   CG: '00001',   GA: '00001',  MW: '00001',
    SZ: '00001',   LS: '100',
    // Other territories
    UA: '01001',   TR: '34000',   GF: '97300',   GP: '97100',  MQ: '97200',
    FK: '00001',
};

function getDefaultPostal(countryCode) {
    return DEFAULT_POSTAL[countryCode] || '00000';
}

const DEFAULT_CITY = {
    AU: 'Sydney',        AT: 'Vienna',        AZ: 'Baku',          BD: 'Dhaka',
    BE: 'Brussels',      BR: 'Sao Paulo',     BN: 'Bandar Seri Begawan', BG: 'Sofia',
    CA: 'Toronto',       CL: 'Santiago',      CN: 'Beijing',       CO: 'Bogota',
    HR: 'Zagreb',        CY: 'Nicosia',       CZ: 'Prague',        DK: 'Copenhagen',
    EG: 'Cairo',         EE: 'Tallinn',       FI: 'Helsinki',      FR: 'Paris',
    DE: 'Berlin',        GR: 'Athens',        HK: 'Hong Kong',     HU: 'Budapest',
    IS: 'Reykjavik',     IN: 'New Delhi',     ID: 'Jakarta',       IE: 'Dublin',
    IT: 'Rome',          JP: 'Tokyo',         JO: 'Amman',         KZ: 'Almaty',
    KR: 'Seoul',         KW: 'Kuwait City',   LV: 'Riga',          LT: 'Vilnius',
    LU: 'Luxembourg',    MY: 'Kuala Lumpur',  MV: 'Male',          MT: 'Valletta',
    MX: 'Mexico City',   NL: 'Amsterdam',     NZ: 'Auckland',      NO: 'Oslo',
    OM: 'Muscat',        PK: 'Islamabad',     PH: 'Manila',        PL: 'Warsaw',
    PT: 'Lisbon',        QA: 'Doha',          RO: 'Bucharest',     SA: 'Riyadh',
    SG: 'Singapore',     SK: 'Bratislava',    SI: 'Ljubljana',     ZA: 'Pretoria',
    ES: 'Madrid',        SE: 'Stockholm',     CH: 'Zurich',        TW: 'Taipei',
    TH: 'Bangkok',       TR: 'Istanbul',      AE: 'Dubai',         GB: 'London',
    US: 'New York',      VN: 'Hanoi',         BH: 'Manama',
};

function getDefaultCity(countryCode) {
    return DEFAULT_CITY[countryCode] || 'City';
}

// ─── Standard shipping box sizes ─────────────────────────────────────────────
// Dimensions confirmed by DHL support (Rate Request.zip attachment).
// DHL charges by the greater of actual weight vs volumetric weight (L×W×H / 5000).
// Using real box dimensions is critical for accurate rate quotes.
const SHIPPING_BOXES = [
    // Small: single small item (up to 0.5 kg)
    { maxWeightKg: 0.5, lengthCm: 25,   widthCm: 20,   heightCm: 8   },
    // Standard: 1–3 items (up to 2 kg) — DHL-confirmed box
    { maxWeightKg: 2.0, lengthCm: 33.7, widthCm: 32.2, heightCm: 9.2 },
    // Large: 4+ items (up to 5 kg)
    { maxWeightKg: 5.0, lengthCm: 40,   widthCm: 35,   heightCm: 15  },
    // Extra large: bulk orders (above 5 kg)
    { maxWeightKg: Infinity, lengthCm: 50, widthCm: 40, heightCm: 20  },
];

/**
 * Select the appropriate shipping box based on total package weight.
 * Returns { lengthCm, widthCm, heightCm }.
 */
function selectBox(weightKg) {
    for (const box of SHIPPING_BOXES) {
        if (weightKg <= box.maxWeightKg) {
            return { lengthCm: box.lengthCm, widthCm: box.widthCm, heightCm: box.heightCm };
        }
    }
    // Fallback to largest box
    const last = SHIPPING_BOXES[SHIPPING_BOXES.length - 1];
    return { lengthCm: last.lengthCm, widthCm: last.widthCm, heightCm: last.heightCm };
}

// ─── DHL Service name mapping ────────────────────────────────────────────────
const SERVICE_NAMES = {
    'P': 'Express Worldwide',
    'Y': 'Express 12:00',
    'M': 'Express 10:30',
    '8': 'Express Easy',
    'Q': 'Medical Express',
    'N': 'Express Domestic',
    'D': 'Express Worldwide (Doc)',
    'T': 'Express 12:00 (Doc)',
    'K': 'Express 9:00',
};

// ─── 1. Get Shipping Rates ───────────────────────────────────────────────────

/**
 * @param {object} destination  { city, postalCode, countryCode, streetLines }
 * @param {object} pkg          { weightKg, lengthCm, widthCm, heightCm }
 * @returns {object}            { currency, amount, productCode, deliveryTime, services[] }
 */
export async function getRates(destination, pkg) {
    const ts = shipTimestamp(120);

    // Auto-select box dimensions based on weight when not explicitly provided
    const weight = pkg.weightKg || 1.2;
    const box = selectBox(weight);
    pkg = {
        ...pkg,
        weightKg: weight,
        lengthCm: pkg.lengthCm || box.lengthCm,
        widthCm:  pkg.widthCm  || box.widthCm,
        heightCm: pkg.heightCm || box.heightCm,
    };

    // Build XML matching DHL's confirmed working template:
    // - No <Request>/<ServiceHeader> block
    // - PaymentInfo = DDU
    // - StreetLines present for recipient
    // - Element order: DropOffType, NextBusinessDay, Ship, Packages, ShipTimestamp, UnitOfMeasurement, Content, PaymentInfo, Account
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:rat="http://scxgxtt.phx-dc.dhl.com/euExpressRateBook/RateMsgRequest">
  <soapenv:Header>
    ${buildWsseHeader()}
  </soapenv:Header>
  <soapenv:Body>
    <rat:RateRequest>
      <ClientDetail/>
      <RequestedShipment>
        <DropOffType>REGULAR_PICKUP</DropOffType>
        <ServiceType>P</ServiceType>
        <NextBusinessDay>Y</NextBusinessDay>
        <Ship>
          <Shipper>
            <StreetLines>${xmlEscape(process.env.DHL_SHIPPER_STREET)}</StreetLines>
            <City>${xmlEscape(process.env.DHL_SHIPPER_CITY)}</City>
            <PostalCode>${xmlEscape(process.env.DHL_SHIPPER_POSTAL)}</PostalCode>
            <CountryCode>${xmlEscape(process.env.DHL_SHIPPER_COUNTRY)}</CountryCode>
          </Shipper>
          <Recipient>
            <StreetLines>${xmlEscape((destination.streetLines && destination.streetLines.trim()) || 'Main Street')}</StreetLines>
            <City>${xmlEscape((destination.city && destination.city.trim()) || getDefaultCity(destination.countryCode))}</City>
            <PostalCode>${xmlEscape((destination.postalCode && destination.postalCode.trim()) || getDefaultPostal(destination.countryCode))}</PostalCode>
            <CountryCode>${xmlEscape(destination.countryCode)}</CountryCode>
          </Recipient>
        </Ship>
        <Packages>
          <RequestedPackages number="1">
            <Weight>
              <Value>${pkg.weightKg || 1.2}</Value>
            </Weight>
            <Dimensions>
              <Length>${pkg.lengthCm}</Length>
              <Width>${pkg.widthCm}</Width>
              <Height>${pkg.heightCm}</Height>
            </Dimensions>
          </RequestedPackages>
        </Packages>
        <ShipTimestamp>${ts}</ShipTimestamp>
        <UnitOfMeasurement>SI</UnitOfMeasurement>
        <Content>NON_DOCUMENTS</Content>
        <PaymentInfo>DDU</PaymentInfo>
        <Account>${xmlEscape(process.env.DHL_ACCOUNT_NUMBER)}</Account>
      </RequestedShipment>
    </rat:RateRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    console.log('[DHL rates] Request for:', destination.countryCode, '| Weight:', pkg.weightKg, 'kg');

    const { body: response } = await soapPost(dhlEndpoint('rate'), xml, 'DHL-RATES');


    // ── Parse multi-service response ─────────────────────────────────────────
    // DHL returns multiple <Service type="X"> blocks, each with its own
    // TotalNet, Charges, DeliveryTime, CutoffTime.
    const serviceBlocks = [...response.matchAll(/<(?:[\w-]+:)?Service\b[^>]*\btype="([^"]+)"[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Service>/gi)];
    const services = [];

    for (const match of serviceBlocks) {
        const [, serviceType, block] = match;
        const totalNetBlock = extractTag(block, 'TotalNet');
        const currency = extractTag(totalNetBlock || block, 'Currency') || 'USD';
        const amount = totalNetBlock ? parseFloat(extractTag(totalNetBlock, 'Amount') || '0') : 0;
        const deliveryTime = extractTag(block, 'DeliveryTime') || null;
        const cutoffTime = extractTag(block, 'CutoffTime') || null;

        // Parse individual charges
        const chargeBlocks = extractAllTags(block, 'Charge');
        const charges = chargeBlocks.map(ch => ({
            type: extractTag(ch, 'ChargeType') || '',
            code: extractTag(ch, 'ChargeCode') || '',
            amount: parseFloat(extractTag(ch, 'ChargeAmount') || '0'),
        }));

        if (amount > 0) {
            services.push({
                serviceType,
                serviceName: SERVICE_NAMES[serviceType] || `DHL ${serviceType}`,
                currency,
                amount,
                deliveryTime,
                cutoffTime,
                charges,
            });
        }
    }

    // Sort by amount ascending (cheapest first)
    services.sort((a, b) => a.amount - b.amount);

    const errorMsg = extractDHLError(response);

    console.log(`[DHL rates] Parsed ${services.length} services. Error=${errorMsg}`);
    services.forEach(s => console.log(`  [${s.serviceType}] ${s.serviceName}: ${s.currency} ${s.amount}`));

    if (services.length === 0 && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    // Primary service: prefer Express Worldwide (P), fallback to cheapest
    const primary = services.find(s => s.serviceType === 'P') || services[0] || {};

    return {
        currency: primary.currency || 'USD',
        amount: primary.amount || 0,
        productCode: primary.serviceType || 'P',
        deliveryTime: primary.deliveryTime || null,
        services,


    };
}

/** Escape special regex characters in a string */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── 2. Create Shipment ──────────────────────────────────────────────────────

/**
 * @param {object} order    DB order (shippingAddress, orderItems, _id, etc.)
 * @param {number} weightKg Total package weight in kg
 * @returns {object}        { awbNumber, labelPdfBase64, pickupDate }
 */
export async function createShipment(order, weightKg = 1) {
    if (!['USD', 'EUR'].includes(order.currency)) { const error = new Error('Record the original order currency before creating a shipment.'); error.status = 400; throw error; }
    const box = selectBox(weightKg);
    const ts = shipTimestamp(120);
    const today = new Date().toISOString().split('T')[0];
    const invoiceNum = String(order._id).slice(-9).toUpperCase();
    const ref = msgRef();

    const { shippingAddress } = order;
    const items = order.orderItems || [];

    const lineItems = items.map((item, idx) => `
        <ExportLineItem>
          <CommodityCode>SPICE${idx + 1}</CommodityCode>
          <ExportReasonType>PERMANENT</ExportReasonType>
          <ItemNumber>${idx + 1}</ItemNumber>
          <Quantity>${item.qty || 1}</Quantity>
          <QuantityUnitOfMeasurement>PCS</QuantityUnitOfMeasurement>
          <ItemDescription>${xmlEscape(item.name)}</ItemDescription>
          <UnitPrice>${item.price}</UnitPrice>
          <NetWeight>${((weightKg / items.length) * 0.9).toFixed(2)}</NetWeight>
          <GrossWeight>${(weightKg / items.length).toFixed(2)}</GrossWeight>
          <ManufacturingCountryCode>LK</ManufacturingCountryCode>
        </ExportLineItem>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ship="http://scxgxtt.phx-dc.dhl.com/euExpressRateBook/ShipmentMsgRequest">
  <soapenv:Header>
    ${buildWsseHeader()}
  </soapenv:Header>
  <soapenv:Body>
    <ship:ShipmentRequest>
      <Request>
        <ServiceHeader>
          <MessageTime>${new Date().toISOString()}</MessageTime>
          <MessageReference>${ref}</MessageReference>
        </ServiceHeader>
      </Request>
      <RequestedShipment>
        <ShipmentInfo>
          <DropOffType>REGULAR_PICKUP</DropOffType>
          <ServiceType>${xmlEscape(order.shippingProductCode || 'P')}</ServiceType>
          <Billing>
            <ShipperAccountNumber>${xmlEscape(process.env.DHL_ACCOUNT_NUMBER)}</ShipperAccountNumber>
            <ShippingPaymentType>S</ShippingPaymentType>
            <BillingAccountNumber>${xmlEscape(process.env.DHL_ACCOUNT_NUMBER)}</BillingAccountNumber>
          </Billing>
          <SpecialServices>
            <Service><ServiceType>WY</ServiceType></Service>
          </SpecialServices>
          <Currency>${xmlEscape(order.currency)}</Currency>
          <UnitOfMeasurement>SI</UnitOfMeasurement>
          <ShipmentReferences>
            <ShipmentReference>
              <ShipmentReference>ORD-${invoiceNum}</ShipmentReference>
            </ShipmentReference>
          </ShipmentReferences>
          <LabelType>PDF</LabelType>
          <LabelTemplate>ECOM26_84_001</LabelTemplate>
          <ArchiveLabelTemplate>ARCH_8x4</ArchiveLabelTemplate>
          <CustomsInvoiceTemplate>COMMERCIAL_INVOICE_03</CustomsInvoiceTemplate>
          <PaperlessTradeEnabled>true</PaperlessTradeEnabled>
          <LabelOptions>
            <PrinterDPI>200</PrinterDPI>
            <RequestWaybillDocument>Y</RequestWaybillDocument>
            <HideAccountInWaybillDocument>N</HideAccountInWaybillDocument>
            <NumberOfWaybillDocumentCopies>1</NumberOfWaybillDocumentCopies>
            <RequestDHLCustomsInvoice>Y</RequestDHLCustomsInvoice>
            <DHLCustomsInvoiceLanguageCode>eng</DHLCustomsInvoiceLanguageCode>
            <DHLCustomsInvoiceType>COMMERCIAL_INVOICE</DHLCustomsInvoiceType>
          </LabelOptions>
        </ShipmentInfo>
        <ShipTimestamp>${ts}</ShipTimestamp>
        <PaymentInfo>DAP</PaymentInfo>
        <InternationalDetail>
          <Commodities>
            <Description>Ceylon Spices</Description>
            <CustomsValue>${order.itemsPrice || order.totalPrice}</CustomsValue>
          </Commodities>
          <Content>NON_DOCUMENTS</Content>
          <ExportDeclaration>
            <ExportLineItems>${lineItems}</ExportLineItems>
            <InvoiceDate>${today}</InvoiceDate>
            <InvoiceNumber>${invoiceNum}</InvoiceNumber>
            <InvoiceSignatureDetails>
              <SignatureName>${xmlEscape(process.env.DHL_SHIPPER_NAME)}</SignatureName>
              <SignatureTitle>MR</SignatureTitle>
            </InvoiceSignatureDetails>
            <PackageMarks>Silonka Premium Ceylon Spices</PackageMarks>
            <PayerGSTVAT></PayerGSTVAT>
            <RecipientReference>ORD-${invoiceNum}</RecipientReference>
          </ExportDeclaration>
        </InternationalDetail>
        <Ship>
          <Shipper>
            <Contact>
              <PersonName>${xmlEscape(process.env.DHL_SHIPPER_NAME)}</PersonName>
              <CompanyName>${xmlEscape(process.env.DHL_SHIPPER_COMPANY)}</CompanyName>
              <PhoneNumber>${xmlEscape(process.env.DHL_SHIPPER_PHONE)}</PhoneNumber>
              <EmailAddress>${xmlEscape(process.env.DHL_SHIPPER_EMAIL)}</EmailAddress>
              <MobilePhoneNumber>${xmlEscape(process.env.DHL_SHIPPER_PHONE)}</MobilePhoneNumber>
            </Contact>
            <Address>
              <StreetLines>${xmlEscape(process.env.DHL_SHIPPER_STREET)}</StreetLines>
              <City>${xmlEscape(process.env.DHL_SHIPPER_CITY)}</City>
              <PostalCode>${xmlEscape(process.env.DHL_SHIPPER_POSTAL)}</PostalCode>
              <CountryCode>${xmlEscape(process.env.DHL_SHIPPER_COUNTRY)}</CountryCode>
            </Address>
          </Shipper>
          <Recipient>
            <Contact>
              <PersonName>${xmlEscape(shippingAddress.fullName || 'Customer')}</PersonName>
              <CompanyName>${xmlEscape(shippingAddress.company || 'N/A')}</CompanyName>
              <PhoneNumber>${xmlEscape(shippingAddress.phone || '000000000')}</PhoneNumber>
              <EmailAddress>${xmlEscape(shippingAddress.email || 'customer@silonka.com')}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${xmlEscape(shippingAddress.address)}</StreetLines>
              <City>${xmlEscape(shippingAddress.city)}</City>
              <PostalCode>${xmlEscape(shippingAddress.postalCode || '')}</PostalCode>
              <CountryCode>${xmlEscape(shippingAddress.countryCode || shippingAddress.country)}</CountryCode>
            </Address>
          </Recipient>
        </Ship>
        <Packages>
          <RequestedPackages number="1">
            <Weight>${weightKg}</Weight>
            <Dimensions>
              <Length>${box.lengthCm}</Length>
              <Width>${box.widthCm}</Width>
              <Height>${box.heightCm}</Height>
            </Dimensions>
            <CustomerReferences>ORD-${invoiceNum}</CustomerReferences>
          </RequestedPackages>
        </Packages>
      </RequestedShipment>
    </ship:ShipmentRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const { body: response } = await soapPost(dhlEndpoint('shipment'), xml, 'DHL-SHIPMENT');

    const awbNumber = extractTag(response, 'AirwayBillNumber') || extractTag(response, 'AWBNumber');
    const labelPdfBase64 = extractTag(response, 'OutputImage') || extractTag(response, 'LabelImage');
    const errorMsg = extractDHLError(response);

    if (!awbNumber) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return { awbNumber, labelPdfBase64 };
}

// ─── 3. Schedule Pickup ──────────────────────────────────────────────────────

/**
 * @param {string} awbNumber  DHL Airway Bill Number
 * @param {string} pickupDate ISO date string (YYYY-MM-DD)
 * @returns {object}          { confirmationNumber, pickupDate }
 */
export async function schedulePickup(awbNumber, pickupDate) {
    const pickupTs = `${pickupDate}T10:00:00 GMT+05:30`;
    const ref = msgRef();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ns0="http://scxgxtt.phx-dc.dhl.com/euExpressRateBook/PickUpRequest">
  <soapenv:Header>
    ${buildWsseHeader()}
  </soapenv:Header>
  <soapenv:Body>
    <ns0:PickUpRequest>
      <Request>
        <ServiceHeader>
          <MessageTime>${new Date().toISOString()}</MessageTime>
          <MessageReference>${ref}</MessageReference>
        </ServiceHeader>
      </Request>
      <PickUpShipment>
        <ShipmentInfo>
          <ServiceType>P</ServiceType>
          <Billing>
            <ShipperAccountNumber>${xmlEscape(process.env.DHL_ACCOUNT_NUMBER)}</ShipperAccountNumber>
            <ShippingPaymentType>S</ShippingPaymentType>
            <BillingAccountNumber>${xmlEscape(process.env.DHL_ACCOUNT_NUMBER)}</BillingAccountNumber>
          </Billing>
          <UnitOfMeasurement>SI</UnitOfMeasurement>
        </ShipmentInfo>
        <PickupTimestamp>${pickupTs}</PickupTimestamp>
        <PickupLocationCloseTime>17:00</PickupLocationCloseTime>
        <SpecialPickupInstruction>AWB: ${awbNumber}</SpecialPickupInstruction>
        <PickupLocation>Silonka Store</PickupLocation>
        <InternationalDetail>
          <Commodities>
            <NumberOfPieces>1</NumberOfPieces>
            <Description>Ceylon Spices</Description>
          </Commodities>
        </InternationalDetail>
        <Ship>
          <Shipper>
            <Contact>
              <PersonName>${xmlEscape(process.env.DHL_SHIPPER_NAME)}</PersonName>
              <CompanyName>${xmlEscape(process.env.DHL_SHIPPER_COMPANY)}</CompanyName>
              <PhoneNumber>${xmlEscape(process.env.DHL_SHIPPER_PHONE)}</PhoneNumber>
              <EmailAddress>${xmlEscape(process.env.DHL_SHIPPER_EMAIL)}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${xmlEscape(process.env.DHL_SHIPPER_STREET)}</StreetLines>
              <City>${xmlEscape(process.env.DHL_SHIPPER_CITY)}</City>
              <PostalCode>${xmlEscape(process.env.DHL_SHIPPER_POSTAL)}</PostalCode>
              <CountryCode>${xmlEscape(process.env.DHL_SHIPPER_COUNTRY)}</CountryCode>
            </Address>
          </Shipper>
          <Pickup>
            <Contact>
              <PersonName>${xmlEscape(process.env.DHL_SHIPPER_NAME)}</PersonName>
              <CompanyName>${xmlEscape(process.env.DHL_SHIPPER_COMPANY)}</CompanyName>
              <PhoneNumber>${xmlEscape(process.env.DHL_SHIPPER_PHONE)}</PhoneNumber>
              <EmailAddress>${xmlEscape(process.env.DHL_SHIPPER_EMAIL)}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${xmlEscape(process.env.DHL_SHIPPER_STREET)}</StreetLines>
              <City>${xmlEscape(process.env.DHL_SHIPPER_CITY)}</City>
              <PostalCode>${xmlEscape(process.env.DHL_SHIPPER_POSTAL)}</PostalCode>
              <CountryCode>${xmlEscape(process.env.DHL_SHIPPER_COUNTRY)}</CountryCode>
            </Address>
          </Pickup>
        </Ship>
        <Packages>
          <RequestedPackages number="1">
            <Weight>1</Weight>
            <Dimensions>
              <Length>20</Length>
              <Width>15</Width>
              <Height>10</Height>
            </Dimensions>
            <CustomerReferences>${awbNumber}</CustomerReferences>
          </RequestedPackages>
        </Packages>
      </PickUpShipment>
    </ns0:PickUpRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const { body: response } = await soapPost(dhlEndpoint('pickup'), xml, 'DHL-PICKUP');

    const confirmationNumber = extractTag(response, 'ConfirmationNumber') || extractTag(response, 'PickupConfirmationNumber');
    const errorMsg = extractDHLError(response);

    if (!confirmationNumber && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return { confirmationNumber, pickupDate };
}

// ─── 4. Track Shipment ───────────────────────────────────────────────────────

/**
 * @param {string} awbNumber  DHL Airway Bill Number
 * @returns {object}          { status, events: [{ date, time, location, description }] }
 */
export async function trackShipment(awbNumber) {
    const msgTime = new Date().toISOString();
    const ref = msgRef();

    // DHL Express Track SOAP — glDHLExpressTrack service
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:dhl="http://www.dhl.com">
  <soapenv:Header>
    ${buildWsseHeader()}
  </soapenv:Header>
  <soapenv:Body>
    <dhl:TrackingRequest>
      <Request>
        <ServiceHeader>
          <MessageTime>${msgTime}</MessageTime>
          <MessageReference>${ref}</MessageReference>
        </ServiceHeader>
      </Request>
      <AWBNumber>
        <ArrayOfAWBNumberItem>${awbNumber}</ArrayOfAWBNumberItem>
      </AWBNumber>
      <LevelOfDetails>ALL_CHECK_POINTS</LevelOfDetails>
      <PiecesEnabled>P</PiecesEnabled>
    </dhl:TrackingRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const { body: response } = await soapPost(dhlEndpoint('track'), xml, 'DHL-TRACK');

    // Check for errors first
    const errorMsg = extractDHLError(response);

    // Extract checkpoint events — DHL uses AWBEvent blocks
    const checkpointBlocks = extractAllTags(response, 'AWBEvent');

    const events = checkpointBlocks.map((block) => {
        // Location can be in ServiceArea or ServiceAreaCode
        const serviceAreaBlock = extractTag(block, 'ServiceArea');
        const location = serviceAreaBlock
            ? (extractTag(serviceAreaBlock, 'Description') || extractTag(serviceAreaBlock, 'ServiceAreaCode') || '')
            : (extractTag(block, 'ServiceAreaCode') || '');

        return {
            date:        extractTag(block, 'Date') || '',
            time:        extractTag(block, 'Time') || '',
            location,
            description: extractTag(block, 'Description') || extractTag(block, 'Remark') || '',
            code:        extractTag(block, 'EventCode') || '',
        };
    });

    // Remove events where description is just the location name (ServiceArea description bleeds in)
    // and deduplicate
    const uniqueEvents = events.filter((e, i, arr) =>
        e.date && i === arr.findIndex(x => x.date === e.date && x.time === e.time && x.code === e.code)
    );

    const shipmentStatus = extractTag(response, 'ShipmentStatus')
        || extractTag(response, 'Status')
        || (uniqueEvents.length > 0 ? uniqueEvents[0].description : null);

    const shipperRef = extractTag(response, 'ShipperReference') || awbNumber;

    // If no events and there's an error, surface it
    if (uniqueEvents.length === 0 && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return {
        awbNumber,
        status: shipmentStatus || 'No tracking updates available',
        shipperRef,
        events: uniqueEvents,

    };
}
