import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import MobileSelect from './MobileSelect';
import PhotoUpload from './PhotoUpload';
import MultiPhotoUpload from './MultiPhotoUpload';
import WattwatcherA3RMForm from './WattwatcherA3RMForm';
import WattwatcherA6MForm from './WattwatcherA6MForm';

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
  { value: 'MSB', label: 'MSB — Main Switchboard' },
  { value: 'MSSB', label: 'MSSB — Main Sub-Switchboard' },
  { value: 'DB', label: 'DB — Distribution Board' },
  { value: 'HVAC-DB', label: 'HVAC-DB — HVAC Distribution Board' },
  { value: 'LX-DB', label: 'LX-DB — Lighting Distribution Board' },
  { value: 'PV-DB', label: 'PV-DB — PV/Solar Distribution Board' },
  { value: 'MCC', label: 'MCC — Motor Control Centre' },
  { value: 'Other', label: 'Other' },
];

const METER_DEVICE_TYPES = [
  { value: 'A3RM Auditor', label: 'A3RM Auditor (SW MaaS)' },
  { value: 'A6M Auditor', label: 'A6M Auditor' },
  { value: 'Other Meter', label: 'Other Meter' },
];

const METER_CLASSIFICATIONS = [
  { value: 'Utility / Gate Meter', label: 'Utility / Gate Meter' },
  { value: 'Sub-meter', label: 'Sub-meter' },
  { value: 'Check Meter', label: 'Check Meter' },
  { value: 'Solar / Generation Meter', label: 'Solar / Generation Meter' },
  { value: 'Other', label: 'Other' },
];

const METER_COVERAGE = [
  { value: 'Entire Board Load', label: 'Entire Board Load' },
  { value: 'Specific Outgoing Circuit', label: 'Specific Outgoing Circuit' },
  { value: 'Multiple Circuits', label: 'Multiple Circuits' },
  { value: 'Unknown', label: 'Unknown' },
];

