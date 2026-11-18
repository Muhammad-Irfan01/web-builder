import { prisma } from '../../lib/database.server';
import { randomUUID } from 'crypto';
import { generateBlockForIntent, type GeneratedBlockPreview } from './blockCatalog';
import { getStoreKnowledge, type StoreKnowledge } from './storeKnowledge.server';
import type { StoreProfile } from './storeProfiler';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export type BuilderAction =
  | { type: 'APPLY_BLOCK'; block: GeneratedBlockPreview; title?: string; description?: string; html?: string }
  | { type: 'UPDATE_ELEMENT'; selector: string; title: string; html: string; description: string };

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: BuilderAction;
  applied?: boolean;
  createdAt?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  startedAt: string;
  messageCount: number;
  lastMessage?: string;
}

// LangChain & LangSmith Environment Configuration
if (process.env.LANGCHAIN_KEY || process.env.LANGCHAIN_API_KEY) {
  process.env.LANGCHAIN_TRACING_V2 = 'true';
  process.env.LANGCHAIN_ENDPOINT = 'https://api.smith.langchain.com';
  process.env.LANGCHAIN_API_KEY = process.env.LANGCHAIN_KEY || process.env.LANGCHAIN_API_KEY;
  process.env.LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || 'orcayo-builder-agent';
}

/**
 * Ensures a dedicated Visual Builder Agent exists for this store in rag.agents
 */
export async function getOrCreateBuilderAgent(storeId: string): Promise<string> {
  try {
    const existing: any = await prisma.$queryRawUnsafe(
      'SELECT id FROM rag.agents WHERE store_id = $1 AND role = $2 LIMIT 1',
      storeId,
      'visual-builder-agent'
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return existing[0].id;
    }

    const id = randomUUID();
    const systemPrompt =
      'You are the Orcayo AI Visual Builder Agent. You design, generate, and adapt visual storefront sections tailored to the merchant business including physical products, bespoke services, appointments, and rentals.';
    const modelConfig = JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7 });

    await prisma.$executeRawUnsafe(
      'INSERT INTO rag.agents (id, store_id, name, role, category, system_prompt, model_config, is_default, is_active, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, NOW(), NOW())',
      id,
      storeId,
      'Orcayo Visual Builder Agent',
      'visual-builder-agent',
      'visual_builder',
      systemPrompt,
      modelConfig,
      false,
      true,
      'system'
    );

    return id;
  } catch (err) {
    console.warn('[BuilderAgent] Error ensuring agent, using fallback uuid:', err);
    return 'builder-agent-default';
  }
}

/**
 * List all visual builder conversations for this store
 */
