import { getWhatsAppBot, handleWhatsAppEvent } from "@/lib/whatsapp-bot";
import { waitUntil } from "@vercel/functions";

export async function GET(req: Request) {
    const bot = getWhatsAppBot();
    return handleWhatsAppEvent(bot, req);
}

export async function POST(req: Request) {
    const bot = getWhatsAppBot();
    return handleWhatsAppEvent(bot, req, { waitUntil });
}
