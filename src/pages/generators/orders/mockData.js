// src/pages/generators/orders/mockData.js
// Static mock data — no API calls. Replace with real service calls when ready.

/* ── Enumerations ────────────────────────────────────────────────────────── */
export const ORDER_STATUSES = {
  PENDING:     'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED:   'COMPLETED',
  CANCELLED:   'CANCELLED',
};

export const DIESEL_TYPES = {
  WITH_OWNER: 'WITH_OWNER',
  PARTY:      'PARTY',
};

/* ── Generator catalogue (mock — maps to Generator Inventory) ────────────── */
export const MOCK_GENERATORS = [
  { id: 'GEN-001', name: 'Kirloskar 25 KVA',  code: 'KIR-25'  },
  { id: 'GEN-002', name: 'Kirloskar 40 KVA',  code: 'KIR-40'  },
  { id: 'GEN-003', name: 'Kirloskar 62.5 KVA',code: 'KIR-62'  },
  { id: 'GEN-004', name: 'Kirloskar 125 KVA', code: 'KIR-125' },
  { id: 'GEN-005', name: 'Mahindra 40 KVA',   code: 'MAH-40'  },
  { id: 'GEN-006', name: 'Mahindra 62.5 KVA', code: 'MAH-62'  },
  { id: 'GEN-007', name: 'Mahindra 82 KVA',   code: 'MAH-82'  },
  { id: 'GEN-008', name: 'Mahindra 125 KVA',  code: 'MAH-125' },
  { id: 'GEN-009', name: 'Mahindra 250 KVA',  code: 'MAH-250' },
  { id: 'GEN-010', name: 'Cummins 62.5 KVA',  code: 'CUM-62'  },
  { id: 'GEN-011', name: 'Cummins 82 KVA',    code: 'CUM-82'  },
  { id: 'GEN-012', name: 'Cummins 125 KVA',   code: 'CUM-125' },
  { id: 'GEN-013', name: 'Cummins 250 KVA',   code: 'CUM-250' },
  { id: 'GEN-014', name: 'Cummins 500 KVA',   code: 'CUM-500' },
];

/* ── Operator roster (mock) ──────────────────────────────────────────────── */
export const MOCK_OPERATORS = [
  'Suresh Kumar',
  'Amit Patel',
  'Vijay Singh',
  'Rakesh Nair',
  'Deepak Joshi',
  'Sandeep Verma',
  'Mohan Das',
  'Ramesh Tiwari',
  'Pradeep Ghosh',
  'Nitin Kulkarni',
];

