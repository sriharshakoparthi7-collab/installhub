import { CircuitBoard, Zap, AlertTriangle, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  MSB: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  MSSB: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  DB: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'HVAC-DB': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'LX-DB': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'PV-DB': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  MCC: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Other: 'bg-muted text-muted-foreground',
};

export default function ElectricalAssetCard({ asset, allAssets = [], onEdit, onDelete }) {
  const electricalParent = allAssets.find(a => a.id === asset.electrical_parent_id);
  const typeColor = TYPE_COLORS[asset.asset_type] || TYPE_COLORS.Other;

  return (
    <div className="bg-card rounded-xl border border-border hover:shadow-sm transition-all p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CircuitBoard className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{asset.asset_name}</p>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor}`}>{asset.asset_type}</Badge>
              {asset.has_wattwatcher && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                  <Zap className="w-2.5 h-2.5 mr-1" />WW
                </Badge>
              )}
            </div>
            {asset.display_code && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{asset.display_code}</p>
            )}
            {asset.location_description && (
              <p className="text-xs text-muted-foreground mt-0.5">{asset.location_description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(asset.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Electrical parent row */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Fed from:</span>
        {asset.electrical_parent_tbc ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3 h-3" /> TBC / Unknown
          </span>
        ) : electricalParent ? (
          <span className="text-foreground font-medium">{electricalParent.display_code || electricalParent.asset_name}</span>
        ) : (
          <span className="text-muted-foreground italic">— not set —</span>
        )}
      </div>

      {/* Wattwatcher / Meter chips */}
      {(asset.has_wattwatcher || asset.meter_present) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {asset.has_wattwatcher && asset.wattwatcher_device_id && (
            <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-md px-2 py-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-medium text-primary">{asset.wattwatcher_device_id}</span>
              {asset.wattwatcher_model && <span className="text-[11px] text-muted-foreground">· {asset.wattwatcher_model}</span>}
            </div>
          )}
          {asset.meter_present && asset.meter_device_id && (
            <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-md px-2 py-1">
              <CheckCircle2 className="w-3 h-3 text-accent" />
              <span className="text-[11px] font-medium text-foreground">{asset.meter_device_id}</span>
              {asset.meter_classification && <span className="text-[11px] text-muted-foreground">· {asset.meter_classification}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}