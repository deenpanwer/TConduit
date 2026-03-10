export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // Only send a notification if the tab is not active.
  if (document.hidden) {
    const notification = new Notification(title, {
      ...options,
      icon: "/logo.svg", // Using the main site logo
      badge: "/logo.svg", // Icon for mobile notifications
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};
