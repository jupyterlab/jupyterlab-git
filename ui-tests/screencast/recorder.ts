import { Locator, Page } from '@playwright/test';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

/**
 * Draw a mouse cursor following the pointer events, and a subtle ripple on click.
 *
 * Headless browsers do not render the cursor, so it has to be part of the page
 * to show up in the recording.
 */
export async function installCursor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement('style');
      style.textContent = `
        .screencast-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 22px;
          height: 22px;
          z-index: 2147483647;
          pointer-events: none;
          transform-origin: 3px 2px;
          transition: scale 80ms ease-out;
          filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 35%));
        }
        .screencast-cursor.pressed {
          scale: 0.88;
        }
        .screencast-ripple {
          position: fixed;
          width: 28px;
          height: 28px;
          margin: -14px 0 0 -14px;
          border-radius: 50%;
          z-index: 2147483646;
          pointer-events: none;
          /* Neutral colors, to be visible on light and highlighted items */
          background: rgb(128 128 128 / 20%);
          border: 1.5px solid rgb(96 96 96 / 50%);
          animation: screencast-ripple 450ms ease-out forwards;
        }
        @keyframes screencast-ripple {
          from { scale: 0.3; opacity: 1; }
          to { scale: 1; opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      const cursor = document.createElement('div');
      cursor.className = 'screencast-cursor';
      cursor.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2 L3 18.5 L7.2 14.6 L10 20.6 L12.9 19.3 L10.2 13.4 L16 13.4 Z"
          fill="#1a1a1a" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>`;
      cursor.style.display = 'none';
      document.body.appendChild(cursor);

      const move = (event: MouseEvent) => {
        cursor.style.display = 'block';
        cursor.style.translate = `${event.clientX - 3}px ${
          event.clientY - 2
        }px`;
      };
      window.addEventListener('mousemove', move, true);
      window.addEventListener(
        'mousedown',
        event => {
          move(event);
          cursor.classList.add('pressed');
          const ripple = document.createElement('div');
          ripple.className = 'screencast-ripple';
          ripple.style.left = `${event.clientX}px`;
          ripple.style.top = `${event.clientY}px`;
          ripple.addEventListener('animationend', () => ripple.remove());
          document.body.appendChild(ripple);
        },
        true
      );
      window.addEventListener(
        'mouseup',
        () => cursor.classList.remove('pressed'),
        true
      );
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install);
    } else {
      install();
    }
  });
}

const FPS = 30;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Move the mouse like a human would: along a slight curve, accelerating then
 * slowing down, instead of jumping from one point to the next.
 */
export class Pointer {
  constructor(
    protected page: Page,
    protected position = { x: 0, y: 0 }
  ) {}

  async moveTo(
    target: Locator,
    options: { offset?: { x: number; y: number } } = {}
  ): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) {
      throw new Error(`${target} is not visible`);
    }
    const end = options.offset
      ? { x: box.x + options.offset.x, y: box.y + options.offset.y }
      : { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    const start = this.position;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    const duration = Math.min(350 + distance * 0.6, 1000);
    // Bend the path a little bit, perpendicular to the straight line
    const bend = Math.min(distance * 0.08, 40);
    const normal =
      distance > 0 ? { x: -dy / distance, y: dx / distance } : { x: 0, y: 0 };

    const t0 = Date.now();
    for (;;) {
      const t = Math.min((Date.now() - t0) / duration, 1);
      const progress = easeInOut(t);
      const arc = Math.sin(Math.PI * progress) * bend;
      await this.page.mouse.move(
        start.x + dx * progress + normal.x * arc,
        start.y + dy * progress + normal.y * arc
      );
      if (t === 1) {
        break;
      }
      await sleep(16);
    }
    this.position = end;
  }

  async click(
    target: Locator,
    options: { offset?: { x: number; y: number } } = {}
  ): Promise<void> {
    await this.moveTo(target, options);
    await sleep(150);
    await target.click({
      delay: 60,
      position: options.offset
    });
  }

  async dblclick(target: Locator): Promise<void> {
    await this.moveTo(target);
    await sleep(150);
    await target.dblclick({ delay: 40 });
  }
}

/**
 * Record a high quality video of a page.
 *
 * The frames are collected from the browser screencast and encoded at the end
 * with ffmpeg in a H.264 MP4 video at constant frame rate.
 */
export class Recorder {
  constructor(
    protected page: Page,
    protected options: { path: string }
  ) {}

  async start(): Promise<void> {
    const viewport = this.page.viewportSize()!;
    const scale = await this.page.evaluate(() => window.devicePixelRatio);
    this.frameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'screencast-'));
    this.frames = [];
    this.writes = [];
    await this.page.screencast.start({
      size: {
        width: Math.round(viewport.width * scale),
        height: Math.round(viewport.height * scale)
      },
      quality: 100,
      onFrame: ({ data, timestamp }) => {
        const file = path.join(
          this.frameDir,
          `frame-${String(this.frames.length).padStart(5, '0')}.jpg`
        );
        this.frames.push({ file, timestamp });
        this.writes.push(fs.promises.writeFile(file, data));
      }
    });
  }

  async stop(): Promise<void> {
    const end = Date.now();
    await this.page.screencast.stop();
    await Promise.all(this.writes);
    if (this.frames.length === 0) {
      throw new Error('No frame recorded');
    }

    // Each frame is displayed until the next one is received
    const lines = ['ffconcat version 1.0'];
    this.frames.forEach(({ file, timestamp }, index) => {
      const next = this.frames[index + 1]?.timestamp ?? end;
      lines.push(`file '${file}'`, `duration ${(next - timestamp) / 1000}`);
    });
    // The duration of the last entry is ignored, so repeat the last frame
    lines.push(`file '${this.frames[this.frames.length - 1].file}'`);
    const list = path.join(this.frameDir, 'frames.txt');
    fs.writeFileSync(list, lines.join('\n'));

    fs.mkdirSync(path.dirname(this.options.path), { recursive: true });
    await promisify(execFile)(
      'ffmpeg',
      // prettier-ignore
      [
        '-y', '-loglevel', 'error',
        '-f', 'concat', '-safe', '0', '-i', list,
        // The JPEG frames use the BT.601 full range colors, convert them to the
        // limited range BT.709 colors expected by the browsers for HD videos
        '-vf', `fps=${FPS},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
        '-movflags', '+faststart',
        this.options.path
      ]
    );
    fs.rmSync(this.frameDir, { recursive: true, force: true });
  }

  protected frameDir = '';
  protected frames: { file: string; timestamp: number }[] = [];
  protected writes: Promise<void>[] = [];
}
