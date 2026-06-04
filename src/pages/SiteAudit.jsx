import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Save, Loader2, CheckCircle, FileText, Trash2, AlertTriangle, Download, LayoutList, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import ZoneCard from '../components/ZoneCard';
import SiteSummaryDialog from '../components/SiteSummaryDialog';
import PullToRefresh from '../components/PullToRefresh';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SiteAudit() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const isNew = auditId === 'new';

  const [audit, setAudit] = useState({
    client_name: '', site_name: '', site_address: '', inspector_name: '',
    audit_date: new Date().toISOString().split('T')[0], status: 'Draft',
  });
  const [orphanCount, setOrphanCount] = useState(0);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [zoneDialog, setZoneDialog] = useState(false);
  const [newZone, setNewZone] = useState({ zone_name: '', zone_description: '' });
  const [deleteAuditDialog, setDeleteAuditDialog] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);

  useEffect(() => {
    if (!isNew) loadData();
  }, [auditId]);

  const loadData = async () => {
    try {
      const [auditData, zonesData, assetsData] = await Promise.all([
        base44.entities.Audit.filter({ id: auditId }),
        base44.entities.Zone.filter({ audit_id: auditId }),
        base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      ]);
      if (auditData.length) setAudit(auditData[0]);
      setZones(zonesData);
      setOrphanCount(assetsData.filter(a => a.electrical_parent_tbc).length);
    } catch (e) {
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!audit.client_name || !audit.site_name || !audit.site_address || !audit.inspector_name) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    if (isNew) {
      const created = await base44.entities.Audit.create(audit);
      toast.success('Installation created');
      navigate(`/audit/${created.id}`, { replace: true });
    } else {
      const { id, created_date, updated_date, created_by, ...updateData } = audit;
      await base44.entities.Audit.update(auditId, updateData);
      toast.success('Installation saved');
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    await base44.entities.Audit.update(auditId, { status: 'Completed' });
    setAudit({ ...audit, status: 'Completed' });
    toast.success('Installation marked as completed');
  };

  const handleAddZone = async () => {
    if (!newZone.zone_name) return;
    // Optimistic: add placeholder immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...newZone, id: tempId, audit_id: auditId };
    setZones(prev => [...prev, optimistic]);
    setNewZone({ zone_name: '', zone_description: '' });
    setZoneDialog(false);
    const created = await base44.entities.Zone.create({ ...newZone, audit_id: auditId });
    // Replace temp with real
    setZones(prev => prev.map(z => z.id === tempId ? created : z));
    toast.success('Zone added');
  };

  const handleDeleteZone = async (zoneId) => {
    // Optimistic remove
    setZones(prev => prev.filter(z => z.id !== zoneId));
    toast.success('Zone removed');
    await base44.entities.Zone.delete(zoneId);
  };

  const handleDeleteAudit = async () => {
    for (const z of zones) {
      await base44.entities.Zone.delete(z.id);
    }
    await base44.entities.Audit.delete(auditId);
    toast.success('Installation deleted');
    navigate('/', { replace: true });
  };

  const handleRefresh = async () => {
    try {
      const [auditData, zonesData, assetsData] = await Promise.all([
        base44.entities.Audit.filter({ id: auditId }),
        base44.entities.Zone.filter({ audit_id: auditId }),
        base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
      ]);
      if (auditData.length) setAudit(auditData[0]);
      setZones(zonesData);
      setOrphanCount(assetsData.filter(a => a.electrical_parent_tbc).length);
    } catch (e) {
      toast.error('Refresh failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const set = (key, val) => setAudit({ ...audit, [key]: val });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={() => setSummaryDialog(true)}>
              <LayoutList className="w-3.5 h-3.5 mr-1.5" />
              Summary
            </Button>
          )}
          {!isNew && (
            <Link to={`/audit/${auditId}/metering-assets`}>
              <Button variant="outline" size="sm">
                <Table2 className="w-3.5 h-3.5 mr-1.5" />
                Metering Table
              </Button>
            </Link>
          )}
          {!isNew && (
            <Link to={`/audit/${auditId}/wattmapper-report`}>
              <Button variant="outline" size="sm">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Full Report
              </Button>
            </Link>
          )}
          {!isNew && audit.status === 'Completed' && (
            <Link to={`/audit/${auditId}/report`}>
              <Button variant="outline" size="sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Data View
              </Button>
            </Link>
          )}
          {!isNew && (
            <Badge variant={audit.status === 'Completed' ? 'default' : 'secondary'}>
              {audit.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Site Details Form */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Installation Details</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Client Name *</label>
              <Input value={audit.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Site Name *</label>
              <Input value={audit.site_name} onChange={e => set('site_name', e.target.value)} placeholder="e.g. Head Office" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Site Address *</label>
            <Input value={audit.site_address} onChange={e => set('site_address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Technician / Inspector *</label>
              <Input value={audit.inspector_name} onChange={e => set('inspector_name', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
              <Input type="date" value={audit.audit_date} onChange={e => set('audit_date', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? 'Create Installation' : 'Save Changes'}
          </Button>
          {!isNew && audit.status === 'Draft' && (
            <Button variant="outline" onClick={handleComplete}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Zones Section */}
      {!isNew && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Zones / Areas ({zones.length})</h2>
            <Button size="sm" onClick={() => setZoneDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Zone
            </Button>
          </div>
          {zones.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-3">No zones added yet</p>
              <Button variant="outline" size="sm" onClick={() => setZoneDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Zone / Area
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map(zone => (
                <ZoneCard key={zone.id} zone={zone} auditId={auditId} onDelete={handleDeleteZone} />
              ))}
            </div>
          )}

          {/* Orphan TBC Alert */}
          {orphanCount > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{orphanCount} unresolved electrical connection{orphanCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Some assets have "TBC / Unknown" electrical parents. Review before completing.</p>
              </div>
            </div>
          )}

          {/* Delete Audit */}
          <div className="pt-4 border-t border-border">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive min-h-[44px]" onClick={() => setDeleteAuditDialog(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Installation
            </Button>
          </div>
        </div>
      )}

      {/* Add Zone Dialog */}
      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Zone / Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Zone Name *</label>
              <Input value={newZone.zone_name} onChange={e => setNewZone({ ...newZone, zone_name: e.target.value })} placeholder="e.g. Ground Floor, Level 1, Rooftop, Basement" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea value={newZone.zone_description} onChange={e => setNewZone({ ...newZone, zone_description: e.target.value })} placeholder="Optional description" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(false)}>Cancel</Button>
            <Button onClick={handleAddZone} disabled={!newZone.zone_name}>Add Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteSummaryDialog open={summaryDialog} onClose={() => setSummaryDialog(false)} auditId={auditId} audit={audit} />

      {/* Delete Audit Confirmation */}
      <AlertDialog open={deleteAuditDialog} onOpenChange={setDeleteAuditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Installation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this installation record and all its zones and asset data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteAudit}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PullToRefresh>
  );
}