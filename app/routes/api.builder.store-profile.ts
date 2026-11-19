import { requireAuth } from '../lib/auth.server';
import type { LoaderFunctionArgs } from '@react-router/node';
import { getStoreKnowledge } from '../builder/ai/storeKnowledge.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  // The store always comes from the login, never from the query string
  const { storeId } = await requireAuth(request);
  const refresh = url.searchParams.get('refresh') === 'true';

  try {
    const knowledge = await getStoreKnowledge(storeId, refresh);
    return Response.json({
      success: true,
      profile: {
        storeId: knowledge.storeId,
        storeName: knowledge.storeName,
        industry: knowledge.industry,
        detectedNiche: knowledge.detectedNiche,
        primaryBusiness: knowledge.primaryBusiness,
        suggestedPromptChips: knowledge.suggestedPromptChips,
        capabilities: {
          hasProducts: knowledge.physicalProducts.length > 0,
          hasServices: knowledge.services.length > 0,
          productCount: knowledge.allProducts.length,
        },
        sampleItems: {
          products: knowledge.physicalProducts.slice(0, 6).map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            category: p.category,
          })),
          services: knowledge.services.slice(0, 4).map(s => ({
            title: s.title,
            duration: s.duration ? `${s.duration} ${s.durationUnit || 'mins'}` : undefined,
          })),
        },
      },
    });
  } catch (err: any) {
    console.error('[API Store Profile Error]:', err);
    return Response.json(
      {
        success: false,
        error: err.message || 'Failed to load store profile',
      },
      { status: 500 }
    );
  }
}
