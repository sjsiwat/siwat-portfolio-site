/**
 * github-contributions — Cloudflare Worker
 *
 * GitHub's contribution calendar is only available through the GraphQL API,
 * which requires a token. A static page cannot hold one, so this Worker keeps
 * the token server-side and hands the page a small, already-shaped JSON body.
 *
 * Deploy:
 *   wrangler secret put GITHUB_TOKEN     # classic PAT, no scopes needed for public data
 *   wrangler deploy
 */

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function cors(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env, ctx) {
    const allowed = (env.ALLOWED_ORIGINS || "https://siwat.me")
      .split(",")
      .map((s) => s.trim());
    const headers = cors(request.headers.get("Origin") || "", allowed);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // One upstream call an hour is plenty — the calendar moves once a day.
    const cache = caches.default;
    const cacheKey = new Request(new URL(request.url).origin + "/calendar", request);
    const hit = await cache.match(cacheKey);
    if (hit) {
      const body = await hit.text();
      return new Response(body, {
        headers: { ...headers, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const login = env.GITHUB_LOGIN || "sjsiwat";

    const upstream = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "siwat.me-contributions",
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "upstream", status: upstream.status }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const json = await upstream.json();
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) {
      return new Response(JSON.stringify({ error: "no calendar" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Flatten to [week, weekday, count, level] so the page does no reshaping.
    const days = [];
    calendar.weeks.forEach((week, w) => {
      week.contributionDays.forEach((d) => {
        days.push([w, d.weekday, d.contributionCount, LEVELS[d.contributionLevel] ?? 0]);
      });
    });

    const payload = JSON.stringify({
      login,
      total: calendar.totalContributions,
      weeks: calendar.weeks.length,
      from: calendar.weeks[0]?.contributionDays[0]?.date ?? null,
      to: days.length ? calendar.weeks.at(-1).contributionDays.at(-1).date : null,
      days,
    });

    const cacheable = new Response(payload, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    });
    ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));

    return new Response(payload, {
      headers: { ...headers, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  },
};
