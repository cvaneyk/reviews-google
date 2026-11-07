"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS, type TourStep } from "./tour-steps";

const ROUTE_TIMEOUT_MS = 8000;
const ELEMENT_TIMEOUT_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function selectorFor(step: TourStep) {
  return step.target ? `[data-tour="${step.target}"]` : undefined;
}

async function waitForStep(step: TourStep) {
  const routeDeadline = Date.now() + ROUTE_TIMEOUT_MS;
  while (window.location.pathname !== step.route && Date.now() < routeDeadline) {
    await sleep(50);
  }

  const selector = selectorFor(step);
  const elementDeadline = Date.now() + ELEMENT_TIMEOUT_MS;
  while (selector && !document.querySelector(selector) && Date.now() < elementDeadline) {
    await sleep(50);
  }
}

export function useProductTour(autoStart: boolean) {
  const router = useRouter();
  const tourRef = useRef<Driver | null>(null);
  const navigatingRef = useRef(false);
  const autoStartedRef = useRef(false);

  // Navega a la página del paso antes de mostrarlo; driver.js solo conoce la página actual
  const prepareStep = useCallback(
    async (index: number) => {
      const step = TOUR_STEPS[index];
      if (window.location.pathname === step.route) return;
      router.push(step.route);
      await waitForStep(step);
    },
    [router]
  );

  const goToStep = useCallback(
    async (tour: Driver, index: number) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      await prepareStep(index);
      navigatingRef.current = false;
      if (tourRef.current === tour) tour.moveTo(index);
    },
    [prepareStep]
  );

  const startTour = useCallback(async () => {
    if (tourRef.current || navigatingRef.current) return;

    const tour = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      closeBtnLabel: "Cerrar el tour",
      overlayClickBehavior: "none",
      allowKeyboardControl: false,
      disableActiveInteraction: true,
      steps: TOUR_STEPS.map((step) => ({
        element: selectorFor(step),
        popover: { title: step.title, description: step.description },
      })),
      onNextClick: () => {
        const nextIndex = (tour.getActiveIndex() ?? 0) + 1;
        if (nextIndex >= TOUR_STEPS.length) {
          tour.destroy();
        } else {
          void goToStep(tour, nextIndex);
        }
      },
      onPrevClick: () => {
        const previousIndex = (tour.getActiveIndex() ?? 0) - 1;
        if (previousIndex >= 0) void goToStep(tour, previousIndex);
      },
      onDestroyed: () => {
        tourRef.current = null;
        // Terminar o cerrar cuenta como visto; si falla, el tour volverá a salir en el próximo acceso
        fetch("/api/account/tour", { method: "PUT", keepalive: true }).catch((error) => {
          console.error("Tour completion error:", error);
        });
      },
    });

    tourRef.current = tour;
    navigatingRef.current = true;
    await prepareStep(0);
    navigatingRef.current = false;
    if (tourRef.current === tour) tour.drive();
  }, [goToStep, prepareStep]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startTour();
  }, [autoStart, startTour]);

  return { startTour };
}
