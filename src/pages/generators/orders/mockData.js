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

/* ── Cable Sizes (static — rates stored here, only selected size saved to DB) */
export const CABLE_SIZES = [
  { size: '10',       rate: 10  },
  { size: '16',       rate: 10  },
  { size: '25',       rate: 10  },
  { size: '35',       rate: 15  },
  { size: '50',       rate: 15  },
  { size: '70',       rate: 15  },
  { size: '95',       rate: 20  },
  { size: '120',      rate: 20  },
  { size: '150',      rate: 20  },
  { size: '185',      rate: 30  },
  { size: '240',      rate: 30  },
  { size: '300',      rate: 30  },
  { size: 'Earth Rod', rate: 500 },
];

/** Returns the rate for a given cable size string */
export function getCableRate(size) {
  const found = CABLE_SIZES.find(c => c.size === size);
  return found ? found.rate : 0;
}

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

/* ── Operator roster (mock — fallback when API unavailable) ──────────────── */
export const MOCK_OPERATORS = [
  { name: 'Suresh Kumar',   mobile: '9876543210' },
  { name: 'Amit Patel',     mobile: '9111222333' },
  { name: 'Vijay Singh',    mobile: '9222333444' },
  { name: 'Rakesh Nair',    mobile: '9333444555' },
  { name: 'Deepak Joshi',   mobile: '9444555666' },
  { name: 'Sandeep Verma',  mobile: '9555666777' },
  { name: 'Mohan Das',      mobile: '9666777888' },
  { name: 'Ramesh Tiwari',  mobile: '9777888999' },
  { name: 'Pradeep Ghosh',  mobile: '9888999000' },
  { name: 'Nitin Kulkarni', mobile: '9999000111' },
];

