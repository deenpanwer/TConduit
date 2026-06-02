import webpush from "web-push";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

const vapidEmail = process.env.VAPID_EMAIL;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidEmail && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID details are missing.");
}

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 500 });
    }
    const adminDb = admin.firestore();

    const { userId, title, body, icon, badge, data } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    if (!userData || !userData.pushSubscriptions) {
      return NextResponse.json({ success: true, info: "No subscriptions found" });
    }
    
    const subscriptions: any[] = userData.pushSubscriptions;

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/special-triangle.svg",
      badge: badge || "/special-triangle.svg",
      data: data || {}
    });

    const sendResults = await Promise.all(
      subscriptions.map(async (subStr: any) => {
        try {
          // HYBRID CHECK: If it's a string, parse it. If it's a Map (object), use it directly.
          const subscription = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
          
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error: any) {
          console.error(`Push Error for ${userId}:`, error.statusCode);
          
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