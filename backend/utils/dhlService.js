/**
 * DHL Express SOAP Service
 * Wraps Rate, CreateShipment, SchedulePickup, and Track calls.
 * All credentials come from process.env — never exposed to the browser.
 *
 * NOTE: wsbexpress.dhl.com uses DHL's own CA; we disable strict TLS
 * verification only for this internal utility (not affecting other requests).
 */

import https from 'node:https';

const DHL_ENDPOINTS = {
    rate:     'https://wsbexpress.dhl.com:443/sndpt/expressRateBook',
    shipment: 'https://wsbexpress.dhl.com:443/sndpt/expressRateBook',
    pickup:   'https://wsbexpress.dhl.com:443/sndpt/requestPickup',
    track:    'https://wsbexpress.dhl.com:443/sndpt/glDHLExpressTrack',
};

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
            rejectUnauthorized: false, // DHL uses their own intermediate CA
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Content-Length': body.length,
                'SOAPAction': '',
            },
        };

        console.log(`[${label}] → POST ${url}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                console.log(`[${label}] ← HTTP ${res.statusCode} | Length: ${data.length}`);
                // Log first 800 chars of response for debugging without flooding logs
                console.log(`[${label}] RAW (first 800):\n${data.substring(0, 800)}`);
                resolve(data);
            });
        });

        req.on('error', (err) => {
            console.error(`[${label}] Network error:`, err.message);
            reject(err);
        });
        req.write(body);
        req.end();
    });
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

function buildWsseHeader() {
    return `<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soapenv:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>${process.env.DHL_USERNAME}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${process.env.DHL_PASSWORD}</wsse:Password>
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
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00 GMT+00:00`;
}

/**
 * Required by DHL for every SOAP call — unique reference per request.
 * Must be 28-32 characters.
 */
function msgRef() {
    return `SLK${Date.now()}SHIP`.substring(0, 28).padEnd(28, '0');
}

function extractTag(xml, tag) {
    const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'i');
    const m = xml.match(re);
    return m ? m[1].trim() : null;
}

function extractAllTags(xml, tag) {
    const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'gi');
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
    US: '10001', CA: 'M5H2N2', GB: 'SW1A1AA', AU: '2000',  NZ: '1010',
    DE: '10115', FR: '75001', IT: '00100', ES: '28001', PT: '1000001',
    NL: '1011',  BE: '1000',  CH: '8001',  AT: '1010',  SE: '11120',
    NO: '0150',  DK: '1000',  FI: '00100', GR: '10431', IE: 'D01',
    SG: '018989',MY: '50000', HK: '999077',JP: '1000001',CN: '100000',
    IN: '110001',PK: '44000', PH: '1000',  QA: '00000',  SA: '11564',
    AE: '00000', ZA: '0001',  MV: '20026',
};

function getDefaultPostal(countryCode) {
    return DEFAULT_POSTAL[countryCode] || '00000';
}

// ─── 1. Get Shipping Rates ───────────────────────────────────────────────────

/**
 * @param {object} destination  { city, postalCode, countryCode }
 * @param {object} pkg          { weightKg, lengthCm, widthCm, heightCm }
 * @returns {object}            { currency, amount, productCode, deliveryTime }
 */
export async function getRates(destination, pkg) {
    const ts = shipTimestamp(120);
    const ref = msgRef();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:rat="http://scxgxtt.phx-dc.dhl.com/euExpressRateBook/RateMsgRequest">
  <soapenv:Header>
    ${buildWsseHeader()}
  </soapenv:Header>
  <soapenv:Body>
    <rat:RateRequest>
      <Request>
        <ServiceHeader>
          <MessageTime>${new Date().toISOString()}</MessageTime>
          <MessageReference>${ref}</MessageReference>
        </ServiceHeader>
      </Request>
      <ClientDetail/>
      <RequestedShipment>
        <DropOffType>REGULAR_PICKUP</DropOffType>
        <ShipTimestamp>${ts}</ShipTimestamp>
        <UnitOfMeasurement>SI</UnitOfMeasurement>
        <Content>NON_DOCUMENTS</Content>
        <PaymentInfo>DAP</PaymentInfo>
        <NextBusinessDay>Y</NextBusinessDay>
        <Ship>
          <Shipper>
            <StreetLines>${process.env.DHL_SHIPPER_STREET}</StreetLines>
            <City>${process.env.DHL_SHIPPER_CITY}</City>
            <PostalCode>${process.env.DHL_SHIPPER_POSTAL}</PostalCode>
            <CountryCode>${process.env.DHL_SHIPPER_COUNTRY}</CountryCode>
          </Shipper>
          <Recipient>
            <City>${(destination.city && destination.city.trim()) || 'MAIN'}</City>
            <PostalCode>${(destination.postalCode && destination.postalCode.trim()) || getDefaultPostal(destination.countryCode)}</PostalCode>
            <CountryCode>${destination.countryCode}</CountryCode>
          </Recipient>
        </Ship>
        <Packages>
          <RequestedPackages number="1">
            <Weight>
              <Value>${pkg.weightKg || 0.5}</Value>
            </Weight>
            <Dimensions>
              <Length>${pkg.lengthCm || 20}</Length>
              <Width>${pkg.widthCm || 15}</Width>
              <Height>${pkg.heightCm || 10}</Height>
            </Dimensions>
          </RequestedPackages>
        </Packages>
        <Account>${process.env.DHL_ACCOUNT_NUMBER}</Account>
      </RequestedShipment>
    </rat:RateRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    console.log('[DHL rates] Request for:', destination.countryCode, '| Weight:', pkg.weightKg, 'kg');

    const response = await soapPost(DHL_ENDPOINTS.rate, xml, 'DHL-RATES');

    // Parse response — DHL wraps charges in Provider/Service
    const currency = extractTag(response, 'CurrencyCode') || 'USD';

    // TotalNet appears inside Provider → Service → Charges → TotalNet
    let amount = extractAmount(response, 'TotalNet');
    if (!amount) amount = extractAmount(response, 'Amount');
    if (!amount) amount = extractAmount(response, 'ShippingCharge');

    const productCode = extractTag(response, 'GlobalProductCode') || extractTag(response, 'ProductCode') || 'P';
    const deliveryTime = extractTag(response, 'DlvyDateTime') || extractTag(response, 'DeliveryDate') || null;

    const errorMsg = extractDHLError(response);

    console.log(`[DHL rates] Parsed → currency=${currency}, amount=${amount}, error=${errorMsg}`);

    if (amount === 0 && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return { currency, amount, productCode, deliveryTime, rawResponse: response };
}

// ─── 2. Create Shipment ──────────────────────────────────────────────────────

/**
 * @param {object} order    DB order (shippingAddress, orderItems, _id, etc.)
 * @param {number} weightKg Total package weight in kg
 * @returns {object}        { awbNumber, labelPdfBase64, pickupDate }
 */
export async function createShipment(order, weightKg = 1) {
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
          <ItemDescription>${item.name}</ItemDescription>
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
          <ServiceType>P</ServiceType>
          <Billing>
            <ShipperAccountNumber>${process.env.DHL_ACCOUNT_NUMBER}</ShipperAccountNumber>
            <ShippingPaymentType>S</ShippingPaymentType>
            <BillingAccountNumber>${process.env.DHL_ACCOUNT_NUMBER}</BillingAccountNumber>
          </Billing>
          <SpecialServices>
            <Service><ServiceType>WY</ServiceType></Service>
          </SpecialServices>
          <Currency>USD</Currency>
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
              <SignatureName>${process.env.DHL_SHIPPER_NAME}</SignatureName>
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
              <PersonName>${process.env.DHL_SHIPPER_NAME}</PersonName>
              <CompanyName>${process.env.DHL_SHIPPER_COMPANY}</CompanyName>
              <PhoneNumber>${process.env.DHL_SHIPPER_PHONE}</PhoneNumber>
              <EmailAddress>${process.env.DHL_SHIPPER_EMAIL}</EmailAddress>
              <MobilePhoneNumber>${process.env.DHL_SHIPPER_PHONE}</MobilePhoneNumber>
            </Contact>
            <Address>
              <StreetLines>${process.env.DHL_SHIPPER_STREET}</StreetLines>
              <City>${process.env.DHL_SHIPPER_CITY}</City>
              <PostalCode>${process.env.DHL_SHIPPER_POSTAL}</PostalCode>
              <CountryCode>${process.env.DHL_SHIPPER_COUNTRY}</CountryCode>
            </Address>
          </Shipper>
          <Recipient>
            <Contact>
              <PersonName>${shippingAddress.fullName || 'Customer'}</PersonName>
              <CompanyName>${shippingAddress.company || 'N/A'}</CompanyName>
              <PhoneNumber>${shippingAddress.phone || '000000000'}</PhoneNumber>
              <EmailAddress>${shippingAddress.email || 'customer@silonka.com'}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${shippingAddress.address}</StreetLines>
              <City>${shippingAddress.city}</City>
              <PostalCode>${shippingAddress.postalCode || ''}</PostalCode>
              <CountryCode>${shippingAddress.countryCode || shippingAddress.country}</CountryCode>
            </Address>
          </Recipient>
        </Ship>
        <Packages>
          <RequestedPackages number="1">
            <Weight>${weightKg}</Weight>
            <Dimensions>
              <Length>20</Length>
              <Width>15</Width>
              <Height>10</Height>
            </Dimensions>
            <CustomerReferences>ORD-${invoiceNum}</CustomerReferences>
          </RequestedPackages>
        </Packages>
      </RequestedShipment>
    </ship:ShipmentRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await soapPost(DHL_ENDPOINTS.shipment, xml, 'DHL-SHIPMENT');

    const awbNumber = extractTag(response, 'AirwayBillNumber') || extractTag(response, 'AWBNumber');
    const labelPdfBase64 = extractTag(response, 'OutputImage') || extractTag(response, 'LabelImage');
    const errorMsg = extractDHLError(response);

    if (!awbNumber && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return { awbNumber, labelPdfBase64, rawResponse: response };
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
            <ShipperAccountNumber>${process.env.DHL_ACCOUNT_NUMBER}</ShipperAccountNumber>
            <ShippingPaymentType>S</ShippingPaymentType>
            <BillingAccountNumber>${process.env.DHL_ACCOUNT_NUMBER}</BillingAccountNumber>
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
              <PersonName>${process.env.DHL_SHIPPER_NAME}</PersonName>
              <CompanyName>${process.env.DHL_SHIPPER_COMPANY}</CompanyName>
              <PhoneNumber>${process.env.DHL_SHIPPER_PHONE}</PhoneNumber>
              <EmailAddress>${process.env.DHL_SHIPPER_EMAIL}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${process.env.DHL_SHIPPER_STREET}</StreetLines>
              <City>${process.env.DHL_SHIPPER_CITY}</City>
              <PostalCode>${process.env.DHL_SHIPPER_POSTAL}</PostalCode>
              <CountryCode>${process.env.DHL_SHIPPER_COUNTRY}</CountryCode>
            </Address>
          </Shipper>
          <Pickup>
            <Contact>
              <PersonName>${process.env.DHL_SHIPPER_NAME}</PersonName>
              <CompanyName>${process.env.DHL_SHIPPER_COMPANY}</CompanyName>
              <PhoneNumber>${process.env.DHL_SHIPPER_PHONE}</PhoneNumber>
              <EmailAddress>${process.env.DHL_SHIPPER_EMAIL}</EmailAddress>
            </Contact>
            <Address>
              <StreetLines>${process.env.DHL_SHIPPER_STREET}</StreetLines>
              <City>${process.env.DHL_SHIPPER_CITY}</City>
              <PostalCode>${process.env.DHL_SHIPPER_POSTAL}</PostalCode>
              <CountryCode>${process.env.DHL_SHIPPER_COUNTRY}</CountryCode>
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

    const response = await soapPost(DHL_ENDPOINTS.pickup, xml, 'DHL-PICKUP');

    const confirmationNumber = extractTag(response, 'ConfirmationNumber') || extractTag(response, 'PickupConfirmationNumber');
    const errorMsg = extractDHLError(response);

    if (!confirmationNumber && errorMsg) {
        throw new Error(`DHL: ${errorMsg}`);
    }

    return { confirmationNumber, pickupDate, rawResponse: response };
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

    const response = await soapPost(DHL_ENDPOINTS.track, xml, 'DHL-TRACK');

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
        status: shipmentStatus || 'In Transit',
        shipperRef,
        events: uniqueEvents,
        rawResponse: response,
    };
}
