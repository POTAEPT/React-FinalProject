"use client";

import { useEffect, useRef, useState } from "react";

// Mounts its children only once the placeholder is near the viewport. Use it
// for heavy or below-the-fold client UI (live panels, long lists); until then
// the fallback keeps the space, so the page does not jump.
export function LazySection({ children, fallback = null, rootMargin = "200px" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;

    if (visible || !node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return visible ? children : <div ref={ref}>{fallback}</div>;
}
