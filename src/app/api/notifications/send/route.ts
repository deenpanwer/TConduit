import webpush from "web-push";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// Configure Web Push with VAPID keys from environment variables
const vapidEmail = process.env.VAPID_EMAIL;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidEmail && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID details are missing in environment variables. Push notifications will not work.");
}

export async function POST(req: Request) {
  try {
    const { userId, title, body, icon, badge, data } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get user's subscriptions from Firestore using Admin SDK
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    if (!userData || !userData.pushSubscriptions) {
      console.log(`No push subscriptions found for user: ${userId}`);
      return NextResponse.json({ success: true, info: "No subscriptions found" });
    }
    
    const subscriptions: string[] = userData.pushSubscriptions;

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/logo.svg",
      badge: badge || "/logo.svg",
      data: data || {}
    });

    const sendResults = await Promise.all(
      subscriptions.map(async (subStr: string) => {
        try {
          const subscription = JSON.parse(subStr);
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error: any) {
          console.error(`Error sending push to subscription for user ${userId}:`, error.statusCode);
          
          // If subscription is expired or invalid (410 Gone or 404 Not Found), remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await userRef.update({
              pushSubscriptions: FieldValue.arrayRemove(subStr)
            });
          }
          return { success: false, error: error.message };
        }
      })
    );

    return NextResponse.json({ success: true, results: sendResults });
  } catch (error: any) {
    console.error("Error in push notification API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}