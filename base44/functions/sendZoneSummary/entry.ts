import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { auditId, zoneId } = await req.json();
    if (!auditId) return Response.json({ error: 'auditId is required' }, { status: 400 });

    // Fetch all required data in parallel
    const [audits, zones, allBoards, allSiteAssets] = await Promise.all([
      base44.entities.Audit.filter({ id: auditId }),
      zoneId ? base44.entities.Zone.filter({ id: zoneId }) : base44.entities.Zone.filter({ audit_id: auditId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      base44.entities.SiteAsset.filter({ audit_id: auditId }),
    ]);

    const audit = audits[0] || {};

    // Build a map of board id -> board for lookups
    const boardMap = {};
    allBoards.forEach(b => { boardMap[b.id] = b; });

    // Build electrical boards list
    const boardRows = allBoards.map(board => {
      const parent = boardMap[board.electrical_parent_id];
      const devices = (board.meters || []).map(m => ({
        device_name: m.device_name || '',
        device_type: m.meter_device_type || '',
        serial_number: m.ww_switchboard?.serial_number || m.meter_device_id || '',
        channels: (m.ww_channels || []).map((ch, i) => ({
          channel: `Channel ${i + 1}`,
          load: ch.load || '',
          load_description: ch.load_description || '',
          coil_size: ch.coil_size || '',
          ct_rating: ch.ct_rating || '',
        })),
      }));

      return {
        id: board.id,
        name: board.asset_name,
        display_code: board.display_code || '',
        asset_type: board.asset_type,
        zone_name: (zones.find(z => z.id === board.zone_id) || {}).zone_name || '',
        location: board.location_description || '',
        phase: board.phase || '',
        amperage_rating: board.amperage_rating || '',
        site_nmi: board.site_nmi || '',
        electrical_parent_tbc: !!board.electrical_parent_tbc,
        fed_from: board.electrical_parent_tbc ? 'TBC' : (parent ? (parent.display_code || parent.asset_name) : ''),
        meter_present: !!board.meter_present,
        devices,
      };
    });

    // Build site assets list
    const assetRows = allSiteAssets.map(asset => {
      const board = boardMap[asset.electrical_board_id];
      const meterBoard = boardMap[asset.meter_switchboard_id];

      // Find the specific device on the meter board
      let meterDevice = null;
      if (meterBoard && asset.meter_device_id) {
        meterDevice = (meterBoard.meters || []).find(m =>
          m.device_name === asset.meter_device_id || m.ww_switchboard?.serial_number === asset.meter_device_id
        );
      }

      return {
        id: asset.id,
        name: asset.asset_name,
        display_code: asset.display_code || '',
        asset_type: asset.asset_type,
        zone_name: (zones.find(z => z.id === asset.zone_id) || {}).zone_name || '',
        location: asset.location_description || '',
        fed_from_board: asset.electrical_board_tbc ? 'TBC' : (board ? (board.display_code || board.asset_name) : ''),
        electrical_board_tbc: !!asset.electrical_board_tbc,
        meter_present: !!asset.meter_present,
        meter_switchboard: asset.meter_switchboard_tbc ? 'TBC' : (meterBoard ? (meterBoard.display_code || meterBoard.asset_name) : ''),
        meter_device: asset.meter_device_id || '',
        meter_channels: (asset.meter_channels || []).map(ch => ({
          channel: ch.channel,
          description: ch.description || '',
        })),
      };
    });

    const summary = {
      audit: {
        id: audit.id,
        site_name: audit.site_name,
        site_address: audit.site_address,
        inspector_name: audit.inspector_name,
        audit_date: audit.audit_date,
        status: audit.status,
      },
      generated_at: new Date().toISOString(),
      generated_by: user.full_name || user.email,
      electrical_boards: boardRows,
      site_assets: assetRows,
      summary_counts: {
        total_boards: boardRows.length,
        total_assets: assetRows.length,
        boards_with_devices: boardRows.filter(b => b.meter_present).length,
        assets_with_metering: assetRows.filter(a => a.meter_present).length,
        tbc_boards: boardRows.filter(b => b.electrical_parent_tbc).length,
        tbc_assets: assetRows.filter(a => a.electrical_board_tbc).length,
      },
    };

    // Send to external API if EXTERNAL_API_URL is configured
    const externalUrl = Deno.env.get('EXTERNAL_API_URL');
    let externalResult = null;
    if (externalUrl) {
      const headers = { 'Content-Type': 'application/json' };
      const apiKey = Deno.env.get('EXTERNAL_API_KEY');
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const extRes = await fetch(externalUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(summary),
      });
      externalResult = { status: extRes.status, ok: extRes.ok };
    }

    return Response.json({ success: true, summary, external_api: externalResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});