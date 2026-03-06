import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// This hook wraps vite-plugin-pwa's useRegisterSW.
// registerType: 'prompt' means the service worker waits for us to call updateSW()
// before activating a new version — this gives us the manual update button.
export function usePWAUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds while online
      if (r) {
        setInterval(() => {
          if (navigator.onLine) r.update()
        }, 60_000)
      }
    }
  })

  return { needsUpdate: needRefresh, triggerUpdate: () => updateServiceWorker(true) }
}
