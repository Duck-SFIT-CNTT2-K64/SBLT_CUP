"use client";

import { useState, useCallback, useEffect } from "react";

export function usePushNotifications() {
  const [isSupported] = useState(() =>
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setIsSubscribed(!!subscription);
      } catch {
        // Service worker not registered yet
      }
    })();
    return () => { cancelled = true; };
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      // Get VAPID public key
      const keyRes = await fetch("/api/notifications/push/vapid-key");
      if (!keyRes.ok) throw new Error("Failed to get VAPID key");
      const { publicKey } = await keyRes.json();

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();

      // Send subscription to server
      const res = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch(`/api/notifications/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: "DELETE",
        });
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe from push:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isSupported, isSubscribed, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
