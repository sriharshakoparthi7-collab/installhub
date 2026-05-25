import moment from 'moment';

// ─── Shared primitives ───────────────────────────────────────────────────────

export function SectionTitle({ number, title, plain }) {
  if (plain) {
    return (
      <h2 className="keep-with-next" style={{ fontSize: '18pt', fontWeight: 800, color: '#0E2240', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
        {number}
      </h2>
    );
  }
  return (
    <div className="keep-with-next" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', paddingBottom: '8px', borderBottom: '2px solid #0E2240', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
      <span style={{ fontSize: '20pt', fontWeight: 800, color: '#0E2240' }}>{number}.</span>
      <h2 style={{ fontSize: '18pt', fontWeight: 700, color: '#1a3a60', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
    </div>
  );
}

export function SubSectionTitle({ title }) {
  return (
    <h3 className="keep-with-next" style={{ fontSize: '13pt', fontWeight: 600, color: '#0E2240', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #22D3EE', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
      {title}
    </h3>
  );
}

export function FieldRow({ label, value }) {
  return (
    <div className="field-row" style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid #F0F0F0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <span style={{ fontSize: '9pt', fontWeight: 600, width: '180px', flexShrink: 0, color: '#0E2240' }}>{label}</span>
      <span style={{ fontSize: '9pt', color: '#333333', wordBreak: 'break-word', overflowWrap: 'break-word', flex: 1 }}>{value ?? '—'}</span>
    </div>
  );
}

export function InfoBox({ label, value }) {
  return (
    <div style={{ borderRadius: '8px', padding: '12px', background: '#EEF6FB' }}>
      <p style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: '#0E2240' }}>{label}</p>
      <p style={{ fontSize: '11pt', fontWeight: 600, color: '#1a3a60' }}>{value || '—'}</p>
    </div>
  );
}

function PhotoBox({ url, label }) {
  if (!url) return null;
  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #DDDDDD', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <img src={url} alt={label || 'Photo'} style={{ width: '100%', height: 'auto', display: 'block', border: 'none' }} />
      {label && <p style={{ fontSize: '9pt', textAlign: 'center', padding: '4px', color: '#666', background: '#fafafa' }}>{label}</p>}
    </div>
  );
}

// ─── Summary Statistics Bar ───────────────────────────────────────────────────

export function ReportSummaryStats({ zones, assets }) {
  const wwCount = assets.filter(a => a.has_wattwatcher).length;
  const meterCount = assets.filter(a => a.meter_present).length;
  const tbcCount = assets.filter(a => a.electrical_parent_tbc).length;

  const stats = [
    { label: 'Zones', value: zones.length },
    { label: 'Assets', value: assets.length },
    { label: 'Wattwatchers', value: wwCount },
    { label: 'Meters', value: meterCount },
    { label: 'TBC / Unresolved', value: tbcCount },
  ];

  return (
    <div className="avoid-break" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '12px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.label === 'TBC / Unresolved' && s.value > 0 ? '#FFF3CD' : '#EEF6FB', borderRadius: '10px', padding: '14px', textAlign: 'center', border: s.label === 'TBC / Unresolved' && s.value > 0 ? '1px solid #F0AD4E' : '1px solid #D0E8F5' }}>
            <p style={{ fontSize: '22pt', fontWeight: 800, color: s.label === 'TBC / Unresolved' && s.value > 0 ? '#856404' : '#0E2240', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '8pt', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Location Section ─────────────────────────────────────────────────────────

export function ReportLocationSection({ zones, assets }) {
  return (
    <section>
      <SectionTitle number="1" title="Asset Register by Location" />
      {zones.map((zone, zi) => {
        const zoneAssets = assets.filter(a => a.zone_id === zone.id);
        return (
          <div key={zone.id} className="card-block" style={{ marginBottom: '24px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SubSectionTitle title={`Zone ${zi + 1}: ${zone.zone_name}`} />
            {zone.zone_description && <p style={{ fontSize: '9pt', color: '#555', marginBottom: '10px' }}>{zone.zone_description}</p>}

            {/* Zone photos */}
            {zone.photos?.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }} className="photo-evidence">
                {zone.photos.map((url, i) => (
                  <div key={i} style={{ width: '30%', maxWidth: '220px' }}>
                    <PhotoBox url={url} label={`Zone photo ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {zoneAssets.length === 0 ? (
              <p style={{ fontSize: '9pt', color: '#999', fontStyle: 'italic' }}>No assets recorded in this zone.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ background: '#0E2240', color: '#fff' }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Asset Name</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Display Code</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Phase</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Wattwatcher</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneAssets.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : '#F7FBFF', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1a3a60' }}>{a.asset_name}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontSize: '8pt', fontWeight: 600 }}>{a.asset_type}</span></td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: '8pt' }}>{a.display_code || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{a.phase || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{a.has_wattwatcher ? `✓ ${a.wattwatcher_device_id || 'TBC'}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ─── Electrical Hierarchy ─────────────────────────────────────────────────────

function ElecTreeRow({ asset, allAssets, depth = 0 }) {
  const children = allAssets.filter(a => a.electrical_parent_id === asset.id && !a.electrical_parent_tbc);
  const indent = depth * 20;
  return (
    <>
      <tr style={{ background: depth === 0 ? '#EEF6FB' : depth === 1 ? '#fff' : '#FAFAFA', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <td style={{ padding: '6px 10px', paddingLeft: `${10 + indent}px` }}>
          <span style={{ color: '#999', marginRight: '6px', fontSize: '9pt' }}>{'└─'.repeat(Math.min(depth, 1))} </span>
          <span style={{ fontWeight: depth === 0 ? 700 : 500, color: '#0E2240', fontSize: '9pt' }}>{asset.asset_name}</span>
        </td>
        <td style={{ padding: '6px 10px' }}><span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 7px', borderRadius: '4px', fontSize: '8pt', fontWeight: 600 }}>{asset.asset_type}</span></td>
        <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: '8pt' }}>{asset.display_code || '—'}</td>
        <td style={{ padding: '6px 10px', fontSize: '9pt' }}>
          {asset.has_wattwatcher ? <span style={{ color: '#0369A1', fontWeight: 600 }}>✓ {asset.wattwatcher_device_id || 'TBC'}</span> : '—'}
        </td>
        <td style={{ padding: '6px 10px', fontSize: '8pt' }}>
          {asset.electrical_parent_tbc ? <span style={{ color: '#856404', fontWeight: 600 }}>⚠ TBC</span> : (allAssets.find(a => a.id === asset.electrical_parent_id)?.asset_name || (depth === 0 ? 'Root / Grid' : '—'))}
        </td>
      </tr>
      {children.map(c => <ElecTreeRow key={c.id} asset={c} allAssets={allAssets} depth={depth + 1} />)}
    </>
  );
}

export function ReportElectricalTree({ assets }) {
  const roots = assets.filter(a => !a.electrical_parent_id || a.electrical_parent_tbc);
  return (
    <section>
      <SectionTitle number="2" title="Electrical Hierarchy" />
      <p style={{ fontSize: '9pt', color: '#555', marginBottom: '12px' }}>Assets arranged by upstream electrical source. TBC nodes are treated as root-level assets.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
        <thead>
          <tr style={{ background: '#0E2240', color: '#fff' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, width: '28%' }}>Asset</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, width: '12%' }}>Type</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, width: '18%' }}>Display Code</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, width: '22%' }}>Wattwatcher ID</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, width: '20%' }}>Fed From</th>
          </tr>
        </thead>
        <tbody>
          {roots.map(r => <ElecTreeRow key={r.id} asset={r} allAssets={assets} />)}
        </tbody>
      </table>
    </section>
  );
}

// ─── Wattwatcher Device Registry ──────────────────────────────────────────────

export function ReportDeviceRegistry({ assets, zones }) {
  const wwAssets = assets.filter(a => a.has_wattwatcher);
  return (
    <section>
      <SectionTitle number="3" title="Wattwatcher Device Registry" />
      <p style={{ fontSize: '9pt', color: '#555', marginBottom: '12px' }}>{wwAssets.length} Wattwatcher device{wwAssets.length !== 1 ? 's' : ''} recorded across the site.</p>
      {wwAssets.length === 0 ? (
        <p style={{ fontSize: '9pt', color: '#999', fontStyle: 'italic' }}>No Wattwatcher devices recorded.</p>
      ) : (
        wwAssets.map((asset, i) => {
          const zone = zones.find(z => z.id === asset.zone_id);
          return (
            <div key={asset.id} className="card-block" style={{ background: '#fff', borderRadius: '10px', border: '1px solid #D0E8F5', padding: '16px', marginBottom: '16px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#0E2240', borderRadius: '8px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '10pt' }}>{asset.wattwatcher_device_id || 'Device ID TBC'}</span>
                </div>
                {asset.wattwatcher_model && <span style={{ fontSize: '10pt', color: '#555' }}>{asset.wattwatcher_model}</span>}
                <span style={{ marginLeft: 'auto', fontSize: '9pt', color: '#999' }}>Device {i + 1} of {wwAssets.length}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <FieldRow label="Installed On" value={asset.asset_name} />
                <FieldRow label="Asset Type" value={asset.asset_type} />
                <FieldRow label="Display Code" value={asset.display_code} />
                <FieldRow label="Zone / Area" value={zone?.zone_name} />
                <FieldRow label="Physical Location" value={asset.location_description} />
                <FieldRow label="Phase" value={asset.phase} />
                <FieldRow label="Amperage Rating" value={asset.amperage_rating} />
                <FieldRow label="Site NMI" value={asset.site_nmi} />
              </div>

              {/* Meter section */}
              {asset.meter_present && (
                <div style={{ background: '#EEF6FB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '9pt', color: '#0E2240', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚡ Metering</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <FieldRow label="Meter Device ID" value={asset.meter_device_id} />
                    <FieldRow label="Classification" value={asset.meter_classification} />
                    <FieldRow label="Coverage Type" value={asset.meter_coverage_type} />
                    {asset.sub_circuits_description && <FieldRow label="Sub-Circuits" value={asset.sub_circuits_description} />}
                  </div>
                </div>
              )}

              {/* Photos */}
              {(asset.photo || asset.wattwatcher_photo) && (
                <div className="photo-evidence" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {asset.photo && <div style={{ width: '30%', maxWidth: '220px' }}><PhotoBox url={asset.photo} label="Asset Photo" /></div>}
                  {asset.wattwatcher_photo && <div style={{ width: '30%', maxWidth: '220px' }}><PhotoBox url={asset.wattwatcher_photo} label="Wattwatcher Photo" /></div>}
                </div>
              )}

              {asset.comments && (
                <div style={{ marginTop: '10px', background: '#FAFAFA', borderRadius: '6px', padding: '10px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 700, color: '#555', marginBottom: '4px', textTransform: 'uppercase' }}>Comments</p>
                  <p style={{ fontSize: '9pt', color: '#333' }}>{asset.comments}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

// ─── Full Asset Detail Sheets ─────────────────────────────────────────────────

export function ReportAssetDetails({ assets, zones }) {
  return (
    <section>
      <SectionTitle number="4" title="Full Asset Detail Sheets" />
      {assets.map((asset, i) => {
        const zone = zones.find(z => z.id === asset.zone_id);
        return (
          <div key={asset.id} className="card-block" style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', padding: '16px', marginBottom: '20px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #0E2240' }}>
              <span style={{ background: '#0E2240', color: '#22D3EE', fontWeight: 800, fontSize: '10pt', borderRadius: '6px', padding: '4px 10px' }}>#{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: '13pt', color: '#0E2240' }}>{asset.asset_name}</span>
              <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontSize: '9pt', fontWeight: 600 }}>{asset.asset_type}</span>
              {asset.has_wattwatcher && <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '8pt', fontWeight: 700 }}>⚡ WW</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <FieldRow label="Zone / Area" value={zone?.zone_name} />
              <FieldRow label="Display Code" value={asset.display_code} />
              <FieldRow label="Physical Location" value={asset.location_description} />
              <FieldRow label="Phase" value={asset.phase} />
              <FieldRow label="Amperage Rating" value={asset.amperage_rating ? `${asset.amperage_rating} A` : null} />
              <FieldRow label="Site NMI" value={asset.site_nmi} />
            </div>

            {asset.has_wattwatcher && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '9pt', color: '#0E2240', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>⚡ Wattwatcher Device</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', background: '#F0F9FF', borderRadius: '8px', padding: '10px' }}>
                  <FieldRow label="Device ID" value={asset.wattwatcher_device_id} />
                  <FieldRow label="Model" value={asset.wattwatcher_model} />
                </div>
              </div>
            )}

            {asset.meter_present && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '9pt', color: '#0E2240', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Metering</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', background: '#F0FDF4', borderRadius: '8px', padding: '10px' }}>
                  <FieldRow label="Meter Device ID" value={asset.meter_device_id} />
                  <FieldRow label="Classification" value={asset.meter_classification} />
                  <FieldRow label="Coverage Type" value={asset.meter_coverage_type} />
                  {asset.sub_circuits_description && <FieldRow label="Sub-Circuits" value={asset.sub_circuits_description} />}
                </div>
              </div>
            )}

            {(asset.photo || asset.wattwatcher_photo || (asset.extra_photos?.length > 0)) && (
              <div className="photo-evidence" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
                {asset.photo && <div style={{ width: '30%', maxWidth: '220px' }}><PhotoBox url={asset.photo} label="Asset Photo" /></div>}
                {asset.wattwatcher_photo && <div style={{ width: '30%', maxWidth: '220px' }}><PhotoBox url={asset.wattwatcher_photo} label="Wattwatcher Photo" /></div>}
                {asset.extra_photos?.map((url, idx) => url && (
                  <div key={idx} style={{ width: '30%', maxWidth: '220px' }}><PhotoBox url={url} label={`Photo ${idx + 1}`} /></div>
                ))}
              </div>
            )}

            {asset.comments && (
              <div style={{ marginTop: '10px', background: '#FAFAFA', borderRadius: '6px', padding: '10px' }}>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>Comments</p>
                <p style={{ fontSize: '9pt', color: '#333' }}>{asset.comments}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ─── TBC / Orphan Nodes ───────────────────────────────────────────────────────

export function ReportTBCSection({ assets }) {
  const tbcAssets = assets.filter(a => a.electrical_parent_tbc);
  if (tbcAssets.length === 0) return null;
  return (
    <section>
      <SectionTitle number="5" title="Unresolved Electrical Connections (TBC)" />
      <div style={{ background: '#FFF8E1', border: '1px solid #F0AD4E', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '9pt', color: '#856404', marginBottom: '12px' }}>
          The following {tbcAssets.length} asset{tbcAssets.length > 1 ? 's' : ''} have an unresolved "Fed From" connection marked TBC. These should be confirmed and updated before sign-off.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
          <thead>
            <tr style={{ background: '#F59E0B', color: '#fff' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Asset Name</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Type</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Display Code</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {tbcAssets.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? '#fffbf0' : '#fff3cd', breakInside: 'avoid' }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.asset_name}</td>
                <td style={{ padding: '6px 10px' }}>{a.asset_type}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{a.display_code || '—'}</td>
                <td style={{ padding: '6px 10px' }}>{a.location_description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}