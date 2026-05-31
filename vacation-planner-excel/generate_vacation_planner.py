from __future__ import annotations

import html
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "vacation-planner-excel" / "roczny-plan-urlopow-2026-planopia.xlsx",
    ROOT / "planopia-next-landing" / "public" / "downloads" / "roczny-plan-urlopow-2026-planopia.xlsx",
]

SHEETS = [
    ("Instrukcja", "instrukcja.xml"),
    ("Pracownicy", "pracownicy.xml"),
    ("Wnioski_urlopowe", "wnioski.xml"),
    ("Plan_roczny", "plan.xml"),
    ("Podsumowanie", "podsumowanie.xml"),
]

EMPLOYEES = [
    ("Anna Kowalska", "Sprzedaz", "Specjalista", 26),
    ("Piotr Nowak", "Produkcja", "Brygadzista", 26),
    ("Marta Zielinska", "Administracja", "Office manager", 20),
    ("Tomasz Wisniewski", "Serwis", "Technik", 26),
    ("Katarzyna Wojcik", "Marketing", "Specjalista", 20),
    ("Michal Kaminski", "IT", "Administrator", 26),
]

REQUESTS = [
    ("Anna Kowalska", "Sprzedaz", "2026-01-12", "2026-01-16", "Wypoczynkowy", "Zatwierdzony", "Ferie"),
    ("Piotr Nowak", "Produkcja", "2026-02-02", "2026-02-06", "Wypoczynkowy", "Planowany", ""),
    ("Marta Zielinska", "Administracja", "2026-05-04", "2026-05-08", "Wypoczynkowy", "Zatwierdzony", "Majowka"),
    ("Tomasz Wisniewski", "Serwis", "2026-07-13", "2026-07-24", "Wypoczynkowy", "Planowany", "Urlop letni"),
    ("Katarzyna Wojcik", "Marketing", "2026-08-03", "2026-08-14", "Wypoczynkowy", "Planowany", "Urlop letni"),
    ("Michal Kaminski", "IT", "2026-12-21", "2026-12-31", "Wypoczynkowy", "Planowany", "Koniec roku"),
]

MONTHS = [
    ("Styczen", "01"),
    ("Luty", "02"),
    ("Marzec", "03"),
    ("Kwiecien", "04"),
    ("Maj", "05"),
    ("Czerwiec", "06"),
    ("Lipiec", "07"),
    ("Sierpien", "08"),
    ("Wrzesien", "09"),
    ("Pazdziernik", "10"),
    ("Listopad", "11"),
    ("Grudzien", "12"),
]


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def col_name(index: int) -> str:
    name = ""
    while index:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def inline_cell(ref: str, value: object, style: int | None = None) -> str:
    style_attr = f' s="{style}"' if style is not None else ""
    return f'<c r="{ref}" t="inlineStr"{style_attr}><is><t>{esc(value)}</t></is></c>'


def number_cell(ref: str, value: object, style: int | None = None) -> str:
    style_attr = f' s="{style}"' if style is not None else ""
    return f'<c r="{ref}"{style_attr}><v>{value}</v></c>'


def formula_cell(ref: str, formula: str, style: int | None = None) -> str:
    style_attr = f' s="{style}"' if style is not None else ""
    return f'<c r="{ref}"{style_attr}><f>{esc(formula)}</f></c>'


def row_xml(row_number: int, cells: list[str], height: int | None = None) -> str:
    height_attr = f' ht="{height}" customHeight="1"' if height else ""
    return f'<row r="{row_number}"{height_attr}>{"".join(cells)}</row>'


def merge_xml(ranges: list[str]) -> str:
    if not ranges:
        return ""
    items = "".join(f'<mergeCell ref="{ref}"/>' for ref in ranges)
    return f'<mergeCells count="{len(ranges)}">{items}</mergeCells>'


