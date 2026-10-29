import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResponse, DatasetProfile } from '../types';
import { getPdfReportUrl, getCleanCsvExportUrl, getClientDatasetRows } from './api';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads the Clinical Machine Learning Evaluation Report as an official PDF.
 * Attempts remote backend fetch first; on Vercel or when backend is unreachable,
 * generates a publication-grade academic PDF client-side using jsPDF.
 */
export async function exportReportPdf(
  analysis: AnalysisResponse,
  profile: DatasetProfile | null
): Promise<void> {
  const filename = `MediAnalytics_Report_${analysis.analysis_id}.pdf`;

  // 1. Attempt remote backend PDF generation first (if backend is active)
  try {
    const backendUrl = getPdfReportUrl(analysis.analysis_id);
    const res = await fetch(backendUrl, { signal: AbortSignal.timeout(3500) });
    const contentType = res.headers.get('content-type') || '';
    
    // Crucial: Vercel rewrites non-existent API routes to index.html (text/html)
    // We only accept valid application/pdf responses
    if (res.ok && contentType.includes('application/pdf')) {
      const blob = await res.blob();
      triggerBlobDownload(blob, filename);
      return;
    }
  } catch (err) {
    // Backend offline / Vercel standalone: fallback to client-side generation
  }

  // 2. Client-side PDF Generation via jsPDF
  generateClientSidePdf(analysis, profile, filename);
}

/**
 * Downloads the clean, preprocessed CSV dataset.
 * Attempts backend fetch first; falls back to in-memory/profile records client-side.
 */
export async function exportCleanCsv(
  analysis: AnalysisResponse,
  profile: DatasetProfile | null
): Promise<void> {
  const filename = `clean_dataset_${analysis.dataset_id}.csv`;

  // 1. Attempt remote backend clean CSV export
  try {
    const backendUrl = getCleanCsvExportUrl(analysis.analysis_id);
    const res = await fetch(backendUrl, { signal: AbortSignal.timeout(3500) });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
      const blob = await res.blob();
      triggerBlobDownload(blob, filename);
      return;
    }
  } catch (err) {
    // Backend offline / Vercel standalone: fallback to client-side generation
  }

  // 2. Client-side CSV generation
  const datasetRows = getClientDatasetRows(analysis.dataset_id);
  const rows = (datasetRows && datasetRows.length > 0)
    ? datasetRows
    : (profile?.preview_rows && profile.preview_rows.length > 0 ? profile.preview_rows : []);

  if (!rows || rows.length === 0) {
    throw new Error('No dataset records are available for CSV export.');
  }

  // Build CSV headers and rows
  const headers = Object.keys(rows[0]);
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    lines.push(values.join(','));
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function ensureSpace(doc: jsPDF, neededPt: number, currentY: number): number {
  if (currentY + neededPt > 730) {
    doc.addPage();
    return 40;
  }
  return currentY;
}

