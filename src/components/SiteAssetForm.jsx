import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from './MobileSelect';
import PhotoUpload from './PhotoUpload';
import MultiPhotoUpload from './MultiPhotoUpload';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Info, Zap } from 'lucide-react';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const ASSET_TYPES = [
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Lighting', label: 'Lighting' },
  { value: 'Solar / PV', label: 'Solar / PV' },
  { value: 'EV Charger', label: 'EV Charger' },
  { value: 'Exhaust / Fan System', label: 'Exhaust / Fan System' },
  { value: 'Power Outlet', label: 'Power Outlet' },
  { value: 'Hot Water', label: 'Hot Water' },
  { value: 'Refrigeration', label: 'Refrigeration' },
  { value: 'Compressed Air', label: 'Compressed Air' },
  { value: 'Other', label: 'Other' },
];

const ALL_CHANNELS = ['Channel 1', 'Channel 2', 'Channel 3', 'Channel 4', 'Channel 5', 'Channel 6'];

export default function SiteAssetForm({ data, onChange, auditId, currentZoneId }) {
  const [allBoards, setAllBoards] = useState([]);
  const [siteName, setSiteName] = useState('');
  const [allSiteAssets, setAllSiteAssets] = useState([]);
  const [userEditedCode, setUserEditedCode] = useState(!!data?.display_code);
  const set = (key, val) => onChange({ ...data, [key]: val });

  useEffect(() => {
    if (auditId) {
      Promise.all([
        base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
        base44.entities.Audit.filter({ id: auditId }),
        base44.entities.SiteAsset.filter({ audit_id: auditId }),
      ]).then(([boards, audits, siteAssets]) => {
        setAllBoards(boards);
        setSiteName(audits[0]?.site_name || '');
        setAllSiteAssets(siteAssets.filter(a => a.id !== data?.id));
      });
    }
  }, [auditId]);

  // Auto-generate display code
  useEffect(() => {
    if (userEditedCode || !data.asset_name) return;
    const base = `${siteName} - ${data.asset_name}`;
    const sameNameCount = allSiteAssets.filter(
      a => (a.asset_name || '').toLowerCase() === (data.asset_name || '').toLowerCase()
    ).length;
    const code = sameNameCount > 0 ? `${base} ${sameNameCount + 1}` : base;
    onChange({ ...data, display_code: code });
  }, [siteName, data.asset_name, userEditedCode, allSiteAssets.length]);

  // Board options for "fed from"
  const boardOptions = [
    { value: 'TBC', label: '— TBC / Unknown (to be confirmed) —' },
    ...allBoards.map(b => ({ value: b.id, label: b.display_code || b.asset_name })),
  ];

  const handleBoardChange = (val) => {
    if (val === 'TBC') onChange({ ...data, electrical_board_id: '', electrical_board_tbc: true });
    else onChange({ ...data, electrical_board_id: val, electrical_board_tbc: false });
  };

  const currentBoardValue = data.electrical_board_tbc ? 'TBC' : (data.electrical_board_id || '');

  // --- Meter section ---
  // Switchboard options
  const switchboardOptions = [
    { value: 'TBC', label: '— TBC / Unknown —' },
    ...allBoards.map(b => ({ value: b.id, label: b.display_code || b.asset_name })),
  ];

  const handleSwitchboardChange = (val) => {
    // Reset device and channels when switchboard changes
    if (val === 'TBC') {
      onChange({ ...data, meter_switchboard_id: '', meter_switchboard_tbc: true, meter_device_id: '', meter_channels: [] });
    } else {
      onChange({ ...data, meter_switchboard_id: val, meter_switchboard_tbc: false, meter_device_id: '', meter_channels: [] });
    }
  };

  const currentSwitchboardValue = data.meter_switchboard_tbc ? 'TBC' : (data.meter_switchboard_id || '');

  // Get the selected switchboard object and its devices
  const selectedBoard = allBoards.find(b => b.id === data.meter_switchboard_id);
  const boardDevices = (selectedBoard?.meters || []).filter(m => m.device_name || m.meter_device_type);

  // Device options from the selected switchboard
  const deviceOptions = boardDevices.map((m, i) => ({
    value: m.device_name || `device-${i}`,
    label: `${m.device_name || `Device ${i + 1}`}${m.meter_device_type ? ` (${m.meter_device_type})` : ''}`,
  }));

  const handleDeviceChange = (val) => {
    onChange({ ...data, meter_device_id: val, meter_channels: [] });
  };

  // Get the selected device's channels (from WW config)
  const selectedDevice = boardDevices.find(m => m.device_name === data.meter_device_id);
  const deviceChannelCount = selectedDevice?.meter_device_type?.includes('A6M') ? 6
    : selectedDevice?.meter_device_type?.includes('A3RM') ? 3
    : (selectedDevice?.ww_channels?.length || 6);

  const availableChannels = ALL_CHANNELS.slice(0, deviceChannelCount).map((ch, i) => {
    const wwCh = selectedDevice?.ww_channels?.[i];
    const suffix = wwCh?.load_description || wwCh?.load ? ` — ${wwCh.load_description || wwCh.load}` : '';
    return { value: ch, label: `${ch}${suffix}` };
  });

  // Channel management
  const channels = data.meter_channels || [];
  const usedChannels = channels.map(c => c.channel);

  const addChannel = () => {
    const next = availableChannels.find(c => !usedChannels.includes(c.value));
    if (!next) return;
    set('meter_channels', [...channels, { channel: next.value, description: '' }]);
  };

  const removeChannel = (i) => set('meter_channels', channels.filter((_, idx) => idx !== i));

  const updateChannel = (i, field, val) => {
    set('meter_channels', channels.map((ch, idx) => idx === i ? { ...ch, [field]: val } : ch));
  };

  const canAddMore = availableChannels.length > 0 && channels.length < availableChannels.length;

  return (
    <div className="space-y-5">
      {/* Equipment Identity */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Equipment Identity</p>
        <Field label="Equipment Name *" hint="Short descriptive name, e.g. Rooftop HVAC Unit 1">
          <Input value={data.asset_name || ''} onChange={e => set('asset_name', e.target.value)} placeholder="e.g. Rooftop HVAC Unit 1" />
        </Field>
        <Field label="Asset Type *">
          <MobileSelect value={data.asset_type || ''} onValueChange={v => set('asset_type', v)} placeholder="Select asset type..." options={ASSET_TYPES} />
        </Field>
      </div>

      {/* Electrical Board */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Electrical Board</p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 flex gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">Select the switchboard / distribution board this asset is fed from. Use TBC if unknown.</p>
        </div>
        <Field label="Fed From (Electrical Board)">
          <MobileSelect value={currentBoardValue} onValueChange={handleBoardChange} placeholder="Select board..." options={boardOptions} />
        </Field>
        {data.electrical_board_tbc && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Marked as TBC — can be resolved in the report reconciliation screen.
          </div>
        )}
      </div>

      {/* Physical Location */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Physical Location</p>
        <Field label="Location Description">
          <Input value={data.location_description || ''} onChange={e => set('location_description', e.target.value)} placeholder="e.g. Level 2 Plant Room" />
        </Field>
        <PhotoUpload value={data.location_photo || ''} onChange={v => set('location_photo', v)} label="Location Photo" />
      </div>

      {/* Display Code */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Display Code</p>
        <Field label="Display Code" hint="Auto-generated as (Site Name) - (Equipment Name). Edit to override.">
          <Input
            value={data.display_code || ''}
            onChange={e => { setUserEditedCode(true); set('display_code', e.target.value); }}
            placeholder="e.g. Acme HQ - Rooftop HVAC Unit 1"
            className="font-mono text-sm"
          />
        </Field>
      </div>

      {/* Metering / Device */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Metering / Device</p>
        <div className="flex items-center gap-3">
          <Switch
            id="meter_present_asset"
            checked={!!data.meter_present}
            onCheckedChange={v => {
              if (!v) onChange({ ...data, meter_present: false, meter_switchboard_id: '', meter_switchboard_tbc: false, meter_device_id: '', meter_channels: [] });
              else set('meter_present', true);
            }}
          />
          <Label htmlFor="meter_present_asset" className="text-sm font-medium">Metering / Device Present</Label>
        </div>

        {data.meter_present && (
          <div className="space-y-4 pl-3 border-l-2 border-primary/30">
            {/* Step 1: Switchboard */}
            <Field label="1. Switchboard (where metering device is installed)">
              <MobileSelect
                value={currentSwitchboardValue}
                onValueChange={handleSwitchboardChange}
                placeholder="Select switchboard..."
                options={switchboardOptions}
              />
            </Field>
            {data.meter_switchboard_tbc && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                Switchboard marked as TBC.
              </div>
            )}

            {/* Step 2: Device on that switchboard */}
            {data.meter_switchboard_id && !data.meter_switchboard_tbc && (
              <>
                {boardDevices.length === 0 ? (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    No metering devices recorded on <span className="font-medium">{selectedBoard?.display_code || selectedBoard?.asset_name}</span>. Add devices to that board first.
                  </div>
                ) : (
                  <Field label="2. Metering Device">
                    <MobileSelect
                      value={data.meter_device_id || ''}
                      onValueChange={handleDeviceChange}
                      placeholder="Select device..."
                      options={deviceOptions}
                    />
                    {/* Show device info if selected */}
                    {selectedDevice && (
                      <div className="mt-2 bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-primary">{selectedDevice.meter_device_type}</p>
                          {selectedDevice.ww_switchboard?.serial_number && (
                            <p className="text-xs text-muted-foreground">S/N: {selectedDevice.ww_switchboard.serial_number}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </Field>
                )}

                {/* Step 3: Channels */}
                {data.meter_device_id && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">3. Channels Used by This Asset</label>
                      {canAddMore && (
                        <Button type="button" size="sm" variant="outline" onClick={addChannel} className="h-7 text-xs gap-1">
                          <Plus className="w-3 h-3" /> Add Channel
                        </Button>
                      )}
                    </div>
                    {channels.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No channels assigned yet.</p>
                    )}
                    {channels.map((ch, i) => (
                      <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">Assignment {i + 1}</span>
                          <button type="button" onClick={() => removeChannel(i)} className="text-destructive hover:opacity-70">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <MobileSelect
                          value={ch.channel || ''}
                          onValueChange={v => updateChannel(i, 'channel', v)}
                          placeholder="Select channel..."
                          options={availableChannels.filter(opt =>
                            opt.value === ch.channel || !usedChannels.includes(opt.value)
                          )}
                        />
                        <Input
                          value={ch.description || ''}
                          onChange={e => updateChannel(i, 'description', e.target.value)}
                          placeholder="Channel description / circuit name..."
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Notes & Photos */}
      <div className="space-y-4 pt-4 mt-4 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes & Additional Photos</p>
        <Field label="Comments">
          <Textarea value={data.comments || ''} onChange={e => set('comments', e.target.value)} rows={3} placeholder="Any extra observations..." />
        </Field>
        <MultiPhotoUpload value={data.extra_photos || []} onChange={v => set('extra_photos', v)} label="Additional Photos" />
      </div>
    </div>
  );
}