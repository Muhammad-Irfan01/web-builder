import { prisma } from '../lib/database.server';
import { requireAuth } from '../lib/auth.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);

function isApexDomain(domain: string): boolean {
  const parts = domain.split('.');
  if (parts.length <= 2) return true;
  // Handle common two-part TLDs (e.g. co.uk, com.br, net.in)
  const secondToLast = parts[parts.length - 2];
  const commonSecondLevelTLDs = ['co', 'com', 'net', 'org', 'gov', 'edu', 'asn', 'id', 'ne'];
  if (parts.length === 3 && commonSecondLevelTLDs.includes(secondToLast)) {
    return true; // brand.co.uk is apex
  }
  return false;
}

async function registerCloudflareCustomHostname(hostname: string) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    console.error('[Cloudflare] Missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN in env');
    return { success: false, error: 'Cloudflare configuration missing' };
  }

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        hostname: hostname,
        ssl: {
          method: 'http',
          type: 'dv'
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors?.some((e: any) => e.code === 1437 || e.message?.toLowerCase().includes('already exists'))) {
        console.log(`[Cloudflare] Custom hostname ${hostname} is already registered.`);
        return { success: true, alreadyExists: true };
      }
      console.error('[Cloudflare API Error]:', data);
      return { success: false, error: data.errors?.[0]?.message || 'Cloudflare API error' };
    }

    console.log(`[Cloudflare] Successfully registered custom hostname ${hostname}:`, data);
    return { success: true, data: data.result };
  } catch (err: any) {
    console.error('[Cloudflare Fetch Error]:', err);
    return { success: false, error: err.message || 'Fetch failed' };
  }
}

async function deleteCloudflareCustomHostname(hostname: string) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    console.warn('[Cloudflare] Missing configuration. Skipping Cloudflare delete.');
    return false;
  }

  try {
    const listRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${hostname}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!listRes.ok) {
      console.error('[Cloudflare] Failed to list custom hostname for deletion');
      return false;
    }

    const listData = await listRes.json();
    const hostnameObj = listData.result?.find((item: any) => item.hostname === hostname);
    if (!hostnameObj) {
      console.log(`[Cloudflare] Custom hostname ${hostname} not found in Cloudflare to delete.`);
      return true;
    }

    const hostnameId = hostnameObj.id;

    const deleteRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${hostnameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) {
      console.error('[Cloudflare] Failed to delete custom hostname:', deleteData);
      return false;
    }

    console.log(`[Cloudflare] Successfully deleted custom hostname ${hostname}`);
    return true;
  } catch (err) {
    console.error('[Cloudflare Delete Error]:', err);
    return false;
  }
}

async function verifyCloudflareCustomHostnameStatus(hostname: string): Promise<{ isVerified: boolean; sslStatus: string; hostnameStatus: string }> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return { isVerified: false, sslStatus: 'unknown', hostnameStatus: 'unknown' };
  }

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${hostname}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!res.ok) return { isVerified: false, sslStatus: 'unknown', hostnameStatus: 'unknown' };

    const data = await res.json();
    const hostnameObj = data.result?.find((item: any) => item.hostname === hostname);
    if (!hostnameObj) {
      return { isVerified: false, sslStatus: 'not_found', hostnameStatus: 'not_found' };
    }

    const isVerified = hostnameObj.status === 'active' && hostnameObj.ssl?.status === 'active';
    return {
      isVerified,
      sslStatus: hostnameObj.ssl?.status || 'unknown',
      hostnameStatus: hostnameObj.status || 'unknown'
    };
  } catch (err) {
    console.error('[Cloudflare Verify Error]:', err);
    return { isVerified: false, sslStatus: 'error', hostnameStatus: 'error' };
  }
}

/**
 * GET: List all domains or Verify a specific domain.
 */
export async function loader({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const auth = await requireAuth(request);
  const { storeId } = auth;
  const { projectId } = params;
  
  const url = new URL(request.url);
  const hostnameToVerify = url.searchParams.get('hostname');

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, storeId },
    include: { domains: true }
  });

  if (!project) {
    return jsonWithCors({ error: 'Project not found' }, request, { status: 404 });
  }

  // 1. If hostname provided, perform verification
  if (hostnameToVerify) {
    const domain = project.domains.find((d: any) => d.hostname === hostnameToVerify);
    if (!domain) return jsonWithCors({ error: 'Domain not found for this project' }, request, { status: 404 });

    let isNowVerified = domain.isVerified;
    let cfStatus = { isVerified: false, sslStatus: 'unknown', hostnameStatus: 'unknown' };

    if (!isNowVerified) {
      // A. Query Cloudflare API status first (most authoritative)
      cfStatus = await verifyCloudflareCustomHostnameStatus(domain.hostname);
      if (cfStatus.isVerified) {
        isNowVerified = true;
      } else {
        // B. Fallback to DNS lookup check
        try {
          const isApex = isApexDomain(domain.hostname);
          if (isApex) {
            const ips = await resolve4(domain.hostname);
            // Pointed directly to our server IP
            isNowVerified = ips.includes('142.44.136.233');
          } else {
            const cnames = await resolveCname(domain.hostname);
            isNowVerified = cnames.some(addr => 
              addr.toLowerCase() === 'sandbox.wattlesol.com' || 
              addr.toLowerCase() === 'sandbox.wattlesol.com.' ||
              addr.toLowerCase() === 'published.wattlesol.com' || 
              addr.toLowerCase() === 'published.wattlesol.com.'
            );
          }
        } catch (err) {
          console.warn(`[Domain Verify] DNS lookup failed for ${domain.hostname}`);
        }
      }

      if (isNowVerified) {
        await prisma.domain.update({
          where: { id: domain.id },
          data: { isVerified: true }
        });
      }
    }

    return jsonWithCors({
      success: true,
      verified: isNowVerified,
      domain: domain.hostname,
      dnsSettings: getDnsSettings(domain.hostname),
      cloudflareStatus: cfStatus
    }, request);
  }

  // 2. Otherwise return the list of domains
  return jsonWithCors({
    success: true,
    domains: project.domains.map((d: any) => ({
      ...d,
      dnsSettings: getDnsSettings(d.hostname)
    }))
  }, request);
}