/* ── Mock Orders (new structure — each order has a `generators` array) ───── */
const rawMockOrders = [
  {
    id: 'ORD-001',
    billNumber: '85658523521',
    clientName: 'Rajesh Construction Co.',
    contactNumber: '9876543210',
    siteAddress: '123, MG Road, Sector 12, Navi Mumbai, Maharashtra - 400701',
    remarks: 'Client needs generator for 3 days event. Ensure timely fuel refill.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-04T11:00:00Z',
    generators: [
      {
        _id: 'g-001-1',
        generatorId: 'GEN-003',
        generatorName: 'Kirloskar 62.5 KVA',
        operatorName: 'Suresh Kumar',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '09:00',
        endTime: '17:00',
        duration: '08:00',
      },
      {
        _id: 'g-001-2',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        operatorName: 'Ramesh Tiwari',
        cableRequired: false,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '09:00',
        endTime: '17:00',
        duration: '08:00',
      },
    ],
  },
  {
    id: 'ORD-002',
    billNumber: '85658523522',
    clientName: 'Sharma Events & Pvt Ltd',
    contactNumber: '9123456789',
    siteAddress: '456, Film City Road, Goregaon West, Mumbai - 400062',
    remarks: 'Wedding event. Client will arrange diesel. Operator must reach by 5 PM.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-28T08:00:00Z',
    updatedAt: '2026-07-01T00:30:00Z',
    generators: [
      {
        _id: 'g-002-1',
        generatorId: 'GEN-007',
        generatorName: 'Mahindra 82 KVA',
        operatorName: 'Amit Patel',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '18:00',
        endTime: '23:00',
        duration: '05:00',
      },
    ],
  },
  {
    id: 'ORD-003',
    billNumber: '85658523523',
    clientName: 'Mehta Builders',
    contactNumber: '9988776655',
    siteAddress: '789, Eastern Express Hwy, Chembur, Mumbai - 400071',
    remarks: 'Construction site backup power. Daily renewal likely.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-05T10:30:00Z',
    updatedAt: '2026-07-05T10:30:00Z',
    generators: [
      {
        _id: 'g-003-1',
        generatorId: 'GEN-012',
        generatorName: 'Cummins 125 KVA',
        operatorName: 'Vijay Singh',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '08:00',
        endTime: '20:00',
        duration: '12:00',
      },
      {
        _id: 'g-003-2',
        generatorId: 'GEN-004',
        generatorName: 'Kirloskar 125 KVA',
        operatorName: 'Deepak Joshi',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '08:00',
        endTime: '20:00',
        duration: '12:00',
      },
      {
        _id: 'g-003-3',
        generatorId: 'GEN-008',
        generatorName: 'Mahindra 125 KVA',
        operatorName: 'Pradeep Ghosh',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '12:00',
        endTime: '20:00',
        duration: '08:00',
      },
    ],
  },
  {
    id: 'ORD-004',
    billNumber: '85658523524',
    clientName: 'Gupta Retail Chain',
    contactNumber: '9871234560',
    siteAddress: '22, Linking Road, Bandra West, Mumbai - 400050',
    remarks: 'Store inauguration backup. Short duration order.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-25T09:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
    generators: [
      {
        _id: 'g-004-1',
        generatorId: 'GEN-002',
        generatorName: 'Kirloskar 40 KVA',
        operatorName: 'Rakesh Nair',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '10:00',
        endTime: '14:00',
        duration: '04:00',
      },
    ],
  },
  {
    id: 'ORD-005',
    billNumber: '85658523525',
    clientName: 'Yadav Hospitality',
    contactNumber: '9090909090',
    siteAddress: '501, Palm Beach Road, Vashi, Navi Mumbai - 400703',
    remarks: 'Hotel kitchen backup power. Continuous load expected.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-03T06:45:00Z',
    updatedAt: '2026-07-06T09:00:00Z',
    generators: [
      {
        _id: 'g-005-1',
        generatorId: 'GEN-006',
        generatorName: 'Mahindra 62.5 KVA',
        operatorName: 'Deepak Joshi',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
    ],
  },
  {
    id: 'ORD-006',
    billNumber: '85658523526',
    clientName: 'Tech Park Infra Ltd',
    contactNumber: '9654321870',
    siteAddress: 'Plot 7, MIDC, Andheri East, Mumbai - 400093',
    remarks: 'Data center backup. Must not stop under any circumstance.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-06T12:00:00Z',
    generators: [
      {
        _id: 'g-006-1',
        generatorId: 'GEN-013',
        generatorName: 'Cummins 250 KVA',
        operatorName: 'Sandeep Verma',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
      {
        _id: 'g-006-2',
        generatorId: 'GEN-014',
        generatorName: 'Cummins 500 KVA',
        operatorName: 'Nitin Kulkarni',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
    ],
  },
  {
    id: 'ORD-007',
    billNumber: '85658523527',
    clientName: 'Patel Catering Services',
    contactNumber: '9321654780',
    siteAddress: '15, Juhu Scheme, Santacruz West, Mumbai - 400049',
    remarks: 'Outdoor catering event. Client cancelled 2 days before.',
    status: ORDER_STATUSES.CANCELLED,
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    generators: [
      {
        _id: 'g-007-1',
        generatorId: 'GEN-001',
        generatorName: 'Kirloskar 25 KVA',
        operatorName: 'Mohan Das',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '16:00',
        endTime: '22:00',
        duration: '06:00',
      },
    ],
  },
  {
    id: 'ORD-008',
    billNumber: '85658523528',
    clientName: 'Desai Medical Center',
    contactNumber: '9812345670',
    siteAddress: '77, LBS Marg, Kurla West, Mumbai - 400070',
    remarks: 'ICU backup power. Priority order. 24/7 monitoring required.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T07:00:00Z',
    updatedAt: '2026-07-06T07:00:00Z',
    generators: [
      {
        _id: 'g-008-1',
        generatorId: 'GEN-011',
        generatorName: 'Cummins 82 KVA',
        operatorName: 'Ramesh Tiwari',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '06:00',
        endTime: '22:00',
        duration: '16:00',
      },
    ],
  },
  {
    id: 'ORD-009',
    billNumber: '85658523529',
    clientName: 'Kumar Industries',
    contactNumber: '9765432100',
    siteAddress: '34, MIDC Phase 2, Dombivali East, Thane - 421203',
    remarks: 'Factory power backup during grid maintenance window.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-30T08:00:00Z',
    updatedAt: '2026-06-30T19:00:00Z',
    generators: [
      {
        _id: 'g-009-1',
        generatorId: 'GEN-008',
        generatorName: 'Mahindra 125 KVA',
        operatorName: 'Pradeep Ghosh',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '08:30',
        endTime: '18:30',
        duration: '10:00',
      },
    ],
  },
  {
    id: 'ORD-010',
    billNumber: '85658523530',
    clientName: 'Agarwal Wedding Hall',
    contactNumber: '9654789012',
    siteAddress: 'Survey No. 101, Kalyan Road, Thane West - 400601',
    remarks: 'Sangeet night event. Loud sound system. High load expected.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T13:00:00Z',
    updatedAt: '2026-07-06T13:00:00Z',
    generators: [
      {
        _id: 'g-010-1',
        generatorId: 'GEN-003',
        generatorName: 'Kirloskar 62.5 KVA',
        operatorName: 'Suresh Kumar',
        cableRequired: true,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '14:00',
        endTime: '02:00',
        duration: '12:00',
      },
      {
        _id: 'g-010-2',
        generatorId: 'GEN-006',
        generatorName: 'Mahindra 62.5 KVA',
        operatorName: 'Deepak Joshi',
        cableRequired: true,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '14:00',
        endTime: '02:00',
        duration: '12:00',
      },
    ],
  },
  {
    id: 'ORD-011',
    billNumber: '85658523531',
    clientName: 'Singh Pharma Ltd',
    contactNumber: '9098765432',
    siteAddress: 'Plot 45, Tarapur MIDC, Boisar, Palghar - 401506',
    remarks: 'Cold storage backup. Temperature-sensitive cargo on site.',
    status: ORDER_STATUSES.CANCELLED,
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-17T12:00:00Z',
    generators: [
      {
        _id: 'g-011-1',
        generatorId: 'GEN-014',
        generatorName: 'Cummins 500 KVA',
        operatorName: 'Nitin Kulkarni',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
    ],
  },
  {
    id: 'ORD-012',
    billNumber: '85658523532',
    clientName: 'Nair Film Productions',
    contactNumber: '9123409876',
    siteAddress: 'Film City Complex, Goregaon East, Mumbai - 400065',
    remarks: 'Film shoot set power. Multiple light rigs on load.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-07-04T05:00:00Z',
    updatedAt: '2026-07-04T21:30:00Z',
    generators: [
      {
        _id: 'g-012-1',
        generatorId: 'GEN-005',
        generatorName: 'Mahindra 40 KVA',
        operatorName: 'Deepak Joshi',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '05:00',
        endTime: '21:00',
        duration: '16:00',
      },
      {
        _id: 'g-012-2',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        operatorName: 'Vijay Singh',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '05:00',
        endTime: '21:00',
        duration: '16:00',
      },
    ],
  },
  {
    id: 'ORD-013',
    billNumber: '85658523533',
    clientName: 'Verma Cold Storage',
    contactNumber: '9871234567',
    siteAddress: '89, Market Yard, Vashi Sector 19, Navi Mumbai - 400705',
    remarks: 'Agricultural produce cold storage. Seasonal demand.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-05T06:00:00Z',
    updatedAt: '2026-07-06T10:00:00Z',
    generators: [
      {
        _id: 'g-013-1',
        generatorId: 'GEN-004',
        generatorName: 'Kirloskar 125 KVA',
        operatorName: 'Vijay Singh',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '06:00',
        endTime: '20:00',
        duration: '14:00',
      },
    ],
  },
  {
    id: 'ORD-014',
    billNumber: '85658523534',
    clientName: 'Chatterjee IT Solutions',
    contactNumber: '9654123780',
    siteAddress: '3rd Floor, Infinity Tower, BKC, Mumbai - 400051',
    remarks: 'Server room backup for planned maintenance.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T08:00:00Z',
    updatedAt: '2026-07-06T08:00:00Z',
    generators: [
      {
        _id: 'g-014-1',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        operatorName: 'Rakesh Nair',
        cableRequired: false,
        dieselType: DIESEL_TYPES.PARTY,
        startTime: '09:00',
        endTime: '18:00',
        duration: '09:00',
      },
    ],
  },
  {
    id: 'ORD-015',
    billNumber: '85658523535',
    clientName: 'Iyer Textile Mills',
    contactNumber: '9765001234',
    siteAddress: '12, Bhiwandi Road, Nashik, Maharashtra - 422010',
    remarks: 'Textile mill weaving machines. Very high amp load. Ensure stable output.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-22T07:00:00Z',
    updatedAt: '2026-06-22T19:30:00Z',
    generators: [
      {
        _id: 'g-015-1',
        generatorId: 'GEN-009',
        generatorName: 'Mahindra 250 KVA',
        operatorName: 'Sandeep Verma',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
      {
        _id: 'g-015-2',
        generatorId: 'GEN-013',
        generatorName: 'Cummins 250 KVA',
        operatorName: 'Nitin Kulkarni',
        cableRequired: true,
        dieselType: DIESEL_TYPES.WITH_OWNER,
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
    ],
  },
];

export const mockOrders = rawMockOrders.map((o, idx) => {
  const dateObj = new Date(o.createdAt || '2026-07-06T00:00:00Z');
  const fromStr = dateObj.toISOString().split('T')[0];
  const toDate = new Date(dateObj.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
  const toStr = toDate.toISOString().split('T')[0];
  
  return {
    ...o,
    functionDate: `${fromStr} to ${toStr}`,
    bookingStatus: idx % 2 === 0 ? 'Confirmed' : 'Booked',
    operatorName: o.operatorName || o.generators?.[0]?.operatorName || 'Suresh Kumar',
    cableRequired: o.cableRequired ?? o.generators?.[0]?.cableRequired ?? true,
    dieselType: o.dieselType || o.generators?.[0]?.dieselType || 'WITH_OWNER'
  };
});

/* ── Helper utilities ─────────────────────────────────────────────────────── */

export function createOrder(fields, allOrders) {
  const now = new Date().toISOString();
  let finalId = fields.id;
  if (!finalId) {
    const numbers = allOrders.map(o => {
      const match = o.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(0, ...numbers) + 1;
    finalId = `ORD-${String(nextNum).padStart(5, '0')}`;
  }
  return { ...fields, id: finalId, createdAt: now, updatedAt: now, status: ORDER_STATUSES.PENDING };
}

/** Calculate HH:MM duration between two HH:MM time strings (handles next-day wrap) */
export function calcDuration(start, end) {
  if (!start || !end) return '00:00';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins < 0) totalMins += 24 * 60;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format a UTC ISO string to a readable local date */
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const STATUS_CONFIG = {
  [ORDER_STATUSES.PENDING]:     { label: 'Pending',     bg: '#FEF3C7', color: '#92400E' },
  [ORDER_STATUSES.IN_PROGRESS]: { label: 'In Progress', bg: '#DBEAFE', color: '#1E40AF' },
  [ORDER_STATUSES.COMPLETED]:   { label: 'Completed',   bg: '#D1FAE5', color: '#065F46' },
  [ORDER_STATUSES.CANCELLED]:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#991B1B' },
};

/** Empty generator entry template */
export const newGeneratorEntry = () => ({
  _id:           `g-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  generatorId:   '',
  generatorName: '',
  operatorName:  '',
  cableRequired: true,
  dieselType:    DIESEL_TYPES.WITH_OWNER,
  startTime:     '09:00',
  endTime:       '18:00',
  duration:      '09:00',
});

export let MOCK_BILLS = [
  { orderId: 'ORD-00001', billNo: '00001', rentPrices: { 'g-001-1': 1200, 'g-001-2': 1000 } },
  { orderId: 'ORD-00002', billNo: '00002', rentPrices: { 'g-002-1': 1500 } }
];
