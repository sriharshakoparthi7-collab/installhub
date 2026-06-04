import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, CircuitBoard, Cpu, Zap, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

function SectionHeader({ title }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-5 mb-2 pb-1 border-b border-border">
      {title}
    </p>
  );
}

function Row({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground min-w-[120px] flex-shrink-0">{label}</span>
      <span className={`text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function DeviceBlock({ meter, index }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-primary/20 rounded-lg overflow-hidden mt-2">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-primary/5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-primary flex-1">{meter.device_name || `Device ${index + 1}`}</span>
        <span className="text-[11px] text-muted-foreground">{meter.meter_device_type}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-1 bg-background">
          <Row label="Device No." value={meter.device_number} mono />
          <Row label="Type" value={meter.meter_device_type} />
          <Row label="Serial No." value={meter.ww_switchboard?.serial_number || meter.meter_device_id} mono />
          <Row label="SB Name" value={meter.ww_switchboard?.sb_name} />
          <Row label="SB Location" value={meter.ww_switchboard?.sb_location} />
          <Row label="Signal Strength" value={meter.ww_commissioning?.signal_strength} />
          {(meter.ww_channels || []).length > 0 && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Channels:</p>
              {(meter.ww_channels || []).map((ch, i) => (
                (ch.load || ch.load_description || ch.coil_size || ch.ct_rating) ? (
                  <div key={i} className="flex gap-2 text-[11px] bg-muted/40 rounded px-2 py-1 mb-1">
                    <span className="text-muted-foreground w-16 flex-shrink-0">CH {i + 1}</span>
                    <span className="text-foreground">{[ch.load, ch.load_description, ch.coil_size || ch.ct_rating].filter(Boolean).join(' · ')}</span>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BoardBlock({ board, allBoards, zoneMap }) {
  const [open, setOpen] = useState(true);
  const parent = allBoards.find(b => b.id === board.electrical_parent_id);
  const fedFrom = board.electrical_parent_tbc ? 'TBC' : (parent ? (parent.display_code || parent.asset_name) : '—');

  return (
    <div className="border border-border rounded-xl overflow-hidden mt-3">
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <CircuitBoard className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{board.asset_name}</span>
          {board.display_code && <span className="ml-2 text-[11px] text-muted-foreground font-mono">{board.display_code}</span>}
        </div>
        <Badge variant="outline" className="text-[10px]">{board.asset_type}</Badge>
        {board.electrical_parent_tbc && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-1">
          <Row label="Zone" value={zoneMap[board.zone_id] || '—'} />
          <Row label="Location" value={board.location_description} />
          <Row label="Phase" value={board.phase} />
          <Row label="Amperage" value={board.amperage_rating} />
          <Row label="NMI" value={board.site_nmi} />
          <Row label="Fed From" value={fedFrom} />
          {board.electrical_parent_tbc && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
              <AlertTriangle className="w-3 h-3" /> Electrical parent TBC
            </div>
          )}
          {board.meter_present && (board.meters || []).length > 0 && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">Devices ({board.meters.length}):</p>
              {board.meters.map((m, i) => <DeviceBlock key={i} meter={m} index={i} />)}
            </div>
          )}
          {board.meter_present && (board.meters || []).length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">Meter marked present but no devices recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AssetBlock({ asset, allBoards, zoneMap }) {
  const [open, setOpen] = useState(true);
  const board = allBoards.find(b => b.id === asset.electrical_board_id);
  const meterBoard = allBoards.find(b => b.id === asset.meter_switchboard_id);
  const fedFrom = asset.electrical_board_tbc ? 'TBC' : (board ? (board.display_code || board.asset_name) : '—');
  const meterSB = asset.meter_switchboard_tbc ? 'TBC' : (meterBoard ? (meterBoard.display_code || meterBoard.asset_name) : '—');

  return (
    <div className="border border-border rounded-xl overflow-hidden mt-3">
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <Cpu className="w-4 h-4 text-accent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{asset.asset_name}</span>
          {asset.display_code && <span className="ml-2 text-[11px] text-muted-foreground font-mono">{asset.display_code}</span>}
        </div>
        <Badge variant="outline" className="text-[10px]">{asset.asset_type}</Badge>
        {asset.electrical_board_tbc && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-1">
          <Row label="Zone" value={zoneMap[asset.zone_id] || '—'} />
          <Row label="Location" value={asset.location_description} />
          <Row label="Fed From" value={fedFrom} />
          {asset.meter_present && (
            <>
              <Row label="Meter SB" value={meterSB} />
              <Row label="Device" value={asset.meter_device_id} />
              {(asset.meter_channels || []).length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">Channels:</p>
                  {asset.meter_channels.map((ch, i) => (
                    <div key={i} className="flex gap-2 text-[11px] bg-muted/40 rounded px-2 py-1 mb-1">
                      <span className="text-muted-foreground w-20 flex-shrink-0">{ch.channel}</span>
                      <span className="text-foreground">{ch.description || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SiteSummaryDialog({ open, onClose, auditId, audit }) {
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [boards, setBoards] = useState([]);
  const [siteAssets, setSiteAssets] = useState([]);

  useEffect(() => {
    if (!open || !auditId) return;
    setLoading(true);
    Promise.all([
      base44.entities.Zone.filter({ audit_id: auditId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      base44.entities.SiteAsset.filter({ audit_id: auditId }),
    ]).then(([z, b, a]) => {
      setZones(z);
      setBoards(b);
      setSiteAssets(a);
      setLoading(false);
    });
  }, [open, auditId]);

  const zoneMap = {};
  zones.forEach(z => { zoneMap[z.id] = z.zone_name; });

  const tbcBoards = boards.filter(b => b.electrical_parent_tbc).length;
  const tbcAssets = siteAssets.filter(a => a.electrical_board_tbc).length;
  const boardsWithDevices = boards.filter(b => b.meter_present && (b.meters || []).length > 0);
  const totalDevices = boards.reduce((acc, b) => acc + (b.meters || []).length, 0);

  // Build asset-centric rows for the Devices Table.
  // Each row = one SiteAsset that has meter_present + at least one channel assigned.
  // Also include ElectricalAssets (boards) that have a device with SUB_CIRCUIT channels,
  // but only the board-level entries themselves are shown if they have MAIN_SUPPLY channels.
  const assetRows = [];

  // Helper: given a board, find its device and return channels matching a purpose
  const getBoardDeviceChannels = (board, purpose) => {
    const device = (board?.meters || [])[0]; // use first device on the parent board
    if (!device) return { device, channelStr: '—' };
    const wwChs = device.ww_channels || [];
    const matched = wwChs
      .map((ch, i) => ({ ch, i }))
      .filter(({ ch }) => purpose ? ch.purpose === purpose : true);
    const channelStr = matched.length
      ? matched.map(({ i }) => `C${i + 1}`).join(', ')
      : '—';
    return { device, channelStr };
  };

  // Rows from SiteAssets with metering
  siteAssets.forEach(asset => {
    if (!asset.meter_present) return;

    // Find the device on the meter switchboard that this asset references
    const meterBoard = boards.find(b => b.id === asset.meter_switchboard_id);
    const device = (meterBoard?.meters || []).find(m => m.device_name === asset.meter_device_id)
      || (meterBoard?.meters || [])[0];

    // Channels assigned to this asset
    const assetChannels = (asset.meter_channels || []).map(c => c.channel.replace('Channel ', 'C')).join(', ') || '—';

    // Parent board (the board this asset is electrically fed from)
    const parentBoard = boards.find(b => b.id === asset.electrical_board_id);
    const fedFromDevice = parentBoard ? (parentBoard.display_code || parentBoard.asset_name) : (asset.electrical_board_tbc ? 'TBC' : '—');
    const { channelStr: fedFromChannels } = getBoardDeviceChannels(parentBoard, 'MAIN_SUPPLY');

    assetRows.push({
      device_number: device?.device_number || '—',
      device_name: device?.device_name || asset.meter_device_id || '—',
      channels: assetChannels,
      client_name: audit?.client_name || '—',
      asset_name: asset.asset_name,
      asset_type: asset.asset_type || '—',
      fed_from_device: fedFromDevice,
      fed_from_channels: fedFromChannels,
    });
  });

  // Also add rows for ElectricalAssets (boards) that have MAIN_SUPPLY channels
  // — these represent the board's own gross metering row
  boards.forEach(board => {
    (board.meters || []).forEach((meter, mIdx) => {
      const wwChs = meter.ww_channels || [];
      const mainChs = wwChs.map((ch, i) => ({ ch, i })).filter(({ ch }) => ch.purpose === 'MAIN_SUPPLY');
      if (mainChs.length === 0) return;
      const channelStr = mainChs.map(({ i }) => `C${i + 1}`).join(', ');

      const parentBoard = boards.find(b => b.id === board.electrical_parent_id);
      const fedFromDevice = board.electrical_parent_tbc ? 'TBC'
        : board.electrical_parent_id === 'GRID' ? 'Grid'
        : parentBoard ? (parentBoard.display_code || parentBoard.asset_name) : '—';
      const { channelStr: fedFromChannels } = getBoardDeviceChannels(parentBoard, 'MAIN_SUPPLY');

      assetRows.push({
        device_number: meter.device_number || '—',
        device_name: meter.device_name || `Device ${mIdx + 1}`,
        channels: channelStr,
        client_name: audit?.client_name || '—',
        asset_name: board.display_code || board.asset_name,
        asset_type: board.asset_type || '—',
        fed_from_device: fedFromDevice,
        fed_from_channels: fedFromChannels,
        is_board: true,
      });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Summary — {audit?.site_name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="devices" className="flex-1">Devices Table</TabsTrigger>
            </TabsList>

            <TabsContent value="devices">
              {assetRows.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No metered assets or devices recorded yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Device No.</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Device Name</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Channels</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Client</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Asset Name</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Asset Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Fed From — Device</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">Fed From — Channels</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetRows.map((row, i) => (
                        <tr key={i} className={`border-b border-border last:border-0 hover:bg-muted/20 ${row.is_board ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}>
                          <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary whitespace-nowrap">{row.device_number}</td>
                          <td className="px-3 py-2 text-foreground max-w-[160px] truncate" title={row.device_name}>{row.device_name}</td>
                          <td className="px-3 py-2 font-mono text-foreground whitespace-nowrap">{row.channels}</td>
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">{row.client_name}</td>
                          <td className="px-3 py-2 text-foreground font-medium whitespace-nowrap">
                            {row.asset_name}
                            {row.is_board && <Badge variant="outline" className="ml-1.5 text-[9px] text-blue-600 border-blue-300">Board</Badge>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap"><Badge variant="outline" className="text-[10px]">{row.asset_type}</Badge></td>
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">{row.fed_from_device}</td>
                          <td className="px-3 py-2 font-mono text-foreground whitespace-nowrap">{row.fed_from_channels}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview">
          <div className="space-y-2 text-sm">
            {/* Audit info */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <Row label="Client" value={audit?.client_name} />
            <Row label="Site" value={audit?.site_name} />
              <Row label="Address" value={audit?.site_address} />
              <Row label="Technician" value={audit?.inspector_name} />
              <Row label="Date" value={audit?.audit_date} />
              <Row label="Status" value={audit?.status} />
            </div>

            {/* Counts */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                ['Zones', zones.length],
                ['Boards', boards.length],
                ['Devices', totalDevices],
                ['Assets', siteAssets.length],
              ].map(([label, val]) => (
                <div key={label} className="bg-card border border-border rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-primary">{val}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {(tbcBoards + tbcAssets) > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {tbcBoards + tbcAssets} unresolved TBC connection{tbcBoards + tbcAssets > 1 ? 's' : ''} ({tbcBoards} board{tbcBoards !== 1 ? 's' : ''}, {tbcAssets} asset{tbcAssets !== 1 ? 's' : ''})
              </div>
            )}

            {/* Boards by zone */}
            {zones.map(zone => {
              const zoneBoards = boards.filter(b => b.zone_id === zone.id);
              const zoneAssets = siteAssets.filter(a => a.zone_id === zone.id);
              if (zoneBoards.length === 0 && zoneAssets.length === 0) return null;
              return (
                <div key={zone.id}>
                  <SectionHeader title={`Zone: ${zone.zone_name}`} />
                  {zone.zone_description && (
                    <p className="text-xs text-muted-foreground mb-2">{zone.zone_description}</p>
                  )}
                  {zoneBoards.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">Electrical Boards ({zoneBoards.length})</p>
                      {zoneBoards.map(b => (
                        <BoardBlock key={b.id} board={b} allBoards={boards} zoneMap={zoneMap} />
                      ))}
                    </div>
                  )}
                  {zoneAssets.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">Site Assets ({zoneAssets.length})</p>
                      {zoneAssets.map(a => (
                        <AssetBlock key={a.id} asset={a} allBoards={boards} zoneMap={zoneMap} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {zones.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No zones or assets recorded yet.</p>
            )}
          </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}