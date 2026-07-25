import os
import re
import mimetypes
from typing import BinaryIO, List
from fastapi import UploadFile

# Common image content types
IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/x-ms-bmp",
    "image/tiff"
}

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".bmp", ".tiff", ".tif"
}


def get_clean_mime_type(file: UploadFile) -> str:
    """Extracts a normalized, lowercased MIME type, with fallback to filename extension."""
    raw_content_type = file.content_type or ""
    clean_mime = raw_content_type.split(";")[0].strip().lower()

    if clean_mime in ("", "application/octet-stream") and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in IMAGE_EXTENSIONS:
            guessed, _ = mimetypes.guess_type(file.filename)
            return guessed.lower() if guessed else ("image/jpeg" if ext in (".jpg", ".jpeg") else "image/png")
        elif ext == ".pdf":
            return "application/pdf"

    return clean_mime


def is_valid_pdf(file: BinaryIO) -> bool:
    """Fast, lightweight validation of a PDF file using binary signatures."""
    try:          
        file.seek(0)
        # Check Header: First 4 bytes must be b'%PDF'
        header = file.read(4)
        if header != b"%PDF":
            return False
                
        # Check Footer: Look for b'%%EOF' within the last 1024 bytes
        try:
            file.seek(-1024, os.SEEK_END)
        except OSError:
            # File is smaller than 1024 bytes, scan from the beginning
            file.seek(0)
                
        trailing_bytes = file.read()
        if b"%%EOF" not in trailing_bytes:
            return False
                
        return True
    finally:
        file.seek(0)


def is_valid_image(file: BinaryIO) -> bool:
    """Lightweight validation for common image binary headers."""
    try:
        file.seek(0)
        header = file.read(12)
        
        # Check JPEG (FF D8 FF)
        if header.startswith(b"\xff\xd8\xff"):
            return True
        # Check PNG (89 50 4E 47 0D 0A 1A 0A)
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            return True
        # Check WEBP (RIFF .... WEBP)
        if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
            return True
        # Check GIF (GIF87a / GIF89a)
        if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
            return True
        # Check BMP (BM)
        if header.startswith(b"BM"):
            return True
        # Check TIFF (II*\x00 or MM\x00*)
        if header.startswith(b"II\x2a\x00") or header.startswith(b"MM\x00\x2a"):
            return True
        # Check HEIC/HEIF (ftyp at offset 4)
        if len(header) >= 8 and header[4:8] == b"ftyp":
            return True

        return False
    finally:
        file.seek(0)


def extract_sort_key(filename: str) -> tuple:
    """
    Extracts the leading integer prefix for sorting (e.g. '0_file.png' -> 0).
    Falls back to alphabetical sorting if no leading digit is found.
    """
    basename = os.path.basename(filename)
    match = re.match(r"^(\d+)", basename)
    if match:
        return (0, int(match.group(1)), basename)
    return (1, 0, basename)


def sort_files_by_index(files: List[UploadFile]) -> List[UploadFile]:
    """Sorts UploadFile objects by their filename index."""
    return sorted(files, key=lambda f: extract_sort_key(f.filename or ""))


def validate_file_batch(files: List[UploadFile]) -> str:
    """
    Validates that the upload batch is either a single valid PDF 
    or a collection of valid images.
    
    Returns:
        'pdf' if batch is a valid single PDF
        'images' if batch consists solely of valid images
    
    Raises ValueError if validation fails.
    """
    if not files:
        raise ValueError("No answer files were uploaded.")

    # Scenario 1: Check single file for PDF
    if len(files) == 1:
        first_file = files[0]
        mime_type = get_clean_mime_type(first_file)
        is_pdf_ext = (first_file.filename or "").lower().endswith(".pdf")
        if mime_type == "application/pdf" or is_pdf_ext:
            if not is_valid_pdf(first_file.file):
                raise ValueError("The uploaded file claims to be a PDF, but binary validation failed.")
            first_file.file.seek(0)
            return "pdf"

    # Scenario 2: Check multi-file or single-file image batch
    for file in files:
        mime_type = get_clean_mime_type(file)
        if mime_type not in IMAGE_MIME_TYPES:
            raise ValueError(
                f"Invalid file payload. All files must be images or a single PDF. "
                f"Got unexpected content type: '{mime_type}' for {file.filename}."
            )
        if not is_valid_image(file.file):
            raise ValueError(f"Binary header validation failed for image file: {file.filename}")
        file.file.seek(0)

    return "images"