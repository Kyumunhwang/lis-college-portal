import sys
import json
import re
from pypdf import PdfReader

def parse_transcript_pdf(pdf_path, filename=None):
    if not filename:
        filename = pdf_path.split('\\')[-1].split('/')[-1]

    filename_match = re.match(r'^(\d{4})\s*-\s*([^.]+)\.pdf$', filename, re.IGNORECASE)
    student_code = filename_match.group(1).strip() if filename_match else "0000"
    name_from_file = filename_match.group(2).strip() if filename_match else "Unknown"

    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"

    # 1. Name & Korean Name
    name_en = name_from_file
    name_ko = None
    name_match = re.search(r'Name:\s*([^\n\r]+?)\s*Birth Date:', full_text, re.IGNORECASE)
    if name_match:
        raw_name = name_match.group(1).strip()
        ko_chars = re.findall(r'[\uAC00-\uD7AF]+', raw_name)
        if ko_chars:
            name_ko = " ".join(ko_chars)
            name_en = re.sub(r'[\uAC00-\uD7AF]+', '', raw_name).strip()
            name_en = re.sub(r'\s+', ' ', name_en)
        else:
            name_en = raw_name

    # 2. Birth Date (MM/DD/YYYY -> YYYY-MM-DD)
    birth_date = None
    b_match = re.search(r'Birth Date:\s*(\d{2})/(\d{2})/(\d{4})', full_text, re.IGNORECASE)
    if b_match:
        birth_date = f"{b_match.group(3)}-{b_match.group(1)}-{b_match.group(2)}"

    # 3. Gender
    gender = None
    g_match = re.search(r'Gender:\s*(Female|Male|F|M)', full_text, re.IGNORECASE)
    if g_match:
        gender = 'F' if g_match.group(1).upper().startswith('F') else 'M'

    # 4. Dates
    entry_date = None
    e_match = re.search(r'Entry Date:\s*(\d{2})/(\d{2})/(\d{4})', full_text)
    if e_match:
        entry_date = f"{e_match.group(3)}-{e_match.group(1)}-{e_match.group(2)}"

    withdrawal_date = None
    w_match = re.search(r'Withdrawal Date:\s*(\d{2})/(\d{2})/(\d{4})', full_text)
    if w_match:
        withdrawal_date = f"{w_match.group(3)}-{w_match.group(1)}-{w_match.group(2)}"

    graduation_date = None
    gr_match = re.search(r'Graduation Date:\s*(\d{2})/(\d{2})/(\d{4})', full_text)
    if gr_match:
        graduation_date = f"{gr_match.group(3)}-{gr_match.group(1)}-{gr_match.group(2)}"

    # 5. Parent & Address
    parent_name = None
    p_match = re.search(r'Parent/Guardian:\s*([^\n\r]+?)(?=\s*Address:|\s*City:|$)', full_text)
    if p_match:
        parent_name = p_match.group(1).strip()

    address = None
    addr_match = re.search(r'Address:\s*([^\n\r]+?)\s*City:\s*([^\n\r]+?)\s*State:\s*([^\n\r]+?)', full_text)
    if addr_match:
        address = f"{addr_match.group(1).strip()}, {addr_match.group(2).strip()}, {addr_match.group(3).strip()}"

    # 6. Cumulative Reported GPA & Credits
    reported_cum_gpa = None
    reported_credits = None
    cum_match = re.search(r'Un-Weighted Cumulative GPA:\s*([\d.]+)\s*Cumulative Credits:\s*([\d.]+)', full_text)
    if cum_match:
        reported_cum_gpa = float(cum_match.group(1))
        reported_credits = float(cum_match.group(2))

    # 7. Summary entries: "Grade Level: 9   GPA: 4.00   Credits: 3.500"
    summary_matches = list(re.finditer(r'Grade Level:\s*(\d+)\s+GPA:\s*([\d.]+)\s+Credits:\s*([\d.]+)', full_text))
    term_summaries = []
    for sm in summary_matches:
        term_summaries.append({
            "gradeLevel": int(sm.group(1)),
            "gpa": float(sm.group(2)),
            "credits": float(sm.group(3))
        })

    current_grade_level = term_summaries[-1]["gradeLevel"] if term_summaries else 11

    # 8. Semester Blocks
    sem_regex = r'(Semester\s+[12]\s+\d{4}-\d{4}|(?:Summer|Winter)\s+Semester\s+\d{4})'
    sem_matches = list(re.finditer(sem_regex, full_text, re.IGNORECASE))

    semesters = []
    end_of_semesters = full_text.find('Un-Weighted Cumulative GPA')
    if end_of_semesters == -1:
        end_of_semesters = len(full_text)

    for i, sm in enumerate(sem_matches):
        start_idx = sm.start()
        end_idx = sem_matches[i+1].start() if i + 1 < len(sem_matches) else end_of_semesters
        block = full_text[start_idx:end_idx]
        header = sm.group(1).strip()

        # Parse term name and academic year
        term_name = "Semester 1"
        academic_year = "2023-2024"

        s1 = re.match(r'^(Semester\s+[12])\s+(\d{4}-\d{4})$', header, re.IGNORECASE)
        if s1:
            term_name = s1.group(1).strip()
            academic_year = s1.group(2).strip()
        else:
            s2 = re.match(r'^(Summer|Winter)\s+Semester\s+(\d{4})$', header, re.IGNORECASE)
            if s2:
                term_name = f"{s2.group(1)} Semester"
                year = int(s2.group(2))
                academic_year = f"{year-1}-{year}"

        summary = term_summaries[i] if i < len(term_summaries) else None
        sem_grade_level = summary["gradeLevel"] if summary else current_grade_level
        reported_term_gpa = summary["gpa"] if summary else None

        # Parse course lines
        courses = []
        lines = block.splitlines()
        in_classes = False

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            if 'Class Title' in line_str and 'Credits' in line_str:
                in_classes = True
                continue
            if not in_classes:
                continue
            if line_str.startswith('Semester ') or line_str.startswith('Un-Weighted'):
                break

            # Match: Title Grade Credits
            # e.g. "Honors English I A+ 0.500"
            # e.g. "Physical Education A A+ 0.250"
            # e.g. "Algebra II (Credit Recovery) B+ 0.500"
            cm = re.match(r'^(.+?)\s+([A-D][+-]?|F|Pass|P|NM|N/A|W)\s+([\d.]+)\s*$', line_str, re.IGNORECASE)
            if cm:
                c_title = cm.group(1).strip()
                c_grade = cm.group(2).strip()
                c_credits = float(cm.group(3))
                courses.append({
                    "courseTitle": c_title,
                    "letterGrade": c_grade,
                    "credits": c_credits
                })

        semesters.append({
            "academicYear": academic_year,
            "termName": term_name,
            "gradeLevel": sem_grade_level,
            "reportedTermGpa": reported_term_gpa,
            "courses": courses
        })

    # Status
    status = "ENROLLED"
    if withdrawal_date:
        status = "WITHDRAWAL"
    elif graduation_date:
        status = "GRADUATED"

    return {
        "student": {
            "studentCode": student_code,
            "nameEn": name_en,
            "nameKo": name_ko,
            "gradeLevel": current_grade_level,
            "status": status,
            "birthDate": birth_date,
            "gender": gender,
            "entryDate": entry_date,
            "graduationDate": graduation_date,
            "withdrawalDate": withdrawal_date,
            "parentName": parent_name,
            "address": address,
            "reportedCumGpa": reported_cum_gpa,
            "reportedCredits": reported_credits,
        },
        "semesters": semesters
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        fname = sys.argv[2] if len(sys.argv) > 2 else None
        res = parse_transcript_pdf(path, fname)
        print(json.dumps(res, ensure_ascii=False, indent=2))
