import { createHmac } from 'node:crypto';
import { config } from '../config.js';

type PremiumOp = 'grant' | 'revoke';

interface SignedRequest {
  timestamp: string;
  signature: string;
}

function buildPayload(op: PremiumOp, userId: string, tier: string | undefined): string {
  if (op === 'grant') {
    return JSON.stringify({ type: 'premium.grant', data: { userId, tier } });
  }
  return JSON.stringify({ type: 'premium.revoke', data: { userId } });
}

function sign(body: string, secret: string): SignedRequest {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return { timestamp, signature };
}

export async function sendPremiumWebhook(
  op: PremiumOp,
  userId: string,
  tier?: string
): Promise<{ success: boolean; error?: string }> {
  if (!config.premiumWebhookUrl || !config.premiumWebhookSecret) {
    return { success: false, error: 'Webhook not configured' };
  }

  const body = buildPayload(op, userId, tier);
  const { timestamp, signature } = sign(body, config.premiumWebhookSecret);

  try {
    const res = await fetch(config.premiumWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-premium-signature': `t=${timestamp},v1=${signature}`,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
