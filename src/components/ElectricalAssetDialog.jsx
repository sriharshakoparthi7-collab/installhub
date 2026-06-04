import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import ElectricalAssetForm from './ElectricalAssetForm';

export default function ElectricalAssetDialog({ open, onClose, initialData, zoneId, auditId, onSave }) {
  const [data, setData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [existingNames, setExistingNames] = useState([]);
  const isEdit = !!initialData?.id;

  // Re-sync form data whenever the dialog opens OR initialData changes (ensures
  // saved data — including nested meter fields like device_number — rehydrates correctly)
  useEffect(() => {
    if (open) setData(initialData || {});
  }, [open, initialData]);

  useEffect(() => {
    if (open && auditId) {
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }).then(assets => {
        setExistingNames(
          assets
            .filter(a => a.id !== initialData?.id)
            .map(a => a.asset_name?.trim().toLowerCase())
            .filter(Boolean)
        );
      });
    }
  }, [open, auditId]);

  const isDuplicateName = data.asset_name?.trim() &&
    existingNames.includes(data.asset_name.trim().toLowerCase());

  const handleSave = async () => {
    if (!data.asset_name?.trim()) {
      toast.error('"Asset Name" is required');
      return;
    }
    if (!data.asset_type) {
      toast.error('"Asset Type" is required');
      return;
    }
    if (isDuplicateName) {
      toast.error(`An electrical board named "${data.asset_name}" already exists in this audit. Please use a different name (e.g. ${data.asset_name} 2).`);
      return;
    }
    setSaving(true);
    await onSave(data);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Electrical Board</DialogTitle>
        </DialogHeader>
        {isDuplicateName && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            A board named <strong className="mx-1">"{data.asset_name}"</strong> already exists. Please use a unique name (e.g. {data.asset_name} 2).
          </div>
        )}
        <ElectricalAssetForm
          data={data}
          onChange={setData}
          auditId={auditId}
          currentZoneId={zoneId}
        />
        <DialogFooter className="mt-4 sticky bottom-0 bg-background pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Update' : 'Save Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}