import { Cpu, AlertTriangle, Edit, Trash2, Zap, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  'HVAC': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'Lighting': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'Solar / PV': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'EV Charger': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  'Exhaust / Fan System': 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'Power Outlet': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'Hot Water': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'Refrigeration': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  'Compressed Air': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'Other': 'bg-muted text-muted-foreground',
};

export default function SiteAssetCard({ asset, allBoards = [], onEdit, onDelete }) {
  const board = allBoards.find(b => b.id === asset.electrical_board_id);
  const typeColor = TYPE_COLORS[asset.asset_type] || TYPE_COLORS.Other;

  return (
    <div className="bg-card rounded-xl border border-border hover:shadow-sm transition-all p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cpu className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{asset.asset_name}</p>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor}`}>{asset.asset_type}</Badge>
              {asset.meter_present && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                  <Zap className="w-2.5 h-2.5 mr-1" />Metered
                </Badge>
              )}
            </div>
            {asset.display_code && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{asset.display_code}</p>
            )}
            {asset.location_description && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{asset.location_description}
              </p>
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

      {/* Board row */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Electrical board:</span>
        {asset.electrical_board_tbc ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3 h-3" /> TBC / Unknown
          </span>
        ) : board ? (
          <span className="text-foreground font-medium">{board.display_code || board.asset_name}</span>
        ) : (
          <span className="text-muted-foreground italic">— not set —</span>
        )}
      </div>

      {/* Channels */}
      {asset.meter_present && asset.meter_channels?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {asset.meter_channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-1 bg-primary/5 border border-primary/15 rounded px-2 py-0.5">
              <Zap className="w-2.5 h-2.5 text-primary" />
              <span className="text-[11px] font-medium text-primary">{ch.channel}</span>
              {ch.description && <span className="text-[11px] text-muted-foreground">· {ch.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}