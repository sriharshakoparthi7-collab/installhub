import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Zap, AlertTriangle, CircuitBoard, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MultiPhotoUpload from '../components/MultiPhotoUpload';
import ElectricalAssetDialog from '../components/ElectricalAssetDialog';
import ElectricalAssetCard from '../components/ElectricalAssetCard';
import SiteAssetDialog from '../components/SiteAssetDialog';
import SiteAssetCard from '../components/SiteAssetCard';

export default function ZoneWorkspace() {
  const { auditId, zoneId } = useParams();
  const navigate = useNavigate();
  const [zone, setZone] = useState(null);
  const [boards, setBoards] = useState([]);         // ElectricalAsset (boards only)
  const [siteAssets, setSiteAssets] = useState([]); // SiteAsset (non-board assets)
  const [allSiteBoards, setAllSiteBoards] = useState([]); // all boards across site for parent lookups
  const [loading, setLoading] = useState(true);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editBoard, setEditBoard] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [savingZone, setSavingZone] = useState(false);

  useEffect(() => {
    loadData();
  }, [zoneId]);

  const loadData = async () => {
    const [zoneData, zoneBoards, siteBoards, zoneSiteAssets] = await Promise.all([
      base44.entities.Zone.filter({ id: zoneId }),
      base44.entities.ElectricalAsset.filter({ zone_id: zoneId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      base44.entities.SiteAsset.filter({ zone_id: zoneId }),
    ]);
    if (zoneData.length) setZone(zoneData[0]);
    setBoards(zoneBoards);
    setAllSiteBoards(siteBoards);
    setSiteAssets(zoneSiteAssets);
    setLoading(false);
  };

  // --- Electrical Board CRUD ---
  const handleAddBoard = () => { setEditBoard(null); setBoardDialogOpen(true); };
  const handleEditBoard = (item) => { setEditBoard(item); setBoardDialogOpen(true); };

  const handleSaveBoard = async (data) => {
    if (editBoard?.id) {
      const { id, created_date, updated_date, created_by, ...updateData } = data;
      setBoards(prev => prev.map(a => a.id === editBoard.id ? { ...a, ...updateData } : a));
      setAllSiteBoards(prev => prev.map(a => a.id === editBoard.id ? { ...a, ...updateData } : a));
      toast.success('Board updated');
      await base44.entities.ElectricalAsset.update(editBoard.id, updateData);
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimistic = { ...data, id: tempId, zone_id: zoneId, audit_id: auditId };
      setBoards(prev => [...prev, optimistic]);
      setAllSiteBoards(prev => [...prev, optimistic]);
      toast.success('Board added');
      const created = await base44.entities.ElectricalAsset.create({ ...data, zone_id: zoneId, audit_id: auditId });
      setBoards(prev => prev.map(a => a.id === tempId ? created : a));
      setAllSiteBoards(prev => prev.map(a => a.id === tempId ? created : a));
    }
  };

  const handleDeleteBoard = async (boardId) => {
    setBoards(prev => prev.filter(a => a.id !== boardId));
    setAllSiteBoards(prev => prev.filter(a => a.id !== boardId));
    toast.success('Board removed');
    await base44.entities.ElectricalAsset.delete(boardId);
  };

  // --- Site Asset CRUD ---
  const handleAddAsset = () => { setEditAsset(null); setAssetDialogOpen(true); };
  const handleEditAsset = (item) => { setEditAsset(item); setAssetDialogOpen(true); };

  const handleSaveAsset = async (data) => {
    if (editAsset?.id) {
      const { id, created_date, updated_date, created_by, ...updateData } = data;
      setSiteAssets(prev => prev.map(a => a.id === editAsset.id ? { ...a, ...updateData } : a));
      toast.success('Asset updated');
      await base44.entities.SiteAsset.update(editAsset.id, updateData);
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimistic = { ...data, id: tempId, zone_id: zoneId, audit_id: auditId };
      setSiteAssets(prev => [...prev, optimistic]);
      toast.success('Asset added');
      const created = await base44.entities.SiteAsset.create({ ...data, zone_id: zoneId, audit_id: auditId });
      setSiteAssets(prev => prev.map(a => a.id === tempId ? created : a));
    }
  };

  const handleDeleteAsset = async (assetId) => {
    setSiteAssets(prev => prev.filter(a => a.id !== assetId));
    toast.success('Asset removed');
    await base44.entities.SiteAsset.delete(assetId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tbcBoardCount = boards.filter(a => a.electrical_parent_tbc).length;
  const tbcAssetCount = siteAssets.filter(a => a.electrical_board_tbc).length;
  const totalTbc = tbcBoardCount + tbcAssetCount;

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
          <p className="text-xs text-muted-foreground mt-2">
            {boards.length} board{boards.length !== 1 ? 's' : ''} · {siteAssets.length} asset{siteAssets.length !== 1 ? 's' : ''} in this zone
          </p>
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
      {totalTbc > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{totalTbc} item{totalTbc > 1 ? 's' : ''} with TBC electrical connection</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">You can resolve these in the Report screen before completing the audit.</p>
          </div>
        </div>
      )}

      {/* ── ELECTRICAL BOARDS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Electrical Boards ({boards.length})
            </h2>
          </div>
          <Button size="sm" onClick={handleAddBoard}>
            <Plus className="w-4 h-4 mr-1" />
            Add Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CircuitBoard className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No boards recorded yet</p>
            <p className="text-xs text-muted-foreground mb-3">Add MSBs, MSSBs, DBs and other switchboards.</p>
            <Button variant="outline" size="sm" onClick={handleAddBoard}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Board
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {boards.map(board => (
              <ElectricalAssetCard
                key={board.id}
                asset={board}
                allAssets={allSiteBoards}
                onEdit={handleEditBoard}
                onDelete={handleDeleteBoard}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── ASSETS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Assets ({siteAssets.length})
            </h2>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddAsset}>
            <Plus className="w-4 h-4 mr-1" />
            Add Asset
          </Button>
        </div>

        {siteAssets.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-6 h-6 text-accent" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No assets recorded yet</p>
            <p className="text-xs text-muted-foreground mb-3">Add HVAC units, lighting, solar, EV chargers and other equipment.</p>
            <Button variant="outline" size="sm" onClick={handleAddAsset}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Asset
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {siteAssets.map(asset => (
              <SiteAssetCard
                key={asset.id}
                asset={asset}
                allBoards={allSiteBoards}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {boardDialogOpen && (
        <ElectricalAssetDialog
          open={boardDialogOpen}
          onClose={() => setBoardDialogOpen(false)}
          initialData={editBoard}
          zoneId={zoneId}
          auditId={auditId}
          onSave={handleSaveBoard}
        />
      )}
      {assetDialogOpen && (
        <SiteAssetDialog
          open={assetDialogOpen}
          onClose={() => setAssetDialogOpen(false)}
          initialData={editAsset}
          zoneId={zoneId}
          auditId={auditId}
          onSave={handleSaveAsset}
        />
      )}
    </div>
  );
}