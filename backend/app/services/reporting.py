import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.config import settings

logger = logging.getLogger("geointelligence.reporting")

def generate_pdf_report(
    analysis_id: str,
    analysis_data: Dict[str, Any],
    earlier_img_path: Optional[str] = None,
    later_img_path: Optional[str] = None,
    heatmap_path: Optional[str] = None
) -> str:
    """
    Generates a scientific PDF technical research report using ReportLab.
    Includes metadata, geospatial area quantification, land-cover transitions, and research disclaimers.
    """
    output_filename = f"GeoIntelligence_Report_{analysis_id[:8]}.pdf"
    output_path = settings.REPORTS_DIR / output_filename

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom scientific dark / blue styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0B0F19")
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4B5563")
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1E40AF"),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1F2937")
    )
    bold_body = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    story = []

    # Header Title
    story.append(Paragraph("GEOINTELLIGENCE AI", title_style))
    story.append(Paragraph("Satellite Image Intelligence & Earth Surface Change Detection Platform", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=14))

    # 1. Executive Summary Table
    story.append(Paragraph("1. ANALYSIS SPECIFICATIONS", section_heading))
    meta_table_data = [
        [Paragraph("Analysis ID", bold_body), Paragraph(analysis_id, body_style),
         Paragraph("Execution Date", bold_body), Paragraph(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"), body_style)],
        [Paragraph("AI Model Architecture", bold_body), Paragraph(str(analysis_data.get("model_architecture", "Siamese U-Net")), body_style),
         Paragraph("Detection Threshold", bold_body), Paragraph(str(analysis_data.get("threshold", 0.5)), body_style)],
        [Paragraph("Earlier Acquisition", bold_body), Paragraph(str(analysis_data.get("earlier_date", "T1 Reference")), body_style),
         Paragraph("Later Acquisition", bold_body), Paragraph(str(analysis_data.get("later_date", "T2 Comparison")), body_style)],
        [Paragraph("Target CRS", bold_body), Paragraph(str(analysis_data.get("crs", "EPSG:4326")), body_style),
         Paragraph("Area Measurement CRS", bold_body), Paragraph("EPSG:6933 (Equal-Area Metric)", body_style)]
    ]
    t1 = Table(meta_table_data, colWidths=[130, 135, 130, 135])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # 2. Visual Comparison Thumbnails
    images_row = []
    if earlier_img_path and Path(earlier_img_path).exists():
        try:
            images_row.append([Paragraph("Earlier Image (T1)", bold_body), Image(earlier_img_path, width=160, height=120)])
        except Exception:
            pass
    if later_img_path and Path(later_img_path).exists():
        try:
            images_row.append([Paragraph("Later Image (T2)", bold_body), Image(later_img_path, width=160, height=120)])
        except Exception:
            pass
    if heatmap_path and Path(heatmap_path).exists():
        try:
            images_row.append([Paragraph("Change Heatmap", bold_body), Image(heatmap_path, width=160, height=120)])
        except Exception:
            pass

    if len(images_row) >= 2:
        story.append(Paragraph("2. EARTH OBSERVATION SCENE VISUALIZATION", section_heading))
        headers = [item[0] for item in images_row]
        img_cells = [item[1] for item in images_row]
        img_table = Table([headers, img_cells], colWidths=[530 / len(images_row)] * len(images_row))
        img_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ]))
        story.append(img_table)
        story.append(Spacer(1, 12))

    # 3. Geospatial Area Quantification
    story.append(Paragraph("3. GEOSPATIAL AREA QUANTIFICATION", section_heading))
    results = analysis_data.get("results", {})
    area_table_data = [
        [Paragraph("Metric", bold_body), Paragraph("Measured Quantity", bold_body), Paragraph("Scientific Unit", bold_body)],
        [Paragraph("Total Affected Area", body_style), Paragraph(str(results.get("total_changed_ha", 0.0)), body_style), Paragraph("Hectares (ha)", body_style)],
        [Paragraph("Total Affected Area", body_style), Paragraph(str(results.get("total_changed_sq_km", 0.0)), body_style), Paragraph("Square Kilometers (km²)", body_style)],
        [Paragraph("Total Affected Area", body_style), Paragraph(str(results.get("total_changed_sq_m", 0.0)), body_style), Paragraph("Square Meters (m²)", body_style)],
        [Paragraph("Relative Scene Change", body_style), Paragraph(str(results.get("change_percentage", 0.0)) + " %", body_style), Paragraph("Percentage of Scene Extent", body_style)],
        [Paragraph("Delineated Change Polygons", body_style), Paragraph(str(results.get("polygon_count", 0)), body_style), Paragraph("Discrete Spatial Contours", body_style)],
    ]
    t2 = Table(area_table_data, colWidths=[180, 170, 180])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2563EB")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)
    story.append(Spacer(1, 12))

    # 4. Land-Cover Transition Classification Breakdown
    story.append(Paragraph("4. SPECTRAL LAND-COVER TRANSITION BREAKDOWN", section_heading))
    breakdown = results.get("class_breakdown_ha", {})
    breakdown_data = [
        [Paragraph("Classification Category", bold_body), Paragraph("Affected Area (Hectares)", bold_body), Paragraph("Share of Change (%)", bold_body)]
    ]
    total_ha = results.get("total_changed_ha", 1.0) or 1.0
    for cat, ha_val in breakdown.items():
        share = round((ha_val / total_ha) * 100.0, 1) if total_ha > 0 else 0.0
        breakdown_data.append([Paragraph(cat, body_style), Paragraph(str(ha_val) + " ha", body_style), Paragraph(str(share) + " %", body_style)])

    t3 = Table(breakdown_data, colWidths=[230, 150, 150])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t3)
    story.append(Spacer(1, 14))

    # 5. Scientific Limitations & Conclusion
    story.append(Paragraph("5. RESEARCH LIMITATIONS & METHODOLOGICAL NOTES", section_heading))
    limitations_text = (
        "<b>Scientific Integrity Notice:</b> Changes identified in this analysis are based on remote sensing reflectance "
        "differencing and neural semantic segmentation. True surface alteration may be influenced by atmospheric variations, "
        "seasonal agricultural rhythms, soil moisture fluctuations, and sub-pixel registration variances. Delineated boundaries "
        "must be cross-referenced with high-resolution aerial imagery or ground-truth in-situ surveys prior to regulatory deployment."
    )
    story.append(Paragraph(limitations_text, body_style))

    doc.build(story)
    logger.info(f"Report generated successfully: {output_path}")
    return str(output_path)
