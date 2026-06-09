from pathlib import Path


def read_pdf(file_path):
    try:
        import pypdf
    except ImportError as error:
        raise SystemExit(
            "缺少 pypdf 套件，請執行："
            "python3 -m pip install -r competition/requirements.txt"
        ) from error

    reader = pypdf.PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


if __name__ == "__main__":
    pdf_path = Path(__file__).with_name("Competition (zh_TW).pdf")
    content = read_pdf(pdf_path)
    print(content)
