declare const process: { env: Record<string, string | undefined> };

const clean = (value: string | undefined) => (value || "").trim();

export default {
    async fetch(request: Request) {
        const debug = new URL(request.url).searchParams.get("debug") === "1";

        const app = clean(process.env.METERED_APP)
            .replace(/^https?:\/\//i, "")
            .replace(/\/.*$/, "")
            .replace(/\.metered\.live$/i, "");
        const key = clean(process.env.METERED_API_KEY);

        const problem = (status: number, error: string, extra: Record<string, unknown> = {}) =>
            Response.json(
                debug ? { error, host: app ? `${app}.metered.live` : null, ...extra } : { error },
                { status }
            );

        if (!app || !key) {
            return problem(503, "TURN is not configured");
        }

        if (!/^[a-z0-9-]+$/i.test(app)) {
            return problem(503, "METERED_APP looks wrong. Use only the app name");
        }

        let upstream: Response;

        try {
            upstream = await fetch(
                `https://${app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`
            );
        } catch (err: any) {
            return problem(502, "TURN provider unreachable", {
                stage: "connect",
                reason: String(err?.cause?.code || err?.cause?.message || err?.message || "unknown"),
            });
        }

        if (!upstream.ok) {
            return problem(502, "TURN provider error", { stage: "status", status: upstream.status });
        }

        let data: any;

        try {
            data = await upstream.json();
        } catch (err) {
            return problem(502, "TURN provider returned something unexpected", { stage: "parse" });
        }

        const iceServers = Array.isArray(data) ? data : (data?.iceServers ?? []);

        return Response.json(iceServers, {
            headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
        });
    },
};
