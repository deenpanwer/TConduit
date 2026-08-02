import fs from 'fs/promises';
import path from 'path';

export interface TelnyxMessage {
  id: string;
  type: 'inbound' | 'outbound';
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

const FILE_PATH = path.join(process.cwd(), 'src/data/telnyx-messages.json');

export async function getTelnyxMessages(): Promise<TelnyxMessage[]> {
  try {
    const data = await fs.readFile(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading Telnyx messages JSON:', error);
    return [];
  }
}

export async function saveTelnyxMessage(message: TelnyxMessage): Promise<void> {
  try {
    const messages = await getTelnyxMessages();
    messages.push(message);
    await fs.writeFile(FILE_PATH, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving Telnyx message to JSON:', error);
  }
}
