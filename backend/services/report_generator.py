import io
from datetime import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(data: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#065f46'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=15,
        fontName='Helvetica'
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#047857'),
        spaceBefore=12,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1f2937'),
        leading=14,
        fontName='Helvetica'
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        leftIndent=15,
        leading=14,
        fontName='Helvetica'
    )

    story = []
    
    # Header Title
    story.append(Paragraph("🌿 CropSense AI — Crop Health & Disease Diagnostic Report", title_style))
    story.append(Paragraph(f"Generated on: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')} | Field: {data.get('field_name', 'Main Plot')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#10b981'), spaceAfter=15))

    # Summary Table
    severity_val = str(data.get('severity', 'Moderate'))
    severity_color = colors.HexColor('#ef4444') if severity_val == 'Severe' else (colors.HexColor('#f59e0b') if severity_val == 'Moderate' else colors.HexColor('#10b981'))

    table_data = [
        [
            Paragraph("<b>Diagnosed Condition:</b>", body_style),
            Paragraph(f"<b>{data.get('disease_name', 'N/A')}</b>", body_style)
        ],
        [
            Paragraph("<b>Detection Confidence:</b>", body_style),
            Paragraph(f"{data.get('confidence', 0)}%", body_style)
        ],
        [
            Paragraph("<b>Health Pre-check:</b>", body_style),
            Paragraph(f"{data.get('pre_check', 'Unknown')}", body_style)
        ],
        [
            Paragraph("<b>Severity Rating:</b>", body_style),
            Paragraph(f"<font color='{severity_color.hexval()}'><b>{severity_val}</b></font>", body_style)
        ],
        [
            Paragraph("<b>Estimated Yield Impact:</b>", body_style),
            Paragraph(f"-{data.get('yield_impact', 0)}% potential loss", body_style)
        ],
        [
            Paragraph("<b>Est. Financial Risk:</b>", body_style),
            Paragraph(f"${data.get('estimated_financial_loss', 0):,.2f} USD", body_style)
        ]
    ]

    summary_table = Table(table_data, colWidths=[160, 370])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # Cause & Biological Context
    story.append(Paragraph("Biological Assessment & Pathogen Profile", section_heading))
    story.append(Paragraph(data.get('cause', 'Active foliage condition identified on leaf surface.'), body_style))
    story.append(Spacer(1, 10))

    # Actionable Treatment Roadmap
    story.append(Paragraph("Recommended Treatment & Remediation Steps", section_heading))
    treatments = data.get('treatment', [])
    if isinstance(treatments, list) and len(treatments) > 0:
        for idx, step in enumerate(treatments, 1):
            story.append(Paragraph(f"<b>Step {idx}:</b> {step}", bullet_style))
            story.append(Spacer(1, 4))
    else:
        story.append(Paragraph("Consult regional agricultural extension officer for custom spraying schedule.", bullet_style))
    
    story.append(Spacer(1, 10))

    # Long-term Prevention Protocol
    story.append(Paragraph("Preventative & Crop Management Protocol", section_heading))
    story.append(Paragraph(data.get('prevention', 'Ensure regular crop rotation, sanitary equipment practices, and soil drainage.'), body_style))
    story.append(Spacer(1, 20))

    # Footer Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#d1d5db'), spaceAfter=8))
    story.append(Paragraph(
        "<i>Notice: This automated report is generated by CropSense AI based on deep neural network leaf vision analysis. Always verify chemical fungicide/pesticide labels and local regulations before field application.</i>",
        ParagraphStyle('Footer', parent=styles['Italic'], fontSize=8, textColor=colors.HexColor('#9ca3af'), leading=10)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
