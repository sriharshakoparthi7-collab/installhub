import moment from 'moment';

export default function WattMapperReportHeader({ audit }) {
  return (
    <div className="relative overflow-hidden" style={{ background: '#0E2240', minHeight: '260px' }}>
      {/* Decorative arcs top-right */}
      <svg className="absolute top-0 right-0 opacity-10" width="300" height="300" viewBox="0 0 300 300">
        {[20, 50, 80, 110, 140, 170, 200].map((r, i) => (
          <circle key={i} cx="300" cy="0" r={r} fill="none" stroke="#22D3EE" strokeWidth="1" />
        ))}
      </svg>
      {/* Decorative arcs bottom-left */}
      <svg className="absolute bottom-0 left-0 opacity-10" width="220" height="220" viewBox="0 0 220 220">
        {[20, 50, 80, 110, 140, 170].map((r, i) => (
          <circle key={i} cx="0" cy="220" r={r} fill="none" stroke="#22D3EE" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative z-10 px-10 py-10">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div style={{ background: '#22D3EE', borderRadius: '10px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E2240" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0E2240', letterSpacing: '0.05em' }}>WATTMAPPER</span>
          </div>
        </div>

        {/* Titles */}
        <h1 className="text-3xl font-black uppercase tracking-wide mb-1" style={{ color: '#ffffff' }}>
          Wattwatcher Device
        </h1>
        <h1 className="text-3xl font-black uppercase tracking-wide mb-6" style={{ color: '#22D3EE' }}>
          Installation Report
        </h1>

        {/* Meta grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <MetaBlock label="Site Name" value={audit.site_name} />
          <MetaBlock label="Site Address" value={audit.site_address} />
          <MetaBlock label="Date of Audit" value={moment(audit.audit_date).format('DD MMMM YYYY')} />
          <MetaBlock label="Technician" value={audit.inspector_name} />
        </div>
      </div>
    </div>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#22D3EE' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{value || '—'}</p>
    </div>
  );
}