export type DragGuard = {
  start(x: number, y: number): void;
  move(x: number, y: number): void;
  end(): void;
  /** True when the click that follows belongs to a drag and must be swallowed. */
  consumesClick(detail: number): boolean;
};

/**
 * Track pointer movement so a drag that starts on a link pans the diagram
 * instead of following the link. Keyboard clicks have no pointer movement
 * (detail 0) and always pass through.
 */
export function createDragGuard(threshold: number): DragGuard {
  let origin: { x: number; y: number } | null = null;
  let moved = false;

  return {
    start(x, y) {
      origin = { x, y };
      moved = false;
    },
    move(x, y) {
      if (origin && Math.hypot(x - origin.x, y - origin.y) > threshold) {
        moved = true;
      }
    },
    end() {
      origin = null;
    },
    consumesClick(detail) {
      if (!moved || detail === 0) {
        return false;
      }

      moved = false;
      return true;
    }
  };
}
