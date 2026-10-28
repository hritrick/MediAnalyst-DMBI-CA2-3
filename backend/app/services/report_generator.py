import io
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.config import settings

logger = logging.getLogger(__name__)

def generate_clean_csv(df: pd.DataFrame, drop_duplicates: bool = True, drop_ids: bool = True) -> io.BytesIO:
    clean_df = df.copy()
    if drop_duplicates:
        clean_df = clean_df.drop_duplicates()
        
    output = io.BytesIO()
    clean_df.to_csv(output, index=False)
    output.seek(0)
    return output

def generate_pdf_report(analysis_dict: Dict[str, Any], meta_dict: Dict[str, Any]) -> Path:
    analysis_id = analysis_dict.get("analysis_id", "report")
    pdf_path = settings.REPORTS_DIR / f"report_{analysis_id}.pdf"
    
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom palette styles
    primary_color = colors.HexColor("#234B43")
    teal_color = colors.HexColor("#315F62")
    slate_color = colors.HexColor("#627D98")
    dark_text = colors.HexColor("#202A32")
    sub_text = colors.HexColor("#6B7280")
    light_bg = colors.HexColor("#F6F7F5")
    border_color = colors.HexColor("#E3E8E5")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=sub_text,
        spaceAfter=14
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=teal_color,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_text,
        spaceAfter=6
    )
    
    disclaimer_style = ParagraphStyle(
        'DisclaimerCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=sub_text,
        spaceBefore=14
    )

    elements = []
    
    # 1. Header Banner
    elements.append(Paragraph("MediAnalytics — Clinical Machine Learning Report", title_style))
    elements.append(Paragraph(
        f"Academic Viva Benchmark Report | Analysis ID: <b>{analysis_id}</b> | Generated: {analysis_dict.get('created_at', '')[:10]}",
        subtitle_style
    ))
    elements.append(Spacer(1, 8))
    
    # 2. Executive Summary
    elements.append(Paragraph("1. Executive Summary & Problem Formulation", h2_style))
    task_type = analysis_dict.get("task_type", "Classification").capitalize()
    target_col = analysis_dict.get("target_column") or "N/A"
    d_summary = analysis_dict.get("dataset_summary", {})
    
    exec_text = (
        f"This report presents an empirical evaluation of machine learning methodologies applied to medical dataset "
        f"<b>{meta_dict.get('filename', 'dataset')}</b>. The analysis formulation is configured as <b>{task_type}</b> "
        f"targeting clinical attribute <b>'{target_col}'</b>. The cohort comprises {d_summary.get('train_samples', 0)} training samples "
        f"and {d_summary.get('test_samples', 0)} independent test samples evaluated across {d_summary.get('engineered_features', 0)} "
        f"standardized predictive variables."
    )
    elements.append(Paragraph(exec_text, body_style))
    
    # 3. Model Comparison Table
    elements.append(Paragraph("2. Model Performance Benchmarking", h2_style))
    comp_table_data = analysis_dict.get("comparison_table", [])
    if comp_table_data:
        headers = list(comp_table_data[0].keys())
        table_rows = [[Paragraph(f"<b>{h}</b>", body_style) for h in headers]]
        for row in comp_table_data:
            table_rows.append([Paragraph(str(row.get(h, "")), body_style) for h in headers])
            
        t = Table(table_rows, colWidths=[120] + [70] * (len(headers) - 1))
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), light_bg),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, primary_color),
            ('LINEBELOW', (0, 1), (-1, -1), 0.5, border_color),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 8))
    
    # 4. Statistical Interpretation
    elements.append(Paragraph("3. Evidence-Based Interpretation", h2_style))
    interpretation = analysis_dict.get("interpretation", "No interpretation generated.")
    elements.append(Paragraph(interpretation, body_style))
    
    # 5. Heart Disease Adapter Results (if available)
    hd_adapter = analysis_dict.get("heart_disease_adapter")
    if hd_adapter:
        elements.append(Paragraph("4. Cleveland Heart Disease Clinical Cohort Analysis", h2_style))
        cohort_rows = hd_adapter.get("age_cohort_summary", [])
        if cohort_rows:
            hd_table_data = [[
                Paragraph("<b>Age Cohort</b>", body_style),
                Paragraph("<b>Total Patients</b>", body_style),
                Paragraph("<b>Disease Cases</b>", body_style),
                Paragraph("<b>Prevalence Rate</b>", body_style)
            ]]
            for c in cohort_rows:
                hd_table_data.append([
                    Paragraph(c.get("cohort", ""), body_style),
                    Paragraph(str(c.get("total_patients", 0)), body_style),
                    Paragraph(str(c.get("disease_cases", 0)), body_style),
                    Paragraph(c.get("prevalence_formatted", ""), body_style)
                ])
            hd_t = Table(hd_table_data, colWidths=[140, 100, 100, 120])
            hd_t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), light_bg),
                ('LINEBELOW', (0, 0), (-1, 0), 1, teal_color),
                ('LINEBELOW', (0, 1), (-1, -1), 0.5, border_color),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(hd_t)
            elements.append(Spacer(1, 6))
            
        opt = hd_adapter.get("optimal_threshold", {})
        if opt:
            elements.append(Paragraph(
                f"<b>Decision Threshold Optimization:</b> Calibrated decision threshold tau = {opt.get('threshold_value')} "
                f"achieving {opt.get('precision_achieved', 0)*100:.1f}% precision and {opt.get('recall_achieved', 0)*100:.1f}% recall "
                f"under strategy: <i>{opt.get('strategy')}</i>.",
                body_style
            ))

    # 6. Ethical & Educational Disclaimer
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        "<b>Academic Disclaimer:</b> This report was generated by MediAnalytics for DMBI academic research and education. "
        "The algorithms, statistical metrics, and classifications are intended solely for academic evaluation and do not "
        "constitute clinical diagnostic decisions or validated medical guidance.",
        disclaimer_style
    ))
    
    doc.build(elements)
    return pdf_path
