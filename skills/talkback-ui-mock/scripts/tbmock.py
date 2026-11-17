"""Talkback UI mock helper: rough PNG mocks in the add-on's look (Pillow only).

Run `python3 -I tbmock.py out.png` to draw every call once.
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

SS = 4  # supersampling; drawn at 4x, saved at 2x
C = {  # RGBA 0-255, from build-v1.0/chat_comments/style.py
    "viewport": (40, 42, 46), "surface": (19, 19, 22), "input": (9, 9, 10), "border": (66, 66, 74),
    "text": (224, 224, 230), "strong": (255, 255, 255), "muted": (153, 153, 163), "dim": (120, 120, 126),
    "pill": (0, 0, 0, 184), "ask": (255, 140, 26), "done": (77, 204, 97), "send": (110, 110, 117),
    "user": (41, 102, 224), "agent": (214, 214, 222), "agent_text": (23, 23, 28),
}
PIN, RADIUS, BADGE_R, PAD_X, PAD_Y = 22, 8, 4.2, 12, 10  # px at UI scale 1


def _font(px, bold=False):
    names = (["Inter-Bold.ttf", "Inter-Bold.otf", "DejaVuSans-Bold.ttf"] if bold
             else ["Inter-Regular.ttf", "Inter-Regular.otf", "DejaVuSans.ttf"])
    dirs = ("", "/usr/share/fonts/truetype/dejavu/", "/usr/share/fonts/opentype/inter/", "/Library/Fonts/",
            "/System/Library/Fonts/Supplemental/")
    for n in names:
        for d in dirs:
            try:
                return ImageFont.truetype(d + n, int(px * SS))
            except OSError:
                pass
    return ImageFont.load_default()


class Mock:
    def __init__(self, w, h, bg=C["viewport"], scale=1.5):
        self.w, self.h, self.k = w, h, scale  # k = UI scale (Paul uses about 2.1; 1.5 reads well)
        self.im = Image.new("RGBA", (w * SS, h * SS), (*bg, 255))
        self.d = ImageDraw.Draw(self.im)

    def _p(self, v):
        return int(v * SS)

    def text(self, x, y, s, px=13, color=C["text"], bold=False):
        self.d.text((self._p(x), self._p(y)), s, font=_font(px * self.k / 1.5 * 1.2, bold), fill=color)

    def text_w(self, s, px=13, bold=False):
        return self.d.textlength(s, font=_font(px * self.k / 1.5 * 1.2, bold)) / SS

    def heading(self, x, y, s):
        self.text(x, y, s, 14, C["dim"], True)

    def box(self, x, y, w, h, fill=C["surface"], r=RADIUS, outline=None):
        r = r * self.k
        self.d.rounded_rectangle([self._p(x), self._p(y), self._p(x + w), self._p(y + h)], radius=self._p(r),
                                 fill=fill, outline=outline, width=self._p(1) if outline else 0)

    def pin(self, x, y, state="ready", filled=False, color=C["strong"], alpha=255, grow=1.0):
        """Teardrop speech bubble, (x, y) = top-left. state: ready | ask | done | resolved."""
        s = PIN * self.k * grow
        ring = (*color[:3], alpha)
        fill = ring if filled else (*C["surface"], alpha)
        def drop(x0, y0, x1, y1, col):
            rr = (y1 - y0) / 2
            self.d.ellipse([self._p(x0), self._p(y0), self._p(x1), self._p(y1)], fill=col)
            self.d.rectangle([self._p(x0), self._p(y0 + rr), self._p(x0 + rr), self._p(y1)], fill=col)
        drop(x, y, x + s, y + s, ring)
        i = 1.5 * self.k
        if not filled:
            drop(x + i, y + i, x + s - i, y + s - i, fill)
        if state in ("ask", "done"):
            self.badge(x + s - 2 * self.k, y + 2 * self.k, state)
        return (x, y, x + s, y + s)

    def badge(self, cx, cy, state):
        r = (BADGE_R + 1.2) * self.k
        col = C["ask"] if state == "ask" else C["done"]
        self.d.ellipse([self._p(cx - r), self._p(cy - r), self._p(cx + r), self._p(cy + r)], fill=col,
                       outline=C["viewport"], width=self._p(1.2 * self.k))

    def chip(self, x, y, s, fg=(20, 20, 22), bg=(235, 235, 235)):
        w = self.text_w(s, 11, True) + 10 * self.k
        h = 16 * self.k
        self.d.rounded_rectangle([self._p(x), self._p(y), self._p(x + w), self._p(y + h)], radius=self._p(h / 2), fill=bg)
        self.text(x + 5 * self.k, y + 1.5 * self.k, s, 11, fg, True)

    def stack(self, x, y, n, state="ready"):
        """Pins stacked behind one another with a count chip."""
        for k in (2, 1):
            self.pin(x + 5 * k * self.k, y - 5 * k * self.k, color=(150, 150, 156))
        self.pin(x, y, state)
        s = PIN * self.k
        self.chip(x + s * 0.7, y + s * 0.7, str(n))

    def state_icon(self, x, y, state):
        k = self.k
        if state == "ask":
            self.badge(x + 6 * k, y + 7 * k, "ask")
        elif state == "done":
            self.badge(x + 6 * k, y + 7 * k, "done")
        elif state == "ready":  # paper plane; resolved has no icon
            pts = [(x, y + 6 * k), (x + 13 * k, y), (x + 8 * k, y + 13 * k), (x + 5.5 * k, y + 7.5 * k)]
            self.d.polygon([(self._p(a), self._p(b)) for a, b in pts], fill=C["text"])

    def author_icon(self, x, y, agent=False):
        k = self.k
        if agent:
            cx, cy, a, b = x + 6 * k, y + 8 * k, 7 * k, 1.8 * k  # four-point sparkle
            pts = [(cx, cy - a), (cx + b, cy - b), (cx + a, cy), (cx + b, cy + b),
                   (cx, cy + a), (cx - b, cy + b), (cx - a, cy), (cx - b, cy - b)]
            self.d.polygon([(self._p(px), self._p(py)) for px, py in pts], fill=C["muted"])
        else:
            self.d.ellipse([self._p(x + 3 * k), self._p(y), self._p(x + 9 * k), self._p(y + 6 * k)], fill=C["muted"])
            self.d.pieslice([self._p(x), self._p(y + 7 * k), self._p(x + 12 * k), self._p(y + 17 * k)], 180, 360, fill=C["muted"])

    def hover_card(self, x, y, title, message=None, state="ready", agent=False, w=None):
        """The v1.0 lean hover card: state icon + bold title, then author icon + newest message (muted)."""
        k = self.k
        w = w or max(self.text_w(title, 13, True), self.text_w(message or "", 12)) + 50 * k
        h = (30 if message is None else 52) * k
        self.box(x, y, w, h)
        self.state_icon(x + PAD_X * k, y + 9 * k, state)
        self.text(x + 32 * k, y + 6 * k, title, 13, C["strong"], True)
        if message:
            self.author_icon(x + PAD_X * k, y + 31 * k, agent)
            self.text(x + 32 * k, y + 28 * k, message, 12, C["muted"])
        return (x, y, x + w, y + h)

    def field(self, x, y, w, placeholder="Write a message…", pin_state="ready"):
        """Message field with the pin on its left and the round send button inside."""
        k = self.k
        h = 34 * k
        self.pin(x - PIN * k - 8 * k, y + (h - PIN * k) / 2, pin_state)
        self.box(x, y, w, h, fill=C["input"], outline=(200, 200, 205))
        self.text(x + PAD_X * k, y + 8 * k, placeholder, 12, C["muted"])
        d = 26 * k
        cx, cy = x + w - 5 * k - d / 2, y + h / 2
        self.d.ellipse([self._p(cx - d / 2), self._p(cy - d / 2), self._p(cx + d / 2), self._p(cy + d / 2)], fill=C["send"])
        self.text(cx - 4.5 * k, cy - 9 * k, "↑", 13, C["strong"], True)

    def message(self, x, y, w, s, agent=False):
        """A message bubble of the conversation window (yours blue right, the agent's grey left)."""
        k = self.k
        h = 28 * k
        self.box(x, y, w, h, fill=C["agent"] if agent else C["user"])
        self.author_icon(x + 8 * k, y + 6 * k, agent)
        self.text(x + 28 * k, y + 5 * k, s, 12, C["agent_text"] if agent else C["strong"])

    def line(self, x0, y0, x1, y1, color=(160, 160, 166), width=1):
        self.d.line([self._p(x0), self._p(y0), self._p(x1), self._p(y1)], fill=color, width=self._p(width * self.k))

    def save(self, path):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        self.im.resize((self.w * 2, self.h * 2), Image.LANCZOS).save(path)
        return path


if __name__ == "__main__":  # demo: every call once
    import sys
    m = Mock(900, 340)
    m.heading(20, 14, "A. Pins and stack")
    m.pin(30, 60); m.pin(80, 60, "ask"); m.pin(130, 60, "done"); m.pin(180, 60, filled=True)
    m.stack(250, 70, 8, "ask")
    m.heading(340, 14, "B. Hover card")
    m.hover_card(340, 50, "Door glass darker", "10 or 20 percent darker?", "ask", agent=True)
    m.hover_card(340, 140, "Impeller blade 0", "Please check this part.")
    m.heading(20, 170, "C. Message field")
    m.field(70, 210, 380)
    m.message(600, 230, 280, "Make the glass darker", agent=False)
    m.message(600, 282, 280, "Which one?", agent=True)
    m.chip(600, 200, "Now")
    m.save(sys.argv[1] if len(sys.argv) > 1 else "tbmock-demo.png")
