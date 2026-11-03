import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface ConnectionBannerProps {
    status: "disconnected" | "connecting" | "connected";
    detail: string;
    error: string | null;
    log: string[];
    onRetry: () => void;
}

const ConnectionBanner = ({ status, detail, error, log, onRetry }: ConnectionBannerProps) => {
    const [showLog, setShowLog] = useState(false);

    if (status === "connected") return null;

    const failed = status === "disconnected" && !!error;
    const message = failed ? error : detail || "Connecting...";

    const tone = failed
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

    return (
        <div
            role={failed ? "alert" : "status"}
            aria-live="polite"
            className={`rounded-2xl border p-4 ${tone}`}
        >
            <div className="flex items-start gap-3">
                {failed ? (
                    <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                    >
                        !
                    </span>
                ) : (
                    <span
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"
                    />
                )}

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                        {failed ? "Could not connect" : "Connecting"}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed">{message}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {failed && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                Try again
                            </button>
                        )}

                        {log.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowLog((value) => !value)}
                                aria-expanded={showLog}
                                className="text-sm font-medium underline underline-offset-4 hover:no-underline"
                            >
                                {showLog ? "Hide details" : "Connection details"}
                            </button>
                        )}
                    </div>

                    {showLog && (
                        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-neutral-900 p-3 font-mono text-xs leading-relaxed text-neutral-100">
                            {log.join("\n")}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectionBanner;
