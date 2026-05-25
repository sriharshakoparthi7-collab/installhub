import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import MobileSelect from './MobileSelect';
import PhotoUpload from './PhotoUpload';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function BoolField({ label, value, onChange }) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <Label htmlFor={id} className="text-sm text-foreground flex-1">{label}</Label>
      <Switch id={id} checked={!!value} onCheckedChange={onChange} />
    </div>
  );
}

const ROGOWSKI_SIZES = [
  '10cm-200A', '10cm-333mV', '20cm-3000A', '30cm-3000A', '45cm-3000A', 'Not Used'
].map(v => ({ value: v, label: v }));

const LOAD_TYPES = [
  'Mains Supply', 'HVAC', 'Lighting', 'Solar PV', 'Forklift Charger', 'Hot Water', 'General Power', 'Other', 'Not Used'
].map(v => ({ value: v, label: v }));

const SIGNAL_STRENGTH = ['Low', 'Medium', 'High'].map(v => ({ value: v, label: v }));
const ANTENNA_TYPES = ['Internal', 'External', 'CSM550 - External High Gain', 'Other'].map(v => ({ value: v, label: v }));

export default function WattwatcherA3RMForm({ data = {}, onChange }) {
  const set = (section, key, val) => onChange({ ...data, [section]: { ...(data[section] || {}), [key]: val } });
  const setChannel = (idx, key, val) => {
    const channels = [...(data.ww_channels || [{}, {}, {}])];
    channels[idx] = { ...(channels[idx] || {}), [key]: val };
    onChange({ ...data, ww_channels: channels });
  };

  const pre = data.ww_prestart || {};
  const sb = data.ww_switchboard || {};
  const channels = data.ww_channels || [{}, {}, {}];
  const ver = data.ww_verification || {};
  const com = data.ww_commissioning || {};
  const photos = data.ww_photos || {};

  return (
    <div className="space-y-6">
      {/* Pre-start */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Pre-start Information</p>
        <BoolField label="Is a site induction required for this installation?" value={pre.site_induction} onChange={v => set('ww_prestart', 'site_induction', v)} />
        <BoolField label="Do you have safe access to the installation location?" value={pre.safe_access} onChange={v => set('ww_prestart', 'safe_access', v)} />
        <BoolField label="Do you have all the correct PPE for this installation?" value={pre.correct_ppe} onChange={v => set('ww_prestart', 'correct_ppe', v)} />
        <BoolField label='Are you aware of all the "LIVE" points for where you are working?' value={pre.live_points_aware} onChange={v => set('ww_prestart', 'live_points_aware', v)} />
        <BoolField label="Can the power source be safely isolated for this installation?" value={pre.can_isolate} onChange={v => set('ww_prestart', 'can_isolate', v)} />
        <BoolField label="Have you identified any additional hazards?" value={pre.additional_hazards} onChange={v => set('ww_prestart', 'additional_hazards', v)} />
        <BoolField label="Can you safely proceed with this installation?" value={pre.safe_to_proceed} onChange={v => set('ww_prestart', 'safe_to_proceed', v)} />
      </div>

      {/* Switchboard & Device Details */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Switchboard & Device Details</p>
        <Field label="Switchboard Name">
          <Input value={sb.sb_name || ''} onChange={e => set('ww_switchboard', 'sb_name', e.target.value)} placeholder="e.g. MSSB 1B" />
        </Field>
        <Field label="Switchboard Location">
          <Input value={sb.sb_location || ''} onChange={e => set('ww_switchboard', 'sb_location', e.target.value)} placeholder="e.g. Plant Room upstairs adjacent to CM Office" />
        </Field>
        <Field label="Address Map Locator">
          <Input value={sb.map_locator || ''} onChange={e => set('ww_switchboard', 'map_locator', e.target.value)} placeholder="Longitude: 0 Latitude: 0" />
        </Field>
        <Field label="Type of Switchboard">
          <MobileSelect value={sb.sb_type || ''} onValueChange={v => set('ww_switchboard', 'sb_type', v)} placeholder="Select type" options={[
            'Main Switchboard', 'Sub/ Distribution Board', 'HVAC DB', 'Lighting DB', 'Solar/PV DB', 'MCC', 'Other'
          ].map(v => ({ value: v, label: v }))} />
        </Field>
        <Field label="Site NMI">
          <Input value={sb.site_nmi || ''} onChange={e => set('ww_switchboard', 'site_nmi', e.target.value)} placeholder="e.g. 4101797583" />
        </Field>
        <Field label="A3RM 4G Auditor - Serial Number">
          <Input value={sb.serial_number || ''} onChange={e => set('ww_switchboard', 'serial_number', e.target.value)} placeholder="e.g. DDF3710140597" />
        </Field>
      </div>

      {/* Channel Configuration */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Channel Configuration (3 Channels)</p>
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Channel {i + 1}</p>
            <Field label="Rogowski Coil Size">
              <MobileSelect value={channels[i]?.coil_size || ''} onValueChange={v => setChannel(i, 'coil_size', v)} placeholder="Select size" options={ROGOWSKI_SIZES} />
            </Field>
            <Field label="Load">
              <MobileSelect value={channels[i]?.load || ''} onValueChange={v => setChannel(i, 'load', v)} placeholder="Select load" options={LOAD_TYPES} />
            </Field>
            <Field label="Load Description">
              <Input value={channels[i]?.load_description || ''} onChange={e => setChannel(i, 'load_description', e.target.value)} placeholder="e.g. Grid Connect - Phase A" />
            </Field>
          </div>
        ))}
      </div>

      {/* App Verification & Measurements */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">App Verification & Measurements</p>
        <BoolField label="Have you completed the Start page on the WW Onboarding App?" value={ver.start_page_done} onChange={v => set('ww_verification', 'start_page_done', v)} />
        <BoolField label="Have you completed the Channels page on the WW Onboarding App?" value={ver.channels_page_done} onChange={v => set('ww_verification', 'channels_page_done', v)} />
        <div className="grid grid-cols-3 gap-3">
          {['A', 'B', 'C'].map(ph => (
            <Field key={ph} label={`Phase ${ph} Voltage (V)`}>
              <Input type="number" value={ver[`phase_${ph.toLowerCase()}_voltage`] || ''} onChange={e => set('ww_verification', `phase_${ph.toLowerCase()}_voltage`, e.target.value)} placeholder="e.g. 247" />
            </Field>
          ))}
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Channel {i + 1}</p>
            <BoolField label="Rogowski Coil Polarity Correct?" value={ver[`ch${i + 1}_polarity`]} onChange={v => set('ww_verification', `ch${i + 1}_polarity`, v)} />
            <Field label="Current - AC Clamp Tester">
              <Input value={ver[`ch${i + 1}_current`] || ''} onChange={e => set('ww_verification', `ch${i + 1}_current`, e.target.value)} placeholder="e.g. 30" />
            </Field>
          </div>
        ))}
      </div>

      {/* Commissioning */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Commissioning</p>
        <BoolField label="Is the Auditor energised?" value={com.energised} onChange={v => set('ww_commissioning', 'energised', v)} />
        <BoolField label="Are all 3 LED's visible on the Auditor?" value={com.leds_visible} onChange={v => set('ww_commissioning', 'leds_visible', v)} />
        <BoolField label="Is the Auditor online in the WW Onboarding App?" value={com.online} onChange={v => set('ww_commissioning', 'online', v)} />
        <Field label="4G Signal Strength">
          <MobileSelect value={com.signal_strength || ''} onValueChange={v => set('ww_commissioning', 'signal_strength', v)} placeholder="Select" options={SIGNAL_STRENGTH} />
        </Field>
        <Field label="Antenna Type">
          <MobileSelect value={com.antenna_type || ''} onValueChange={v => set('ww_commissioning', 'antenna_type', v)} placeholder="Select" options={ANTENNA_TYPES} />
        </Field>
        <Field label="Final Comments">
          <Textarea value={com.final_comments || ''} onChange={e => set('ww_commissioning', 'final_comments', e.target.value)} rows={3} placeholder="Any final notes..." />
        </Field>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Media / Installation Photos</p>
        {[
          ['auditor_location', 'Auditor Location (Before)'],
          ['rogowski_location', 'Rogowski Coil Location'],
          ['cb_location', 'C/B Location'],
          ['ch1_nameplate', 'Channel 1 Load Nameplates'],
          ['ch2_nameplate', 'Channel 2 Load Nameplates'],
          ['ch3_nameplate', 'Channel 3 Load Nameplates'],
          ['installed_auditor', 'Installed Auditor Location'],
          ['auditor_serial', 'Auditor Serial Number'],
          ['installed_rogowski', 'Installed Rogowski Coil Location'],
          ['installed_cb', 'Installed C/B Location'],
          ['screenshot_start', 'Screenshot: Start Page (WW App)'],
          ['screenshot_channels', 'Screenshot: Channels Page (WW App)'],
          ['screenshot_energy', 'Screenshot: Onboarding Energy Page'],
          ['completed_installation', 'Completed Installation'],
        ].map(([key, label]) => (
          <PhotoUpload key={key} value={photos[key] || ''} onChange={v => onChange({ ...data, ww_photos: { ...photos, [key]: v } })} label={label} />
        ))}
      </div>
    </div>
  );
}