def sheet_xml(
    rows: list[str],
    dimension: str,
    cols: str,
    merges: list[str] | None = None,
    freeze: str | None = None,
    validations: str = "",
    conditional: str = "",
) -> str:
    views = (
        f'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
        if freeze == "row1"
        else '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="{dimension}"/>
{views}
<sheetFormatPr defaultRowHeight="18"/>
{cols}
<sheetData>
{''.join(rows)}
</sheetData>
{merge_xml(merges or [])}
{validations}
{conditional}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
</worksheet>'''


def build_instruction() -> str:
    rows = [
        row_xml(1, [inline_cell("A1", "Roczny plan urlopow 2026 - szablon Planopia", 1)], 30),
        row_xml(3, [inline_cell("A3", "Jak korzystac z pliku", 2)]),
    ]
    steps = [
        "1. W arkuszu Pracownicy wpisz zespol i limit dni urlopu.",
        "2. W arkuszu Wnioski_urlopowe dopisuj planowane lub zatwierdzone terminy.",
        "3. Dni robocze licza sie automatycznie funkcja NETWORKDAYS.",
        "4. Plan_roczny pokazuje miesiace, w ktorych dana osoba ma urlop.",
        "5. Podsumowanie pokazuje wykorzystanie limitu i miesiace z najwiekszym oblozeniem.",
        "Wskazowka: po uzupelnieniu danych mozesz zapisac arkusz jako PDF i udostepnic zespolowi.",
    ]
    for i, text in enumerate(steps, start=4):
        rows.append(row_xml(i, [inline_cell(f"A{i}", text, 8)]))

    rows.append(row_xml(12, [inline_cell("A12", "Co edytowac?", 2)]))
    editable = [
        ("Pracownicy", "imie i nazwisko, zespol, stanowisko, roczny limit dni"),
        ("Wnioski_urlopowe", "pracownik, data od, data do, typ, status, notatka"),
        ("Plan_roczny / Podsumowanie", "te arkusze korzystaja z formul - zwykle nie trzeba ich edytowac"),
    ]
    for idx, (sheet, desc) in enumerate(editable, start=13):
        rows.append(row_xml(idx, [inline_cell(f"A{idx}", sheet, 3), inline_cell(f"B{idx}", desc, 8)]))

    cols = '<cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="2" width="88" customWidth="1"/></cols>'
    return sheet_xml(rows, "A1:B15", cols, ["A1:B1"])


def build_employees() -> str:
    rows = [row_xml(1, [inline_cell(f"{col_name(i)}1", h, 3) for i, h in enumerate(["Pracownik", "Zespol", "Stanowisko", "Limit dni", "Wykorzystane", "Pozostalo"], start=1)])]
    for r, employee in enumerate(EMPLOYEES, start=2):
        name, team, role, limit = employee
        rows.append(
            row_xml(
                r,
                [
                    inline_cell(f"A{r}", name, 8),
                    inline_cell(f"B{r}", team, 8),
                    inline_cell(f"C{r}", role, 8),
                    number_cell(f"D{r}", limit, 5),
                    formula_cell(f"E{r}", f'SUMIFS(Wnioski_urlopowe!$G$2:$G$101,Wnioski_urlopowe!$A$2:$A$101,A{r},Wnioski_urlopowe!$F$2:$F$101,"Zatwierdzony")+SUMIFS(Wnioski_urlopowe!$G$2:$G$101,Wnioski_urlopowe!$A$2:$A$101,A{r},Wnioski_urlopowe!$F$2:$F$101,"Planowany")', 5),
                    formula_cell(f"F{r}", f'D{r}-E{r}', 5),
                ],
            )
        )
    for r in range(8, 22):
        rows.append(
            row_xml(
                r,
                [
                    inline_cell(f"A{r}", "", 8),
                    inline_cell(f"B{r}", "", 8),
                    inline_cell(f"C{r}", "", 8),
                    inline_cell(f"D{r}", "", 8),
                    formula_cell(f"E{r}", f'IF(A{r}="","",SUMIFS(Wnioski_urlopowe!$G$2:$G$101,Wnioski_urlopowe!$A$2:$A$101,A{r}))', 5),
                    formula_cell(f"F{r}", f'IF(A{r}="","",D{r}-E{r})', 5),
                ],
            )
        )
    cols = '<cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="3" width="18" customWidth="1"/><col min="4" max="6" width="13" customWidth="1"/></cols>'
    conditional = '<conditionalFormatting sqref="F2:F21"><cfRule type="cellIs" priority="1" operator="lessThan" dxfId="0"><formula>0</formula></cfRule></conditionalFormatting>'
    return sheet_xml(rows, "A1:F21", cols, freeze="row1", conditional=conditional)


def build_requests() -> str:
    headers = ["Pracownik", "Zespol", "Data od", "Data do", "Typ", "Status", "Dni robocze", "Notatka"]
    rows = [row_xml(1, [inline_cell(f"{col_name(i)}1", h, 3) for i, h in enumerate(headers, start=1)])]
    for r, request in enumerate(REQUESTS, start=2):
        name, team, start, end, leave_type, status, note = request
        rows.append(
            row_xml(
                r,
                [
                    inline_cell(f"A{r}", name, 8),
                    inline_cell(f"B{r}", team, 8),
                    number_cell(f"C{r}", f'{{date:{start}}}', 4),
                    number_cell(f"D{r}", f'{{date:{end}}}', 4),
                    inline_cell(f"E{r}", leave_type, 8),
                    inline_cell(f"F{r}", status, 8),
                    formula_cell(f"G{r}", f'IF(OR(C{r}="",D{r}=""),"",NETWORKDAYS(C{r},D{r}))', 5),
                    inline_cell(f"H{r}", note, 8),
                ],
            )
        )
    for r in range(8, 102):
        rows.append(
            row_xml(
                r,
                [
                    inline_cell(f"A{r}", "", 8),
                    inline_cell(f"B{r}", "", 8),
                    inline_cell(f"C{r}", "", 4),
                    inline_cell(f"D{r}", "", 4),
                    inline_cell(f"E{r}", "", 8),
                    inline_cell(f"F{r}", "", 8),
                    formula_cell(f"G{r}", f'IF(OR(C{r}="",D{r}=""),"",NETWORKDAYS(C{r},D{r}))', 5),
                    inline_cell(f"H{r}", "", 8),
                ],
            )
        )
    cols = '<cols><col min="1" max="2" width="20" customWidth="1"/><col min="3" max="4" width="13" customWidth="1"/><col min="5" max="6" width="16" customWidth="1"/><col min="7" max="7" width="12" customWidth="1"/><col min="8" max="8" width="28" customWidth="1"/></cols>'
    validations = '''<dataValidations count="3">
<dataValidation type="list" allowBlank="1" sqref="A2:A101"><formula1>Pracownicy!$A$2:$A$21</formula1></dataValidation>
<dataValidation type="list" allowBlank="1" sqref="E2:E101"><formula1>"Wypoczynkowy,Na zadanie,Opieka,Bezplatny,Inny"</formula1></dataValidation>
<dataValidation type="list" allowBlank="1" sqref="F2:F101"><formula1>"Planowany,Zatwierdzony,Odrzucony,Anulowany"</formula1></dataValidation>
</dataValidations>'''
    return sheet_xml(rows, "A1:H101", cols, freeze="row1", validations=validations)


def build_plan() -> str:
    headers = ["Pracownik", "Zespol", "Limit", "Wykorzystane", "Pozostalo"] + [m[0] for m in MONTHS]
    rows = [row_xml(1, [inline_cell(f"{col_name(i)}1", h, 3) for i, h in enumerate(headers, start=1)])]
    for r in range(2, 22):
        employee_row = r
        cells = [
            formula_cell(f"A{r}", f'Pracownicy!A{employee_row}', 8),
            formula_cell(f"B{r}", f'Pracownicy!B{employee_row}', 8),
            formula_cell(f"C{r}", f'Pracownicy!D{employee_row}', 5),
            formula_cell(f"D{r}", f'Pracownicy!E{employee_row}', 5),
            formula_cell(f"E{r}", f'Pracownicy!F{employee_row}', 5),
        ]
        for c, (_, month) in enumerate(MONTHS, start=6):
            col = col_name(c)
            month_number = int(month)
            formula = f'IF($A{r}="","",COUNTIFS(Wnioski_urlopowe!$A$2:$A$101,$A{r},Wnioski_urlopowe!$C$2:$C$101,"<="&EOMONTH(DATE(2026,{month_number},1),0),Wnioski_urlopowe!$D$2:$D$101,">="&DATE(2026,{month_number},1)))'
            cells.append(formula_cell(f"{col}{r}", formula, 5))
        rows.append(row_xml(r, cells))
    cols = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/><col min="3" max="17" width="12" customWidth="1"/></cols>'
    conditional = '<conditionalFormatting sqref="F2:Q21"><cfRule type="cellIs" priority="2" operator="greaterThan" dxfId="1"><formula>0</formula></cfRule></conditionalFormatting>'
    return sheet_xml(rows, "A1:Q21", cols, freeze="row1", conditional=conditional)


def build_summary() -> str:
    rows = [
        row_xml(1, [inline_cell("A1", "Podsumowanie planu urlopow 2026", 1)], 30),
        row_xml(3, [inline_cell("A3", "Liczba pracownikow", 2), formula_cell("B3", 'COUNTA(Pracownicy!A2:A21)', 6)]),
        row_xml(4, [inline_cell("A4", "Laczny limit dni", 2), formula_cell("B4", "SUM(Pracownicy!D2:D21)", 6)]),
        row_xml(5, [inline_cell("A5", "Dni zaplanowane / zatwierdzone", 2), formula_cell("B5", "SUM(Pracownicy!E2:E21)", 6)]),
        row_xml(6, [inline_cell("A6", "Pozostale dni", 2), formula_cell("B6", "SUM(Pracownicy!F2:F21)", 6)]),
        row_xml(8, [inline_cell("A8", "Miesiac", 3), inline_cell("B8", "Liczba wpisow urlopowych", 3)]),
    ]
    for idx, (month_name, _) in enumerate(MONTHS, start=9):
        plan_col = col_name(idx - 3)
        rows.append(row_xml(idx, [inline_cell(f"A{idx}", month_name, 8), formula_cell(f"B{idx}", f"SUM(Plan_roczny!{plan_col}2:{plan_col}21)", 5)]))
    rows.append(row_xml(23, [inline_cell("A23", "Najbardziej obciazony miesiac", 2), formula_cell("B23", "INDEX(A9:A20,MATCH(MAX(B9:B20),B9:B20,0))", 6)]))
    rows.append(row_xml(24, [inline_cell("A24", "Uwaga", 2), inline_cell("B24", "Wysokie oblozenie oznacza, ze w danym miesiacu wiele osob ma wpisany urlop.", 8)]))
    cols = '<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="28" customWidth="1"/></cols>'
    return sheet_xml(rows, "A1:B24", cols, ["A1:B1"])


def excel_date(value: str) -> int:
    from datetime import date

    year, month, day = map(int, value.split("-"))
    return (date(year, month, day) - date(1899, 12, 30)).days


def replace_dates(xml: str) -> str:
    while "{date:" in xml:
        start = xml.index("{date:")
        end = xml.index("}", start)
        date_value = xml[start + 6 : end]
        xml = xml[:start] + str(excel_date(date_value)) + xml[end + 1 :]
    return xml


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>
<fonts count="5">
<font><sz val="11"/><color rgb="FF334155"/><name val="Calibri"/></font>
<font><b/><sz val="18"/><color rgb="FF064E3B"/><name val="Calibri"/></font>
<font><b/><sz val="12"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><sz val="11"/><color rgb="FF64748B"/><name val="Calibri"/></font>
</fonts>
<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEFFDF5"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF059669"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="2">
<dxf><font><color rgb="FF991B1B"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill></dxf>
<dxf><font><color rgb="FF065F46"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill></dxf>
</dxfs>
</styleSheet>'''


def workbook_xml() -> str:
    sheet_entries = []
    for idx, (name, _) in enumerate(SHEETS, start=1):
        sheet_entries.append(f'<sheet name="{name}" sheetId="{idx}" r:id="rId{idx}"/>')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<workbookPr date1904="false"/>
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>{''.join(sheet_entries)}</sheets>
<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/>
</workbook>'''


def workbook_rels_xml() -> str:
    rels = []
    for idx, (_, file_name) in enumerate(SHEETS, start=1):
        rels.append(f'<Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/{file_name}"/>')
    rels.append(f'<Relationship Id="rId{len(SHEETS) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
{''.join(rels)}
</Relationships>'''


def content_types_xml() -> str:
    overrides = [
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    for _, file_name in SHEETS:
        overrides.append(f'<Override PartName="/xl/worksheets/{file_name}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
{''.join(overrides)}
</Types>'''


def root_rels_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''


def props_xml() -> tuple[str, str]:
    core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Roczny plan urlopow 2026 - Planopia</dc:title>
<dc:creator>Planopia</dc:creator>
<cp:lastModifiedBy>Planopia</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-05-31T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-31T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''
    app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>Planopia</Application>
</Properties>'''
    return core, app


def build_workbook(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sheets = {
        "instrukcja.xml": build_instruction(),
        "pracownicy.xml": build_employees(),
        "wnioski.xml": build_requests(),
        "plan.xml": build_plan(),
        "podsumowanie.xml": build_summary(),
    }
    core, app = props_xml()
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml())
        archive.writestr("_rels/.rels", root_rels_xml())
        archive.writestr("docProps/core.xml", core)
        archive.writestr("docProps/app.xml", app)
        archive.writestr("xl/workbook.xml", workbook_xml())
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml())
        archive.writestr("xl/styles.xml", styles_xml())
        for file_name, xml in sheets.items():
            archive.writestr(f"xl/worksheets/{file_name}", replace_dates(xml))


def main() -> None:
    for output in OUTPUTS:
        build_workbook(output)
        print(f"Generated: {output}")


if __name__ == "__main__":
    main()
