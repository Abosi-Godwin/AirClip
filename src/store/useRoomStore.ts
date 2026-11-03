import { create } from "zustand";
import Peer, { DataConnection } from "peerjs";

export interface TransferFile {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    status: "sending" | "receiving" | "completed" | "error";
    url?: string;
}

interface RoomState {
    peer: Peer | null;
    myPeerId: string;
    remotePeerId: string | null;
    connection: DataConnection | null;
    connectionStatus: "disconnected" | "connecting" | "connected";
    connectionError: string | null;
    clipboardText: string;
    files: TransferFile[];

    initializePeer: (roomId: string) => void;
    sendText: (text: string) => void;
    sendFile: (file: File) => void;
    disconnectRoom: () => void;
}

const STUN_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
];

const TURN_SERVERS: RTCIceServer[] = [];

const HOST_REGISTER_RETRY_MS = 700;
const HOST_RETRY_MS = 1500;
const GUEST_RETRIES = 3;
const GUEST_RETRY_MS = 2000;
const OPEN_TIMEOUT_MS = 15000;
const GIVE_UP_MS = 90000;

const TRANSIENT_ERRORS = ["network", "server-error", "socket-error", "socket-closed"];

const hostIdOf = (room: string) => `airclip-room-${room}-host`;
const guestIdOf = (room: string) => `airclip-room-${room}-guest`;

const peerOptions = () =>
    TURN_SERVERS.length
        ? { config: { iceServers: [...STUN_SERVERS, ...TURN_SERVERS] } }
        : {};

let session = 0;
let activeRoom = "";
let currentPeer: Peer | null = null;
let timers: ReturnType<typeof setTimeout>[] = [];
let deadline = 0;

