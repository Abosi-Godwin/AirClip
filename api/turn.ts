declare const process: { env: Record<string, string | undefined> };

export default {
    async fetch() {
        const app = process.env.METERED_APP;
        const key = process.env.METERED_API_KEY;

        if (!app || !key) {
            return Response.json({ error: "TURN is not configured" }, { status: 503 });
        }

        try {
            const upstream = await fetch(
                `https://${app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`
            );

            if (!upstream.ok) {
                return Response.json({ error: "TURN provider error" }, { status: 502 });
            }

            const data: any = await upstream.json();
            const iceServers = Array.isArray(data) ? data : (data?.iceServers ?? []);

            return Response.json(iceServers, {
                headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
            });
        } catch (err) {
            return Response.json({ error: "TURN provider unreachable" }, { status: 502 });
        }
    },
};
