import "@testing-library/jest-dom";

// Framer Motion and layout code rely on these browser APIs.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "IntersectionObserver", { value: IO });
Object.defineProperty(window, "matchMedia", {
  value: (q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }),
});

// jsdom lacks PointerEvent, which Base UI's checkbox dispatches on click.
if (!("PointerEvent" in window)) {
  Object.defineProperty(window, "PointerEvent", { value: MouseEvent });
}
