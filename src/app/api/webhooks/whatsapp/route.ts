import { getWhatsAppBot, handleWhatsAppEvent } from "@/lib/whatsapp-bot";

export async function GET(req: Request) {
    const bot = getWhatsAppBot();
    return handleWhatsAppEvent(bot, req);
}

export async function POST(req: Request) {
    const bot = getWhatsAppBot();
    return handleWhatsAppEvent(bot, req);
}
