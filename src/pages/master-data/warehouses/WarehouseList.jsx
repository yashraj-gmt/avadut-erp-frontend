// src/pages/master-data/warehouses/WarehouseList.jsx
import { useState, useMemo } from 'react';
import PageHeader                      from '@/components/shared/PageHeader';
import { StatCard }                    from '@/components/shared/Card';
import { SearchInput }                 from '@/components/shared/Input';
import Input                           from '@/components/shared/Input';
import DataTable                       from '@/components/shared/DataTable';
import Badge                           from '@/components/shared/Badge';
import Button, { IconButton }          from '@/components/shared/Button';
import { NoSearchResults, NoData }     from '@/components/shared/EmptyState';
import ConfirmModal                    from '@/components/shared/modal/ConfirmModal';
import WarehouseForm                   from './WarehouseForm';

/* ── Mock data ──────────────────────────────────────────────────────────── */
const MOCK_WAREHOUSES = [
  {
    id: 1, name: 'Central Delhi Hub',       code: 'WH-DEL-01',
    location: 'Industrial Area, Phase 1',   address: '12, Okhla Industrial Estate',
    city: 'New Delhi',   state: 'Delhi',     pincode: '110020',
    contactPerson: 'Ramesh Sharma',          contactPhone: '+91 98765 43210',
    totalCapacity: 8000,  isActive: true,    inventories: 142,
  },
  {
    id: 2, name: 'Mumbai West Depot',       code: 'WH-MUM-01',
    location: 'MIDC Andheri West',          address: '45-B, MIDC Road, Andheri (W)',
    city: 'Mumbai',      state: 'Maharashtra', pincode: '400053',
    contactPerson: 'Priya Nair',            contactPhone: '+91 90123 45678',
    totalCapacity: 12000, isActive: true,   inventories: 318,
  },
  {
    id: 3, name: 'Bengaluru Cold Store',    code: 'WH-BLR-CS',
    location: 'Electronic City Phase 2',    address: 'Plot 7, Hosur Road',
    city: 'Bengaluru',   state: 'Karnataka', pincode: '560100',
    contactPerson: 'Arjun Rao',             contactPhone: '+91 80900 12345',
    totalCapacity: 4500,  isActive: true,   inventories: 89,
  },
  {
    id: 4, name: 'Chennai Port Facility',   code: 'WH-CHN-PF',
    location: 'Chennai Port Trust Area',    address: 'Gate 3, Royapuram Port',
    city: 'Chennai',     state: 'Tamil Nadu', pincode: '600013',
    contactPerson: 'Lakshmi Venkat',        contactPhone: '+91 44901 23456',
    totalCapacity: 20000, isActive: true,   inventories: 523,
  },
  {
    id: 5, name: 'Hyderabad Old Godown',    code: 'WH-HYD-OG',
    location: 'Begumpet, Old City',         address: '88, Begumpet Rd',
    city: 'Hyderabad',   state: 'Telangana', pincode: '500016',
    contactPerson: 'Suresh Reddy',          contactPhone: '+91 40800 56789',
    totalCapacity: 3200,  isActive: false,  inventories: 0,
  },
  {
    id: 6, name: 'Pune Logistics Park',     code: 'WH-PUN-LP',
    location: 'Chakan Industrial Zone',     address: 'Survey No. 202, Chakan',
    city: 'Pune',        state: 'Maharashtra', pincode: '410501',
    contactPerson: 'Nikhil Joshi',          contactPhone: '+91 20900 34567',
    totalCapacity: 9500,  isActive: true,   inventories: 204,
  },
  {
    id: 7, name: 'Ahmedabad Dry Store',     code: 'WH-AMD-DS',
    location: 'GIDC Vatva',                 address: 'Plot B-14, GIDC Vatva',
    city: 'Ahmedabad',   state: 'Gujarat',   pincode: '382445',
    contactPerson: 'Hardik Patel',          contactPhone: '+91 79900 78901',
    totalCapacity: 6000,  isActive: false,  inventories: 12,
  },
  {
    id: 8, name: 'Kolkata East Terminal',   code: 'WH-KOL-ET',
    location: 'Salt Lake Sector V',         address: 'Block EP & GP, Sector V',
    city: 'Kolkata',     state: 'West Bengal', pincode: '700091',
    contactPerson: 'Debjit Ghosh',          contactPhone: '+91 33800 23456',
    totalCapacity: 7200,  isActive: true,   inventories: 176,
  },
];

