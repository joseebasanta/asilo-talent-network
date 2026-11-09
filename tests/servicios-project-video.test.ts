// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initProjectVideos } from "../src/scripts/servicios-project-video";

const markup = `
<ul>
  <li class="s-project">
    <div class="s-project-media">
      <img class="s-project-image" src="/a.webp" alt="A" />
      <video class="s-project-video" src="/a.mp4" muted loop playsinline preload="none" data-project-video></video>
    </div>
  </li>
  <li class="s-project"><div class="s-project-media"><img class="s-project-image" src="/b.webp" alt="B" /></div></li>
</ul>`;

// matchMedia con respuestas fijas: puede hacer hover con mouse y si pidió menos movimiento.
function stubMedia(canHover: boolean, reduced = false) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion") ? reduced : canHover,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
}

describe("project hover video", () => {
  let card: HTMLElement;
  let video: HTMLVideoElement;
  let play: ReturnType<typeof vi.fn>;
  let pause: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = markup;
    card = document.querySelector<HTMLElement>(".s-project")!;
    video = document.querySelector<HTMLVideoElement>("video")!;
    play = vi.fn(() => Promise.resolve());
    pause = vi.fn();
    Object.assign(video, { play, pause });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("plays on hover and shows the video only once frames are playing", () => {
    stubMedia(true);
    initProjectVideos(document, window);

    card.dispatchEvent(new Event("mouseenter"));
    expect(play).toHaveBeenCalledTimes(1);
    expect(video.preload).toBe("auto");
    expect(video.classList.contains("is-playing")).toBe(false);

    video.dispatchEvent(new Event("playing"));
    expect(video.classList.contains("is-playing")).toBe(true);
  });

  it("pauses, fades out and rewinds after the fade when the mouse leaves", () => {
    stubMedia(true);
    initProjectVideos(document, window);

    card.dispatchEvent(new Event("mouseenter"));
    video.dispatchEvent(new Event("playing"));
    video.currentTime = 5;
    card.dispatchEvent(new Event("mouseleave"));

    expect(pause).toHaveBeenCalledTimes(1);
    expect(video.classList.contains("is-playing")).toBe(false);
    expect(video.currentTime).toBe(5);
    vi.advanceTimersByTime(300);
    expect(video.currentTime).toBe(0);
  });

  it("does not reveal a late 'playing' event after the mouse already left", () => {
    stubMedia(true);
    initProjectVideos(document, window);

    card.dispatchEvent(new Event("mouseenter"));
    card.dispatchEvent(new Event("mouseleave"));
    video.dispatchEvent(new Event("playing"));
    expect(video.classList.contains("is-playing")).toBe(false);
  });

  it("keeps the still image on touch screens and with reduced motion", () => {
    stubMedia(false);
    initProjectVideos(document, window);
    card.dispatchEvent(new Event("mouseenter"));
    expect(play).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    Object.assign(video, { play, pause });
    stubMedia(true, true);
    initProjectVideos(document, window);
    card.dispatchEvent(new Event("mouseenter"));
    expect(play).not.toHaveBeenCalled();
    expect(video.preload).toBe("none");
  });
});
