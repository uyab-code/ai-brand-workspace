import base64
import io
import urllib.request

from PIL import Image

from app.config import get_settings

settings = get_settings()

# Image size mapping per content type
CONTENT_TYPE_SIZES = {
    "feed": (1024, 1024),
    "story": (1024, 1792),
    "carousel": (1024, 1024),
}

# Target aspect ratios for server-side crop (Pillow).
# feed & carousel -> 4:5 (≈1080x1350), story -> 9:16 (≈1080x1920).
TARGET_RATIOS = {
    "feed": (4, 5),
    "story": (9, 16),
    "carousel": (4, 5),
}

# Composition guidance appended to the image prompt so the model composes for the
# FINAL frame. This way the server-side crop only trims margins, not the subject.
COMPOSITION_NOTES = {
    "feed": (
        "IMPORTANT - FINAL FRAME 4:5 (1080x1350): Compose the image so the ENTIRE main subject and "
        "all essential content fit fully inside the central 4:5 band (the middle ~80% vertically). "
        "The top and bottom strips MUST contain only background, texture, or empty space - they will "
        "be cropped away, so never put faces, key objects, or text there. Do NOT crop the subject."
    ),
    "carousel": (
        "IMPORTANT - FINAL FRAME 4:5 (1080x1350): Compose the image so the ENTIRE main subject and "
        "all essential content fit fully inside the central 4:5 band (the middle ~80% vertically). "
        "The top and bottom strips MUST contain only background, texture, or empty space - they will "
        "be cropped away, so never put faces, key objects, or text there. Do NOT crop the subject."
    ),
    "story": (
        "IMPORTANT - FINAL FRAME 9:16 (1080x1920): Compose the image so the ENTIRE main subject and "
        "all essential content fit fully inside the central 9:16 column (the middle ~70% horizontally). "
        "The left and right strips MUST contain only background, texture, or empty space - they will "
        "be cropped away, so never put faces, key objects, or text there. Do NOT crop the subject."
    ),
}

CONTENT_TYPE_SPECS = {
    "feed": {
        "format": "Instagram feed post",
        "aspect_ratio": "1:1 square",
        "canvas": "1024x1024",
        "intent": "one polished square social media visual",
    },
    "story": {
        "format": "Instagram story",
        "aspect_ratio": "9:16 vertical",
        "canvas": "1024x1792",
        "intent": "one immersive vertical story visual",
    },
    "carousel": {
        "format": "Instagram carousel slide",
        "aspect_ratio": "1:1 square",
        "canvas": "1024x1024",
        "intent": "one cohesive carousel slide visual",
    },
}

DESIGN_DIRECTOR_SYSTEM_PROMPT = """You are a professional design director for a creative agency. Your job is to REFINE the user's creative brief into a better image generation prompt — NOT to reimagine or reinterpret it.

Structured creative brief:
{structured_prompt}

CRITICAL RULES:
1. Output only the final prompt, no title, no quotes, no explanation.
2. Write in English for better image generation quality.
3. PRESERVE every detail the user specified: subject, pose, composition, colors, style, elements, mood, and layout. Do NOT change, replace, or omit any of them.
4. Only ADD technical image quality terms (lighting, resolution, sharpness) — never add new subjects, objects, or scene elements the user didn't mention.
5. Keep the prompt concise but retain all critical visual rules from the user's input.
6. Do NOT invent details that weren't in the original brief.
"""


