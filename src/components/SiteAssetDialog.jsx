import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SiteAssetForm from './SiteAssetForm';

export default function SiteAssetDialog({ open, onClose, initialData, zoneId, auditId, onSave }) {
  const [data, setData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const isEdit = !!initialData?.id;

  const handleSave = async () => {
    if (!data.asset_name?.trim()) {
      toast.error('"Equipment Name" is required');
      return;
    }
    if (!data.asset_type) {
      toast.error('"Asset Type" is required');
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
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Asset</DialogTitle>
        </DialogHeader>
        <SiteAssetForm
          data={data}
          onChange={setData}
          auditId={auditId}
          currentZoneId={zoneId}
        />
        <DialogFooter className="mt-4 sticky bottom-0 bg-background pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Update' : 'Save Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}