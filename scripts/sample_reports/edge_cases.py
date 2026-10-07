"""
Generators for error-path edge-case documents:
- scanned_no_text.pdf: Pure raster PDF with zero text characters.
- encrypted.pdf: Password-protected PDF (StandardEncryption).
- not_a_pdf.pdf: Plain text file with .pdf extension.
"""

from pathlib import Path
from PIL import Image, ImageDraw
from reportlab.lib.pdfencrypt import StandardEncryption
from reportlab.pdfgen import canvas

def generate_scanned_pdf(output_path: Path) -> Path:
    """Generates an image-only PDF containing no extractable text characters."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (1200, 1600), color=(250, 250, 252))
    draw = ImageDraw.Draw(img)

    # Draw border and geometric medical report shapes
    draw.rectangle([60, 60, 1140, 1540], outline=(200, 210, 220), width=3)
    draw.rectangle([100, 100, 1100, 200], fill=(235, 240, 248), outline=(180, 190, 205), width=2)
    # Simulated raster lines (not text glyphs)
    for y in range(260, 1400, 45):
        draw.line([120, y, 1080, y], fill=(225, 230, 238), width=1)
        draw.rectangle([120, y - 10, 250, y - 2], fill=(210, 215, 225))
        draw.rectangle([350, y - 10, 480, y - 2], fill=(210, 215, 225))

    img.save(str(output_path), "PDF", resolution=150.0)
    return output_path

def generate_encrypted_pdf(output_path: Path, password: str = "secretpass123") -> Path:
    """Generates a standard password-encrypted PDF."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    enc = StandardEncryption(password, canPrint=0, canModify=0)
    c = canvas.Canvas(str(output_path), encrypt=enc)
    c.drawString(100, 750, "Confidential Protected Medical Document")
    c.drawString(100, 720, "This record is password protected under hospital privacy policy.")
    c.drawString(100, 690, "Synthetic sample. Not a real patient.")
    c.save()
    return output_path

def generate_not_a_pdf(output_path: Path) -> Path:
    """Generates a non-PDF text file with .pdf extension."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        "This is a plain text file pretending to be a PDF.\n"
        "It deliberately lacks the %PDF- magic header.\n",
        encoding="utf-8",
    )
    return output_path
