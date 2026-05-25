import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Zap, Search, ClipboardList } from 'lucide-react';
import PullToRefresh from '../components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuditCard from '../components/AuditCard';

export default function Dashboard() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    const data = await base44.entities.Audit.list('-created_date');
    setAudits(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    const data = await base44.entities.Audit.list('-created_date');
    setAudits(data);
  };

  const handleDelete = async (auditId) => {
    setAudits(prev => prev.filter(a => a.id !== auditId));
    await base44.entities.Audit.delete(auditId);
  };

  const filtered = audits.filter(a =>
    a.site_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.inspector_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">WattMapper</h1>
            <p className="text-xs text-muted-foreground">Wattwatchers Device Installation Logger</p>
          </div>
        </div>
        <Link to="/audit/new">
          <Button className="w-full mt-3 h-12 text-sm font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Start New Site Installation
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search audits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No installations yet</h3>
          <p className="text-sm text-muted-foreground">Start your first site installation to get going</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Installations ({filtered.length})
          </h2>
          {filtered.map(audit => (
            <AuditCard key={audit.id} audit={audit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}