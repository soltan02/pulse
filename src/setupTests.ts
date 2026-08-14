import '@testing-library/jest-dom/vitest'

const g = globalThis as unknown as Record<string, unknown>;
if (typeof g.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  g.ResizeObserver = ResizeObserverMock;
}
