import type { LoaderFunctionArgs, ActionFunctionArgs } from '@react-router/node';
import {
  getConversationWithMessages,
  deleteBuilderConversation,
} from '../builder/ai/agentService.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const conversationId = params.id;
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId') || '';

  if (!conversationId) {
    return Response.json({ error: 'Missing conversation id parameter' }, { status: 400 });
  }

  try {
    const data = await getConversationWithMessages(conversationId, storeId);
    if (!data) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      conversation: data,
    });
  } catch (err: any) {
    console.error('[API Builder Conversation GET :id Error]:', err);
    return Response.json({ error: err.message || 'Failed to get conversation' }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const conversationId = params.id;
  if (!conversationId) {
    return Response.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const storeId = url.searchParams.get('storeId') || '';
      const success = await deleteBuilderConversation(conversationId, storeId);
      return Response.json({ success });
    } catch (err: any) {
      console.error('[API Builder Conversation DELETE Error]:', err);
      return Response.json({ error: err.message || 'Failed to delete conversation' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