/**
 * POST: Add domain
 * PUT: Set primary
 * DELETE: Remove domain
 */
export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const auth = await requireAuth(request);
  const { storeId } = auth;
  const { projectId } = params;

  if (request.method === 'POST') {
    const { domain } = await request.json();
    if (!domain) return jsonWithCors({ error: 'Domain name is required' }, request, { status: 400 });

    const cleanedDomain = domain.trim().toLowerCase();
    if (!cleanedDomain.includes('.') || cleanedDomain.startsWith('http://') || cleanedDomain.startsWith('https://')) {
      return jsonWithCors({ error: 'Please enter a valid domain name (e.g. store.yourbrand.com)' }, request, { status: 400 });
    }

    try {
      // 1. Check if the domain is already registered to ANY project in the system
      const existingDomain = await prisma.domain.findUnique({
        where: { hostname: cleanedDomain }
      });

      if (existingDomain) {
        return jsonWithCors({ 
          error: 'This domain is already connected to a project' 
        }, request, { status: 400 });
      }

      // 2. Create the domain
      const newDomain = await prisma.domain.create({
        data: {
          hostname: cleanedDomain,
          type: 'CUSTOM',
          projectId,
          storeId,
          isVerified: false,
          isPrimary: false
        }
      });

      // 3. Register custom hostname on Cloudflare SSL for SaaS
      const cfResult = await registerCloudflareCustomHostname(cleanedDomain);
      if (!cfResult.success) {
        console.warn(`[Cloudflare SaaS] Registration failed for ${cleanedDomain}: ${cfResult.error}`);
      }

      return jsonWithCors({ success: true, domain: newDomain }, request);
    } catch (err: any) {
      console.error('[Domain Connect Error]:', err);
      if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
        return jsonWithCors({ error: 'This domain is already connected to a project' }, request, { status: 400 });
      }
      return jsonWithCors({ 
        error: 'Failed to connect domain. The domain might already be connected to a project or is invalid.' 
      }, request, { status: 400 });
    }
  }

  if (request.method === 'PUT') {
    const { hostname, isPrimary } = await request.json();
    if (!hostname || isPrimary === undefined) return jsonWithCors({ error: 'Hostname and isPrimary status required' }, request, { status: 400 });

    if (isPrimary) {
      // Unset current primary and set this one
      await prisma.$transaction([
        prisma.domain.updateMany({
          where: { projectId, isPrimary: true },
          data: { isPrimary: false }
        }),
        prisma.domain.update({
          where: { hostname },
          data: { isPrimary: true }
        })
      ]);
      return jsonWithCors({ success: true }, request);
    }
  }

  if (request.method === 'DELETE') {
    const { hostname } = await request.json();
    if (!hostname) return jsonWithCors({ error: 'Hostname required' }, request, { status: 400 });

    const domain = await prisma.domain.findUnique({ where: { hostname } });
    if (!domain || domain.projectId !== projectId) return jsonWithCors({ error: 'Domain not found' }, request, { status: 404 });
    if (domain.type === 'SYSTEM') return jsonWithCors({ error: 'System domains cannot be removed' }, request, { status: 400 });

    await prisma.domain.delete({ where: { hostname } });

    // Also delete from Cloudflare custom hostnames
    await deleteCloudflareCustomHostname(hostname);

    return jsonWithCors({ success: true }, request);
  }

  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}

function getDnsSettings(domain: string) {
  const domainParts = domain.split('.');
  if (isApexDomain(domain)) {
    return {
      type: 'A',
      host: '@',
      value: '142.44.136.233'
    };
  } else {
    const secondToLast = domainParts[domainParts.length - 2];
    const commonSecondLevelTLDs = ['co', 'com', 'net', 'org', 'gov', 'edu', 'asn', 'id', 'ne'];
    const isThreePartApex = domainParts.length >= 3 && commonSecondLevelTLDs.includes(secondToLast);
    
    const rootPartsCount = isThreePartApex ? 3 : 2;
    const host = domainParts.slice(0, domainParts.length - rootPartsCount).join('.');
    
    return {
      type: 'CNAME',
      host: host || '@',
      value: 'sandbox.wattlesol.com'
    };
  }
}
