import { requireAuth } from '../lib/auth.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@react-router/node';
import {
  listBuilderConversations,
  createBuilderConversation,
} from '../builder/ai/agentService.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // The store always comes from the login, never from the query string
  const { storeId } = await requireAuth(request);

  try {
    const conversations = await listBuilderConversations(storeId);
    return Response.json({
      success: true,
      conversations,
    });
  } catch (err: any) {
    console.error('[API Builder Conversations GET Error]:', err);
    return Response.json({ error: err.message || 'Failed to list conversations' }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { storeId } = await requireAuth(request);

  try {
    const body = await request.json();
    const { title } = body as { title?: string };

    const newConv = await createBuilderConversation(storeId, title);
    return Response.json({
      success: true,
      conversation: newConv,
    });
  } catch (err: any) {
    console.error('[API Builder Conversations POST Error]:', err);
    return Response.json({ error: err.message || 'Failed to create conversation' }, { status: 500 });
  }
}

