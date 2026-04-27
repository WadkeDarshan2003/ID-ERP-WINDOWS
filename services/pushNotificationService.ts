import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "./firebaseConfig";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

/**
 * Request notification permission for web browsers
 */
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.log("Notification permission skipped: Messaging not supported");
    return null;
  }

  try {
    console.log("Requesting notification permission for user:", userId);
    const permission = await Notification.requestPermission();
    console.log("Permission status:", permission);
    
    if (permission === "granted") {
      console.log("Getting FCM token...");
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      console.log("FCM Token received:", token ? token.substring(0, 20) + "..." : "null");
      
      if (token && userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          console.log("Saving token to user profile...");
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          console.log("✅ Token saved successfully!");
        } else {
          console.error("User document doesn't exist:", userId);
        }
      }
      
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onMessageListener = (addNotification?: any, onDeepLink?: (path: string) => void) =>
  new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log("📬 Foreground message received:", payload);
      
      const deepLinkPath = payload.data?.deepLinkPath || payload.fcmOptions?.link || '/';
      const projectId = payload.data?.projectId;
      const taskId = payload.data?.taskId;
      const meetingId = payload.data?.meetingId;
      const targetTab = payload.data?.targetTab;
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'notification-' + Date.now(),
          requireInteraction: false,
          data: {
            url: deepLinkPath,
            deepLinkPath,
            projectId,
            taskId,
            meetingId,
            targetTab
          }
        };
        
        const notification = new Notification(notificationTitle, notificationOptions);
        
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          if (onDeepLink && deepLinkPath && deepLinkPath !== '/') {
            onDeepLink(deepLinkPath);
          } else if (deepLinkPath && deepLinkPath !== '/') {
            window.location.href = deepLinkPath;
          }
          
          notification.close();
        };
        
        console.log("✅ Browser notification displayed with deep-link:", deepLinkPath);
      }
      
      if (addNotification) {
        addNotification({
          title: payload.notification?.title || 'New Notification',
          message: payload.notification?.body || '',
          type: 'info',
          projectId,
          taskId,
          meetingId,
          targetTab,
          deepLinkPath
        });
      }
      
      resolve(payload);
    });
  });

/**
 * Send push notification via Cloud Function
 */
export const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string,
  options?: {
    deepLinkPath?: string;
    projectId?: string;
    taskId?: string;
    meetingId?: string;
    targetTab?: 'discovery' | 'plan' | 'financials' | 'team' | 'timeline' | 'documents' | 'meetings';
    icon?: string;
  }
): Promise<void> => {
  try {
    const PUSH_FUNCTION_URL = 'https://sendpushnotification-jl3d2uhdra-uc.a.run.app';
    
    const payload = {
      recipientId,
      title,
      body,
      deepLinkPath: options?.deepLinkPath || '/',
      projectId: options?.projectId,
      taskId: options?.taskId,
      meetingId: options?.meetingId,
      targetTab: options?.targetTab,
      icon: options?.icon || "/icons/icon-192x192.png"
    };

    await fetch(PUSH_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

/**
 * Electron/Desktop notification handler (stub for compatibility)
 */
export const initElectronNotificationListener = () => {
  console.log('Desktop notification system initialized');
};
