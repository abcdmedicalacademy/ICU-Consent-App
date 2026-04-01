/**
 * ICU Consent App — Service Worker Registration  (Phase 7)
 * =========================================================
 * Handles:
 *   • SW registration and lifecycle
 *   • "Add to Home Screen" install prompt capture
 *   • Update detection with "session-end to apply" UX
 *   • Online/offline state broadcasting to React app
 *   • Email queue background sync registration
 *
 * This script is loaded as a plain <script> tag in index.html,
 * before the React app bundle, so it runs immediately.
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────
  const SW_PATH    = "/service-worker.js";
  const SW_SCOPE   = "/";
  const DEBUG      = false; // set true for verbose console logging

  function log(...args) { if (DEBUG) console.log("[SW-Register]", ...args); }

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  let waitingWorker    = null;   // SW waiting to take over
  let updateAvailable  = false;  // True when new version is waiting
  let deferredInstall  = null;   // beforeinstallprompt event captured

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOM EVENT HELPERS — allows React to listen via window.addEventListener
  // ─────────────────────────────────────────────────────────────────────────
  function emit(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    log("Event emitted:", eventName, detail);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REGISTER SERVICE WORKER
  // ─────────────────────────────────────────────────────────────────────────
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: SW_SCOPE,
          updateViaCache: "none", // Always check for new SW version on network
        });

        log("SW registered:", registration.scope);

        // ── Detect waiting worker (update already downloaded) ─────────────
        if (registration.waiting) {
          handleWaitingWorker(registration.waiting);
        }

        // ── Detect new worker installing ───────────────────────────────────
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          log("New SW installing...");

          newWorker.addEventListener("statechange", () => {
            log("New SW state:", newWorker.state);
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version downloaded and waiting — existing clients still running
              handleWaitingWorker(newWorker);
            }
          });
        });

        // ── Periodic update check (every hour) ────────────────────────────
        setInterval(() => {
          registration.update().catch(() => {}); // silent — may be offline
        }, 60 * 60 * 1000);

        // ── Listen for messages from SW ────────────────────────────────────
        navigator.serviceWorker.addEventListener("message", (event) => {
          const { type, ...data } = event.data || {};
          log("Message from SW:", type, data);

          switch (type) {
            case "SW_ACTIVATED":
              emit("sw:activated", data);
              break;

            case "EMAIL_QUEUE_SENT":
              emit("sw:email-sent", data);
              break;

            case "CACHE_STATUS":
              emit("sw:cache-status", data);
              break;

            case "CACHE_REFRESHED":
              emit("sw:cache-refreshed", data);
              break;
          }
        });

        // ── Reload if controller changes (new SW took over) ───────────────
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            log("Controller changed — reloading for new version");
            window.location.reload();
          }
        });

        // Expose registration globally for React app access
        window.__swRegistration = registration;

      } catch (err) {
        console.warn("[SW-Register] Registration failed:", err);
        // App works fine without SW — just no offline capability
      }
    });
  } else {
    log("Service workers not supported in this browser");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLE WAITING WORKER
  // Spec: "New content update available — will apply at next session start"
  // We do NOT skip waiting immediately — that would cause a mid-session reload.
  // Instead, we notify the React app via a custom event so it can show the
  // non-intrusive banner at the bottom of the export screen.
  // ─────────────────────────────────────────────────────────────────────────
  function handleWaitingWorker(worker) {
    waitingWorker   = worker;
    updateAvailable = true;
    log("New version waiting:", worker.state);

    // Notify React app
    emit("sw:update-available", {
      message: "New content update available. Will apply at next session start.",
      messageTa: "புதிய உள்ளடக்க புதுப்பிப்பு கிடைக்கிறது. அடுத்த அமர்வு தொடங்கும்போது பயன்படுத்தப்படும்.",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API — used by React app
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Called when user ends a session (New Patient / Discharge & Clear).
   * Safe point to activate any waiting service worker.
   */
  window.swSignalSessionEnd = function () {
    log("Session ended — signalling SW");
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SESSION_ENDED" });
    }
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SESSION_ENDED" });
    }
  };

  /**
   * Queue an email for background sync (called when offline during email export).
   * payload: { to, subject, body, filename, pdfBase64 }
   */
  window.swQueueEmail = function (payload) {
    if (!navigator.serviceWorker.controller) {
      log("No SW controller — cannot queue email");
      return Promise.reject(new Error("Service worker not active"));
    }
    navigator.serviceWorker.controller.postMessage({
      type: "QUEUE_EMAIL",
      payload,
    });
    // Register background sync
    if (window.__swRegistration && window.__swRegistration.sync) {
      return window.__swRegistration.sync
        .register("email-queue-sync")
        .then(() => { log("Email queued for background sync"); })
        .catch((err) => { log("Sync registration failed:", err); });
    }
    return Promise.resolve();
  };

  /**
   * Request cache status from the service worker.
   */
  window.swGetCacheStatus = function () {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "GET_CACHE_STATUS" });
    }
  };

  /**
   * Check if a SW update is currently waiting.
   */
  window.swUpdateAvailable = function () {
    return updateAvailable;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PWA INSTALL PROMPT
  // Capture the beforeinstallprompt event so we can show it at the right moment
  // (e.g., after the user successfully generates their first document)
  // ─────────────────────────────────────────────────────────────────────────
  window.addEventListener("beforeinstallprompt", (event) => {
    // Prevent the default mini-infobar from appearing immediately
    event.preventDefault();
    deferredInstall = event;
    log("Install prompt captured");

    // Notify React app that installation is available
    emit("sw:install-available");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    log("App installed to home screen");
    emit("sw:installed");
  });

  /**
   * Trigger the PWA install prompt. Call this when the user taps
   * the "Add to Home Screen" button in the app.
   * Returns a Promise that resolves to "accepted" or "dismissed".
   */
  window.swPromptInstall = function () {
    if (!deferredInstall) {
      return Promise.reject(new Error("Install prompt not available"));
    }
    deferredInstall.prompt();
    return deferredInstall.userChoice.then((choice) => {
      deferredInstall = null;
      return choice.outcome; // "accepted" | "dismissed"
    });
  };

  window.swInstallAvailable = function () {
    return !!deferredInstall;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ONLINE / OFFLINE EVENTS — broadcast to React app
  // ─────────────────────────────────────────────────────────────────────────
  window.addEventListener("online",  () => emit("sw:online"));
  window.addEventListener("offline", () => emit("sw:offline"));

  // Emit initial state after a tick (React may not be mounted yet)
  setTimeout(() => {
    if (!navigator.onLine) emit("sw:offline");
  }, 500);

  log("SW registration script loaded");
})();
