#!/usr/bin/env python3
"""Build a narrated, captioned product walkthrough from the real VeilConsent UI."""

from __future__ import annotations

import asyncio
import hashlib
import math
import os
import re
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
NARRATOR = "en-US-AndrewMultilingualNeural"
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    shutil.which("google-chrome"),
    shutil.which("chromium"),
]
SCENES = [
    (
        "intro", "/?demo=initial", "Private consent for AI",
        "Authorize one exact use of shared data without exposing the consent record.",
        "VeilConsent is a private consent gate for AI. It lets a team authorize one exact use of shared data, while keeping identities, individual decisions, and the consent threshold off the public ledger.",
    ),
    (
        "purpose", "/?demo=initial", "Define one exact use",
        "Task, model, recipients, retention, policy, and expiry are bound together.",
        "The organizer starts with a document and defines the task, model, recipients, retention period, policy, and expiry. The browser encrypts the document before creating a commitment, so plaintext never becomes public chain data.",
    ),
    (
        "participant", "/participant.html?demo=review", "Independent review",
        "Each participant checks the purpose and returns an encrypted response.",
        "Each participant works from a separate portal. They create a one-time credential, inspect the exact purpose, and approve or decline. Their response is encrypted to the organizer and bound to this request.",
    ),
    (
        "created", "/?demo=created", "Commit before proof",
        "Plaintext is cleared; only a binding commitment enters the lifecycle.",
        "When the request is created, VeilConsent clears the visible plaintext and commits the document, purpose, policy, credentials, and expiry. Changing any of these values breaks the proof.",
    ),
    (
        "issued", "/?demo=issued", "Prove the policy",
        "A two-of-three rule passes without revealing votes or the threshold.",
        "The Compact contract checks the private responses. Here, two of three approvals satisfy the hidden policy. It issues a purpose-bound capability without revealing who approved or which threshold was used.",
    ),
    (
        "consumed", "/?demo=consumed", "Consume once",
        "Authorization is consumed before decryption, and replay is blocked.",
        "Processing happens only after the capability is consumed. The gateway then decrypts the document and calls the configured adapter. A second attempt fails because the contract state permanently blocks replay.",
    ),
    (
        "preprod", "/?demo=evidence", "Verified on Preprod",
        "Create, issue, and consume are finalized and independently verifiable.",
        "This is not a mocked contract flow. The same compiled contract is deployed on Midnight Preprod, where create, issue, and consume were finalized. The public state and transaction hashes can be verified independently.",
    ),
    (
        "complete", "/?demo=consumed", "Ready for review",
        "A live privacy product with tests, CI, verifiable evidence, and clear limits.",
        "VeilConsent turns consent into a machine-verifiable prerequisite for sensitive AI work. This Level Four MVP includes independent participants, clear failure states, automated tests, continuous delivery, and a live Preprod deployment.",
    ),
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


async def narrate(text: str, target: Path) -> None:
    """Render one scene with a warm conversational neural voice."""
    try:
        import edge_tts
    except ImportError as error:
        raise SystemExit("Install demo dependencies with `python3 -m pip install -r requirements-demo.txt`") from error
    await edge_tts.Communicate(text, NARRATOR, rate="+8%", volume="+0%", pitch="+0Hz").save(target)


def media_duration(ffmpeg: str, source: Path) -> float:
    probe = subprocess.run([ffmpeg, "-i", str(source)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", probe.stderr)
    if not match:
        raise RuntimeError(f"Could not determine duration of {source}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


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
        slides = [compose(i, capture(chrome, key, route), title, body) for i, (key, route, title, body, _) in enumerate(SCENES)]
    finally:
        server.terminate()
        server.wait(timeout=5)

    ffmpeg = find_ffmpeg()

    audio_files = []
    for index, (*_, narration) in enumerate(SCENES):
        audio = OUT / f"narration-{index + 1:02d}.mp3"
        stamp = OUT / f"narration-{index + 1:02d}.sha256"
        fingerprint = hashlib.sha256(f"{NARRATOR}|+8%|{narration}".encode()).hexdigest()
        if not audio.exists() or not stamp.exists() or stamp.read_text().strip() != fingerprint:
            asyncio.run(narrate(narration, audio))
            stamp.write_text(f"{fingerprint}\n")
        audio_files.append(audio)

    segments = []
    for index, (slide, audio) in enumerate(zip(slides, audio_files, strict=True)):
        duration = math.ceil(media_duration(ffmpeg, audio) + 0.5)
        segment = OUT / f"segment-{index + 1:02d}.mp4"
        subprocess.run(
            [
                ffmpeg, "-y", "-loop", "1", "-i", str(slide), "-i", str(audio),
                "-t", str(duration), "-vf", "fps=30,format=yuv420p",
                "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-b:a", "160k",
                "-af", "apad,loudnorm=I=-16:TP=-1.5:LRA=11",
                "-movflags", "+faststart", str(segment),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        segments.append(segment)

    concat = OUT / "segments.txt"
    concat.write_text("".join(f"file '{segment.name}'\n" for segment in segments))
    assembled = OUT / "veil-consent-assembled.mp4"
    subprocess.run(
        [
            ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
            "-c", "copy",
            "-movflags", "+faststart", str(assembled),
        ],
        cwd=OUT,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    video = OUT / "veil-consent-mvp.mp4"
    subprocess.run(
        [
            ffmpeg, "-y", "-i", str(assembled), "-c:v", "copy",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
            "-movflags", "+faststart", str(video),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    shutil.copy2(video, ROOT / "frontend" / video.name)
    print(video)


if __name__ == "__main__":
    main()
