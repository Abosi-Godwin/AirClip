import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Share2, X } from "lucide-react";

interface ShareModalProps {
    url: string;
    roomId: string;
    onClose: () => void;
}

const primaryClass =
    "flex flex-1 items-center justify-center gap-2 rounded-xl bg-bay-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-bay-800";

const secondaryClass =
    "flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50";

const ShareModal = ({ url, roomId, onClose }: ShareModalProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [shown, setShown] = useState(false);
    const [copied, setCopied] = useState(false);

    const canShare =
        typeof navigator !== "undefined" && typeof navigator.share === "function";

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const frame = requestAnimationFrame(() => setShown(true));
        closeRef.current?.focus();

        return () => {
            cancelAnimationFrame(frame);
            document.body.style.overflow = overflow;
            previous?.focus?.();
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }

            if (e.key !== "Tab" || !dialogRef.current) return;

            const items =
                dialogRef.current.querySelectorAll<HTMLElement>("button, input");
            if (items.length === 0) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            inputRef.current?.select();
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: "AirClip room",
                text: `Join my AirClip room ${roomId}`,
                url
            });
        } catch {
            return;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`absolute inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${
                    shown ? "opacity-100" : "opacity-0"
                }`}
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-title"
                className={`relative w-full max-w-md rounded-t-3xl border border-neutral-200/80 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl transition duration-200 motion-reduce:transition-none sm:rounded-3xl sm:p-6 ${
                    shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="share-title"
                            className="text-lg font-bold text-neutral-900"
                        >
                            Join this room
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Scan the code on the other device, or send the link.
                        </p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mx-auto mt-5 w-full max-w-[15rem] rounded-2xl border border-neutral-200 bg-white p-4">
                    <QRCodeSVG
                        value={url}
                        size={256}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0a0a0a"
                        style={{ display: "block", width: "100%", height: "auto" }}
                    />
                </div>

                <p className="mt-3 text-center font-mono text-xs text-neutral-500">
                    Room <span className="text-bay-600">#{roomId}</span>
                </p>

                <input
                    ref={inputRef}
                    readOnly
                    value={url}
                    aria-label="Room link"
                    onFocus={e => e.currentTarget.select()}
                    className="mt-4 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-xs text-neutral-700 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20"
                />

                <div className="mt-3 flex gap-2">
                    {canShare && (
                        <button
                            type="button"
                            onClick={handleShare}
                            className={primaryClass}
                        >
                            <Share2 className="h-4 w-4" />
                            Share link
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={canShare ? secondaryClass : primaryClass}
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy link"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
