// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IN_VIEW_RATIO, initProjectVideos } from "../src/scripts/servicios-project-video";

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

// IntersectionObserver falso: guarda cada observador para disparar "entra/sale de pantalla" a mano.
type FakeEntry = { isIntersecting: boolean; intersectionRatio: number; target: Element };
class FakeObserver {
  static all: FakeObserver[] = [];
  targets: Element[] = [];
  constructor(
    public callback: (entries: FakeEntry[]) => void,
    public options: IntersectionObserverInit = {},
  ) {
    FakeObserver.all.push(this);
  }
  observe(el: Element) {
    this.targets.push(el);
  }
  unobserve(el: Element) {
    this.targets = this.targets.filter((t) => t !== el);
  }
  disconnect() {
    this.targets = [];
  }
}
// Simula que la imagen queda visible en la proporción dada (0 = fuera de pantalla).
function showVideo(ratio: number) {
  for (const o of FakeObserver.all) {
    for (const target of o.targets) o.callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio, target }]);
  }
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
    FakeObserver.all = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("ignores mouse events on touch screens and keeps the still image with reduced motion", () => {
    stubMedia(false);
    initProjectVideos(document, window);
    card.dispatchEvent(new Event("mouseenter"));
    expect(play).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    Object.assign(video, { play, pause });
    FakeObserver.all = [];
    stubMedia(false, true);
    initProjectVideos(document, window);
    showVideo(1);
    expect(play).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    Object.assign(video, { play, pause });
    stubMedia(true, true);
    initProjectVideos(document, window);
    card.dispatchEvent(new Event("mouseenter"));
    expect(play).not.toHaveBeenCalled();
    expect(video.preload).toBe("none");
  });

  it("plays on touch screens once the image is mostly in view, and stops when it leaves", () => {
    stubMedia(false);
    initProjectVideos(document, window);

    showVideo(0.3);
    expect(play).not.toHaveBeenCalled();
    showVideo(IN_VIEW_RATIO);
    expect(play).toHaveBeenCalledTimes(1);
    expect(video.preload).toBe("auto");
    video.dispatchEvent(new Event("playing"));
    expect(video.classList.contains("is-playing")).toBe(true);

    video.currentTime = 4;
    showVideo(0);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(video.classList.contains("is-playing")).toBe(false);
    vi.advanceTimersByTime(300);
    expect(video.currentTime).toBe(0);

    // Al volver a la vista arranca de nuevo.
    showVideo(0.9);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("does not autoplay on scroll when the device has a mouse (hover keeps control)", () => {
    stubMedia(true);
    initProjectVideos(document, window);
    showVideo(1);
    expect(play).not.toHaveBeenCalled();
  });
});
