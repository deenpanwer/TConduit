import { useState, useEffect, useCallback } from 'react';

export type NotificationSetting = 'all' | 'silent';

export const useNotificationSettings = (chatId: string) => {
  const [setting, setSetting] = useState<NotificationSetting>('all');

  useEffect(() => {
    if (chatId) {
      const storedSetting = localStorage.getItem(`chat-notification-${chatId}`) as NotificationSetting;
      if (storedSetting) {
        setSetting(storedSetting);
      }
    }
  }, [chatId]);

  const updateSetting = useCallback((newSetting: NotificationSetting) => {
    setSetting(newSetting);
    localStorage.setItem(`chat-notification-${chatId}`, newSetting);
  }, [chatId]);

  return { setting, updateSetting };
};