export const useRoomStore = create<RoomState>((set, get) => {
    function later(ms: number, token: number, fn: () => void) {
        timers.push(
            setTimeout(() => {
                if (token === session) fn();
            }, ms)
        );
    }

    function clearTimers() {
        timers.forEach(clearTimeout);
        timers = [];
    }

    function releasePeer() {
        const peer = currentPeer;
        currentPeer = null;
        if (peer && !peer.destroyed) peer.destroy();
    }

    function fail(token: number, message: string) {
        if (token !== session) return;
        clearTimers();
        releasePeer();
        set({
            peer: null,
            myPeerId: "",
            connection: null,
            remotePeerId: null,
            connectionStatus: "disconnected",
            connectionError: message,
        });
    }

    function retryHost(room: string, token: number, message: string) {
        if (token !== session) return;
        releasePeer();
        set({
            peer: null,
            myPeerId: "",
            connection: null,
            remotePeerId: null,
            connectionStatus: "connecting",
        });
        if (Date.now() > deadline) {
            fail(token, message);
            return;
        }
        later(HOST_RETRY_MS, token, () => runHost(room, token, 1));
    }

    function onConnectionClosed(room: string, token: number, role: "host" | "guest") {
        if (token !== session) return;
        set({ connection: null, remotePeerId: null, connectionStatus: "connecting" });
        if (role === "guest") {
            deadline = Date.now() + GIVE_UP_MS;
            releasePeer();
            set({ peer: null, myPeerId: "" });
            later(HOST_RETRY_MS, token, () => runHost(room, token, 0));
        }
    }

    function handlePeerError(err: any, room: string, token: number) {
        if (TRANSIENT_ERRORS.includes(err?.type)) {
            if (get().connection?.open) return;
            retryHost(
                room,
                token,
                "Could not reach the connection server. Check your internet and try again."
            );
            return;
        }
        fail(token, err?.message || "Connection error");
    }

    function watchServer(peer: Peer, room: string, token: number) {
        peer.on("disconnected", () => {
            if (token === session && peer === currentPeer && peer.disconnected && !peer.destroyed) {
                peer.reconnect();
            }
        });
        peer.on("close", () => {
            if (token === session && peer === currentPeer) {
                retryHost(room, token, "Connection to the room was lost.");
            }
        });
    }

    function runHost(room: string, token: number, attempt: number) {
        if (token !== session) return;

        const peer = new Peer(hostIdOf(room), peerOptions());
        currentPeer = peer;
        set({ peer, myPeerId: "" });

        const live = () => token === session && peer === currentPeer;

        peer.on("open", (id) => {
            if (live()) set({ myPeerId: id });
        });

        peer.on("connection", (conn) => {
            if (!live()) {
                conn.close();
                return;
            }

            const existing = get().connection;
            if (existing && existing.open) {
                conn.on("open", () => conn.close());
                return;
            }

            const accept = () => {
                if (!live()) {
                    conn.close();
                    return;
                }
                set({
                    connection: conn,
                    remotePeerId: conn.peer,
                    connectionStatus: "connected",
                    connectionError: null,
                });
                setupConnectionListeners(conn, set, get, () =>
                    onConnectionClosed(room, token, "host")
                );
            };

            if (conn.open) accept();
            else conn.on("open", accept);
        });

        watchServer(peer, room, token);

        peer.on("error", (err: any) => {
            if (!live()) return;

            if (err?.type === "unavailable-id") {
                releasePeer();
                if (attempt === 0) {
                    later(HOST_REGISTER_RETRY_MS, token, () => runHost(room, token, 1));
                } else {
                    runGuest(room, token, 0);
                }
                return;
            }

            handlePeerError(err, room, token);
        });
    }

    function runGuest(room: string, token: number, attempt: number) {
        if (token !== session) return;

        const peer = new Peer(guestIdOf(room), peerOptions());
        currentPeer = peer;
        set({ peer, myPeerId: "" });

        const live = () => token === session && peer === currentPeer;

        peer.on("open", (id) => {
            if (!live()) return;
            set({ myPeerId: id });

            const conn = peer.connect(hostIdOf(room), { reliable: true });
            let opened = false;

            const unreachable = "Could not reach the other device. Check that both devices are online, or try again.";

            later(OPEN_TIMEOUT_MS, token, () => {
                if (!opened && live()) retryHost(room, token, unreachable);
            });

            conn.on("open", () => {
                if (!live()) return;
                opened = true;
                set({
                    connection: conn,
                    remotePeerId: hostIdOf(room),
                    connectionStatus: "connected",
                    connectionError: null,
                });
                setupConnectionListeners(conn, set, get, () =>
                    onConnectionClosed(room, token, "guest")
                );
            });

            conn.on("error", () => {
                if (!opened && live()) retryHost(room, token, unreachable);
            });

            conn.on("close", () => {
                if (!opened && live()) retryHost(room, token, unreachable);
            });
        });

        watchServer(peer, room, token);

        peer.on("error", (err: any) => {
            if (!live()) return;

            if (err?.type === "unavailable-id") {
                releasePeer();
                if (attempt < GUEST_RETRIES) {
                    later(GUEST_RETRY_MS, token, () => runGuest(room, token, attempt + 1));
                } else {
                    fail(token, "This room already has two devices connected.");
                }
                return;
            }

            if (err?.type === "peer-unavailable") {
                retryHost(
                    room,
                    token,
                    "Could not reach the other device. Check that both devices are online, or try again."
                );
                return;
            }

            handlePeerError(err, room, token);
        });
    }

    return {
        peer: null,
        myPeerId: "",
        remotePeerId: null,
        connection: null,
        connectionStatus: "disconnected",
        connectionError: null,
        clipboardText: "",
        files: [],

        initializePeer: (roomId: string) => {
            const room = roomId.toLowerCase();
            if (activeRoom === room && currentPeer) return;

            releasePeer();
            clearTimers();

            const token = ++session;
            activeRoom = room;
            deadline = Date.now() + GIVE_UP_MS;

            set({
                peer: null,
                myPeerId: "",
                connection: null,
                remotePeerId: null,
                connectionStatus: "connecting",
                connectionError: null,
            });

            later(0, token, () => runHost(room, token, 0));
        },

        sendText: (text: string) => {
            const { connection } = get();
            set({ clipboardText: text });

            if (connection && connection.open) {
                connection.send({ type: "TEXT_SYNC", payload: text });
            }
        },

        sendFile: (file: File) => {
            const { connection } = get();
            const fileId = Math.random().toString(36).substring(2, 9);

            const newFileEntry: TransferFile = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                progress: 0,
                status: "sending",
            };

            set((state: RoomState) => ({ files: [newFileEntry, ...state.files] }));

            if (!connection || !connection.open) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result;
                if (!buffer) return;

                connection.send({
                    type: "FILE_META",
                    payload: { id: fileId, name: file.name, size: file.size, type: file.type },
                });

                connection.send({
                    type: "FILE_CHUNK",
                    payload: { id: fileId, data: buffer },
                });

                set((state: RoomState) => ({
                    files: state.files.map((f) =>
                        f.id === fileId ? { ...f, progress: 100, status: "completed" } : f
                    ),
                }));
            };

            reader.readAsArrayBuffer(file);
        },

        disconnectRoom: () => {
            const { connection } = get();

            session += 1;
            clearTimers();
            activeRoom = "";

            if (connection) connection.close();
            releasePeer();

            set({
                peer: null,
                myPeerId: "",
                remotePeerId: null,
                connection: null,
                connectionStatus: "disconnected",
                connectionError: null,
                clipboardText: "",
                files: [],
            });
        },
    };
});

function setupConnectionListeners(
    conn: DataConnection,
    set: any,
    get: any,
    onClose: () => void
) {
    conn.on("data", (data: any) => {
        if (data.type === "TEXT_SYNC") {
            set({ clipboardText: data.payload });
        }

        if (data.type === "FILE_META") {
            const incomingFile: TransferFile = {
                id: data.payload.id,
                name: data.payload.name,
                size: data.payload.size,
                type: data.payload.type,
                progress: 0,
                status: "receiving",
            };
            set((state: RoomState) => ({ files: [incomingFile, ...state.files] }));
        }

        if (data.type === "FILE_CHUNK") {
            const { id, data: buffer } = data.payload;
            const blob = new Blob([buffer]);
            const url = URL.createObjectURL(blob);

            set((state: RoomState) => ({
                files: state.files.map((f) =>
                    f.id === id ? { ...f, progress: 100, status: "completed", url } : f
                ),
            }));
        }
    });

    conn.on("close", () => {
        if (get().connection !== conn) return;
        onClose();
    });
}