/* ── Mock Orders (new structure — each order has a `generators` array) ───── */
const rawMockOrders = [
  {
    id: 'GO20261',
    billNumber: '85658523521',
    clientName: 'Rajesh Construction Co.',
    contactNumber: '9876543210',
    alternateMobile: '',
    siteAddress: '123, MG Road, Sector 12, Navi Mumbai, Maharashtra - 400701',
    siteAddressLink: '',
    remarks: 'Client needs generator for 3 days event. Ensure timely fuel refill.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-04T11:00:00Z',
    generators: [
      {
        _id: 'g-001-1',
        generatorId: 'GEN-003',
        generatorName: 'Kirloskar 62.5 KVA',
        cableSize: '25',
        startTime: '09:00',
        endTime: '17:00',
        duration: '08:00',
      },
      {
        _id: 'g-001-2',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        cableSize: '',
        startTime: '09:00',
        endTime: '17:00',
        duration: '08:00',
      },
    ],
  },
  {
    id: 'GO20262',
    billNumber: '85658523522',
    clientName: 'Sharma Events & Pvt Ltd',
    contactNumber: '9123456789',
    alternateMobile: '',
    siteAddress: '456, Film City Road, Goregaon West, Mumbai - 400062',
    siteAddressLink: '',
    remarks: 'Wedding event. Client will arrange diesel. Operator must reach by 5 PM.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-28T08:00:00Z',
    updatedAt: '2026-07-01T00:30:00Z',
    generators: [
      {
        _id: 'g-002-1',
        generatorId: 'GEN-007',
        generatorName: 'Mahindra 82 KVA',
        cableSize: '',
        startTime: '18:00',
        endTime: '23:00',
        duration: '05:00',
      },
    ],
  },
  {
    id: 'GO20263',
    billNumber: '85658523523',
    clientName: 'Mehta Builders',
    contactNumber: '9988776655',
    alternateMobile: '',
    siteAddress: '789, Eastern Express Hwy, Chembur, Mumbai - 400071',
    siteAddressLink: '',
    remarks: 'Construction site backup power. Daily renewal likely.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-05T10:30:00Z',
    updatedAt: '2026-07-05T10:30:00Z',
    generators: [
      {
        _id: 'g-003-1',
        generatorId: 'GEN-012',
        generatorName: 'Cummins 125 KVA',
        cableSize: '35',
        startTime: '08:00',
        endTime: '20:00',
        duration: '12:00',
      },
      {
        _id: 'g-003-2',
        generatorId: 'GEN-004',
        generatorName: 'Kirloskar 125 KVA',
        cableSize: '35',
        startTime: '08:00',
        endTime: '20:00',
        duration: '12:00',
      },
      {
        _id: 'g-003-3',
        generatorId: 'GEN-008',
        generatorName: 'Mahindra 125 KVA',
        cableSize: '',
        startTime: '12:00',
        endTime: '20:00',
        duration: '08:00',
      },
    ],
  },
  {
    id: 'GO20264',
    billNumber: '85658523524',
    clientName: 'Gupta Retail Chain',
    contactNumber: '9871234560',
    alternateMobile: '',
    siteAddress: '22, Linking Road, Bandra West, Mumbai - 400050',
    siteAddressLink: '',
    remarks: 'Store inauguration backup. Short duration order.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-25T09:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
    generators: [
      {
        _id: 'g-004-1',
        generatorId: 'GEN-002',
        generatorName: 'Kirloskar 40 KVA',
        cableSize: '16',
        startTime: '10:00',
        endTime: '14:00',
        duration: '04:00',
      },
    ],
  },
  {
    id: 'GO20265',
    billNumber: '85658523525',
    clientName: 'Yadav Hospitality',
    contactNumber: '9090909090',
    alternateMobile: '',
    siteAddress: '501, Palm Beach Road, Vashi, Navi Mumbai - 400703',
    siteAddressLink: '',
    remarks: 'Hotel kitchen backup power. Continuous load expected.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-03T06:45:00Z',
    updatedAt: '2026-07-06T09:00:00Z',
    generators: [
      {
        _id: 'g-005-1',
        generatorId: 'GEN-006',
        generatorName: 'Mahindra 62.5 KVA',
        cableSize: '',
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
    ],
  },
  {
    id: 'GO20266',
    billNumber: '85658523526',
    clientName: 'Tech Park Infra Ltd',
    contactNumber: '9654321870',
    alternateMobile: '',
    siteAddress: 'Plot 7, MIDC, Andheri East, Mumbai - 400093',
    siteAddressLink: '',
    remarks: 'Data center backup. Must not stop under any circumstance.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-06T12:00:00Z',
    generators: [
      {
        _id: 'g-006-1',
        generatorId: 'GEN-013',
        generatorName: 'Cummins 250 KVA',
        cableSize: '70',
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
      {
        _id: 'g-006-2',
        generatorId: 'GEN-014',
        generatorName: 'Cummins 500 KVA',
        cableSize: '95',
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
    ],
  },
  {
    id: 'GO20267',
    billNumber: '85658523527',
    clientName: 'Patel Catering Services',
    contactNumber: '9321654780',
    alternateMobile: '',
    siteAddress: '15, Juhu Scheme, Santacruz West, Mumbai - 400049',
    siteAddressLink: '',
    remarks: 'Outdoor catering event. Client cancelled 2 days before.',
    status: ORDER_STATUSES.CANCELLED,
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    generators: [
      {
        _id: 'g-007-1',
        generatorId: 'GEN-001',
        generatorName: 'Kirloskar 25 KVA',
        cableSize: '',
        startTime: '16:00',
        endTime: '22:00',
        duration: '06:00',
      },
    ],
  },
  {
    id: 'GO20268',
    billNumber: '85658523528',
    clientName: 'Desai Medical Center',
    contactNumber: '9812345670',
    alternateMobile: '',
    siteAddress: '77, LBS Marg, Kurla West, Mumbai - 400070',
    siteAddressLink: '',
    remarks: 'ICU backup power. Priority order. 24/7 monitoring required.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T07:00:00Z',
    updatedAt: '2026-07-06T07:00:00Z',
    generators: [
      {
        _id: 'g-008-1',
        generatorId: 'GEN-011',
        generatorName: 'Cummins 82 KVA',
        cableSize: '35',
        startTime: '06:00',
        endTime: '22:00',
        duration: '16:00',
      },
    ],
  },
  {
    id: 'GO20269',
    billNumber: '85658523529',
    clientName: 'Kumar Industries',
    contactNumber: '9765432100',
    alternateMobile: '',
    siteAddress: '34, MIDC Phase 2, Dombivali East, Thane - 421203',
    siteAddressLink: '',
    remarks: 'Factory power backup during grid maintenance window.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-30T08:00:00Z',
    updatedAt: '2026-06-30T19:00:00Z',
    generators: [
      {
        _id: 'g-009-1',
        generatorId: 'GEN-008',
        generatorName: 'Mahindra 125 KVA',
        cableSize: '50',
        startTime: '08:30',
        endTime: '18:30',
        duration: '10:00',
      },
    ],
  },
  {
    id: 'GO202610',
    billNumber: '85658523530',
    clientName: 'Agarwal Wedding Hall',
    contactNumber: '9654789012',
    alternateMobile: '',
    siteAddress: 'Survey No. 101, Kalyan Road, Thane West - 400601',
    siteAddressLink: '',
    remarks: 'Sangeet night event. Loud sound system. High load expected.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T13:00:00Z',
    updatedAt: '2026-07-06T13:00:00Z',
    generators: [
      {
        _id: 'g-010-1',
        generatorId: 'GEN-003',
        generatorName: 'Kirloskar 62.5 KVA',
        cableSize: '25',
        startTime: '14:00',
        endTime: '02:00',
        duration: '12:00',
      },
      {
        _id: 'g-010-2',
        generatorId: 'GEN-006',
        generatorName: 'Mahindra 62.5 KVA',
        cableSize: '25',
        startTime: '14:00',
        endTime: '02:00',
        duration: '12:00',
      },
    ],
  },
  {
    id: 'GO202611',
    billNumber: '85658523531',
    clientName: 'Singh Pharma Ltd',
    contactNumber: '9098765432',
    alternateMobile: '',
    siteAddress: 'Plot 45, Tarapur MIDC, Boisar, Palghar - 401506',
    siteAddressLink: '',
    remarks: 'Cold storage backup. Temperature-sensitive cargo on site.',
    status: ORDER_STATUSES.CANCELLED,
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-17T12:00:00Z',
    generators: [
      {
        _id: 'g-011-1',
        generatorId: 'GEN-014',
        generatorName: 'Cummins 500 KVA',
        cableSize: '120',
        startTime: '00:00',
        endTime: '23:59',
        duration: '23:59',
      },
    ],
  },
  {
    id: 'GO202612',
    billNumber: '85658523532',
    clientName: 'Nair Film Productions',
    contactNumber: '9123409876',
    alternateMobile: '',
    siteAddress: 'Film City Complex, Goregaon East, Mumbai - 400065',
    siteAddressLink: '',
    remarks: 'Film shoot set power. Multiple light rigs on load.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-07-04T05:00:00Z',
    updatedAt: '2026-07-04T21:30:00Z',
    generators: [
      {
        _id: 'g-012-1',
        generatorId: 'GEN-005',
        generatorName: 'Mahindra 40 KVA',
        cableSize: '',
        startTime: '05:00',
        endTime: '21:00',
        duration: '16:00',
      },
      {
        _id: 'g-012-2',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        cableSize: '',
        startTime: '05:00',
        endTime: '21:00',
        duration: '16:00',
      },
    ],
  },
  {
    id: 'GO202613',
    billNumber: '85658523533',
    clientName: 'Verma Cold Storage',
    contactNumber: '9871234567',
    alternateMobile: '',
    siteAddress: '89, Market Yard, Vashi Sector 19, Navi Mumbai - 400705',
    siteAddressLink: '',
    remarks: 'Agricultural produce cold storage. Seasonal demand.',
    status: ORDER_STATUSES.IN_PROGRESS,
    createdAt: '2026-07-05T06:00:00Z',
    updatedAt: '2026-07-06T10:00:00Z',
    generators: [
      {
        _id: 'g-013-1',
        generatorId: 'GEN-004',
        generatorName: 'Kirloskar 125 KVA',
        cableSize: '50',
        startTime: '06:00',
        endTime: '20:00',
        duration: '14:00',
      },
    ],
  },
  {
    id: 'GO202614',
    billNumber: '85658523534',
    clientName: 'Chatterjee IT Solutions',
    contactNumber: '9654123780',
    alternateMobile: '',
    siteAddress: '3rd Floor, Infinity Tower, BKC, Mumbai - 400051',
    siteAddressLink: '',
    remarks: 'Server room backup for planned maintenance.',
    status: ORDER_STATUSES.PENDING,
    createdAt: '2026-07-06T08:00:00Z',
    updatedAt: '2026-07-06T08:00:00Z',
    generators: [
      {
        _id: 'g-014-1',
        generatorId: 'GEN-010',
        generatorName: 'Cummins 62.5 KVA',
        cableSize: '',
        startTime: '09:00',
        endTime: '18:00',
        duration: '09:00',
      },
    ],
  },
  {
    id: 'GO202615',
    billNumber: '85658523535',
    clientName: 'Iyer Textile Mills',
    contactNumber: '9765001234',
    alternateMobile: '',
    siteAddress: '12, Bhiwandi Road, Nashik, Maharashtra - 422010',
    siteAddressLink: '',
    remarks: 'Textile mill weaving machines. Very high amp load. Ensure stable output.',
    status: ORDER_STATUSES.COMPLETED,
    createdAt: '2026-06-22T07:00:00Z',
    updatedAt: '2026-06-22T19:30:00Z',
    generators: [
      {
        _id: 'g-015-1',
        generatorId: 'GEN-009',
        generatorName: 'Mahindra 250 KVA',
        cableSize: '95',
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
      {
        _id: 'g-015-2',
        generatorId: 'GEN-013',
        generatorName: 'Cummins 250 KVA',
        cableSize: '95',
        startTime: '07:00',
        endTime: '19:00',
        duration: '12:00',
      },
    ],
  },
];

// ── Mock staff users (mirrors what could be in the DB) ───────────────────────
export const MOCK_STAFF_USERS = [
  { id: 100, name: 'Staff',          mobile: '9800000000' },
  { id: 101, name: 'Arjun Mehta',    mobile: '9811001101' },
  { id: 102, name: 'Priya Sharma',   mobile: '9811001102' },
  { id: 103, name: 'Ravi Desai',     mobile: '9811001103' },
];

// Distribute orders across mock staff for demo purposes.
// Key demo orders assigned directly to "Staff" (covering In Progress, Pending, and Completed):
const STAFF_ASSIGNMENT = {
  'GO20261':  { id: 100, name: 'Staff' },        // IN_PROGRESS (With Diesel)
  'GO20262':  { id: 100, name: 'Staff' },        // COMPLETED (Party Diesel)
  'GO20263':  { id: 100, name: 'Staff' },        // PENDING (With Diesel)
  'GO20264':  { id: 102, name: 'Priya Sharma' },
  'GO20265':  { id: 100, name: 'Staff' },        // IN_PROGRESS (With Diesel)
  'GO20266':  { id: 100, name: 'Staff' },        // IN_PROGRESS (Party Diesel)
  'GO20267':  { id: 103, name: 'Ravi Desai' },
  'GO20268':  { id: 100, name: 'Staff' },        // PENDING (With Diesel)
  'GO20269':  { id: 101, name: 'Arjun Mehta' },
  'GO202610': { id: 100, name: 'Staff' },        // PENDING (With Diesel)
  'GO202611': { id: 102, name: 'Priya Sharma' },
  'GO202612': { id: 100, name: 'Staff' },        // COMPLETED (With Diesel)
  'GO202613': { id: 103, name: 'Ravi Desai' },
  'GO202614': { id: 102, name: 'Priya Sharma' },
  'GO202615': { id: 101, name: 'Arjun Mehta' },
};

// Operator assignments for mock orders
const OPERATOR_ASSIGNMENT = {
  'GO20261':  { name: 'Suresh Kumar',   mobile: '9876543210' },
  'GO20262':  { name: 'Amit Patel',     mobile: '9111222333' },
  'GO20263':  { name: 'Vijay Singh',    mobile: '9222333444' },
  'GO20264':  { name: 'Rakesh Nair',    mobile: '9333444555' },
  'GO20265':  { name: 'Deepak Joshi',   mobile: '9444555666' },
  'GO20266':  { name: 'Sandeep Verma',  mobile: '9555666777' },
  'GO20267':  { name: 'Mohan Das',      mobile: '9666777888' },
  'GO20268':  { name: 'Ramesh Tiwari',  mobile: '9777888999' },
  'GO20269':  { name: 'Pradeep Ghosh',  mobile: '9888999000' },
  'GO202610': { name: 'Suresh Kumar',   mobile: '9876543210' },
  'GO202611': { name: 'Nitin Kulkarni', mobile: '9999000111' },
  'GO202612': { name: 'Deepak Joshi',   mobile: '9444555666' },
  'GO202613': { name: 'Vijay Singh',    mobile: '9222333444' },
  'GO202614': { name: 'Rakesh Nair',    mobile: '9333444555' },
  'GO202615': { name: 'Sandeep Verma',  mobile: '9555666777' },
};

// Diesel type mapping for demo
const DIESEL_ASSIGNMENT = {
  'GO20261':  'WITH_OWNER',
  'GO20262':  'PARTY',
  'GO20263':  'WITH_OWNER',
  'GO20264':  'WITH_OWNER',
  'GO20265':  'WITH_OWNER',
  'GO20266':  'PARTY',
  'GO20267':  'PARTY',
  'GO20268':  'WITH_OWNER',
  'GO20269':  'PARTY',
  'GO202610': 'WITH_OWNER',
  'GO202611': 'WITH_OWNER',
  'GO202612': 'WITH_OWNER',
  'GO202613': 'PARTY',
  'GO202614': 'WITH_OWNER',
  'GO202615': 'WITH_OWNER',
};

export const mockOrders = rawMockOrders.map((o, idx) => {
  const dateObj = new Date(o.createdAt || '2026-07-06T00:00:00Z');
  const fromStr = dateObj.toISOString().split('T')[0];
  const toDate = new Date(dateObj.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
  const toStr = toDate.toISOString().split('T')[0];
  const staffAssignment = STAFF_ASSIGNMENT[o.id] || { id: 100, name: 'Staff' };
  const operatorAssignment = OPERATOR_ASSIGNMENT[o.id] || { name: 'Suresh Kumar', mobile: '9876543210' };
  const orderDieselType = DIESEL_ASSIGNMENT[o.id] || 'WITH_OWNER';

  // Ensure generators have default time values and multi-slot structure for time logging
  const enrichedGenerators = (o.generators || []).map((g, gIdx) => {
    const initialSlots = orderDieselType === 'WITH_OWNER' ? [
      {
        id: `slot-${o.id}-${gIdx}-1`,
        date: fromStr,
        startTime: '09:00',
        endTime: '17:00',
        duration: '08:00',
      },
    ] : [];

    return {
      ...g,
      dieselSlots: g.dieselSlots || initialSlots,
      dieselStartTime: g.dieselStartTime || (orderDieselType === 'WITH_OWNER' ? '09:00' : ''),
      dieselEndTime: g.dieselEndTime || (orderDieselType === 'WITH_OWNER' ? '17:00' : ''),
      dieselDuration: g.dieselDuration || (orderDieselType === 'WITH_OWNER' ? '08:00' : ''),
    };
  });

  return {
    ...o,
    functionDate: `${fromStr} to ${toStr}`,
    bookingStatus: idx % 2 === 0 ? 'Confirmed' : 'Booked',
    operatorName: operatorAssignment.name,
    operatorMobile: operatorAssignment.mobile,
    cableRequired: enrichedGenerators.some(g => g.cableSize) ?? true,
    dieselType: orderDieselType,
    generators: enrichedGenerators,
    // Staff assignment fields
    assignedToId:   staffAssignment.id,
    assignedToName: staffAssignment.name,
    assignedById:   1,
    assignedByName: 'Super Admin',
  };
});

/* ── Staff Order Persistence & Filter Helpers ─────────────────────────────── */

const STAFF_STORAGE_KEY = 'erp_staff_orders_demo_cache';

export function getDatesFromFunctionDate(functionDateStr) {
  if (!functionDateStr) return [new Date().toISOString().split('T')[0]];
  const parts = functionDateStr.split(' to ');
  const parseDate = (dStr) => {
    if (!dStr) return null;
    const clean = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return new Date(clean);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseDate(parts[0]);
  const end = parts[1] ? parseDate(parts[1]) : start;

  if (!start) return [new Date().toISOString().split('T')[0]];
  const dates = [];
  const curr = new Date(start);
  const stop = end || start;
  while (curr <= stop) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
    if (dates.length > 31) break;
  }
  return dates.length > 0 ? dates : [new Date().toISOString().split('T')[0]];
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '—';

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // passes midnight
  }
  const diff = endMinutes - startMinutes;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function getStaffOrdersList(currentUser) {
  let baseOrders = mockOrders;
  try {
    const cached = localStorage.getItem(STAFF_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseOrders = parsed;
      }
    }
  } catch {
    // fallback to mockOrders
  }

  // Filter for orders assigned to current staff user
  // If user is Staff or has role STAFF, show all orders assigned to 'Staff'
  const isStaffRole = currentUser?.role === 'STAFF';
  const userName = currentUser?.name?.trim().toLowerCase() || 'staff';

  const userOrders = baseOrders.filter(o => {
    const assignedName = (o.assignedToName || '').toLowerCase();
    if (assignedName === userName) return true;
    if (currentUser?.id && o.assignedToId === currentUser.id) return true;
    if (isStaffRole && (assignedName === 'staff' || !assignedName)) return true;
    return false;
  });

  // If none matched, fallback to all orders where assignedToName is 'Staff'
  if (userOrders.length === 0) {
    return baseOrders.filter(o => (o.assignedToName || '').toLowerCase() === 'staff');
  }

  return userOrders;
}

export function saveStaffOrderTimes(orderId, updatedGenerators) {
  try {
    let orders = [];
    const cached = localStorage.getItem(STAFF_STORAGE_KEY);
    if (cached) {
      orders = JSON.parse(cached);
    } else {
      orders = [...mockOrders];
    }

    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx] = {
        ...orders[idx],
        generators: updatedGenerators,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(orders));
      return orders[idx];
    }
  } catch (err) {
    console.error('Failed to save staff order times', err);
  }
  return null;
}



/* ── Helper utilities ─────────────────────────────────────────────────────── */

/**
 * Generates a new order number in GO{year}{seq} format.
 * Ensures no duplicates against the provided allOrders list.
 */
export function generateOrderNumber(allOrders) {
  const year = new Date().getFullYear();
  const prefix = `GO${year}`;
  const usedNumbers = allOrders
    .filter(o => o.id && o.id.startsWith(prefix))
    .map(o => {
      const num = parseInt(o.id.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });
  const nextNum = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}${nextNum}`;
}

export function createOrder(fields, allOrders) {
  const now = new Date().toISOString();
  const finalId = fields.id || generateOrderNumber(allOrders);
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

/** Parse string or date into a valid JS Date object */
export function parseDateStr(str) {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
  if (typeof str === 'string') {
    const trimmed = str.trim();
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy-mm-dd
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return isNaN(d.getTime()) ? null : d;
      } else if (parts[2].length === 4) {
        // dd-mm-yyyy or dd/mm/yyyy
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return isNaN(d.getTime()) ? null : d;
      }
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/** Format date to dd-mm-yyyy */
export function formatToDMY(date) {
  if (!date) return '—';
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
  }
  const d = parseDateStr(date);
  if (!d) return typeof date === 'string' ? date : '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Format a date range string to "dd-mm-yyyy to dd-mm-yyyy" */
export function formatRangeToDMY(rangeStr) {
  if (!rangeStr) return '—';
  if (typeof rangeStr === 'string' && rangeStr.includes(' to ')) {
    return rangeStr.split(' to ').map(s => formatToDMY(s)).join(' to ');
  }
  return formatToDMY(rangeStr);
}

/** Format date to dd-mm-yyyy */
export function fmtDate(iso) {
  return formatToDMY(iso);
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
  cableSize:     '',
  startTime:     '09:00',
  endTime:       '18:00',
  duration:      '09:00',
});

export let MOCK_BILLS = [
  { orderId: 'GO20261', billNo: '00001', rentPrices: { 'g-001-1': 9000, 'g-001-2': 4000 } },
  { orderId: 'GO20262', billNo: '00002', rentPrices: { 'g-002-1': 1500 } }
];

/**
 * Converts a number to Indian words (for invoice amount-in-words display).
 */
export function numberToWords(num) {
  if (num === 0) return 'ZERO ONLY';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
                'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
                'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertHundreds(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
      if (n > 0) str += 'AND ';
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) str += ones[n] + ' ';
    return str;
  }

  const intPart  = Math.floor(num);
  const decPart  = Math.round((num - intPart) * 100);

  let result = '';
  if (intPart >= 10000000) {
    result += convertHundreds(Math.floor(intPart / 10000000)) + 'CRORE ';
  }
  if (intPart >= 100000) {
    result += convertHundreds(Math.floor((intPart % 10000000) / 100000)) + 'LAKH ';
  }
  if (intPart >= 1000) {
    result += convertHundreds(Math.floor((intPart % 100000) / 1000)) + 'THOUSAND ';
  }
  
  result += convertHundreds(intPart % 1000);

  if (decPart > 0) {
    result = result.trim() + ' AND PAISE ' + convertHundreds(decPart);
  }

  return 'RUPEES ' + result.trim() + ' ONLY.';
}
