import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CircuitBoard, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileSelect from './MobileSelect';
import { toast } from 'sonner';

export default function TBCResolver({ tbcAssets, allAssets, onResolved }) {
  const [selections, setSelections] = useState({});
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);

  const nonTbcAssets = allAssets.filter(a => !a.electrical_parent_tbc);
  const parentOptions = nonTbcAssets.map(a => ({
    value: a.id,
    label: a.display_code || a.asset_name,
  }));

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const resolvedCount = Object.entries(checked).filter(([id, isChecked]) => isChecked && selections[id]).length;

  const handleResolveAll = async () => {
    const toResolve = Object.entries(checked)
      .filter(([id, isChecked]) => isChecked && selections[id])
      .map(([id]) => id);

    if (toResolve.length === 0) {
      toast.error('Select at least one asset and assign a parent.');
      return;
    }

    setSaving(true);
    await Promise.all(
      toResolve.map(id =>
        base44.entities.ElectricalAsset.update(id, {
          electrical_parent_id: selections[id],
          electrical_parent_tbc: false,
        })
      )
    );
    setSaving(false);
    toast.success(`Resolved ${toResolve.length} connection${toResolve.length > 1 ? 's' : ''}`);
    onResolved();
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {tbcAssets.length} unresolved electrical connection{tbcAssets.length > 1 ? 's' : ''}
          </p>
        </div>
        {resolvedCount > 0 && (
          <Button
            size="sm"
            onClick={handleResolveAll}
            disabled={saving}
            className="text-xs h-8 bg-amber-700 hover:bg-amber-800 text-white"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
            Resolve {resolvedCount}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {tbcAssets.map(asset => (
          <div key={asset.id} className="bg-white dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id={`tbc-${asset.id}`}
                checked={!!checked[asset.id]}
                onChange={e => setChecked(prev => ({ ...prev, [asset.id]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer flex-shrink-0"
              />
              <label htmlFor={`tbc-${asset.id}`} className="flex items-center gap-2 flex-wrap cursor-pointer flex-1">
                <CircuitBoard className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{asset.asset_name}</span>
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">{asset.asset_type}</span>
                {asset.display_code && (
                  <span className="text-xs font-mono text-amber-600">{asset.display_code}</span>
                )}
              </label>
            </div>

            {checked[asset.id] && (
              <div className="ml-6">
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-1.5">Assign electrical parent:</p>
                <MobileSelect
                  value={selections[asset.id] || ''}
                  onValueChange={v => setSelections(prev => ({ ...prev, [asset.id]: v }))}
                  placeholder="Select fed-from asset..."
                  options={parentOptions.filter(o => o.value !== asset.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {checkedCount === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 italic">
          Check assets above to assign their electrical parent and resolve connections.
        </p>
      )}
    </div>
  );
}