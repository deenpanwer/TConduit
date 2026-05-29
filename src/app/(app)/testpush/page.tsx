"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { subscribeUserToPush, requestNotificationPermission, sendBrowserNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function TestPushPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleRequestPermission = async () => {
    addLog("Requesting notification permission...");
    const permission = await requestNotificationPermission();
    addLog(`Permission result: ${permission}`);
    
    if (permission === 'granted') {
      toast.success("Notification permission granted!");
    } else {
      toast.error("Notification permission denied or ignored.");
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      addLog("Error: No user logged in.");
      return;
    }
    
    setLoading(true);
    addLog(`Subscribing user: ${user.uid}...`);
    try {
      const sub = await subscribeUserToPush(user.uid);
      if (sub) {
        addLog("Subscription successful!");
        console.log("Subscription object:", sub);
        toast.success("Subscribed to push notifications!");
      } else {
        addLog("Subscription failed (returned null). Check console for details.");
        toast.error("Failed to subscribe.");
      }
    } catch (err: any) {
      addLog(`Subscription error: ${err.message}`);
      toast.error("Error during subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!user) {
      addLog("Error: No user logged in.");
      return;
    }

    setLoading(true);
    addLog(`Sending test push to self (${user.uid})...`);
    
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          title: "Test Push from /testpush",
          body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
          icon: "/logo.svg", // Note: This might fail on some Android versions if not PNG
          data: { url: "/testpush" }
        })
      });

      const data = await res.json();
      addLog(`API Response: ${JSON.stringify(data)}`);
      
      if (data.success) {
        toast.success("Push sent! Check your notifications.");
      } else {
        toast.error(`Push failed: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`API Error: ${err.message}`);
      toast.error("Network error sending push.");
    } finally {
      setLoading(false);
    }
  };

  const handleBrowserNotification = () => {
    addLog("Sending local browser notification...");
    sendBrowserNotification("Local Test", { body: "This is a local browser notification (not push)." });
    toast.info("Sent local notification.");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm">
              <span className="font-bold">User ID:</span> {user ? user.uid : "Not logged in"}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Button onClick={handleRequestPermission} variant="outline">
                1. Request Permission
              </Button>
              
              <Button onClick={handleSubscribe} disabled={loading || !user}>
                2. Subscribe to Push
              </Button>

              <Button onClick={handleSendTestPush} disabled={loading || !user} variant="default">
                3. Send Test Push (Server)
              </Button>

              <Button onClick={handleBrowserNotification} variant="secondary">
                Test Local Notification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="opacity-50">Waiting for actions...</span>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground mt-4">
        <p><strong>Note:</strong> Push notifications require:</p>
        <ul className="list-disc ml-4 mt-1">
          <li>HTTPS (or localhost)</li>
          <li>Service Worker registered (check Application tab in DevTools)</li>
          <li>Notification permission granted</li>
          <li>Valid VAPID keys in env vars</li>
        </ul>
      </div>
    </div>
  );
}
