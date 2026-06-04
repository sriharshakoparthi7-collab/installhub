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

const CT_RATINGS = [
  'CT-60A', 'CT-120A', 'CT-250A', 'CT-400A', 'CT-600A', 'Not Used'
].map(v => ({ value: v, label: v }));

const CHANNEL_PURPOSES = [
  { value: 'MAIN_SUPPLY', label: '⚡ Main Board Supply — measures incoming feed for this board' },
  { value: 'SUB_CIRCUIT', label: '🔌 Sub-Circuit / Asset — measures a child asset or outgoing circuit' },
  { value: 'SPARE', label: '○ Spare / Unused' },
];

const LOAD_TYPES = [
  'Mains Supply', 'HVAC', 'Lighting', 'Solar PV', 'Forklift Charger', 'Hot Water', 'General Power', 'Other', 'Not Used'
].map(v => ({ value: v, label: v }));

const POLARITY_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Not Used', label: 'Not Used' },
];

const SIGNAL_STRENGTH = ['Low', 'Medium', 'High'].map(v => ({ value: v, label: v }));
const ANTENNA_TYPES = ['Internal', 'External', 'CSM550 - External High Gain', 'Other'].map(v => ({ value: v, label: v }));

export default function WattwatcherA6MForm({ data = {}, onChange }) {
  const set = (section, key, val) => onChange({ ...data, [section]: { ...(data[section] || {}), [key]: val } });
  const setChannel = (idx, key, val) => {
    const channels = [...(data.ww_channels || Array(6).fill({}))];
    channels[idx] = { ...(channels[idx] || {}), [key]: val };
    onChange({ ...data, ww_channels: channels });
  };

  const pre = data.ww_prestart || {};
  const sb = data.ww_switchboard || {};
  const channels = data.ww_channels || Array(6).fill({});
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
          <Input value={sb.sb_name || ''} onChange={e => set('ww_switchboard', 'sb_name', e.target.value)} placeholder="e.g. DB- Maintenance Shed" />
        </Field>
        <Field label="Switchboard Location">
          <Input value={sb.sb_location || ''} onChange={e => set('ww_switchboard', 'sb_location', e.target.value)} placeholder="e.g. Inside maintenance shed" />
        </Field>
        <Field label="Address Map Locator">
          <Input value={sb.map_locator || ''} onChange={e => set('ww_switchboard', 'map_locator', e.target.value)} placeholder="Longitude: 0 Latitude: 0" />
        </Field>
        <Field label="Type of Switchboard">
          <MobileSelect value={sb.sb_type || ''} onValueChange={v => set('ww_switchboard', 'sb_type', v)} placeholder="Select type" options={[
            'Main Switchboard', 'Sub / Distribution Board', 'HVAC DB', 'Lighting DB', 'Solar/PV DB', 'MCC', 'Other'
          ].map(v => ({ value: v, label: v }))} />
        </Field>
        <Field label="Site NMI">
          <Input value={sb.site_nmi || ''} onChange={e => set('ww_switchboard', 'site_nmi', e.target.value)} placeholder="e.g. Unknown or NMI number" />
        </Field>
        <Field label="A6M 4G Auditor - Serial Number">
          <Input value={sb.serial_number || ''} onChange={e => set('ww_switchboard', 'serial_number', e.target.value)} placeholder="e.g. DD03710160579" />
        </Field>
      </div>

      {/* Channel Configuration - 6 channels */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">Channel Configuration (6 Channels)</p>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`rounded-lg p-3 space-y-3 border ${channels[i]?.purpose === 'MAIN_SUPPLY' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : channels[i]?.purpose === 'SUB_CIRCUIT' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-muted/40 border-border'}`}>
            <p className="text-xs font-semibold text-foreground">Channel {i + 1}</p>
            <Field label="Channel Purpose *" hint="Determines how this channel is used in energy calculations.">
              <MobileSelect value={channels[i]?.purpose || ''} onValueChange={v => setChannel(i, 'purpose', v)} placeholder="Select purpose..." options={CHANNEL_PURPOSES} />
            </Field>
            {channels[i]?.purpose === 'SUB_CIRCUIT' && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-md px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                This channel measures a child asset. It will be available for assignment when adding assets fed from this board.
              </div>
            )}
            {channels[i]?.purpose !== 'SPARE' && (
              <>
                <Field label="CT Rating">
                  <MobileSelect value={channels[i]?.ct_rating || ''} onValueChange={v => setChannel(i, 'ct_rating', v)} placeholder="Select rating" options={CT_RATINGS} />
                </Field>
                <Field label="Load">
                  <MobileSelect value={channels[i]?.load || ''} onValueChange={v => setChannel(i, 'load', v)} placeholder="Select load" options={LOAD_TYPES} />
                </Field>
                <Field label="Load Description">
                  <Input value={channels[i]?.load_description || ''} onChange={e => setChannel(i, 'load_description', e.target.value)} placeholder={channels[i]?.purpose === 'SUB_CIRCUIT' ? 'e.g. Rooftop HVAC Unit 1 (assign to asset later)' : 'e.g. Solar Phase C'} />
                </Field>
              </>
            )}
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
              <Input type="number" value={ver[`phase_${ph.toLowerCase()}_voltage`] || ''} onChange={e => set('ww_verification', `phase_${ph.toLowerCase()}_voltage`, e.target.value)} placeholder="e.g. 241" />
            </Field>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground">Channel {i + 1}</p>
            <Field label="CT Polarity">
              <MobileSelect value={ver[`ch${i + 1}_polarity`] || ''} onValueChange={v => set('ww_verification', `ch${i + 1}_polarity`, v)} placeholder="Select" options={POLARITY_OPTIONS} />
            </Field>
            <Field label="Current - AC Clamp Tester">
              <Input value={ver[`ch${i + 1}_current`] || ''} onChange={e => set('ww_verification', `ch${i + 1}_current`, e.target.value)} placeholder="e.g. 2.61 or Not Connected" />
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
          ['ct_location', 'CT Location'],
          ['cb_location', 'C/B Location'],
          ['ch1_nameplate', 'Channel 1 Load Nameplates'],
          ['ch2_nameplate', 'Channel 2 Load Nameplates'],
          ['ch3_nameplate', 'Channel 3 Load Nameplates'],
          ['ch4_nameplate', 'Channel 4 Load Nameplates'],
          ['ch5_nameplate', 'Channel 5 Load Nameplates'],
          ['ch6_nameplate', 'Channel 6 Load Nameplates'],
          ['installed_auditor', 'Installed Auditor Location'],
          ['auditor_serial', 'Auditor Serial Number'],
          ['installed_ct', 'Installed CT Location'],
          ['installed_cb', 'Installed C/B Location'],
          ['screenshot_start', 'Screenshot: Start Page (WW App)'],
          ['screenshot_channels', 'Screenshot: Channels Page (WW App)'],
          ['screenshot_energy', 'Screenshot: Energy Page (WW App)'],
          ['completed_installation', 'Completed Installation'],
        ].map(([key, label]) => (
          <PhotoUpload key={key} value={photos[key] || ''} onChange={v => onChange({ ...data, ww_photos: { ...photos, [key]: v } })} label={label} />
        ))}
      </div>
    </div>
  );
}