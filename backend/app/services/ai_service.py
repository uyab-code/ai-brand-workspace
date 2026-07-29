from urllib.parse import quote

from app.config import get_settings

settings = get_settings()

# Image size mapping per content type
CONTENT_TYPE_SIZES = {
    "feed": (1024, 1024),
    "story": (1024, 1792),
    "carousel": (1024, 1024),
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

DESIGN_DIRECTOR_SYSTEM_PROMPT = """You are a professional design director for a creative agency. Transform the structured creative brief below into one high-quality image generation prompt.

Structured creative brief:
{structured_prompt}

Requirements:
1. Output only the final prompt, no title, no quotes, no explanation.
2. Write in English for better image generation quality.
3. Prioritize concrete visual details: subject, composition, lighting, color, style, background, hierarchy.
4. Preserve brand identity, output format, slide intent, and constraints.
5. Avoid asking the image model to render long readable copy; describe space for copy instead.
6. Keep the prompt concise enough for image generators while retaining critical rules.
"""


class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER

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
            ("global_design_rules", "GLOBAL DESIGN RULES"),
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
        """Design Director: elaborate structured prompt into final image generation prompt."""
        text_provider = settings.AI_TEXT_PROVIDER

        if text_provider == "gemini":
            return self._elaborate_gemini(user_prompt)
        elif text_provider == "openai":
            return self._elaborate_openai_text(user_prompt)
        else:
            return user_prompt  # No elaboration

    def _elaborate_gemini(self, structured_prompt: str) -> str:
        """Elaborate prompt using Google Gemini (free tier)."""
        try:
            from google import genai

            api_key = settings.GEMINI_API_KEY
            if not api_key:
                return structured_prompt

            client = genai.Client(api_key=api_key)
            system = DESIGN_DIRECTOR_SYSTEM_PROMPT.format(structured_prompt=structured_prompt)
            response = client.models.generate_content(
                model=settings.DESIGN_DIRECTOR_MODEL,
                contents=system,
            )
            return response.text.strip() if response.text else structured_prompt
        except Exception as e:
            print(f"[Design Director] Gemini error: {e}")
            return structured_prompt

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
                max_tokens=900,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Design Director] OpenAI error: {e}")
            return structured_prompt

    def generate_image(self, prompt: str, content_type: str = "feed") -> str:
        """Generate a single image. Returns the image URL."""
        width, height = CONTENT_TYPE_SIZES.get(content_type, (1024, 1024))

        if self.provider == "pollinations":
            return self._generate_pollinations(prompt, width, height)
        elif self.provider == "openai":
            return self._generate_openai(prompt, content_type, width, height)
        else:
            return self._generate_pollinations(prompt, width, height)

    def _generate_pollinations(self, prompt: str, width: int, height: int) -> str:
        """Generate image via Pollinations.ai (free, no API key)."""
        encoded = quote(prompt)
        return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed=42"

    def _generate_openai(self, prompt: str, content_type: str, width: int, height: int) -> str:
        """Generate image via OpenAI Images API, then fallback to Pollinations on error."""
        try:
            from openai import OpenAI
            key = settings.OPENAI_API_KEY
            if not key or key == "your-openai-api-key":
                return self._generate_pollinations(prompt, width, height)

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
            if getattr(image, "url", None):
                return image.url
            if getattr(image, "b64_json", None):
                return f"data:image/png;base64,{image.b64_json}"
            return self._generate_pollinations(prompt, width, height)
        except Exception as e:
            print(f"[Image Generator] OpenAI error: {e}")
            return self._generate_pollinations(prompt, width, height)

    def _openai_size(self, model: str, content_type: str, width: int, height: int) -> str:
        if model in ("gpt-image-1", "gpt-image-2"):
            if content_type == "story":
                return "1024x1536"
            return "1024x1024"
        return f"{width}x{height}" if width != height else "1024x1024"

    def _content_output_spec(self, content_type: str, platform: str) -> dict:
        spec = CONTENT_TYPE_SPECS.get(content_type, CONTENT_TYPE_SPECS["feed"]).copy()
        spec["format"] = f"{platform.title()} {spec['format'].split(' ', 1)[-1]}"
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
