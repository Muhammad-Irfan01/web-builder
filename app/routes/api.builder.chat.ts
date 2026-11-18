import type { ActionFunctionArgs } from '@react-router/node';
import { handleBuilderChatTurn } from '../builder/ai/agentService.server';
import type { StoreProfile } from '../builder/ai/storeProfiler';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { prompt, storeId, profile, conversationId, canvasContext } = body as {
      prompt: string;
      storeId: string;
      profile?: StoreProfile;
      conversationId?: string;
      canvasContext?: { sections: string[]; summary: string };
    };

    if (!prompt || !storeId) {
      return Response.json({ error: 'Missing prompt or storeId' }, { status: 400 });
    }

    const result = await handleBuilderChatTurn({
      prompt,
      storeId,
      conversationId,
      canvasContext,
      profile,
    });

    return Response.json({
      success: true,
      conversationId: result.conversationId,
      conversationTitle: result.conversationTitle,
      userMessageId: result.userMessageId,
      assistantMessageId: result.assistantMessageId,
      message: result.message,
      action: result.action,
    });
  } catch (err: any) {
    console.error('[API Builder Chat Error]:', err);
    return Response.json({ error: err.message || 'Failed to process AI chat' }, { status: 500 });
  }
}

