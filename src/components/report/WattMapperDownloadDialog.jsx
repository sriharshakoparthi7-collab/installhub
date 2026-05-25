import { useState, useEffect } from 'react';
import { Download, X, ChevronDown, ChevronRight, CheckSquare, Square, Image } from 'lucide-react';
import JSZip from 'jszip';

const SECTIONS = [
  { key: 'summary', label: 'Summary Statistics' },
  { key: 'location', label: 'Asset Register by Location' },
  { key: 'electrical', label: 'Electrical Hierarchy Tree' },
  { key: 'devices', label: 'Wattwatcher Device Registry' },
  { key: 'details', label: 'Full Asset Detail Sheets' },
  { key: 'tbc', label: 'TBC / Unresolved Connections' },
];

function collectPhotos(assets, zones) {
  const photos = [];
  zones.forEach(zone => {
    (zone.photos || []).forEach((url, i) => {
      if (url) photos.push({ url, label: `${zone.zone_name} — Zone Photo ${i + 1}`, id: `zone-${zone.id}-${i}` });
    });
  });
  assets.forEach(asset => {
    if (asset.photo) photos.push({ url: asset.photo, label: `${asset.asset_name} — Asset Photo`, id: `asset-${asset.id}-main` });
    if (asset.wattwatcher_photo) photos.push({ url: asset.wattwatcher_photo, label: `${asset.asset_name} — Wattwatcher Photo`, id: `asset-${asset.id}-ww` });
    (asset.extra_photos || []).forEach((url, i) => {
      if (url) photos.push({ url, label: `${asset.asset_name} — Photo ${i + 1}`, id: `asset-${asset.id}-extra-${i}` });
    });
  });
  return photos;
}

export default function WattMapperDownloadDialog({ open, onClose, assets, zones, onExport }) {
  const [selectedSections, setSelectedSections] = useState(new Set(SECTIONS.map(s => s.key)));
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const allPhotos = collectPhotos(assets || [], zones || []);

  useEffect(() => {
    if (open) {
      setSelectedSections(new Set(SECTIONS.map(s => s.key)));
      setSelectedPhotos(new Set(allPhotos.map(p => p.id)));
    }
  }, [open]);

  if (!open) return null;

  const toggleSection = (key) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleExport = () => {
    onExport({ sections: selectedSections });
    onClose();
  };

  const handleDownloadPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    setDownloadingPhotos(true);
    const zip = new JSZip();
    const folder = zip.folder('InstallHub-Photos');
    const selected = allPhotos.filter(p => selectedPhotos.has(p.id));

    await Promise.all(selected.map(async (photo, i) => {
      try {
        const res = await fetch(photo.url);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const safeName = photo.label.replace(/[^a-z0-9\-_ ]/gi, '_').substring(0, 60);
        folder.file(`${String(i + 1).padStart(3, '0')}-${safeName}.${ext}`, blob);
      } catch (e) {
        // skip failed
      }
    }));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'InstallHub-Photos.zip';
    a.click();
    URL.revokeObjectURL(url);
    setDownloadingPhotos(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '500px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0E2240', margin: 0 }}>Download Report</h2>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>Select sections to include in PDF, or download all photos as a ZIP</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} color="#666" /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 0' }}>
          {/* PDF Section controls */}
          <div style={{ padding: '8px 24px 4px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => setSelectedSections(new Set(SECTIONS.map(s => s.key)))}
                style={{ fontSize: '12px', color: '#0E2240', fontWeight: 600, border: '1px solid #0E2240', borderRadius: '6px', padding: '4px 12px', background: 'none', cursor: 'pointer' }}>
                Select All
              </button>
              <button onClick={() => setSelectedSections(new Set())}
                style={{ fontSize: '12px', color: '#666', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 12px', background: 'none', cursor: 'pointer' }}>
                Clear All
              </button>
              <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto', alignSelf: 'center' }}>
                {selectedSections.size} / {SECTIONS.length} sections
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>PDF Report Sections</p>
          </div>

          {SECTIONS.map(section => {
            const isSelected = selectedSections.has(section.key);
            return (
              <div key={section.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <div onClick={() => toggleSection(section.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 24px', cursor: 'pointer' }}>
                  {isSelected ? <CheckSquare size={18} color="#0E2240" /> : <Square size={18} color="#bbb" />}
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: isSelected ? '#0E2240' : '#999' }}>{section.label}</span>
                </div>
              </div>
            );
          })}

          {/* Photo Download Section */}
          <div style={{ margin: '12px 0 0', borderTop: '2px solid #f0f0f0' }}>
            <div
              onClick={() => setPhotoExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', cursor: 'pointer' }}>
              <Image size={18} color="#0E2240" />
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#0E2240' }}>Download Photos ({allPhotos.length})</span>
              <span style={{ fontSize: '11px', color: '#888', marginRight: '6px' }}>{selectedPhotos.size} selected</span>
              {photoExpanded ? <ChevronDown size={14} color="#888" /> : <ChevronRight size={14} color="#888" />}
            </div>
            {photoExpanded && (
              <div style={{ padding: '6px 24px 12px 50px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={() => setSelectedPhotos(new Set(allPhotos.map(p => p.id)))}
                    style={{ fontSize: '11px', color: '#0E2240', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Select All</button>
                  <button onClick={() => setSelectedPhotos(new Set())}
                    style={{ fontSize: '11px', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
                {allPhotos.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No photos recorded.</p>
                ) : (
                  allPhotos.map(photo => (
                    <div key={photo.id} onClick={() => {
                      setSelectedPhotos(prev => {
                        const next = new Set(prev);
                        next.has(photo.id) ? next.delete(photo.id) : next.add(photo.id);
                        return next;
                      });
                    }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                      {selectedPhotos.has(photo.id) ? <CheckSquare size={14} color="#0E2240" /> : <Square size={14} color="#bbb" />}
                      <span style={{ fontSize: '12px', color: '#444' }}>{photo.label}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>
            Cancel
          </button>
          {allPhotos.length > 0 && (
            <button
              onClick={handleDownloadPhotos}
              disabled={downloadingPhotos || selectedPhotos.size === 0}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #0E2240', background: '#fff', color: '#0E2240', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: selectedPhotos.size === 0 ? 0.5 : 1 }}
            >
              <Download size={14} /> {downloadingPhotos ? 'Zipping...' : 'Download Photos'}
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={selectedSections.size === 0}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: selectedSections.size === 0 ? '#ccc' : '#0E2240', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: selectedSections.size === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}