import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.SAFEPAY_SECRET_KEY;
const PUBLIC_KEY = process.env.SAFEPAY_PUBLIC_KEY;
const PLAN_ID = "plan_a1819706-f597-44d9-a9aa-6b8dd5a05651";
const BASE = "https://sandbox.api.getsafepay.com";
const SUCCESS_URL = "https://9000-firebase-tconduitgit-1775008881359.cluster-xpmcxs2fjnhg6xvn446ubtgpio.cloudworkstations.dev/subscribe/success";
const CANCEL_URL = "https://9000-firebase-tconduitgit-1775008881359.cluster-xpmcxs2fjnhg6xvn446ubtgpio.cloudworkstations.dev/subscribe/failed";

export async function GET() {
  return NextResponse.json({
    status: "active",
    secret_key_set: !!SECRET_KEY,
    public_key_set: !!PUBLIC_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!SECRET_KEY || !PUBLIC_KEY) {
      return NextResponse.json({ error: "Missing env variables" }, { status: 500 });
    }

    const { orgId } = await req.json();
    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // Step 1: Create payment session
    const sessionRes = await fetch(`${BASE}/order/payments/v3/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": SECRET_KEY,
      },
      body: JSON.stringify({
        merchant_api_key: PUBLIC_KEY,
        intent: "CYBERSOURCE",
        mode: "payment",
        currency: "PKR",
        amount: 100,
      }),
    });

    const sessionData = await sessionRes.json();
    console.log("[Step 1 - Session]:", JSON.stringify(sessionData));

    if (!sessionRes.ok) {
      return NextResponse.json({ error: "Session creation failed", detail: sessionData }, { status: 500 });
    }

    const trackerToken = sessionData?.data?.tracker?.token;
    if (!trackerToken) {
      return NextResponse.json({ error: "No tracker token in session response", detail: sessionData }, { status: 500 });
    }

    // Step 2: Create auth token
    const passportRes = await fetch(`${BASE}/client/passport/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": SECRET_KEY,
      },
    });

    const passportData = await passportRes.json();
    console.log("[Step 2 - Passport]:", JSON.stringify(passportData));

    if (!passportRes.ok) {
      return NextResponse.json({ error: "Passport creation failed", detail: passportData }, { status: 500 });
    }

    const authToken = passportData?.data;
    if (!authToken) {
      return NextResponse.json({ error: "No auth token in passport response", detail: passportData }, { status: 500 });
    }

    // Step 3: Construct checkout URL
    const params = new URLSearchParams({
      env: "sandbox",
      tracker: trackerToken,
      tbt: authToken,
      plan_id: PLAN_ID,
      reference: orgId,
      source: "hosted",
      redirect_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    const checkoutURL = `${BASE}/embedded/pay?${params.toString()}`;
    console.log("[Step 3 - Checkout URL]:", checkoutURL);

    return NextResponse.json({ url: checkoutURL });

  } catch (error: any) {
    console.error("[Safepay Error]:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}