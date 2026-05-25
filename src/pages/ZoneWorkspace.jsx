import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MultiPhotoUpload from '../components/MultiPhotoUpload';
import ElectricalAssetDialog from '../components/ElectricalAssetDialog';
import ElectricalAssetCard from '../components/ElectricalAssetCard';

export default function ZoneWorkspace() {
  const { auditId, zoneId } = useParams();
  const navigate = useNavigate();
  const [zone, setZone] = useState(null);
  const [assets, setAssets] = useState([]);
  const [allSiteAssets, setAllSiteAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [savingZone, setSavingZone] = useState(false);

  useEffect(() => {
    loadData();
  }, [zoneId]);

  const loadData = async () => {
    const [zoneData, zoneAssets, siteAssets] = await Promise.all([
      base44.entities.Zone.filter({ id: zoneId }),
      base44.entities.ElectricalAsset.filter({ zone_id: zoneId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
    ]);
    if (zoneData.length) setZone(zoneData[0]);
    setAssets(zoneAssets);
    setAllSiteAssets(siteAssets);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    if (editItem?.id) {
      const { id, created_date, updated_date, created_by, ...updateData } = data;
      setAssets(prev => prev.map(a => a.id === editItem.id ? { ...a, ...updateData } : a));
      setAllSiteAssets(prev => prev.map(a => a.id === editItem.id ? { ...a, ...updateData } : a));
      toast.success('Asset updated');
      await base44.entities.ElectricalAsset.update(editItem.id, updateData);
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimistic = { ...data, id: tempId, zone_id: zoneId, audit_id: auditId };
      setAssets(prev => [...prev, optimistic]);
      setAllSiteAssets(prev => [...prev, optimistic]);
      toast.success('Asset added');
      const created = await base44.entities.ElectricalAsset.create({ ...data, zone_id: zoneId, audit_id: auditId });
      setAssets(prev => prev.map(a => a.id === tempId ? created : a));
      setAllSiteAssets(prev => prev.map(a => a.id === tempId ? created : a));
    }
  };

  const handleDelete = async (assetId) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    setAllSiteAssets(prev => prev.filter(a => a.id !== assetId));
    toast.success('Asset removed');
    await base44.entities.ElectricalAsset.delete(assetId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tbcCount = assets.filter(a => a.electrical_parent_tbc).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/audit/${auditId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Installation
        </button>
        <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent rounded-2xl p-5 border border-accent/10">
          <h1 className="text-xl font-bold text-foreground">{zone?.zone_name}</h1>
          {zone?.zone_description && (
            <p className="text-sm text-muted-foreground mt-1">{zone.zone_description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{assets.length} electrical asset{assets.length !== 1 ? 's' : ''} in this zone</p>
        </div>
      </div>

      {/* Zone Photos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Zone Photos</h2>
        <MultiPhotoUpload
          value={zone?.photos || []}
          onChange={async (photos) => {
            setZone(prev => ({ ...prev, photos }));
            setSavingZone(true);
            await base44.entities.Zone.update(zoneId, { photos });
            setSavingZone(false);
          }}
          label={savingZone ? 'Saving...' : 'Add photos of this zone / area'}
        />
      </div>

      {/* TBC Warning */}
      {tbcCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{tbcCount} asset{tbcCount > 1 ? 's' : ''} with TBC electrical parent</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">You can resolve these any time — the full site asset list is available in the "Fed From" dropdown.</p>
          </div>
        </div>
      )}

      {/* Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Electrical Assets ({assets.length})
          </h2>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Asset
          </Button>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No assets recorded yet</p>
            <p className="text-xs text-muted-foreground mb-4">Add switchboards, distribution boards, and any Wattwatcher device installations.</p>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Asset
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => (
              <ElectricalAssetCard
                key={asset.id}
                asset={asset}
                allAssets={allSiteAssets}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Asset Dialog */}
      {dialogOpen && (
        <ElectricalAssetDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initialData={editItem}
          zoneId={zoneId}
          auditId={auditId}
          onSave={handleSave}
        />
      )}
    </div>
  );
}