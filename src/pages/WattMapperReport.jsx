import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Download, Loader2, Settings2 } from 'lucide-react';
import moment from 'moment';
import WattMapperReportHeader from '../components/report/WattMapperReportHeader';
import WattMapperDownloadDialog from '../components/report/WattMapperDownloadDialog';
import {
  ReportSummaryStats,
  ReportLocationSection,
  ReportElectricalTree,
  ReportDeviceRegistry,
  ReportAssetDetails,
  ReportTBCSection,
  SectionTitle,
  InfoBox,
} from '../components/report/WattMapperReportSections';

export default function WattMapperReport() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [exportFilter, setExportFilter] = useState(null);

  useEffect(() => { loadAll(); }, [auditId]);

  const loadAll = async () => {
    const [audits, zones, assets] = await Promise.all([
      base44.entities.Audit.filter({ id: auditId }),
      base44.entities.Zone.filter({ audit_id: auditId }),
      base44.entities.ElectricalAsset.filter({ audit_id: auditId }),
    ]);
    setData({ audit: audits[0] || {}, zones, assets });
    setLoading(false);
  };

  const exportPDF = async (config) => {
    setExporting(true);
    setExportFilter(config?.sections || null);
    await new Promise(r => setTimeout(r, 500));

    const el = reportRef.current;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const borderInset = 8;
    const headerH = 12;
    const footerH = 12;
    const marginX = borderInset + 2;
    const contentTop = borderInset + headerH + 3;
    const contentBottom = pdfH - borderInset - footerH - 3;
    const contentW = pdfW - marginX * 2;
    const contentH = contentBottom - contentTop;
    const pxToMm = contentW / el.clientWidth;
    const pageHpx = contentH / pxToMm;

    // Insert spacers to prevent page splits mid-card
    const spacers = [];
    const breakTargets = el.querySelectorAll('.card-block, .obs-block, .photo-evidence, .field-row, tr');
    const elRect = el.getBoundingClientRect();
    breakTargets.forEach(card => {
      const cardTop = card.getBoundingClientRect().top - elRect.top + el.scrollTop;
      const cardH = card.offsetHeight;
      const cardBottom = cardTop + cardH;
      const pageAtStart = Math.floor(cardTop / pageHpx);
      const pageAtEnd = Math.floor((cardBottom - 1) / pageHpx);
      if (pageAtStart !== pageAtEnd && cardH < pageHpx * 0.85) {
        const remaining = pageHpx - (cardTop % pageHpx);
        const spacer = document.createElement('div');
        spacer.style.height = `${remaining + 4}px`;
        spacer.dataset.pdfSpacer = '1';
        card.parentNode.insertBefore(spacer, card);
        spacers.push(spacer);
      }
    });

    await new Promise(r => setTimeout(r, 300));

    const prevBg = el.style.background;
    el.style.background = '#f7f8f8';
    el.style.colorScheme = 'light';

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f7f8f8',
      logging: false,
      onclone: (doc) => {
        doc.documentElement.setAttribute('data-theme', 'light');
        doc.documentElement.classList.remove('dark');
        doc.documentElement.style.colorScheme = 'light';
      },
    });

    el.style.background = prevBg;
    el.style.colorScheme = '';
    spacers.forEach(s => s.remove());

    const siteName = data?.audit?.site_name || 'WattMapper';
    const auditDate = data?.audit?.audit_date
      ? new Date(data.audit.audit_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';

    const totalImgH = (canvas.height * contentW) / canvas.width;
    const totalPages = Math.ceil(totalImgH / contentH);

    const drawBorder = () => {
      pdf.setDrawColor(14, 34, 64);
      pdf.setLineWidth(0.6);
      pdf.rect(borderInset, borderInset, pdfW - borderInset * 2, pdfH - borderInset * 2);
    };

    const drawHeader = () => {
      pdf.setFillColor(14, 34, 64);
      pdf.rect(borderInset, borderInset, pdfW - borderInset * 2, headerH, 'F');
      pdf.setTextColor(34, 211, 238);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WATTMAPPER', marginX, borderInset + 7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${siteName} — Installation Report`, pdfW / 2, borderInset + 7.5, { align: 'center' });
      pdf.setTextColor(34, 211, 238);
      pdf.text(auditDate, pdfW - marginX, borderInset + 7.5, { align: 'right' });
    };

    const drawFooter = (pageNum) => {
      const footerY = pdfH - borderInset - footerH;
      pdf.setDrawColor(200, 215, 230);
      pdf.setLineWidth(0.3);
      pdf.line(marginX, footerY + 2, pdfW - marginX, footerY + 2);
      pdf.setTextColor(90, 110, 150);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('WattMapper — Confidential Installation Report', marginX, footerY + 8);
      pdf.text(`Page ${pageNum} of ${totalPages}`, pdfW - marginX, footerY + 8, { align: 'right' });
    };

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const srcYPx = (p * contentH * canvas.width) / contentW;
      const srcHPx = Math.min((contentH * canvas.width) / contentW, canvas.height - srcYPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.ceil(srcHPx);
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, -Math.floor(srcYPx));
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 1.0);
      const sliceH = (sliceCanvas.height * contentW) / canvas.width;
      pdf.addImage(sliceData, 'JPEG', marginX, contentTop, contentW, sliceH);
      drawBorder();
      drawHeader();
      drawFooter(p + 1);
    }

    pdf.save(`${siteName.replace(/\s+/g, '-')}-WattMapper-Report.pdf`);
    setExportFilter(null);
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { audit, zones, assets } = data;
  const sections = exportFilter || new Set(['summary', 'location', 'electrical', 'devices', 'details', 'tbc']);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .wmreport-body, .wmreport-body * { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif !important; }
        .wmreport-body { background: #f7f8f8; }
        .wmreport-content { padding: 1.8cm; }
        .wmreport-body p, .wmreport-body td, .wmreport-body li { font-size: 10pt; color: #333333; line-height: 1.5; }
        .wmreport-body table { width: 100%; table-layout: fixed; border-collapse: collapse; }
        .wmreport-body td, .wmreport-body th { word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; white-space: normal; padding: 6px 8px; font-size: 9pt; }
        .wmreport-body th { font-size: 9pt; font-weight: 700; }
        .wmreport-body img { max-width: 100%; border: 1px solid #DDDDDD; border-radius: 6px; }
        .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        .keep-with-next { page-break-after: avoid; break-after: avoid; }
        .wmreport-body .card-block { page-break-inside: avoid; break-inside: avoid; }
        .wmreport-body .photo-evidence { page-break-inside: avoid; break-inside: avoid; }
        .wmreport-body .field-row { page-break-inside: avoid; break-inside: avoid; }
        .wmreport-body tr { page-break-inside: avoid; break-inside: avoid; }
        .wmreport-content { padding-bottom: 3cm; }
        @media print {
          .no-print { display: none !important; }
          nav, header, aside { display: none !important; }
          body { background: white !important; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 1.8cm; size: A4; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/audit/${auditId}/report`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Report
        </button>
        <button
          onClick={() => setShowDialog(true)}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background: '#0E2240' }}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
          {exporting ? 'Generating PDF...' : 'Download / Export'}
        </button>
      </div>

      {/* Report Document */}
      <div
        data-pdf-root
        ref={reportRef}
        className="wmreport-body rounded-2xl overflow-hidden shadow-xl"
        style={{ background: '#f7f8f8', colorScheme: 'light', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <WattMapperReportHeader audit={audit} />

        <div className="wmreport-content space-y-12" style={{ background: '#f7f8f8' }}>

          {/* Executive Summary */}
          <section className="avoid-break">
            <SectionTitle number="Installation Summary" plain />
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '10pt', color: '#2c4a6a', lineHeight: 1.6 }}>
                This report details the Wattwatcher device installation audit conducted at{' '}
                <strong>{audit.site_name}</strong>, located at <strong>{audit.site_address}</strong>.
                The inspection was completed on {moment(audit.audit_date).format('DD MMMM YYYY')} by {audit.inspector_name}.
                The report includes a full asset register by location, the electrical hierarchy of all recorded switchboards
                and distribution boards, a registry of all Wattwatcher devices installed, and detailed data sheets for each asset.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <InfoBox label="Audit Date" value={moment(audit.audit_date).format('DD MMMM YYYY')} />
                <InfoBox label="Technician" value={audit.inspector_name} />
                <InfoBox label="Status" value={audit.status} />
              </div>
            </div>
          </section>

          {sections.has('summary') && <ReportSummaryStats zones={zones} assets={assets} />}
          {sections.has('location') && <ReportLocationSection zones={zones} assets={assets} />}
          {sections.has('electrical') && <ReportElectricalTree assets={assets} />}
          {sections.has('devices') && <ReportDeviceRegistry assets={assets} zones={zones} />}
          {sections.has('details') && <ReportAssetDetails assets={assets} zones={zones} />}
          {sections.has('tbc') && <ReportTBCSection assets={assets} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 40px', textAlign: 'center', fontSize: '9pt', background: '#0E2240', color: '#93C5FD' }}>
          WattMapper Installation Report &nbsp;|&nbsp; {audit.site_name} &nbsp;|&nbsp; {moment().format('MMMM YYYY')} &nbsp;|&nbsp; Confidential
        </div>
      </div>

      <WattMapperDownloadDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        assets={assets}
        zones={zones}
        onExport={exportPDF}
      />
    </>
  );
}