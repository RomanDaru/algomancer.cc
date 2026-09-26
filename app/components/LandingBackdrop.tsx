"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./LandingBackdrop.module.css";

export default function LandingBackdrop({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const layers = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-parallax-depth]"),
      (element) => ({
        element,
        depth: Number(element.dataset.parallaxDepth),
      }),
    );
    let frameId = 0;
    let sceneTop = 0;
    let sceneHeight = 0;
    let viewportHeight = window.innerHeight;
    let lastDistance = -1;

    const render = () => {
      frameId = 0;
      const pageScroll = window.scrollY;
      const scroll = pageScroll - sceneTop;
      if (scroll > sceneHeight || scroll < -viewportHeight) return;

      // Match the shared 120px image overscan. The distant sky travels more
      // slowly through the viewport; the foreground travels with the page.
      const distance = reducedMotion.matches
        ? 0
        : Math.min(Math.max(pageScroll, 0), 600);
      if (distance === lastDistance) return;
      lastDistance = distance;

      // Transform only the composited layers, not inherited CSS variables.
      // No layout reads, React renders, easing loop or timers while scrolling.
      for (const { element, depth } of layers) {
        element.style.transform = `translate3d(0, ${(distance * depth).toFixed(2)}px, 0)`;
      }
    };

    const scheduleRender = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(render);
    };

    const measure = () => {
      sceneTop = scene.getBoundingClientRect().top + window.scrollY;
      sceneHeight = scene.offsetHeight;
      viewportHeight = window.innerHeight;
      scheduleRender();
    };

    const updateMotionPreference = () => {
      window.removeEventListener("scroll", scheduleRender);
      if (!reducedMotion.matches) {
        window.addEventListener("scroll", scheduleRender, { passive: true });
      }
      lastDistance = -1;
      // Reset even when the scene is offscreen when the preference changes.
      for (const { element } of layers) element.style.removeProperty("transform");
      scheduleRender();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scene);
    measure();
    updateMotionPreference();
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", updateMotionPreference);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleRender);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      reducedMotion.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene} data-landing-scene>
      <div className={styles.backdrop} aria-hidden='true'>
        <div className={styles.landscape}>
          <div
            className={styles.layer}
            data-parallax-depth='0.18'
            data-parallax-layer='sky'>
            <Image
              src='/images/landing/sky.webp'
              alt=''
              fill
              priority
              sizes='100vw'
              className={styles.landscapeImage}
            />
          </div>
          <div
            className={styles.layer}
            data-parallax-depth='0.1'
            data-parallax-layer='islands'>
            <Image
              src='/images/landing/midground-islands.webp'
              alt=''
              fill
              loading='eager'
              sizes='100vw'
              className={styles.landscapeImage}
            />
          </div>
          <div
            className={styles.layer}
            data-parallax-depth='0.055'
            data-parallax-layer='water'>
            <Image
              src='/images/landing/water.webp'
              alt=''
              fill
              loading='eager'
              sizes='100vw'
              className={styles.landscapeImage}
            />
          </div>
          <div
            className={`${styles.layer} ${styles.caveLayer}`}
            data-parallax-depth='-0.02'
            data-parallax-layer='cave'>
            <Image
              src='/images/landing/cave-frame.webp'
              alt=''
              fill
              loading='eager'
              sizes='100vw'
              className={styles.landscapeImage}
            />
          </div>
        </div>
        <div className={styles.veil} />
      </div>
      {children}
    </div>
  );
}
