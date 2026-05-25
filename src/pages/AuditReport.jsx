import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Layers, GitBranch, AlertTriangle, Zap, CircuitBoard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import moment from 'moment';

function buildLocationTree(zones, assets) {
  return zones.map(zone => ({
    ...zone,
    assets: assets.filter(a => a.zone_id === zone.id),
  }));
}

function buildElectricalTree(assets) {
  // Build a tree: root nodes have no parent or TBC parent
  const roots = assets.filter(a => !a.electrical_parent_id || a.electrical_parent_tbc);
  const childrenOf = (parentId) => assets.filter(a => a.electrical_parent_id === parentId && !a.electrical_parent_tbc);

  function renderNode(asset, depth = 0) {
    const children = childrenOf(asset.id);
    return { asset, children: children.map(c => renderNode(c, depth + 1)), depth };
  }

  return roots.map(r => renderNode(r));
}

function AssetRow({ asset, allAssets }) {
  const parent = allAssets.find(a => a.id === asset.electrical_parent_id);
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
      <CircuitBoard className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{asset.asset_name}</span>
          <Badge variant="outline" className="text-[10px]">{asset.asset_type}</Badge>
          {asset.has_wattwatcher && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              <Zap className="w-2.5 h-2.5 mr-1" />{asset.wattwatcher_device_id || 'WW'}
            </Badge>
          )}
          {asset.electrical_parent_tbc && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />TBC
            </Badge>
          )}
        </div>
        {asset.display_code && <p className="text-xs text-muted-foreground font-mono mt-0.5">{asset.display_code}</p>}
        {asset.location_description && <p className="text-xs text-muted-foreground mt-0.5">{asset.location_description}</p>}
        {asset.meter_present && asset.meter_device_id && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-xs text-muted-foreground">Meter: {asset.meter_device_id} · {asset.meter_classification}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ElectricalTreeNode({ node, allAssets, depth = 0 }) {
  return (
    <div className={depth > 0 ? 'ml-5 pl-3 border-l border-border' : ''}>
      <AssetRow asset={node.asset} allAssets={allAssets} />
      {node.children.map(child => (
        <ElectricalTreeNode key={child.asset.id} node={child} allAssets={allAssets} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AuditReport() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [zones, setZones] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [auditId]);

  const loadData = async () => {
    const [auditData, zonesData, assetsData] = await Promise.all([
      base44.entities.Audit.filter({ id: auditId }),
      base44.entities.Zone.filter({ audit_id: auditId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
    ]);
    if (auditData.length) setAudit(auditData[0]);
    setZones(zonesData);
    setAssets(assetsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tbcAssets = assets.filter(a => a.electrical_parent_tbc);
  const wattwatcherAssets = assets.filter(a => a.has_wattwatcher);
  const locationTree = buildLocationTree(zones, assets);
  const electricalTree = buildElectricalTree(assets);

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
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-5 border border-primary/10">
          <h1 className="text-xl font-bold text-foreground">{audit?.site_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{audit?.site_address}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span>{audit?.inspector_name}</span>
            <span>{moment(audit?.audit_date).format('MMM D, YYYY')}</span>
            <span>{zones.length} zones</span>
            <span>{assets.length} assets</span>
            <span>{wattwatcherAssets.length} Wattwatchers</span>
          </div>
        </div>
      </div>

      {/* TBC Summary */}
      {tbcAssets.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {tbcAssets.length} unresolved electrical connection{tbcAssets.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {tbcAssets.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <CircuitBoard className="w-3.5 h-3.5 flex-shrink-0" />
                <span><strong>{a.asset_name}</strong> ({a.asset_type}) — fed from unknown</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="location">
        <TabsList className="w-full">
          <TabsTrigger value="location" className="flex-1 text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            By Location
          </TabsTrigger>
          <TabsTrigger value="electrical" className="flex-1 text-xs">
            <GitBranch className="w-3.5 h-3.5 mr-1.5" />
            Electrical Tree
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex-1 text-xs">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Devices
          </TabsTrigger>
        </TabsList>

        {/* Location Tree */}
        <TabsContent value="location" className="mt-4 space-y-4">
          {locationTree.map(zone => (
            <div key={zone.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">{zone.zone_name}</h3>
                <span className="text-xs text-muted-foreground">({zone.assets.length} assets)</span>
              </div>
              {zone.assets.length === 0 ? (
                <p className="text-xs text-muted-foreground ml-4 italic">No assets recorded</p>
              ) : (
                <div className="ml-4 space-y-2">
                  {zone.assets.map(asset => (
                    <AssetRow key={asset.id} asset={asset} allAssets={assets} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* Electrical Tree */}
        <TabsContent value="electrical" className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Assets arranged by electrical hierarchy (fed-from relationships). Orphan/TBC nodes appear at root level.</p>
          {electricalTree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assets recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {electricalTree.map(node => (
                <ElectricalTreeNode key={node.asset.id} node={node} allAssets={assets} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wattwatcher Devices */}
        <TabsContent value="devices" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-3">{wattwatcherAssets.length} Wattwatcher device{wattwatcherAssets.length !== 1 ? 's' : ''} installed across the site.</p>
          {wattwatcherAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No Wattwatcher devices recorded.</p>
          ) : (
            wattwatcherAssets.map(asset => {
              const zone = zones.find(z => z.id === asset.zone_id);
              return (
                <div key={asset.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{asset.wattwatcher_device_id || 'Device ID TBC'}</span>
                        {asset.wattwatcher_model && <span className="text-xs text-muted-foreground">· {asset.wattwatcher_model}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Installed on: <strong>{asset.asset_name}</strong> ({asset.asset_type})</p>
                      {zone && <p className="text-xs text-muted-foreground">Zone: {zone.zone_name}</p>}
                      {asset.display_code && <p className="text-xs font-mono text-muted-foreground">{asset.display_code}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 flex-shrink-0">
                      WW
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}