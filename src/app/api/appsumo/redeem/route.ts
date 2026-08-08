import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Regex format validation: AS-TRAC-XXXXXX-XXXXXX (or standard alphanumeric code)
const CODE_REGEX = /^AS-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId, orgId, isNewOrg, orgName } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Redemption code is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Basic format validation
    if (cleanCode.length < 5) {
      return NextResponse.json({ error: "Invalid AppSumo redemption code format." }, { status: 400 });
    }

    // Check if this code has already been redeemed in ANY organization
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("subscription.stackedCodes", "array-contains", cleanCode));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      return NextResponse.json(
        { error: "This AppSumo code has already been redeemed." },
        { status: 400 }
      );
    }

    let targetOrgId = orgId;

    // If targetOrgId is missing, check if user has an existing org
    if (!targetOrgId && userId) {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        targetOrgId = uData.ownedOrgId || uData.orgId;
      }
    }

    // If still no org, create a new org doc
    if (!targetOrgId && userId) {
      const newOrgRef = doc(collection(db, "organizations"));
      targetOrgId = newOrgRef.id;
      await setDoc(newOrgRef, {
        name: orgName || "My Organization",
        ownerId: userId,
        createdAt: serverTimestamp(),
        subscription: {
          plan: "appsumo_lifetime",
          stackedCodes: [cleanCode],
          tier: 1,
          maxSeats: 5,
          updatedAt: new Date().toISOString()
        }
      });

      // Update user doc reference
      await updateDoc(doc(db, "users", userId), {
        ownedOrgId: targetOrgId,
        orgId: targetOrgId,
        role: "owner"
      });

      return NextResponse.json({
        success: true,
        message: "Code redeemed successfully!",
        orgId: targetOrgId,
        tier: 1,
        maxSeats: 5,
        totalCodesStacked: 1
      });
    }

    // If org exists, update subscription with stacked code
    if (targetOrgId) {
      const orgRef = doc(db, "organizations", targetOrgId);
      const orgSnap = await getDoc(orgRef);

      let currentCodes: string[] = [];
      let currentTier = 1;

      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        currentCodes = orgData?.subscription?.stackedCodes || [];
        currentTier = orgData?.subscription?.tier || 1;
      }

      if (currentCodes.includes(cleanCode)) {
        return NextResponse.json(
          { error: "You have already redeemed this code for your organization." },
          { status: 400 }
        );
      }

      const updatedCodes = [...currentCodes, cleanCode];
      const newTier = updatedCodes.length;
      // Calculate seats: Tier 1 = 5 seats, Tier 2 = 15 seats, Tier 3 = 50 seats, etc.
      const seatLimits: Record<number, number> = { 1: 5, 2: 15, 3: 50, 4: 100, 5: 250 };
      const maxSeats = seatLimits[newTier] || newTier * 50;

      await setDoc(orgRef, {
        subscription: {
          plan: "appsumo_lifetime",
          stackedCodes: updatedCodes,
          tier: newTier,
          maxSeats: maxSeats,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });

      if (userId) {
        await updateDoc(doc(db, "users", userId), {
          appsumoCode: cleanCode,
          updatedAt: serverTimestamp()
        });
      }

      return NextResponse.json({
        success: true,
        message: updatedCodes.length > 1 ? `Code stacked successfully! Upgraded to Tier ${newTier}.` : "Code redeemed successfully!",
        orgId: targetOrgId,
        tier: newTier,
        maxSeats: maxSeats,
        totalCodesStacked: updatedCodes.length
      });
    }

    return NextResponse.json({ error: "Could not find or create organization for redemption." }, { status: 400 });

  } catch (error: any) {
    console.error("AppSumo Redemption API Error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during code redemption." },
      { status: 500 }
    );
  }
}
