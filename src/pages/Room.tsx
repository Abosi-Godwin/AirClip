import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    Radio,
    Check,
    Send,
    FileUp,
    Download,
    Loader2,
    ShieldCheck,
    Users,
    ArrowLeft,
    FileText,
    QrCode
} from "lucide-react";
import { useRoomStore, TransferFile } from "../store/useRoomStore";
import Button from "../components/ui/Button";
import ConnectionBanner from "../components/ui/ConnectionBanner";
import ShareModal from "../components/ui/ShareModal";

const readRoute = (log: string[]) => {
    for (let i = log.length - 1; i >= 0; i--) {
        const match = log[i].match(
            /Route: (direct|relayed through TURN)(?:, (\d+) ms)?/
        );

        if (match) {
            return {
                relayed: match[1] !== "direct",
                rtt: match[2] ? Number(match[2]) : null
            };
        }
    }

    return null;
};

export const Room = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const {
        myPeerId,
        remotePeerId,
        connectionStatus,
        connectionError,
        connectionDetail,
        connectionLog,
        clipboardText,
        files,
        initializePeer,
        sendText,
        sendFile,
        disconnectRoom
    } = useRoomStore();

    const [textInput, setTextInput] = useState("");
    const [shareOpen, setShareOpen] = useState(false);
    const [copiedText, setCopiedText] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const failed = connectionStatus === "disconnected" && !!connectionError;
    const route = connectionStatus === "connected" ? readRoute(connectionLog) : null;

    const status =
        connectionStatus === "connected"
            ? { label: "Connected", text: "text-emerald-700", dot: "bg-emerald-500" }
            : failed
              ? { label: "Failed", text: "text-red-700", dot: "bg-red-500" }
              : {
                    label: "Waiting...",
                    text: "text-amber-700",
                    dot: "bg-amber-500 animate-ping"
                };

    const routeText = route
        ? [route.relayed ? "Relayed" : "Direct", route.rtt !== null ? `${route.rtt} ms` : null]
              .filter(Boolean)
              .join(" · ")
        : null;

    useEffect(() => {
        if (!roomId) return;
        initializePeer(roomId);

        return () => {
            disconnectRoom();
        };
    }, [roomId]);

    useEffect(() => {
        if (clipboardText !== textInput) {
            setTextInput(clipboardText);
        }
    }, [clipboardText]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setTextInput(val);
        sendText(val);
    };

    const handleRetry = () => {
        if (roomId) initializePeer(roomId);
    };

    const handleCopyClipboardText = () => {
        navigator.clipboard.writeText(textInput);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            sendFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            sendFile(e.target.files[0]);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={() => {
                                disconnectRoom();
                                navigate("/");
                            }}
                            className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
                            title="Leave Room"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bay-900 text-white">
                                <Radio className="h-4 w-4 text-bay-300 animate-pulse" />
                            </div>

                            <div className="min-w-0 leading-tight">
                                <p className="truncate font-bold tracking-tight text-neutral-900">
                                    Room{" "}
                                    <span className="font-mono text-bay-600">
                                        #{roomId}
                                    </span>
                                </p>
                                <p
                                    title={
                                        route
                                            ? route.relayed
                                                ? "A direct path was not possible, so traffic goes through an encrypted relay. Measured when the connection opened."
                                                : "Your devices are connected straight to each other. Measured when the connection opened."
                                            : undefined
                                    }
                                    className="mt-1 flex min-w-0 items-center gap-1.5 text-xs"
                                >
                                    <span
                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`}
                                    />
                                    <span
                                        className={`shrink-0 font-medium ${status.text}`}
                                    >
                                        {status.label}
                                    </span>
                                    {routeText && (
                                        <span className="truncate text-neutral-500">
                                            &middot; {routeText}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareOpen(true)}
                        aria-label="Share room"
                        className="flex shrink-0 items-center gap-1.5 font-medium text-xs sm:text-sm px-2.5 sm:px-3"
                    >
                        <QrCode className="h-4 w-4" />
                        <span className="hidden xs:inline">Share</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {connectionStatus !== "connected" && (
                    <div className="lg:col-span-12">
                        <ConnectionBanner
                            status={connectionStatus}
                            detail={connectionDetail}
                            error={connectionError}
                            log={connectionLog}
                            onRetry={handleRetry}
                        />
                    </div>
                )}

                <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-bay-600" />
                            <h2 className="text-lg font-bold text-neutral-900">
                                Live Clipboard Sync
                            </h2>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyClipboardText}
                            disabled={!textInput}
                        >
                            {copiedText ? "Copied" : "Copy Text"}
                        </Button>
                    </div>

                    <div className="flex-1 flex flex-col bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-4 sm:p-6 min-h-[300px]">
                        <textarea
                            value={textInput}
                            onChange={handleTextChange}
                            placeholder="Type or paste text here. It syncs instantly to the connected device..."
                            className="w-full flex-1 resize-none rounded-2xl border border-neutral-200 p-4 font-mono text-sm text-neutral-800 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20 bg-neutral-50/50"
                        />
                        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                            <span>{textInput.length} characters</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <ShieldCheck className="h-3.5 w-3.5" />{" "}
                                End-to-End Encrypted
                            </span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-bay-600" />
                            <h2 className="text-lg font-bold text-neutral-900">
                                File Dropzone
                            </h2>
                        </div>
                        <span className="text-xs font-mono text-neutral-500">
                            No size limits
                        </span>
                    </div>

                    <div
                        onDragOver={e => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleFileDrop}
                        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all bg-white shadow-sm ${
                            dragActive
                                ? "border-bay-500 bg-bay-50/50"
                                : "border-neutral-200 hover:border-bay-300"
                        }`}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bay-50 text-bay-700 mb-4">
                            <FileUp className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">
                            Drag & drop any file here, or{" "}
                            <label className="text-bay-600 underline cursor-pointer hover:text-bay-700">
                                browse
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            {route?.relayed
                                ? "Sent through an encrypted relay because a direct link was not possible"
                                : "Transfers directly peer-to-peer over WebRTC data channels"}
                        </p>
                    </div>

                    <div className="flex-1 bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-4 sm:p-6 flex flex-col gap-3 overflow-y-auto max-h-[300px]">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                            Transfer History ({files.length})
                        </h3>

                        {files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-8 text-neutral-400 text-xs">
                                No files transferred in this session yet.
                            </div>
                        ) : (
                            files.map((file: TransferFile) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bay-100 text-bay-700 font-mono text-xs font-bold">
                                            {file.name
                                                .split(".")
                                                .pop()
                                                ?.toUpperCase() || "FILE"}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-neutral-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-500 font-mono">
                                                {formatBytes(file.size)} &bull;{" "}
                                                <span className="capitalize text-bay-600 font-medium">
                                                    {file.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {file.status === "completed" &&
                                        file.url ? (
                                            <a
                                                href={file.url}
                                                download={file.name}
                                                className="flex items-center gap-1.5 rounded-xl bg-bay-900 px-3 py-2 text-xs font-semibold text-white hover:bg-bay-800 transition-colors shadow-sm"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                <span>Save</span>
                                            </a>
                                        ) : file.status === "completed" ? (
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600">
                                                <Check className="h-4 w-4" />
                                                <span>Sent</span>
                                            </div>
                                        ) : file.status === "error" ? (
                                            <div className="text-xs font-mono text-red-600">
                                                Failed
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-bay-600">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>{file.progress}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {shareOpen && roomId && (
                <ShareModal
                    url={window.location.href}
                    roomId={roomId}
                    onClose={() => setShareOpen(false)}
                />
            )}
        </div>
    );
};

export default Room;