function MeterDeviceBlock({ meter, index, onChange, onRemove, allBoards, siteName, zoneName, assetName, existingCount, allMeterNames }) {
  const [expanded, setExpanded] = useState(true);
  const set = (key, val) => onChange({ ...meter, [key]: val });

  // Auto-generate device name: SiteName - ZoneName - Type - N
  useEffect(() => {
    if (meter.device_name) return;
    const base = [siteName, zoneName, meter.meter_device_type || 'Device'].filter(Boolean).join(' - ');
    const name = `${base} ${index + 1}`;
    onChange({ ...meter, device_name: name });
  }, [siteName, zoneName, meter.meter_device_type]);

  // Check if this device's name duplicates another device in the list
  const isDuplicateName = meter.device_name &&
    allMeterNames.filter(n => n === meter.device_name).length > 1;

  const handleWWChange = (updatedData) => {
    onChange({
      ...meter,
      ww_prestart: updatedData.ww_prestart,
      ww_switchboard: updatedData.ww_switchboard,
      ww_channels: updatedData.ww_channels,
      ww_verification: updatedData.ww_verification,
      ww_commissioning: updatedData.ww_commissioning,
      ww_photos: updatedData.ww_photos,
    });
  };

  // Build a fake "data" shape for ww forms
  const wwData = {
    ww_prestart: meter.ww_prestart,
    ww_switchboard: meter.ww_switchboard,
    ww_channels: meter.ww_channels,
    ww_verification: meter.ww_verification,
    ww_commissioning: meter.ww_commissioning,
    ww_photos: meter.ww_photos,
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Device {index + 1}: {meter.device_name || '(unnamed)'}
          </span>
          {meter.meter_device_type && (
            <span className="text-xs text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">{meter.meter_device_type}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-destructive hover:opacity-70 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <Field label="Device Name" hint="Auto-generated from site/zone/type. Edit to override.">
            <Input
              value={meter.device_name || ''}
              onChange={e => set('device_name', e.target.value)}
              placeholder="e.g. Acme HQ - Level 1 - A3RM Auditor 1"
              className={isDuplicateName ? 'border-amber-400 focus-visible:ring-amber-400' : ''}
            />
            {isDuplicateName && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚠ Duplicate name — another device has the same name. Please rename this one.
              </p>
            )}
          </Field>

          <Field label="Device Type">
            <MobileSelect
              value={meter.meter_device_type || ''}
              onValueChange={v => set('meter_device_type', v)}
              placeholder="Select device type..."
              options={METER_DEVICE_TYPES}
            />
          </Field>

          {meter.meter_device_type === 'A3RM Auditor' && (
            <div className="space-y-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary">SW MaaS — A3RM Auditor Installation Form</p>
              </div>
              <WattwatcherA3RMForm data={wwData} onChange={handleWWChange} />
            </div>
          )}

          {meter.meter_device_type === 'A6M Auditor' && (
            <div className="space-y-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary">A6M Auditor Installation Form</p>
              </div>
              <WattwatcherA6MForm data={wwData} onChange={handleWWChange} />
            </div>
          )}

          {meter.meter_device_type === 'Other Meter' && (
            <div className="space-y-4">
              <Field label="Meter Device ID / Serial">
                <Input value={meter.meter_device_id || ''} onChange={e => set('meter_device_id', e.target.value)} placeholder="e.g. D001" />
              </Field>
              <Field label="Meter Classification">
                <MobileSelect value={meter.meter_classification || ''} onValueChange={v => set('meter_classification', v)} placeholder="Select classification" options={METER_CLASSIFICATIONS} />
              </Field>
              <Field label="Coverage Type">
                <MobileSelect value={meter.meter_coverage_type || ''} onValueChange={v => set('meter_coverage_type', v)} placeholder="Select coverage" options={METER_COVERAGE} />
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ElectricalAssetForm({ data, onChange, auditId, currentZoneId }) {
  const [allAssets, setAllAssets] = useState([]);
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [userEditedCode, setUserEditedCode] = useState(!!data?.display_code);
  const set = (key, val) => onChange({ ...data, [key]: val });

  useEffect(() => {
    if (auditId) {
      Promise.all([
        base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
        base44.entities.Audit.filter({ id: auditId }),
        currentZoneId ? base44.entities.Zone.filter({ id: currentZoneId }) : Promise.resolve([]),
      ]).then(([assets, audits, zones]) => {
        setAllAssets(assets.filter(a => a.id !== data?.id));
        if (audits[0]?.site_name) {
          setSiteName(audits[0].site_name);
          const code = audits[0].site_name.split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0, 6);
          setSiteCode(code);
        }
        if (zones[0]?.zone_name) {
          setZoneName(zones[0].zone_name);
        }
      });
    }
  }, [auditId, currentZoneId]);

  // Auto-generate display code
  useEffect(() => {
    if (userEditedCode) return;
    const equipPart = (data.asset_name || '').replace(/\s+/g, '').toUpperCase();
    let parentPart = '';
    if (data.electrical_parent_tbc) {
      parentPart = 'TBC';
    } else if (data.electrical_parent_id) {
      const parent = allAssets.find(a => a.id === data.electrical_parent_id);
      if (parent) parentPart = (parent.asset_name || '').replace(/\s+/g, '').toUpperCase();
    }
    const parts = [siteCode, equipPart, parentPart].filter(Boolean);
    if (parts.length > 0) onChange({ ...data, display_code: parts.join('-') });
  }, [siteCode, data.asset_name, data.electrical_parent_id, data.electrical_parent_tbc, userEditedCode]);

  const parentOptions = [
    { value: 'TBC', label: '— TBC / Unknown (to be confirmed) —' },
    ...allAssets.map(a => ({ value: a.id, label: a.display_code || a.asset_name })),
  ];

  const handleParentChange = (val) => {
    if (val === 'TBC') onChange({ ...data, electrical_parent_id: '', electrical_parent_tbc: true });
    else onChange({ ...data, electrical_parent_id: val, electrical_parent_tbc: false });
  };

  const currentParentValue = data.electrical_parent_tbc ? 'TBC' : (data.electrical_parent_id || '');

  // Multi-meter management
  const meters = data.meters || [];
  const addMeter = () => set('meters', [...meters, {}]);
  const removeMeter = (i) => set('meters', meters.filter((_, idx) => idx !== i));
  const updateMeter = (i, updated) => set('meters', meters.map((m, idx) => idx === i ? updated : m));

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Board Identity</p>
        <Field label="Equipment Name *" hint="Short name, e.g. MSSB1, HVAC DB-1, MSB">
          <Input value={data.asset_name || ''} onChange={e => set('asset_name', e.target.value)} placeholder="e.g. MSB" />
        </Field>
        <Field label="Asset Type *">
          <MobileSelect value={data.asset_type || ''} onValueChange={v => set('asset_type', v)} placeholder="Select type" options={ASSET_TYPES} />
        </Field>
        <Field label="Display Code" hint="Auto-generated — edit to override.">
          <Input
            value={data.display_code || ''}
            onChange={e => { setUserEditedCode(true); set('display_code', e.target.value); }}
            placeholder="SITE-EQUIPNAME-PARENT"
            className="font-mono text-sm"
          />
        </Field>
      </div>

      {/* Physical Location */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Physical Location</p>
        <Field label="Location Description">
          <Input value={data.location_description || ''} onChange={e => set('location_description', e.target.value)} placeholder="e.g. Ground Floor Electrical Room" />
        </Field>
        <PhotoUpload value={data.photo || ''} onChange={v => set('photo', v)} label="Location Photo" />
      </div>

      {/* Electrical Hierarchy */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Electrical Hierarchy</p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 flex gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">Select the board that electrically feeds this board. Use TBC if unknown.</p>
        </div>
        <Field label="Fed From (Electrical Parent)">
          <MobileSelect value={currentParentValue} onValueChange={handleParentChange} placeholder="Select electrical source..." options={parentOptions} />
        </Field>
        {data.electrical_parent_tbc && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Marked as TBC — resolve in the reconciliation screen before completing.
          </div>
        )}
        <Field label="Phase">
          <MobileSelect value={data.phase || ''} onValueChange={v => set('phase', v)} placeholder="Select phase" options={[
            { value: 'Single Phase', label: 'Single Phase' },
            { value: 'Three Phase', label: 'Three Phase' },
            { value: 'Unknown', label: 'Unknown' },
          ]} />
        </Field>
        <Field label="Amperage Rating (A)">
          <Input value={data.amperage_rating || ''} onChange={e => set('amperage_rating', e.target.value)} placeholder="e.g. 400A" />
        </Field>
        <Field label="Site NMI (if applicable)">
          <Input value={data.site_nmi || ''} onChange={e => set('site_nmi', e.target.value)} placeholder="National Metering Identifier" />
        </Field>
        <Field label="Sub-Circuits Description">
          <Textarea value={data.sub_circuits_description || ''} onChange={e => set('sub_circuits_description', e.target.value)} rows={2} placeholder="Outgoing circuits from this board..." />
        </Field>
      </div>

      {/* Metering / Devices */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Metering / Devices</p>
        <div className="flex items-center gap-3">
          <Switch id="meter_present" checked={!!data.meter_present} onCheckedChange={v => {
            if (!v) set('meters', []);
            set('meter_present', v);
          }} />
          <Label htmlFor="meter_present" className="text-sm font-medium">Metering / Device Present</Label>
        </div>

        {data.meter_present && (
          <div className="space-y-4">
            {meters.map((meter, i) => (
              <MeterDeviceBlock
                key={i}
                meter={meter}
                index={i}
                onChange={(updated) => updateMeter(i, updated)}
                onRemove={() => removeMeter(i)}
                allBoards={allAssets}
                siteName={siteName}
                zoneName={zoneName}
                assetName={data.asset_name}
                existingCount={meters.length}
                allMeterNames={meters.map(m => m.device_name).filter(Boolean)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addMeter} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Device / Meter
            </Button>
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