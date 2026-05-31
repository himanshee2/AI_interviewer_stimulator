from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

def generate_report(report_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4,
        rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)

    # Color palette
    NAVY    = HexColor('#0F172A')
    BLUE    = HexColor('#2563EB')
    LBLUE   = HexColor('#EFF6FF')
    GREEN   = HexColor('#059669')
    LGREEN  = HexColor('#ECFDF5')
    RED     = HexColor('#DC2626')
    LRED    = HexColor('#FEF2F2')
    ORANGE  = HexColor('#D97706')
    LORANGE = HexColor('#FFFBEB')
    PURPLE  = HexColor('#7C3AED')
    GRAY    = HexColor('#64748B')
    LGRAY   = HexColor('#F8FAFC')
    BORDER  = HexColor('#E2E8F0')
    W       = white

    S = getSampleStyleSheet()

    def ps(name, **kw):
        return ParagraphStyle(name, parent=S['Normal'], **kw)

    normal  = ps('n',  fontSize=10, textColor=HexColor('#374151'), leading=16)
    small   = ps('s',  fontSize=9,  textColor=GRAY, leading=14)
    bold10  = ps('b10',fontSize=10, textColor=NAVY, fontName='Helvetica-Bold', leading=16)
    bold11  = ps('b11',fontSize=11, textColor=NAVY, fontName='Helvetica-Bold', leading=18)
    bold14  = ps('b14',fontSize=14, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=6)
    white10 = ps('w10',fontSize=10, textColor=W, fontName='Helvetica-Bold', alignment=TA_CENTER)
    white11 = ps('w11',fontSize=11, textColor=W, fontName='Helvetica-Bold')
    cblue10 = ps('cb', fontSize=10, textColor=BLUE, fontName='Helvetica-Bold')
    cgray9  = ps('cg', fontSize=9,  textColor=GRAY, fontName='Helvetica-Bold')

    story = []

    # ── HEADER ──────────────────────────────────────────────
    story.append(Table([[Paragraph("AI Interview Performance Report", ps('ht',
        fontSize=22, textColor=W, fontName='Helvetica-Bold', alignment=TA_CENTER))]],
        colWidths=[525], style=[
            ('BACKGROUND',(0,0),(-1,-1),NAVY),
            ('TOPPADDING',(0,0),(-1,-1),22),('BOTTOMPADDING',(0,0),(-1,-1),22)]))

    story.append(Table([[Paragraph(
        f"Generated on {datetime.now().strftime('%d %B %Y')}  |  AI-Powered Interview Analysis",
        ps('hs', fontSize=10, textColor=HexColor('#93C5FD'), alignment=TA_CENTER))]],
        colWidths=[525], style=[
            ('BACKGROUND',(0,0),(-1,-1),BLUE),
            ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))

    story.append(Spacer(1,18))

    # ── CANDIDATE INFO ───────────────────────────────────────
    c = report_data.get('candidate', {})
    info = Table([
        [Paragraph('Candidate', cgray9), Paragraph(c.get('name','N/A'), bold10),
         Paragraph('Role', cgray9),      Paragraph(c.get('role','N/A'), bold10)],
        [Paragraph('Date', cgray9),      Paragraph(datetime.now().strftime('%d %b %Y'), bold10),
         Paragraph('Difficulty', cgray9),Paragraph(c.get('difficulty','Medium'), bold10)],
    ], colWidths=[80,175,80,190])
    info.setStyle([
        ('BACKGROUND',(0,0),(-1,-1),LGRAY),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
        ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),
        ('GRID',(0,0),(-1,-1),0.5,BORDER),
    ])
    story.append(info)
    story.append(Spacer(1,18))

    # ── OVERALL SCORE ────────────────────────────────────────
    sc = report_data.get('scores', {})
    overall = float(sc.get('overall', 0))

    if   overall >= 8: col,bg,grade,emoji = GREEN,  LGREEN,  'Excellent',    '★'
    elif overall >= 6: col,bg,grade,emoji = BLUE,   LBLUE,   'Good',         '✓'
    elif overall >= 4: col,bg,grade,emoji = ORANGE, LORANGE, 'Average',      '~'
    else:              col,bg,grade,emoji = RED,    LRED,    'Needs Work',   '!'

    story.append(Paragraph("Overall Score", bold14))
    story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))

    bars = []
    for label, val, c2 in [
        ('Technical',     sc.get('technical', 0),     BLUE),
        ('Communication', sc.get('communication', 0), GREEN),
        ('Confidence',    sc.get('confidence', 0),    PURPLE),
        ('Voice',         sc.get('voice', 0),         ORANGE),
    ]:
        val = float(val)
        w_fill = max(int((val/10)*160), 2)
        bar_fill = Table([['']], colWidths=[w_fill],
            style=[('BACKGROUND',(0,0),(-1,-1),c2),
                   ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)])
        bars.append([
            Paragraph(label, ps(f'bl{label}', fontSize=10, textColor=NAVY, fontName='Helvetica-Bold')),
            bar_fill,
            Paragraph(f'{val}/10', ps(f'bv{label}', fontSize=10, textColor=c2, fontName='Helvetica-Bold')),
        ])

    bars_table = Table(bars, colWidths=[105,165,65])
    bars_table.setStyle([
        ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ])

    score_left = Table([
        [Paragraph(f'{overall:.1f}', ps('sn', fontSize=48, textColor=col,
            fontName='Helvetica-Bold', alignment=TA_CENTER, leading=54))],
        [Paragraph('out of 10', ps('so', fontSize=9, textColor=GRAY, alignment=TA_CENTER))],
        [Paragraph(f'{emoji}  {grade}', ps('sg', fontSize=12, textColor=col,
            fontName='Helvetica-Bold', alignment=TA_CENTER))],
    ], colWidths=[165])
    score_left.setStyle([
        ('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ])

    score_wrap = Table([[score_left, bars_table]], colWidths=[165,360])
    score_wrap.setStyle([
        ('BACKGROUND',(0,0),(-1,-1),bg),
        ('TOPPADDING',(0,0),(-1,-1),18),('BOTTOMPADDING',(0,0),(-1,-1),18),
        ('LEFTPADDING',(0,0),(-1,-1),14),
        ('LINEAFTER',(0,0),(0,-1),1,BORDER),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),
    ])
    story.append(score_wrap)
    story.append(Spacer(1,18))

    # ── EMOTION ANALYSIS ─────────────────────────────────────
    em = report_data.get('emotion', {})
    if em:
        story.append(Paragraph("Emotion & Confidence Analysis", bold14))
        story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))

        emotions = em.get('emotions', {})
        items = list(emotions.items())
        rows = [[Paragraph('Emotion',white10),Paragraph('Score',white10),
                 Paragraph('Emotion',white10),Paragraph('Score',white10)]]
        for i in range(0, len(items), 2):
            e1n, e1v = items[i][0].capitalize(), f"{float(items[i][1]):.1f}%"
            e2n = items[i+1][0].capitalize() if i+1 < len(items) else ''
            e2v = f"{float(items[i+1][1]):.1f}%" if i+1 < len(items) else ''
            rows.append([
                Paragraph(e1n, normal), Paragraph(e1v, cblue10),
                Paragraph(e2n, normal), Paragraph(e2v, ps('ep',fontSize=10,textColor=PURPLE,fontName='Helvetica-Bold')),
            ])
        et = Table(rows, colWidths=[130,100,130,100])
        et.setStyle([
            ('BACKGROUND',(0,0),(-1,0),NAVY),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[W,LGRAY]),
            ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('LEFTPADDING',(0,0),(-1,-1),12),
            ('GRID',(0,0),(-1,-1),0.5,BORDER),
        ])
        story.append(et)
        story.append(Spacer(1,6))
        dom  = em.get('dominant_emotion','').capitalize()
        conf = em.get('confidence_score', 0)
        story.append(Table([[
            Paragraph(f'Dominant emotion:  <b>{dom}</b>', normal),
            Paragraph(f'Confidence score:  <b>{conf}/10</b>', normal),
        ]], colWidths=[262,263], style=[
            ('BACKGROUND',(0,0),(-1,-1),LBLUE),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
            ('LEFTPADDING',(0,0),(-1,-1),12),('GRID',(0,0),(-1,-1),0.5,BORDER),
        ]))
        story.append(Spacer(1,4))
        story.append(Paragraph(em.get('feedback',''), small))
        story.append(Spacer(1,16))

    # ── VOICE ANALYSIS ───────────────────────────────────────
    vo = report_data.get('voice', {})
    if vo:
        story.append(Paragraph("Voice & Communication Analysis", bold14))
        story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))

        wpm   = vo.get('words_per_minute', 0)
        dur   = vo.get('duration_seconds', 0)
        pau   = vo.get('pause_count', 0)
        vc    = vo.get('confidence_score', 0)

        vrows = [[Paragraph('Metric',white11), Paragraph('Value',white11), Paragraph('Status',white11)]]
        for metric, val, ok, good_msg, bad_msg in [
            ('Speaking Speed', f'{wpm} WPM',    100<=wpm<=160, 'Ideal pace',         'Adjust speed'),
            ('Duration',       f'{dur} sec',    True,           'Recorded',           ''),
            ('Pause Count',    str(pau),         pau<8,          'Natural flow',       'Too many pauses'),
            ('Confidence',     f'{vc}/10',       float(vc)>=6,   'Confident delivery', 'Needs improvement'),
        ]:
            status_col = GREEN if ok else ORANGE
            status_txt = good_msg if ok else bad_msg
            vrows.append([
                Paragraph(metric, normal),
                Paragraph(str(val), bold10),
                Paragraph(status_txt, ps(f'vs{metric}', fontSize=10, textColor=status_col, fontName='Helvetica-Bold')),
            ])
        vt = Table(vrows, colWidths=[180,165,180])
        vt.setStyle([
            ('BACKGROUND',(0,0),(-1,0),NAVY),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[W,LGRAY]),
            ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('LEFTPADDING',(0,0),(-1,-1),12),
            ('GRID',(0,0),(-1,-1),0.5,BORDER),
        ])
        story.append(vt)
        story.append(Spacer(1,4))
        story.append(Paragraph(vo.get('feedback',''), small))
        story.append(Spacer(1,16))

    # ── ANSWER EVALUATION ────────────────────────────────────
    answers = report_data.get('answers', [])
    if answers:
        story.append(Paragraph("Answer Evaluation", bold14))
        story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))

        for i, ans in enumerate(answers, 1):
            ev = ans.get('evaluation', {})
            sc2 = ev.get('scores', {})
            story.append(Paragraph(f'Q{i}.  {ans.get("question","")}',
                ps(f'qq{i}', fontSize=11, textColor=NAVY, fontName='Helvetica-Bold',
                   spaceBefore=6, spaceAfter=4)))

            st = Table([[
                Paragraph(f'Overall  <b>{sc2.get("overall",0)}/10</b>', normal),
                Paragraph(f'Technical  <b>{sc2.get("technical_accuracy",0)}/10</b>', normal),
                Paragraph(f'Communication  <b>{sc2.get("communication",0)}/10</b>', normal),
            ]], colWidths=[175,175,175])
            st.setStyle([
                ('BACKGROUND',(0,0),(-1,-1),LBLUE),
                ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
                ('LEFTPADDING',(0,0),(-1,-1),10),('GRID',(0,0),(-1,-1),0.5,BORDER),
            ])
            story.append(st)

            str_list = ev.get('strengths', [])
            wk_list  = ev.get('weaknesses', [])
            tip      = ev.get('improvement_tip', '')
            if str_list: story.append(Paragraph(f'✅  {chr(32).join(["• "+s for s in str_list])}', small))
            if wk_list:  story.append(Paragraph(f'⚠️  {chr(32).join(["• "+w for w in wk_list])}', small))
            if tip:      story.append(Paragraph(f'💡  Tip: {tip}', small))
            story.append(Spacer(1,8))

    # ── STRENGTHS & WEAKNESSES ───────────────────────────────
    story.append(Paragraph("Overall Strengths & Areas to Improve", bold14))
    story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=8))

    all_s = list(dict.fromkeys(report_data.get('strengths', [])))
    all_w = list(dict.fromkeys(report_data.get('weaknesses', [])))
    s_txt = '\n'.join([f'• {x}' for x in all_s]) or '• Good overall effort'
    w_txt = '\n'.join([f'• {x}' for x in all_w]) or '• Keep practicing regularly'

    sw = Table([
        [Paragraph('✅  Strengths', ps('sh', fontSize=11, textColor=W, fontName='Helvetica-Bold')),
         Paragraph('⚠️  Areas to Improve', ps('wh', fontSize=11, textColor=W, fontName='Helvetica-Bold'))],
        [Paragraph(s_txt, ps('sb', fontSize=10, textColor=HexColor('#065F46'), leading=18)),
         Paragraph(w_txt, ps('wb', fontSize=10, textColor=HexColor('#991B1B'), leading=18))],
    ], colWidths=[262,263])
    sw.setStyle([
        ('BACKGROUND',(0,0),(0,0),GREEN),('BACKGROUND',(1,0),(1,0),RED),
        ('BACKGROUND',(0,1),(0,1),LGREEN),('BACKGROUND',(1,1),(1,1),LRED),
        ('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12),
        ('LEFTPADDING',(0,0),(-1,-1),14),
        ('GRID',(0,0),(-1,-1),0.5,BORDER),('VALIGN',(0,0),(-1,-1),'TOP'),
    ])
    story.append(sw)
    story.append(Spacer(1,20))

    # ── FOOTER ───────────────────────────────────────────────
    story.append(Table([[
        Paragraph('🎯  AI Interview Simulator',
            ps('fl', fontSize=11, textColor=W, fontName='Helvetica-Bold', alignment=TA_LEFT)),
        Paragraph('Good luck with your interviews! 🚀',
            ps('fr', fontSize=10, textColor=HexColor('#93C5FD'), alignment=TA_RIGHT)),
    ]], colWidths=[300,225], style=[
        ('BACKGROUND',(0,0),(-1,-1),NAVY),
        ('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14),
        ('LEFTPADDING',(0,0),(-1,-1),16),('RIGHTPADDING',(0,0),(-1,-1),16),
    ]))

    doc.build(story)
    return output_path