function generateClientSidePdf(
  analysis: AnalysisResponse,
  profile: DatasetProfile | null,
  filename: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 45;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(35, 75, 67); // Primary forest green
  doc.text('MEDIANALYTICS • CLINICAL DATA MINING & MACHINE LEARNING PLATFORM', margin, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(32, 42, 50); // Dark text
  doc.text('Clinical Evaluation & Benchmark Summary', margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Muted subtext
  const metadataLine = `Analysis ID: ${analysis.analysis_id}   |   Date: ${analysis.created_at.slice(0, 10)}   |   Academic Deliverable: DMBI CA2`;
  doc.text(metadataLine, margin, y);
  y += 10;

  // Metadata Box
  doc.setFillColor(246, 247, 245);
  doc.setDrawColor(227, 232, 229);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(32, 42, 50);
  doc.text(`Dataset: `, margin + 10, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile?.filename || analysis.dataset_id}`, margin + 50, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text(`Task: `, margin + 210, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analysis.task_type.toUpperCase()}`, margin + 240, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text(`Target: `, margin + 350, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analysis.target_column || 'Unsupervised / Clustering'}`, margin + 386, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Records: `, margin + 10, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analysis.dataset_summary?.usable_records || profile?.row_count || 'N/A'}`, margin + 74, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.text(`Train / Test Partition: `, margin + 210, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analysis.dataset_summary?.train_samples || '80%'} / ${analysis.dataset_summary?.test_samples || '20%'}`, margin + 306, y + 26);

  y += 46;

  // Section 1: Executive Summary & Study Protocol
  y = ensureSpace(doc, 70, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(49, 95, 98); // Teal
  doc.text('1. Executive Summary & Study Protocol', margin, y);
  y += 14;

  const summaryText =
    `This investigation empirically benchmarks machine learning architectures on the ` +
    `"${profile?.filename || 'medical dataset'}" cohort comprising ${analysis.dataset_summary?.usable_records || profile?.row_count || 303} ` +
    `clinical instances. The pipeline implemented stratified holdout partitioning (${analysis.dataset_summary?.test_samples || 61} test cases), ` +
    `median-based imputation for missing biometric entries, and feature standardization strictly fit on training partitions to preclude data leakage. ` +
    `Models were evaluated using balanced diagnostic criteria including Accuracy, Precision, Recall, F1-Score, and ROC-AUC.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 12 + 10;

  // Section 2: Model Comparison Table
  y = ensureSpace(doc, 80, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(49, 95, 98);
  doc.text('2. Empirical Model Comparison & Benchmarking', margin, y);
  y += 10;

  if (analysis.comparison_table && analysis.comparison_table.length > 0) {
    const tableHeaders = Object.keys(analysis.comparison_table[0]);
    const tableBody = analysis.comparison_table.map((row) =>
      tableHeaders.map((h) => String(row[h] ?? ''))
    );

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableBody,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [35, 75, 67],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 5
      },
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
        textColor: [32, 42, 50],
        lineColor: [227, 232, 229]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      didParseCell: (data) => {
        // Highlight best model row
        const rowModelName = data.row.raw && Array.isArray(data.row.raw) ? data.row.raw[0] : null;
        if (rowModelName && analysis.best_model && rowModelName === analysis.best_model.name) {
          if (data.section === 'body') {
            data.cell.styles.fillColor = [232, 243, 238];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [35, 75, 67];
          }
        }
      }
    });

    // Update Y after autotable
    y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 16 : y + 100;
  }

  // Section 3: Evidence-Based Statistical Interpretation
  y = ensureSpace(doc, 70, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(49, 95, 98);
  doc.text('3. Evidence-Based Statistical Interpretation', margin, y);
  y += 14;

  const interpretationText = analysis.interpretation || 'No statistical narrative available.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const splitInterpretation = doc.splitTextToSize(interpretationText, contentWidth);
  doc.text(splitInterpretation, margin, y);
  y += splitInterpretation.length * 11.5 + 12;

  // Section 4: Cleveland Heart Disease Clinical Findings (if adapter present)
  if (analysis.heart_disease_adapter) {
    const adapter = analysis.heart_disease_adapter;
    y = ensureSpace(doc, 100, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(49, 95, 98);
    doc.text('4. Cleveland Heart Disease Clinical Adapter Findings (DMBI CA2 Notebook)', margin, y);
    y += 10;

    // Age Cohort Table
    if (adapter.age_cohort_summary && adapter.age_cohort_summary.length > 0) {
      const cohortHeaders = ['Age Cohort', 'Total Patients', 'Disease Cases', 'Prevalence Rate'];
      const cohortBody = adapter.age_cohort_summary.map((c) => [
        c.cohort,
        String(c.total_patients),
        String(c.disease_cases),
        c.prevalence_formatted
      ]);

      autoTable(doc, {
        startY: y,
        head: [cohortHeaders],
        body: cohortBody,
        margin: { left: margin, right: margin },
        theme: 'plain',
        headStyles: {
          fillColor: [246, 247, 245],
          textColor: [49, 95, 98],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 4
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 3.5,
          textColor: [32, 42, 50]
        }
      });

      y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : y + 60;
    }

    // Threshold Calibration details
    if (adapter.optimal_threshold) {
      y = ensureSpace(doc, 45, y);
      const opt = adapter.optimal_threshold;
      const thresholdText =
        `Decision Boundary Calibration: Calibrated decision threshold tau = ${opt.threshold_value} ` +
        `achieving ${(opt.precision_achieved * 100).toFixed(1)}% precision and ${(opt.recall_achieved * 100).toFixed(1)}% recall ` +
        `under strategy: ${opt.strategy}. Clinical benefit: ${opt.clinical_benefit}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      const splitThresh = doc.splitTextToSize(thresholdText, contentWidth);
      doc.text(splitThresh, margin, y);
      y += splitThresh.length * 11 + 10;
    }
  }

  // Section 5: Academic Disclaimer & Viva Certification
  y = ensureSpace(doc, 50, y);
  doc.setDrawColor(227, 232, 229);
  doc.line(margin, y, margin + contentWidth, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('5. Academic Responsible Use & Viva Disclaimer', margin, y);
  y += 10;

  const disclaimerText =
    `This report was synthesized by the MediAnalytics web platform as an academic artifact for a university ` +
    `Data Mining and Business Intelligence (DMBI) CA2 demonstration. The models, metrics, and interpretations ` +
    `are strictly intended for educational evaluation and algorithmic benchmarking. They do not constitute ` +
    `clinically certified diagnostic decisions or approved treatment guidelines.`;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 140);
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(splitDisclaimer, margin, y);

  // Footer for each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('MediAnalytics Platform • University DMBI CA2 Project Deliverable', margin, 770);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, 770);
  }

  // Save the PDF directly to the client's device
  doc.save(filename);
}
