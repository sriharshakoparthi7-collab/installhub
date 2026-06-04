import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Data Transformation ─────────────────────────────────────────────────────
function buildRows(audit, boards, siteAssets) {
  const rows = [];

  // Helper: given a board, return its first device's MAIN_SUPPLY channel labels
  const getMainSupplyChannels = (board) => {
    if (!board) return '—';
    const device = (board.meters || [])[0];
    if (!device) return '—';
    const labels = (device.ww_channels || [])
      .map((ch, i) => ({ ch, i }))
      .filter(({ ch }) => ch.purpose === 'MAIN_SUPPLY')
      .map(({ i }) => `C${i + 1}`);
    return labels.length ? labels.join(', ') : '—';
  };

  // Helper: resolve parent board display name
  const parentName = (board) => {
    if (!board) return '—';
    return board.display_code || board.asset_name || '—';
  };

  // ── SiteAsset rows ──────────────────────────────────────────────────────────
  siteAssets.forEach(asset => {
    const parentBoard = boards.find(b => b.id === asset.electrical_board_id);
    const meterBoard = boards.find(b => b.id === asset.meter_switchboard_id);
    const device = asset.meter_present
      ? (meterBoard?.meters || []).find(m => m.device_name === asset.meter_device_id)
        || (meterBoard?.meters || [])[0]
      : null;

    const channels = asset.meter_present && (asset.meter_channels || []).length
      ? asset.meter_channels.map(c => c.channel.replace('Channel ', 'C')).join(', ')
      : null;

    const fedFromDevice = asset.electrical_board_tbc ? 'TBC' : parentName(parentBoard);
    const fedFromChannels = asset.electrical_board_tbc ? '—' : getMainSupplyChannels(parentBoard);

    rows.push({
      key: `site-${asset.id}`,
      device_number: device?.device_number || null,
      device_name: device?.device_name || asset.meter_device_id || null,
      channels,
      client_name: audit?.client_name || '—',
      asset_name: asset.asset_name,
      asset_type: asset.asset_type || '—',
      fed_from_device: fedFromDevice,
      fed_from_channels: fedFromChannels,
      metered: !!device && !!channels,
      is_board: false,
    });
  });

  // ── ElectricalAsset (board) rows — only those with MAIN_SUPPLY channels ────
  boards.forEach(board => {
    (board.meters || []).forEach((meter, mIdx) => {
      const mainChs = (meter.ww_channels || [])
        .map((ch, i) => ({ ch, i }))
        .filter(({ ch }) => ch.purpose === 'MAIN_SUPPLY');
      if (mainChs.length === 0) return;
      const channelStr = mainChs.map(({ i }) => `C${i + 1}`).join(', ');

      const parentBoard = boards.find(b => b.id === board.electrical_parent_id);
      const fedFromDevice = board.electrical_parent_tbc ? 'TBC'
        : board.electrical_parent_id === 'GRID' ? 'Grid'
        : parentName(parentBoard);
      const fedFromChannels = board.electrical_parent_tbc ? '—'
        : board.electrical_parent_id === 'GRID' ? '—'
        : getMainSupplyChannels(parentBoard);

      rows.push({
        key: `board-${board.id}-${mIdx}`,
        device_number: meter.device_number || null,
        device_name: meter.device_name || `Device ${mIdx + 1}`,
        channels: channelStr,
        client_name: audit?.client_name || '—',
        asset_name: board.display_code || board.asset_name,
        asset_type: board.asset_type || '—',
        fed_from_device: fedFromDevice,
        fed_from_channels: fedFromChannels,
        metered: true,
        is_board: true,
      });
    });
  });

  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'device_number', label: 'Device No.' },
  { key: 'device_name',   label: 'Device Name' },
  { key: 'channels',      label: 'Channels' },
  { key: 'client_name',   label: 'Client' },
  { key: 'asset_name',    label: 'Asset Name' },
  { key: 'asset_type',    label: 'Asset Type' },
  { key: 'fed_from_device',   label: 'Fed From — Device' },
  { key: 'fed_from_channels', label: 'Fed From — Channels' },
];

function NullCell({ label }) {
  return <span className="text-muted-foreground/50 select-none">{label || '—'}</span>;
}

export default function MeteringAssetsTable() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState(null);
  const [boards, setBoards] = useState([]);
  const [siteAssets, setSiteAssets] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Audit.filter({ id: auditId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      base44.entities.SiteAsset.filter({ audit_id: auditId }),
    ]).then(([audits, b, a]) => {
      setAudit(audits[0] || null);
      setBoards(b);
      setSiteAssets(a);
      setLoading(false);
    });
  }, [auditId]);

  const allRows = useMemo(() => buildRows(audit, boards, siteAssets), [audit, boards, siteAssets]);
  const rows = useMemo(() => showAll ? allRows : allRows.filter(r => r.metered), [allRows, showAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => navigate(`/audit/${auditId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Audit
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            Metering Assets — {audit?.site_name || auditId}
          </h1>
          {audit?.client_name && (
            <p className="text-xs text-muted-foreground">{audit.client_name} · {audit.site_address}</p>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setShowAll(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !showAll ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ToggleLeft className="w-3.5 h-3.5" />
          Metered Only
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showAll ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ToggleRight className="w-3.5 h-3.5" />
          All Assets
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing <strong>{rows.length}</strong> of <strong>{allRows.length}</strong> assets
        {!showAll && ` · ${allRows.length - rows.length} unmetered hidden`}
      </p>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-40 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
          {showAll ? 'No assets recorded yet.' : 'No metered assets found. Switch to "All Assets" to see everything.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {COLUMNS.map(col => (
                  <th key={col.key} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                    row.is_board ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''
                  } ${!row.metered ? 'opacity-60' : ''}`}
                >
                  {/* Device No. */}
                  <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary whitespace-nowrap">
                    {row.device_number ? row.device_number : <NullCell label="Unmetered" />}
                  </td>
                  {/* Device Name */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.device_name || <NullCell />}
                  </td>
                  {/* Channels */}
                  <td className="px-3 py-2 font-mono whitespace-nowrap">
                    {row.channels || <NullCell />}
                  </td>
                  {/* Client */}
                  <td className="px-3 py-2 whitespace-nowrap text-foreground">{row.client_name}</td>
                  {/* Asset Name */}
                  <td className="px-3 py-2 font-medium whitespace-nowrap text-foreground">
                    {row.asset_name}
                    {row.is_board && (
                      <Badge variant="outline" className="ml-1.5 text-[9px] text-blue-600 border-blue-300">Board</Badge>
                    )}
                  </td>
                  {/* Asset Type */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px]">{row.asset_type}</Badge>
                  </td>
                  {/* Fed From — Device */}
                  <td className="px-3 py-2 whitespace-nowrap text-foreground">{row.fed_from_device}</td>
                  {/* Fed From — Channels */}
                  <td className="px-3 py-2 font-mono whitespace-nowrap text-foreground">{row.fed_from_channels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}