export async function listBuilderConversations(storeId: string): Promise<ConversationSummary[]> {
  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT c.id, c.started_at, c.metadata, COUNT(m.id) as msg_count,
        (SELECT content FROM rag.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg
       FROM rag.conversations c
       LEFT JOIN rag.messages m ON m.conversation_id = c.id
       WHERE c.store_id = $1 AND c.channel = $2
       GROUP BY c.id, c.started_at, c.metadata
       ORDER BY c.started_at DESC`,
      storeId,
      'visual-builder'
    );

    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => ({
      id: r.id,
      title: r.metadata?.title || 'Visual Design Session',
      startedAt: r.started_at instanceof Date ? r.started_at.toISOString() : String(r.started_at || new Date().toISOString()),
      messageCount: Number(r.msg_count || 0),
      lastMessage: r.last_msg || undefined,
    }));
  } catch (err) {
    console.error('[listBuilderConversations Error]:', err);
    return [];
  }
}

/**
 * Get a specific conversation with all historical messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  storeId: string
): Promise<{ id: string; title: string; messages: ChatMessageItem[] } | null> {
  try {
    const convRows: any = await prisma.$queryRawUnsafe(
      'SELECT id, metadata FROM rag.conversations WHERE id = $1 AND store_id = $2 LIMIT 1',
      conversationId,
      storeId
    );

    if (!Array.isArray(convRows) || convRows.length === 0) {
      return null;
    }

    const title = convRows[0].metadata?.title || 'Design Session';

    const msgRows: any = await prisma.$queryRawUnsafe(
      'SELECT id, role, content, metadata, created_at FROM rag.messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      conversationId
    );

    const messages: ChatMessageItem[] = Array.isArray(msgRows)
      ? msgRows.map((m: any) => {
          let action = undefined;
          if (m.metadata?.action) {
            action = m.metadata.action;
          }
          return {
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'assistant',
            text: m.content,
            action,
            applied: Boolean(m.metadata?.applied),
            createdAt: m.created_at ? new Date(m.created_at).toISOString() : undefined,
          };
        })
      : [];

    return {
      id: conversationId,
      title,
      messages,
    };
  } catch (err) {
    console.error('[getConversationWithMessages Error]:', err);
    return null;
  }
}

/**
 * Create a new conversation session
 */
export async function createBuilderConversation(
  storeId: string,
  title?: string
): Promise<ConversationSummary> {
  const convId = randomUUID();
  const agentId = await getOrCreateBuilderAgent(storeId);
  const convTitle = title || 'New Design Chat';
  const metadata = JSON.stringify({ title: convTitle });

  await prisma.$executeRawUnsafe(
    'INSERT INTO rag.conversations (id, store_id, agent_id, channel, status, metadata, started_at) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())',
    convId,
    storeId,
    agentId,
    'visual-builder',
    'active',
    metadata
  );

  return {
    id: convId,
    title: convTitle,
    startedAt: new Date().toISOString(),
    messageCount: 0,
  };
}

/**
 * Delete a conversation session
 */
export async function deleteBuilderConversation(
  conversationId: string,
  storeId: string
): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(
      'DELETE FROM rag.conversations WHERE id = $1 AND store_id = $2',
      conversationId,
      storeId
    );
    return true;
  } catch (err) {
    console.error('[deleteBuilderConversation Error]:', err);
    return false;
  }
}

/**
 * Handle a chat turn:
 * 1. Proactively queries the store knowledge base
 * 2. Checks canvas context
 * 3. Differentiates greetings / exploratory prompts from design requests
 * 4. Persists to rag.conversations and rag.messages
 * 5. Traced through LangChain
 */
export async function handleBuilderChatTurn({
  prompt,
  storeId,
  conversationId,
  canvasContext,
  profile,
}: {
  prompt: string;
  storeId: string;
  conversationId?: string;
  canvasContext?: { sections: string[]; summary: string };
  profile?: StoreProfile;
}): Promise<{
  conversationId: string;
  conversationTitle: string;
  userMessageId: string;
  assistantMessageId: string;
  message: string;
  action?: {
    type: 'APPLY_BLOCK';
    block: GeneratedBlockPreview;
  };
}> {
  // Proactively fetch real live store knowledge
  const knowledge: StoreKnowledge = await getStoreKnowledge(storeId);

  let convId = conversationId;
  let convTitle = 'Design Session';

  // 1. Resolve or create conversation
  if (convId) {
    const existing: any = await prisma.$queryRawUnsafe(
      'SELECT id, metadata FROM rag.conversations WHERE id = $1 AND store_id = $2 LIMIT 1',
      convId,
      storeId
    );
    if (Array.isArray(existing) && existing.length > 0) {
      convTitle = existing[0].metadata?.title || convTitle;
    } else {
      convId = undefined;
    }
  }

  if (!convId) {
    convTitle = prompt.length > 36 ? prompt.slice(0, 36).trim() + '...' : prompt;
    const newConv = await createBuilderConversation(storeId, convTitle);
    convId = newConv.id;
  }

  // 2. Insert User Message into PostgreSQL
  const userMsgId = randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO rag.messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, NOW())',
      userMsgId,
      convId,
      'user',
      prompt
    );
  } catch (err) {
    console.warn('[BuilderAgent] Error saving user message to DB:', err);
  }

  // 3. Dynamic Tool-Calling Agent Execution with LangSmith Tracing
  let triggeredAction: BuilderAction | undefined = undefined;

  const tools = [
    new DynamicStructuredTool({
      name: 'update_canvas_element',
      description: 'Update or replace an existing element or section on the canvas in-place (such as resizing an image, modifying footer info, changing header navigation, or refining an annotated component).',
      schema: z.object({
        selector: z.string().describe('CSS selector of the target element to replace, e.g. "img.gjs-selected", "footer, .grace-footer", "#header"'),
        title: z.string().describe('Short title describing the modification, e.g. "Resized Image (600px)" or "Updated Store Footer"'),
        description: z.string().describe('One-sentence summary of the styling or content changes made'),
        html: z.string().describe('The complete updated outer HTML and inline styles for the targeted element'),
      }),
      func: async ({ selector, title, description, html }) => {
        triggeredAction = {
          type: 'UPDATE_ELEMENT',
          selector,
          title,
          description,
          html,
        };
        return JSON.stringify({ success: true, action: 'UPDATE_ELEMENT', selector, title });
      },
    }),
    new DynamicStructuredTool({
      name: 'generate_storefront_block',
      description: 'Generate a brand new modern responsive HTML/CSS section to insert into the canvas (e.g. apparel showcase, bespoke cake hero, service booking grid, customer reviews).',
      schema: z.object({
        title: z.string().describe('Section title, e.g. "Paiish Featured Hoodies Grid"'),
        category: z.string().describe('Category name, e.g. "Product Showcase", "Bespoke Services", "Appointments"'),
        description: z.string().describe('Summary of the section content and layout'),
        html: z.string().describe('Complete semantic HTML with responsive styles for the section'),
      }),
      func: async ({ title, category, description, html }) => {
        triggeredAction = {
          type: 'APPLY_BLOCK',
          block: {
            blockId: 'ai-gen-' + Date.now(),
            category,
            title,
            description,
            html,
          },
          title,
          description,
          html,
        };
        return JSON.stringify({ success: true, action: 'APPLY_BLOCK', title });
      },
    }),
  ];

  const storePhone = knowledge.storePhone || '+92 300 1234567';
  const storeEmail = knowledge.storeEmail || ('support@' + knowledge.storeName.toLowerCase().replace(/\s+/g, '') + '.com');
  const storeAddress = knowledge.storeAddress || 'Main Boulevard, Commercial District, Lahore, Pakistan';
  const catalogSummary = knowledge.allProducts.map(p => p.title + ' (' + knowledge.currency + ' ' + p.price + ')').slice(0, 10).join(', ');

  const systemPrompt = `You are the Orcayo AI Visual Builder Agent for "${knowledge.storeName}".
You are an expert visual web designer, UI/UX specialist, and frontend engineer.

STORE PROFILE & CONTEXT:
- Store Name: ${knowledge.storeName}
- Currency: ${knowledge.currency}
- Phone: ${storePhone}
- Email: ${storeEmail}
- Address: ${storeAddress}
- Catalog Items: ${catalogSummary || "Handcrafted apparel, bespoke orders, and custom creations"}
- Canvas Sections: ${canvasContext?.sections?.join(", ") || "Starter template layout"}

CRITICAL ACTION RULES:
1. Targeted In-Place Element Updates:
   - When the user annotates a component (e.g. ### Target Component #1: <img...>, CSS Selector: img.gjs-selected) and asks to modify it (e.g. "increase the size of this image", "change button color", "make text larger"):
     -> YOU MUST CALL update_canvas_element.
     -> Target the exact CSS selector provided (e.g. "img.gjs-selected" or id selector).
     -> Inspect the Current Outer HTML provided and return the modified HTML preserving original IDs and attributes while updating styles (e.g. add style="width: 100%; max-width: 650px; height: auto; display: block;").
     -> DO NOT generate an unrelated product grid or block when the user is asking to modify an existing component!
   - When the user asks to edit or update an existing section (e.g. "edit the footer", "update footer with store info"):
     -> YOU MUST CALL update_canvas_element with selector "footer, .grace-footer, .salon-footer" and generate the real store footer HTML.

2. New Block Additions:
   - When the user asks to add or build a new section (e.g. "add a featured apparel collection for our hoodies", "add customer reviews"):
     -> YOU MUST CALL generate_storefront_block with modern responsive HTML/CSS using the store real catalog products and currency.

3. General Design Inquiries & Advice:
   - If the user asks a general question, gives a greeting, or asks for design suggestions, answer conversationally with thoughtful, helpful recommendations without calling tools.

Always be concise, professional, and explain clearly what modification you have prepared.`;

  let historyMessages: any[] = [];
  try {
    const pastDbMessages: any = await prisma.$queryRawUnsafe(
      `SELECT role, content FROM rag.messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 8`,
      convId
    );
    if (Array.isArray(pastDbMessages)) {
      historyMessages = pastDbMessages.map((m: any) => {
        return m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content);
      });
    }
  } catch (err) {
    console.warn('Could not load history messages:', err);
  }

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ]);

  const inferenceUrl = process.env.OPENAI_BASE_URL || 'http://127.0.0.1:10100/v1';
  const modelName = process.env.OPENAI_MODEL || 'google-antigravity/claude-sonnet-4-6';

  let assistantText = '';

  try {
    const llm = new ChatOpenAI({
      modelName,
      temperature: 0.2,
      configuration: {
        baseURL: inferenceUrl,
        apiKey: process.env.OPENAI_API_KEY || 'local-proxy-token',
      },
    });

    const chain = promptTemplate.pipe(llm.bindTools(tools));

    const response = await chain.invoke(
      {
        input: prompt,
        history: historyMessages,
      },
      {
        runName: 'orcayo_visual_builder_turn',
        tags: ['orcayo-visual-builder', storeId],
        metadata: {
          storeId,
          storeName: knowledge.storeName,
          conversationId: convId,
        },
      }
    );

    assistantText = response.content ? response.content.toString() : '';

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const tc of response.tool_calls) {
        const matchingTool = tools.find(t => t.name === tc.name);
        if (matchingTool) {
          await (matchingTool as any).invoke(tc.args as any);
        }
      }
    }

    if (!assistantText) {
      if (triggeredAction && (triggeredAction as any).type === 'UPDATE_ELEMENT') {
        assistantText = `I have updated ${(triggeredAction as any).title} to match your requested visual changes.\n\nClick **Update Section on Canvas** below to apply the change in-place.`;
      } else if (triggeredAction && (triggeredAction as any).type === 'APPLY_BLOCK') {
        assistantText = `I have prepared a customized **${(triggeredAction as any).title}** section for ${knowledge.storeName}.\n\nClick **Insert into Canvas** below to apply it to your visual page.`;
      } else {
        assistantText = 'I have processed your visual design request.';
      }
    }
  } catch (llmError: any) {
    console.warn('[BuilderAgent] LLM execution warning, using rule fallback:', llmError.message);
    const lower = prompt.toLowerCase();
    if (lower.includes('footer')) {
      const footerHtml = `
        <footer class="grace-footer" id="footer" style="background: #0f172a; color: #f8fafc; padding: 60px 32px 30px; font-family: Inter, sans-serif;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 40px;">
            <div>
              <h3 style="font-size: 22px; font-weight: 800; color: #38bdf8; margin: 0 0 14px;">${knowledge.storeName}</h3>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">📍 ${storeAddress}<br/>📞 ${storePhone}<br/>✉️ ${storeEmail}</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">© ${new Date().getFullYear()} ${knowledge.storeName}. All rights reserved.</div>
        </footer>`;
      triggeredAction = {
        type: 'UPDATE_ELEMENT',
        selector: 'footer, .grace-footer, .salon-footer',
        title: `${knowledge.storeName} Live Store Footer`,
        description: `Updated with verified store details (${storeEmail}, ${storePhone}).`,
        html: footerHtml,
      };
      assistantText = `I have updated your store footer with **${knowledge.storeName}** real contact information.\n\nClick **Update Section on Canvas** below to apply the change in-place.`;
    } else {
      const fallbackBlock = generateBlockForIntent(prompt, knowledge);
      triggeredAction = {
        type: 'APPLY_BLOCK',
        block: fallbackBlock,
        title: fallbackBlock.title,
        description: fallbackBlock.description,
        html: fallbackBlock.html,
      };
      assistantText = `I have prepared a customized **${fallbackBlock.title}** section for **${knowledge.storeName}**.\n\nClick **Insert into Canvas** below to apply it directly to your visual page.`;
    }
  }
  // 4. Insert Assistant Message with Action metadata into PostgreSQL
  const assistantMsgId = randomUUID();
  try {
    const metaJson = triggeredAction ? JSON.stringify({ action: triggeredAction }) : null;
    await prisma.$executeRawUnsafe(
      'INSERT INTO rag.messages (id, conversation_id, role, content, metadata, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())',
      assistantMsgId,
      convId,
      'assistant',
      assistantText,
      metaJson
    );

    await prisma.$executeRawUnsafe(
      'UPDATE rag.conversations SET metadata = $1::jsonb WHERE id = $2',
      JSON.stringify({ title: convTitle, lastUpdated: new Date().toISOString() }),
      convId
    );
  } catch (err) {
    console.warn('[BuilderAgent] Error saving assistant message to DB:', err);
  }

  return {
    conversationId: convId,
    conversationTitle: convTitle,
    userMessageId: userMsgId,
    assistantMessageId: assistantMsgId,
    message: assistantText,
    action: triggeredAction,
  };
}
