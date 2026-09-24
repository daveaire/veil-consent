#!/usr/bin/env python3
"""Build a silent, captioned product walkthrough from the real VeilConsent UI."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import textwrap
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "demo-output"
PORT = 4211
SCENE_SECONDS = 5
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    shutil.which("google-chrome"),
    shutil.which("chromium"),
]
SCENES = [
    ("initial", "/", "Private input", "The document and exact AI purpose begin in the organizer's browser."),
    ("participant", "/participant.html?demo=review", "Independent review", "Each participant holds a one-time credential and reviews the exact purpose in a separate portal."),
    ("created", "/?demo=created", "Request committed", "The plaintext is encrypted and cleared. The circuit exposes only a binding commitment."),
    ("issued", "/?demo=issued", "Consent proven", "A 2-of-3 policy passes without revealing identities, decisions, or threshold."),
    ("consumed", "/?demo=consumed", "Processed once", "The gateway decrypts after authorization. Generated contract state blocks replay."),
]


def find_ffmpeg() -> str:
    """Resolve a system encoder or the executable bundled with imageio-ffmpeg."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass

    for python in (
        "/opt/homebrew/bin/python3.10",
        "/opt/homebrew/bin/python3",
        "/usr/local/bin/python3",
    ):
        if not Path(python).exists() or Path(python).resolve() == Path(sys.executable).resolve():
            continue
        probe = subprocess.run(
            [python, "-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
            capture_output=True,
            text=True,
        )
        candidate = probe.stdout.strip()
        if probe.returncode == 0 and Path(candidate).exists():
            return candidate

    raise SystemExit("Install ffmpeg or imageio-ffmpeg to render the video")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf" if not bold else "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def capture(chrome: str, key: str, route: str) -> Path:
    target = OUT / f"capture-{key}.png"
    subprocess.run(
        [
            chrome,
            "--headless=new",
            "--hide-scrollbars",
            "--window-size=1440,1000",
            "--virtual-time-budget=8000",
            f"--screenshot={target}",
            f"http://127.0.0.1:{PORT}{route}",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return target


def compose(index: int, screenshot: Path, title: str, body: str) -> Path:
    canvas = Image.new("RGB", (1920, 1080), "#f5f5f7")
    shot = Image.open(screenshot).convert("RGB")
    shot.thumbnail((1260, 900), Image.Resampling.LANCZOS)
    canvas.paste(shot, (620, 90))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((70, 70, 535, 1010), radius=28, fill="#ffffff", outline="#e2e2e7", width=2)
    draw.rounded_rectangle((110, 112, 178, 180), radius=17, fill="#1d1d1f")
    draw.text((134, 121), "V", font=font(33, True), fill="#ffffff")
    draw.text((200, 124), "VeilConsent", font=font(30, True), fill="#1d1d1f")
    draw.text((110, 275), f"0{index + 1}", font=font(24, True), fill="#0071e3")
    draw.multiline_text((110, 322), title, font=font(58, True), fill="#1d1d1f", spacing=4)
    wrapped = "\n".join(textwrap.wrap(body, width=25))
    draw.multiline_text((110, 475), wrapped, font=font(29), fill="#6e6e73", spacing=12)
    draw.text((110, 905), "MIDNIGHT PREPROD MVP", font=font(17, True), fill="#86868b")
    path = OUT / f"scene-{index + 1:02d}.png"
    canvas.save(path, optimize=True)
    return path


def main() -> None:
    chrome = next((path for path in CHROME_CANDIDATES if path and Path(path).exists()), None)
    if not chrome:
        raise SystemExit("Chrome or Chromium is required to capture the product UI")
    OUT.mkdir(exist_ok=True)
    subprocess.run(["npm", "run", "build:web"], cwd=ROOT, check=True)
    env = {**os.environ, "PORT": str(PORT)}
    server = subprocess.Popen(["node", "src/server.js"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL)
    try:
        time.sleep(1)
        slides = [compose(i, capture(chrome, key, route), title, body) for i, (key, route, title, body) in enumerate(SCENES)]
    finally:
        server.terminate()
        server.wait(timeout=5)

    ffmpeg = find_ffmpeg()

    concat = OUT / "scenes.txt"
    concat.write_text("".join(f"file '{slide.name}'\nduration {SCENE_SECONDS}\n" for slide in slides) + f"file '{slides[-1].name}'\n")
    subprocess.run(
        [
            ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
            "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18",
            "-t", str(len(slides) * SCENE_SECONDS),
            "-movflags", "+faststart", str(OUT / "veil-consent-mvp.mp4"),
        ],
        cwd=OUT,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    video = OUT / "veil-consent-mvp.mp4"
    shutil.copy2(video, ROOT / "frontend" / video.name)
    print(video)


if __name__ == "__main__":
    main()