class AIService:
    def build_structured_prompt(
        self,
        user_prompt: str,
        brand_context: dict | None = None,
        content_type: str = "feed",
        platform: str = "instagram",
    ) -> str:
        """Build a structured agency-grade prompt brief before AI elaboration.
        Empty optional fields are excluded entirely from the prompt."""
        ctx = brand_context or {}
        spec = self._content_output_spec(content_type, platform)
        slide_text = ctx.get("slide_text") or user_prompt

        sections = []

        # ── Always included (auto from DB) ──────────────────────────────
        sections.append(self._format_section(
            "PROJECT INFORMATION",
            [
                f"Client: {ctx.get('client_name') or 'Not specified'}",
                f"Brief: {ctx.get('brief_name') or 'Not specified'}",
                f"Platform: {platform}",
                f"Content Type: {content_type}",
            ],
        ))
        sections.append(self._format_section(
            "OUTPUT SPECIFICATION",
            [
                f"Format: {spec['format']}",
                f"Aspect Ratio: {spec['aspect_ratio']}",
                f"Canvas: {spec['canvas']}",
                f"Primary Deliverable: {spec['intent']}",
            ],
        ))

        brand_style = ctx.get("style", "")
        has_logo = ctx.get("has_logo", False)
        has_guideline = ctx.get("has_guideline", False)
        if brand_style or has_logo or has_guideline:
            brand_lines = []
            if brand_style:
                brand_lines.append(f"Brand Style: {brand_style}")
            if has_logo:
                brand_lines.append("Logo Available: yes")
            if has_guideline:
                brand_lines.append("Guideline PDF Available: yes")
            sections.append(self._format_section("BRAND GUIDELINE", brand_lines))

        # ── Auto from DB (only if present) ──────────────────────────────
        colors = ctx.get("colors", "")
        if colors:
            sections.append(self._format_section(
                "COLOR PALETTE",
                f"Use these colors naturally and consistently: {colors}",
            ))

        fonts = ctx.get("fonts", "")
        if fonts:
            sections.append(self._format_section(
                "TYPOGRAPHY",
                [
                    f"Brand fonts: {fonts}",
                    "Use clear visual hierarchy, large legible headline space, and minimal small text.",
                ],
            ))

        ref_count = ctx.get("reference_count", 0)
        if ref_count > 0:
            sections.append(self._format_section(
                "REFERENCE IMAGE RULES",
                [
                    f"Reference Images Available: {ref_count}",
                    "Use logo, guideline, and references as style inspiration only. Do not invent unreadable logo text or fake brand marks.",
                ],
            ))

        # ── User form fields — ONLY if not empty ────────────────────────
        for field_name, section_title in [
            ("visual_direction", "VISUAL DIRECTION"),
            ("background_direction", "BACKGROUND DIRECTION"),
            ("talent_specification", "TALENT SPECIFICATION"),
            ("hero_visual_direction", "HERO VISUAL DIRECTION"),
            ("layout_rules", "LAYOUT RULES"),
        ]:
            value = ctx.get(field_name, "")
            if value:
                sections.append(self._format_section(section_title, value))

        # ── Slide-by-slide (auto from DB) ───────────────────────────────
        slide_title = ctx.get("slide_title", "")
        slide_notes = ctx.get("slide_notes", "")
        slide_lines = []
        if slide_title:
            slide_lines.append(f"Slide Title: {slide_title}")
        slide_lines.append(f"Slide Brief: {slide_text}")
        if slide_notes:
            slide_lines.append(f"Notes: {slide_notes}")
        sections.append(self._format_section("SLIDE-BY-SLIDE BRIEF", slide_lines))

        # ── Always included (auto rules) ────────────────────────────────
        sections.append(self._format_section(
            "GLOBAL DESIGN RULES",
            "Premium agency-quality composition, consistent brand identity, polished lighting, clean finish, no clutter.",
        ))
        sections.append(self._format_section(
            "IMAGE GENERATION CONSTRAINTS",
            "No watermarks, no distorted text, no UI screenshots, no extra logos, no messy typography, no low-quality artifacts.",
        ))
        sections.append(self._format_section("USER REQUEST", user_prompt))

        return "\n\n".join(section for section in sections if section)

    def elaborate_prompt(
        self,
        user_prompt: str,
        brand_style: str = "",
        brand_colors: str = "",
        brand_fonts: str = "",
        content_type: str = "feed",
        platform: str = "instagram",
    ) -> str:
        """Design Director: elaborate structured prompt into final image generation prompt (OpenAI)."""
        return self._elaborate_openai_text(user_prompt)

    def _elaborate_openai_text(self, structured_prompt: str) -> str:
        """Elaborate prompt using OpenAI text model."""
        try:
            from openai import OpenAI

            key = settings.OPENAI_API_KEY
            if not key or key == "your-openai-api-key":
                return structured_prompt

            client = OpenAI(api_key=key)
            system = DESIGN_DIRECTOR_SYSTEM_PROMPT.format(structured_prompt=structured_prompt)
            response = client.chat.completions.create(
                model=settings.DESIGN_DIRECTOR_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": structured_prompt},
                ],
                max_completion_tokens=4096,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Design Director] OpenAI error: {e}")
            return structured_prompt

    def generate_image(self, prompt: str, content_type: str = "feed") -> str:
        """Generate a single image via OpenAI. Returns the image URL/data-URL."""
        width, height = CONTENT_TYPE_SIZES.get(content_type, (1024, 1024))

        # Compose for the final frame so the crop trims margins, not the subject.
        note = self._aspect_composition_note(content_type)
        if note:
            prompt = f"{prompt}\n\n{note}"

        return self._generate_openai(prompt, content_type, width, height)

    def _generate_openai(self, prompt: str, content_type: str, width: int, height: int) -> str:
        """Generate image via OpenAI Images API, crop to target ratio if enabled."""
        from openai import OpenAI

        key = settings.OPENAI_API_KEY
        if not key or key == "your-openai-api-key":
            raise ValueError("OPENAI_API_KEY belum di-set di backend/.env")

        model = settings.OPENAI_MODEL
        size = self._openai_size(model, content_type, width, height)
        client = OpenAI(api_key=key)
        response = client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            quality=settings.OPENAI_IMAGE_QUALITY,
            n=1,
        )
        image = response.data[0]
        url = getattr(image, "url", None)
        b64 = getattr(image, "b64_json", None)
        if not settings.IMAGE_CROP_ENABLED:
            if url:
                return url
            if b64:
                return f"data:image/png;base64,{b64}"
        if url:
            return self._crop_to_ratio(None, url, content_type)
        if b64:
            return self._crop_to_ratio(base64.b64decode(b64), None, content_type)
        raise ValueError("OpenAI Images API tidak mengembalikan url maupun b64_json")

    def _fetch_bytes(self, url: str) -> bytes:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.read()

    def _crop_to_ratio(self, image_data: bytes | None, url: str | None, content_type: str) -> str:
        """Crop an image to the target aspect ratio for its content type.

        Returns a PNG data-URL (base64) so the result is stored as a plain
        ``image_url`` string, consistent with the rest of the app.
        """
        if not image_data and url:
            image_data = self._fetch_bytes(url)
        if not image_data:
            return url or ""
        ratio = TARGET_RATIOS.get(content_type)
        if not ratio:
            # No crop needed (e.g. carousel) — keep as data-URL.
            return f"data:image/png;base64,{base64.b64encode(image_data).decode()}"
        with Image.open(io.BytesIO(image_data)) as im:
            w, h = im.size
            target_w, target_h = ratio
            crop_h = int(w * target_h / target_w)
            if crop_h <= h:
                top = (h - crop_h) // 2
                box = (0, top, w, top + crop_h)
            else:
                crop_w = int(h * target_w / target_h)
                left = (w - crop_w) // 2
                box = (left, 0, left + crop_w, h)
            im2 = im.crop(box)
            buf = io.BytesIO()
            im2.save(buf, format="PNG")
            return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

    def _openai_size(self, model: str, content_type: str, width: int, height: int) -> str:
        if model in ("gpt-image-1", "gpt-image-2"):
            if content_type == "story":
                return "1024x1536"
            if content_type in ("feed", "carousel") and settings.IMAGE_CROP_ENABLED:
                return "1024x1536"  # portrait 2:3, crop ke 4:5 di bawah
            return "1024x1024"  # saat crop nonaktif
        return f"{width}x{height}" if width != height else "1024x1024"

    def _aspect_composition_note(self, content_type: str) -> str:
        """Composition guidance so the crop only trims margins, not the subject."""
        if not settings.IMAGE_CROP_ENABLED:
            return ""
        return COMPOSITION_NOTES.get(content_type, "")

    # (aspect_ratio, canvas) of the FINAL frame when crop is enabled.
    ASPECT_OVERRIDES = {
        "feed": ("4:5 portrait", "4:5 (1080x1350)"),
        "story": ("9:16 vertical", "9:16 (1080x1920)"),
        "carousel": ("4:5 portrait", "4:5 (1080x1350)"),
    }

    def _aspect_spec(self, content_type: str) -> tuple[str, str]:
        """(aspect_ratio, canvas) of the FINAL frame when crop is enabled."""
        if settings.IMAGE_CROP_ENABLED and content_type in self.ASPECT_OVERRIDES:
            return self.ASPECT_OVERRIDES[content_type]
        spec = CONTENT_TYPE_SPECS.get(content_type, CONTENT_TYPE_SPECS["feed"])
        return spec["aspect_ratio"], spec["canvas"]

    def _content_output_spec(self, content_type: str, platform: str) -> dict:
        spec = CONTENT_TYPE_SPECS.get(content_type, CONTENT_TYPE_SPECS["feed"]).copy()
        spec["format"] = f"{platform.title()} {spec['format'].split(' ', 1)[-1]}"
        spec["aspect_ratio"], spec["canvas"] = self._aspect_spec(content_type)
        return spec

    def _format_section(self, title: str, value: str | list[str]) -> str:
        """Format a section. Empty value returns empty string (excluded from prompt)."""
        if isinstance(value, list):
            body = "\n".join(line for line in value if line)
        else:
            body = value
        if not body:
            return ""
        return f"[{title}]\n{body}"
