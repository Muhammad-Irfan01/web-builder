import { type LoaderFunctionArgs } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = params.token;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  console.log(`[ACME Challenge] Incoming request for token: ${token} on host: ${host}`);

  if (!token || !host) {
    return new Response("Missing token or host", { status: 400 });
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    console.error("[ACME Challenge] Cloudflare credentials missing in env");
    return new Response("Cloudflare configuration missing on server", { status: 500 });
  }

  try {
    // Query custom hostname status from Cloudflare
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${host}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!res.ok) {
      console.error(`[ACME Challenge] Cloudflare API error fetching custom hostname: ${res.status}`);
      return new Response("Failed to fetch validation from Cloudflare", { status: 502 });
    }

    const data = await res.json();
    const hostnameObj = data.result?.find((item: any) => item.hostname === host);
    if (!hostnameObj) {
      console.warn(`[ACME Challenge] Hostname ${host} not found in Cloudflare zone`);
      return new Response("Hostname not registered on Cloudflare", { status: 404 });
    }

    // Look for a validation record matching the token
    const validationRecords = hostnameObj.ssl?.validation_records;
    if (!validationRecords || !Array.isArray(validationRecords)) {
      console.warn(`[ACME Challenge] No validation records found for ${host}`);
      return new Response("No validation records found", { status: 404 });
    }

    const matchingRecord = validationRecords.find((record: any) => {
      // http_url is e.g. "http://shop.example.com/.well-known/acme-challenge/bKfOzSJs_hFPW4MsWGPo5Q"
      return record.http_url?.endsWith(`/acme-challenge/${token}`) || record.http_url?.includes(token);
    });

    if (!matchingRecord) {
      console.warn(`[ACME Challenge] No matching validation record for token ${token}`);
      return new Response("Validation record token mismatch", { status: 404 });
    }

    console.log(`[ACME Challenge] Successfully matched token ${token}. Returning challenge response!`);

    return new Response(matchingRecord.http_body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[ACME Challenge] Error processing request:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
