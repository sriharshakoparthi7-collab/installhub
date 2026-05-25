import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from './MobileSelect';
import PhotoUpload from './PhotoUpload';
import MultiPhotoUpload from './MultiPhotoUpload';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

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

export default function ElectricalAssetForm({ data, onChange, auditId, currentZoneId }) {
  const [allAssets, setAllAssets] = useState([]);
  const [siteCode, setSiteCode] = useState('');
  const [userEditedCode, setUserEditedCode] = useState(!!data?.display_code);
  const set = (key, val) => onChange({ ...data, [key]: val });

  useEffect(() => {
    if (auditId) {
      Promise.all([
        base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
        base44.entities.Audit.filter({ id: auditId }),
      ]).then(([assets, audits]) => {
        setAllAssets(assets.filter(a => a.id !== data?.id));
        if (audits[0]?.site_name) {
          // Derive site code: first letters of each word, max 6 chars, uppercase
          const code = audits[0].site_name
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 6);
          setSiteCode(code);
        }
      });
    }
  }, [auditId]);

  // Auto-generate display code from site code + asset name + parent name
  // Only auto-update if user hasn't manually edited it
  useEffect(() => {
    if (userEditedCode) return;
    const namePart = (data.asset_name || '').replace(/\s+/g, '').toUpperCase();
    let parentPart = '';
    if (data.electrical_parent_tbc) {
      parentPart = 'TBC';
    } else if (data.electrical_parent_id) {
      const parent = allAssets.find(a => a.id === data.electrical_parent_id);
      if (parent) {
        parentPart = (parent.display_code || parent.asset_name || '').replace(/\s+/g, '').toUpperCase();
      }
    }
    const parts = [siteCode, namePart, parentPart].filter(Boolean);
    if (parts.length > 0) {
      onChange({ ...data, display_code: parts.join('-') });
    }
  }, [siteCode, data.asset_name, data.electrical_parent_id, data.electrical_parent_tbc, userEditedCode]);

  const parentOptions = [
    { value: 'TBC', label: '— TBC / Unknown (to be confirmed) —' },
    ...allAssets.map(a => ({
      value: a.id,
      label: a.display_code || a.asset_name,
    })),
  ];

  const handleParentChange = (val) => {
    if (val === 'TBC') {
      set('electrical_parent_tbc', true);
      onChange({ ...data, electrical_parent_id: '', electrical_parent_tbc: true });
    } else {
      onChange({ ...data, electrical_parent_id: val, electrical_parent_tbc: false });
    }
  };

  const currentParentValue = data.electrical_parent_tbc ? 'TBC' : (data.electrical_parent_id || '');

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Asset Identity</p>
        <Field label="Asset Type *">
          <MobileSelect
            value={data.asset_type || ''}
            onValueChange={v => set('asset_type', v)}
            placeholder="Select type"
            options={ASSET_TYPES}
          />
        </Field>
        <Field label="Asset Name *" hint="Short name, e.g. MSSB1, HVAC DB-1, MSB">
          <Input value={data.asset_name || ''} onChange={e => set('asset_name', e.target.value)} placeholder="e.g. MSSB1" />
        </Field>
        <Field
          label="Display Code"
          hint="Auto-generated from site · asset name · electrical parent. Edit to override."
        >
          <Input
            value={data.display_code || ''}
            onChange={e => {
              setUserEditedCode(true);
              set('display_code', e.target.value);
            }}
            placeholder="SITE-NAME-PARENT"
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
          <p className="text-xs text-blue-700 dark:text-blue-300">Select the board that electrically feeds this asset. You can choose any asset across the entire site. Use TBC if unknown.</p>
        </div>
        <Field label="Fed From (Electrical Parent)">
          <MobileSelect
            value={currentParentValue}
            onValueChange={handleParentChange}
            placeholder="Select electrical source..."
            options={parentOptions}
          />
        </Field>
        {data.electrical_parent_tbc && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Marked as TBC — you can resolve this in the reconciliation screen before completing.
          </div>
        )}
        <Field label="Phase">
          <MobileSelect
            value={data.phase || ''}
            onValueChange={v => set('phase', v)}
            placeholder="Select phase"
            options={[
              { value: 'Single Phase', label: 'Single Phase' },
              { value: 'Three Phase', label: 'Three Phase' },
              { value: 'Unknown', label: 'Unknown' },
            ]}
          />
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

      {/* Wattwatcher Device */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Wattwatcher Device</p>
        <div className="flex items-center gap-3">
          <Switch
            id="has_wattwatcher"
            checked={!!data.has_wattwatcher}
            onCheckedChange={v => set('has_wattwatcher', v)}
          />
          <Label htmlFor="has_wattwatcher" className="text-sm font-medium">Wattwatcher Device Installed</Label>
        </div>
        {data.has_wattwatcher && (
          <div className="space-y-4 pl-3 border-l-2 border-primary/30">
            <Field label="Device ID / Serial Number">
              <Input value={data.wattwatcher_device_id || ''} onChange={e => set('wattwatcher_device_id', e.target.value)} placeholder="e.g. D001, WW-12345" />
            </Field>
            <Field label="Wattwatcher Model">
              <Input value={data.wattwatcher_model || ''} onChange={e => set('wattwatcher_model', e.target.value)} placeholder="e.g. Auditor 6M" />
            </Field>
            <PhotoUpload value={data.wattwatcher_photo || ''} onChange={v => set('wattwatcher_photo', v)} label="Device Photo" />
          </div>
        )}
      </div>

      {/* Metering */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Metering</p>
        <div className="flex items-center gap-3">
          <Switch
            id="meter_present"
            checked={!!data.meter_present}
            onCheckedChange={v => set('meter_present', v)}
          />
          <Label htmlFor="meter_present" className="text-sm font-medium">Metering Present</Label>
        </div>
        {data.meter_present && (
          <div className="space-y-4 pl-3 border-l-2 border-accent/40">
            <Field label="Meter Device ID / Serial">
              <Input value={data.meter_device_id || ''} onChange={e => set('meter_device_id', e.target.value)} placeholder="e.g. D001, D004" />
            </Field>
            <Field label="Meter Classification">
              <MobileSelect
                value={data.meter_classification || ''}
                onValueChange={v => set('meter_classification', v)}
                placeholder="Select classification"
                options={METER_CLASSIFICATIONS}
              />
            </Field>
            <Field label="Coverage Type" hint="Does this meter capture the entire board load, or a specific circuit?">
              <MobileSelect
                value={data.meter_coverage_type || ''}
                onValueChange={v => set('meter_coverage_type', v)}
                placeholder="Select coverage"
                options={METER_COVERAGE}
              />
            </Field>
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