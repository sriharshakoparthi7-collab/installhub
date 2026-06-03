import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, ChevronRight, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export default function AuditCard({ audit, onDelete }) {
  const isCompleted = audit.status === 'Completed';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  return (
    <>
      <Link to={`/audit/${audit.id}`} className="block group">
        <div className="bg-card rounded-xl border border-border p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {audit.client_name ? `${audit.client_name} — ${audit.site_name}` : audit.site_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{audit.site_address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isCompleted ? 'default' : 'secondary'}
                className={isCompleted ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/10' : ''}
              >
                {audit.status || 'Draft'}
              </Badge>
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {audit.inspector_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {moment(audit.audit_date).format('MMM D, YYYY')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Link>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Installation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{audit.client_name ? `${audit.client_name} — ${audit.site_name}` : audit.site_name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(audit.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}