/* ── Icons ──────────────────────────────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function WarehouseStatIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
      <path d="M6 18h12"/>
    </svg>
  );
}

/* ── Helper: format capacity ─────────────────────────────────────────────── */
function fmtCapacity(n) {
  if (!n) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ═══════════════════════════════════════════════════════════════════════════
   WarehouseList
═══════════════════════════════════════════════════════════════════════════ */
export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState(MOCK_WAREHOUSES);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  /* ── Filtered data ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return warehouses.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        (w.city ?? '').toLowerCase().includes(q) ||
        (w.contactPerson ?? '').toLowerCase().includes(q);
      const matchFilter =
        filter === 'all'      ? true :
        filter === 'active'   ? w.isActive :
                                !w.isActive;
      return matchSearch && matchFilter;
    });
  }, [warehouses, search, filter]);

  /* ── Stats ──────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:    warehouses.length,
    active:   warehouses.filter((w) => w.isActive).length,
    inactive: warehouses.filter((w) => !w.isActive).length,
    capacity: warehouses.reduce((s, w) => s + (w.totalCapacity || 0), 0),
  }), [warehouses]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const openAdd  = () => { setEditItem(null); setShowForm(true); };
  const openEdit = (row) => { setEditItem(row); setShowForm(true); };

  const handleSave = (data) => {
    if (data.id) {
      setWarehouses((prev) => prev.map((w) => w.id === data.id ? { ...w, ...data } : w));
    } else {
      setWarehouses((prev) => [...prev, { ...data, id: Date.now(), inventories: 0 }]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setWarehouses((prev) => prev.filter((w) => w.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  /* ── Table columns ──────────────────────────────────────────── */
  const columns = [
    {
      key:    '#',
      header: '#',
      width:  'w-12',
      render: (_, __, idx) => (
        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          {idx + 1}
        </span>
      ),
    },
    {
      key:      'name',
      header:   'Warehouse',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon */}
          <div
            className="shrink-0 w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
            style={{
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary)',
            }}
          >
            <WarehouseStatIcon />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {row.name}
            </p>
            <span
              className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5"
              style={{
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.04em',
                border: '1px solid var(--color-border)',
              }}
            >
              {row.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key:      'city',
      header:   'Location',
      sortable: true,
      render: (_, row) => (
        <div className="min-w-0">
          <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
            {row.city}{row.state ? `, ${row.state}` : ''}
          </p>
          {row.location && (
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)', maxWidth: 200 }}>
              {row.location}
            </p>
          )}
        </div>
      ),
    },
    {
      key:    'contactPerson',
      header: 'Contact',
      render: (_, row) => (
        row.contactPerson ? (
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {row.contactPerson}
            </p>
            {row.contactPhone && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {row.contactPhone}
              </p>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        )
      ),
    },
    {
      key:      'totalCapacity',
      header:   'Capacity',
      sortable: true,
      align:    'center',
      render: (val) => (
        <span
          className="inline-block font-bold text-sm px-2.5 py-1 rounded-full"
          style={{
            background: 'var(--color-primary-100)',
            color: 'var(--color-primary)',
          }}
        >
          {fmtCapacity(val)}
        </span>
      ),
    },
    {
      key:    'isActive',
      header: 'Status',
      align:  'center',
      render: (val) => (
        <Badge variant={val ? 'success' : 'danger'} dot>
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key:    'actions',
      header: 'Actions',
      align:  'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          <IconButton
            title="View"
            size="sm"
            className="!bg-[var(--color-surface-2)] !text-[var(--color-text-muted)] hover:!bg-[var(--color-border)] hover:!text-[var(--color-text)]"
          >
            <EyeIcon />
          </IconButton>
          <IconButton
            title="Edit"
            size="sm"
            className="!bg-[var(--color-primary-100)] !text-[var(--color-primary)] hover:!bg-[var(--color-primary)] hover:!text-white"
            onClick={() => openEdit(row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            title="Delete"
            size="sm"
            className="!bg-[var(--color-danger-light)] !text-[var(--color-danger)] hover:!bg-[var(--color-danger)] hover:!text-white"
            onClick={() => setDeleteId(row.id)}
          >
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  /* ── Empty state node ───────────────────────────────────────── */
  const emptyNode = search || filter !== 'all'
    ? <NoSearchResults query={search} onClear={() => { setSearch(''); setFilter('all'); }} />
    : <NoData
        title="No warehouses yet"
        message="Add your first warehouse to start managing inventory locations."
        action={<Button icon={<PlusIcon />} onClick={openAdd}>Add Warehouse</Button>}
      />;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen p-6 sm:p-8"
      style={{ background: 'var(--color-bg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* ── Page header ─────────────────────────────────────── */}
      <PageHeader
        title="Warehouses"
        breadcrumbs={[
          { label: 'Master Data', href: '#' },
          { label: 'Warehouses' },
        ]}
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={openAdd}>
            Add Warehouse
          </Button>
        }
        className="mb-6"
      />

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={stats.total}    label="Total Warehouses" accent="primary" />
        <StatCard value={stats.active}   label="Active"           accent="success" />
        <StatCard value={stats.inactive} label="Inactive"         accent="danger"  />
        <StatCard
          value={stats.capacity >= 1000 ? `${(stats.capacity / 1000).toFixed(1)}k` : stats.capacity}
          label="Total Capacity"
          accent="info"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            placeholder="Search by name, code, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Input
          as="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Input>

        <span
          className="text-sm sm:ml-auto shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Data table ──────────────────────────────────────── */}
      <DataTable
        data={filtered}
        columns={columns}
        keyField="id"
        pageSize={8}
        pageSizeOptions={[8, 16, 32]}
        emptyState={emptyNode}
        striped
      />

      {/* ── Warehouse Form modal ─────────────────────────────── */}
      {showForm && (
        <WarehouseForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* ── Delete Confirm modal ─────────────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Warehouse?"
        message="This will permanently remove the warehouse and all associated records. This action cannot be undone."
        confirmLabel="Delete Warehouse"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}