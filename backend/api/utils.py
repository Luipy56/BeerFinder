"""Utilities for the API app."""
import io
from PIL import Image

# Thumbnail target: keep under ~150 KB to avoid large blobs (e.g. 4 MB uploads)
MAX_SIZE = (400, 400)
JPEG_QUALITY = 75
MAX_BYTES = 150 * 1024


def compress_thumbnail(image_data: bytes) -> bytes:
    """
    Compress image for thumbnail storage. Returns JPEG bytes.
    Reduces resolution and quality to limit blob size (e.g. 80–150 KB).
    On failure (invalid image), returns original bytes unchanged.
    """
    try:
        img = Image.open(io.BytesIO(image_data))
    except Exception:
        return image_data

    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    out = buf.getvalue()

    # If still too large, reduce quality further
    quality = JPEG_QUALITY
    while len(out) > MAX_BYTES and quality > 20:
        quality -= 10
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=quality, optimize=True)
        out = buf.getvalue()

    return out
