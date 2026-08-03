import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      orgName,
      inviteCode,
      ownerWhatsapp,
      ownerEmail,
      teamSize,
      reportingPlatforms,
      motivation,
      modulePriorities,
      role
    } = await req.json();

    // 1. Pushover Notification to Team (Detailed Summary)
    const PUSHOVER_USER = 'uyge2dnhwroxbyhwsord7k4o3inum5';
    const PUSHOVER_TOKEN = 'abjsbdfhr7rs9azsec8ybwr9y6rvkq';

    const details = [
      `Org: ${orgName || 'N/A'}`,
      `Email: ${ownerEmail || 'N/A'}`,
      `WhatsApp: ${ownerWhatsapp || 'N/A'}`,
      `Role: ${role || 'N/A'}`,
      `Invite Code: ${inviteCode || 'N/A'}`,
      `Team Size: ${teamSize || 'N/A'}`,
      `Platforms: ${reportingPlatforms?.join(', ') || 'None'}`,
      `Modules: ${modulePriorities?.join(', ') || 'None'}`,
      motivation ? `\nMotivation: ${motivation}` : ''
    ].filter(Boolean).join('\n');

    const pushoverRes = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        message: details,
        title: `🚀 New Signup: ${orgName || 'New User'}`,
        priority: '0'
      })
    });

    if (!pushoverRes.ok) {
      console.error("Pushover failed:", await pushoverRes.text());
    }

    // 2. WhatsApp Welcome Message to Owner (TEMPLATE: onboarding_invite_v1)
    if (ownerWhatsapp) {
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

      const cleanPhone = ownerWhatsapp.replace(/\+/g, '').replace(/\s/g, '');

      const whatsappRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: "onboarding_invite_v1",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: orgName || "your new workspace" },
                  { type: "text", text: inviteCode }
                ]
              }
            ]
          }
        })
      });

      if (!whatsappRes.ok) {
        console.error("WhatsApp Template Welcome failed:", await whatsappRes.text());
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
