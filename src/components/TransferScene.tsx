import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";

type Phase = "idle" | "sending" | "done";
type Kind = "image" | "pdf" | "audio" | "text";

interface FileItem {
    name: string;
    size: string;
    kind: Kind;
}

interface Sim {
    phase: Phase;
    t0: number;
    doneAt: number;
    idleSince: number;
    dragging: boolean;
    moved: boolean;
    over: boolean;
    sx: number;
    sy: number;
    dx: number;
    dy: number;
    hover: boolean;
    px: number;
    py: number;
    rx: number;
    ry: number;
    scale: number;
    dpr: number;
    visible: boolean;
    reduced: boolean;
    path: number[];
    p0x: number;
    p0y: number;
    pct: number;
}

const W = 640;
const H = 480;
const CARD_W = 92;
const CARD_H = 112;
const PHONE_CARD_W = 80;
const PHONE_CARD_H = 98;
const LAPTOP_CARD = { x: 175, y: 220 };
const PHONE_CARD = { x: 488, y: 216 };
const DEFAULT_PATH = [175, 220, 215, 8, 452, 8, 488, 216];

const SPREAD = 34;
const DONE_AT = 1800;
const DONE_HOLD = 3600;
const FADE_AT = 1950;
const FADE_LEN = 420;
const SPARK_AT = 1700;
const AUTOPLAY_WAIT = 2600;
const DROP_RADIUS = 150;

const COLORS = ["#ffffff", "#d4e2ff", "#93b4ff", "#5b86ff", "#2f5bff"];

const FILES: FileItem[] = [
    { name: "holiday.png", size: "4.2 MB", kind: "image" },
    { name: "invoice.pdf", size: "1.1 MB", kind: "pdf" },
    { name: "mixtape.mp3", size: "8.7 MB", kind: "audio" },
    { name: "notes.txt", size: "12 KB", kind: "text" },
];

const PANEL_BG =
    "radial-gradient(90% 70% at 70% 105%, rgba(31,77,245,.55) 0%, rgba(31,77,245,0) 60%), radial-gradient(70% 60% at 15% -10%, rgba(91,134,255,.28) 0%, rgba(91,134,255,0) 60%), linear-gradient(180deg, #071447 0%, #040b2e 100%)";

const GRID = (() => {
    let d = "";
    for (let x = -520; x <= 1160; x += 56) {
        d += `M${x} 262L${x + 440} 482M${x} 262L${x - 440} 482`;
    }
    return d;
})();

const CSS = `
@keyframes ts-ripple{0%{transform:scale(.25);opacity:.8}100%{transform:scale(2);opacity:0}}
@keyframes ts-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes ts-pop{0%{transform:scale(.2);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes ts-pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes ts-arrow{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(6px);opacity:1}}
@keyframes ts-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@keyframes ts-ping{75%,100%{transform:scale(2.4);opacity:0}}
@media (prefers-reduced-motion: reduce){.ts-anim{animation:none!important}}
`;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function bez(p: number[], t: number, out: number[]) {
    const mt = 1 - t;
    const a = mt * mt * mt;
    const b = 3 * mt * mt * t;
    const c = 3 * mt * t * t;
    const d = t * t * t;
    out[0] = a * p[0] + b * p[2] + c * p[4] + d * p[6];
    out[1] = a * p[1] + b * p[3] + c * p[5] + d * p[7];
    const da = 3 * mt * mt;
    const db = 6 * mt * t;
    const dc = 3 * t * t;
    const dx = da * (p[2] - p[0]) + db * (p[4] - p[2]) + dc * (p[6] - p[4]);
    const dy = da * (p[3] - p[1]) + db * (p[5] - p[3]) + dc * (p[7] - p[5]);
    const len = Math.hypot(dx, dy) || 1;
    out[2] = -dy / len;
    out[3] = dx / len;
}

function makeParticles(n: number) {
    const u = new Float32Array(n);
    const v = new Float32Array(n);
    const delay = new Float32Array(n);
    const dur = new Float32Array(n);
    const noise = new Float32Array(n);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const col = new Uint8Array(n);
    const glow = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
        u[i] = Math.random();
        v[i] = Math.random();
        delay[i] = u[i] * 380 + Math.random() * 140;
        dur[i] = 1000 + Math.random() * 250;
        noise[i] = Math.random() + Math.random() - 1;
        size[i] = 1.4 + Math.random() * Math.random() * 2.3;
        phase[i] = Math.random() * 6.283;
        const r = Math.random();
        col[i] = r < 0.28 ? 0 : r < 0.52 ? 1 : r < 0.78 ? 2 : r < 0.92 ? 3 : 4;
        glow[i] = i % 60 === 0 ? 1 : 0;
    }

    return { n, u, v, delay, dur, noise, size, phase, col, glow };
}

function makeSparks(n: number) {
    const ang = new Float32Array(n);
    const speed = new Float32Array(n);
    const col = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        ang[i] = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        speed[i] = 40 + Math.random() * 100;
        col[i] = Math.random() < 0.5 ? 0 : 2;
    }
    return { n, ang, speed, col };
}

function makeMotes(n: number) {
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const v = new Float32Array(n);
    const p = new Float32Array(n);
    const s = new Float32Array(n);
    const c = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        x[i] = Math.random() * W;
        y[i] = Math.random() * H;
        v[i] = 0.008 + Math.random() * 0.02;
        p[i] = Math.random() * 6.283;
        s[i] = 1 + Math.random() * 1.6;
        c[i] = Math.random() < 0.5 ? 1 : 2;
    }
    return { n, x, y, v, p, s, c };
}

function makeGlow() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d");
    if (g) {
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.25, "rgba(150,185,255,0.6)");
        grad.addColorStop(1, "rgba(60,100,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
    }
    return c;
}

const Layer = ({ z, scale, children }: { z: number; scale: number; children: ReactNode }) => (
    <div className="pointer-events-none absolute inset-0" style={{ transform: `translateZ(${z}px)` }}>
        <div
            className="absolute left-0 top-0"
            style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
            {children}
        </div>
    </div>
);

const Glyph = ({ kind }: { kind: Kind }) => {
    if (kind === "image") {
        return (
            <svg width="58" height="42" viewBox="0 0 58 42" aria-hidden="true">
                <rect x="1" y="1" width="56" height="40" rx="7" fill="#dce6ff" />
                <circle cx="43" cy="13" r="5" fill="#7ea2ff" />
                <path d="M4 38L21 16l11 14 7-8 15 16z" fill="#1f4df5" />
                <path d="M4 38L21 16l8 10-11 12z" fill="#0a2fd9" />
            </svg>
        );
    }
    if (kind === "pdf") {
        return (
            <svg width="58" height="42" viewBox="0 0 58 42" aria-hidden="true">
                <rect x="1" y="1" width="56" height="40" rx="7" fill="#dce6ff" />
                <rect x="8" y="8" width="22" height="12" rx="3" fill="#0a2fd9" />
                <text x="19" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="var(--font-mono), monospace">PDF</text>
                <rect x="8" y="25" width="42" height="3" rx="1.5" fill="#7ea2ff" />
                <rect x="8" y="32" width="30" height="3" rx="1.5" fill="#93b4ff" />
            </svg>
        );
    }
    if (kind === "audio") {
        const bars = [10, 22, 14, 30, 18, 34, 20, 26, 12, 20, 8];
        return (
            <svg width="58" height="42" viewBox="0 0 58 42" aria-hidden="true">
                <rect x="1" y="1" width="56" height="40" rx="7" fill="#dce6ff" />
                {bars.map((h, i) => (
                    <rect key={i} x={7 + i * 4.3} y={21 - h / 2} width="2.6" height={h} rx="1.3" fill={i % 3 === 0 ? "#0a2fd9" : "#3b6bff"} />
                ))}
            </svg>
        );
    }
    return (
        <svg width="58" height="42" viewBox="0 0 58 42" aria-hidden="true">
            <rect x="1" y="1" width="56" height="40" rx="7" fill="#dce6ff" />
            <rect x="9" y="9" width="40" height="3.2" rx="1.6" fill="#1f4df5" />
            <rect x="9" y="17" width="34" height="3.2" rx="1.6" fill="#5b86ff" />
            <rect x="9" y="25" width="40" height="3.2" rx="1.6" fill="#5b86ff" />
            <rect x="9" y="33" width="22" height="3.2" rx="1.6" fill="#93b4ff" />
        </svg>
    );
};

const FileCard = ({ file, w, h }: { file: FileItem; w: number; h: number }) => (
    <div
        style={{
            width: w,
            height: h,
            filter: "drop-shadow(0 14px 20px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(80,130,255,.55))",
        }}
    >
        <div
            className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden px-2.5 pb-2.5 pt-3"
            style={{
                background: "linear-gradient(180deg,#ffffff 0%,#e4ecff 100%)",
                borderRadius: 12,
                clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)",
            }}
        >
            <div
                className="absolute right-0 top-0"
                style={{ width: 18, height: 18, background: "linear-gradient(225deg, transparent 50%, #a9c0ff 50%)" }}
            />
            <div className="flex flex-1 items-center justify-center">
                <Glyph kind={file.kind} />
            </div>
            <div className="w-full text-center leading-tight">
                <div className="truncate text-[11px] font-semibold text-[#0a1a5c]">{file.name}</div>
                <div className="font-mono text-[9.5px] text-[#5a6aa8]">{file.size}</div>
            </div>
        </div>
    </div>
);

const Chip = ({ left, top, children }: { left: string; top: string; children: ReactNode }) => (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
        <div className="relative overflow-hidden whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium leading-none text-white ring-1 ring-white/20 backdrop-blur-md sm:text-xs">
            {children}
        </div>
    </div>
);

const Ripple = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
        {[0, 0.35].map((delay) => (
            <ellipse
                key={delay}
                className="ts-anim"
                cx={cx}
                cy={cy}
                rx="90"
                ry="30"
                fill="none"
                stroke="#7ea2ff"
                strokeWidth="2"
                style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: `ts-ripple 1.4s ease-out ${delay}s both`,
                }}
            />
        ))}
    </g>
);

const TransferScene = ({ className = "" }: { className?: string }) => {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const panelRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const pctRef = useRef<HTMLSpanElement>(null);

    const [scale, setScale] = useState(0.7);
    const [phase, setPhase] = useState<Phase>("idle");
    const [fileIndex, setFileIndex] = useState(0);
    const [over, setOver] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [rounds, setRounds] = useState(0);

    const sim = useRef<Sim>({
        phase: "idle",
        t0: 0,
        doneAt: 0,
        idleSince: 0,
        dragging: false,
        moved: false,
        over: false,
        sx: 0,
        sy: 0,
        dx: 0,
        dy: 0,
        hover: false,
        px: 0,
        py: 0,
        rx: 0,
        ry: 0,
        scale: 0.7,
        dpr: 1,
        visible: false,
        reduced: false,
        path: DEFAULT_PATH.slice(),
        p0x: LAPTOP_CARD.x,
        p0y: LAPTOP_CARD.y,
        pct: 0,
    });

    const startSend = (now: number) => {
        const m = sim.current;
        if (m.phase !== "idle") return;
        m.p0x = LAPTOP_CARD.x + m.dx;
        m.p0y = LAPTOP_CARD.y + m.dy;
        m.path = [m.p0x, m.p0y, m.p0x + 40, 8 + (m.p0y - 220) * 0.3, 452, 8, PHONE_CARD.x, PHONE_CARD.y];
        m.dx = 0;
        m.dy = 0;
        m.over = false;
        m.pct = 0;
        m.t0 = now;
        setOver(false);
        setRounds((r) => r + 1);
        if (m.reduced) {
            m.phase = "done";
            m.doneAt = now;
            setPhase("done");
            return;
        }
        m.phase = "sending";
        setPhase("sending");
    };

    const startSendRef = useRef(startSend);
    startSendRef.current = startSend;

    useEffect(() => {
        const panel = panelRef.current;
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        if (!panel || !stage || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const m = sim.current;
        const small = window.innerWidth < 640 || (navigator.hardwareConcurrency || 8) <= 4;
        const P = makeParticles(small ? 520 : 900);
        const S = makeSparks(28);
        const M = makeMotes(small ? 22 : 40);
        const glow = makeGlow();
        const pt = [0, 0, 0, 0];
        const pt2 = [0, 0, 0, 0];

        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onMedia = () => {
            m.reduced = media.matches;
        };
        onMedia();
        media.addEventListener("change", onMedia);

        const fit = () => {
            const w = panel.clientWidth;
            if (!w) return;
            m.scale = w / W;
            m.dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * m.scale * m.dpr);
            canvas.height = Math.round(H * m.scale * m.dpr);
            setScale(m.scale);
        };
        const ro = new ResizeObserver(fit);
        ro.observe(panel);
        fit();

        const tilt = (now: number) => {
            if (m.reduced) {
                stage.style.transform = "";
                return;
            }
            const live = m.hover && !m.dragging;
            const tx = (live ? m.px * 8 : 0) + Math.sin(now / 2600) * 1.8;
            const ty = (live ? -m.py * 6 : 0) + Math.cos(now / 3300) * 1.2;
            m.ry += (tx - m.ry) * 0.08;
            m.rx += (ty - m.rx) * 0.08;
            stage.style.transform = `rotateX(${m.rx.toFixed(3)}deg) rotateY(${m.ry.toFixed(3)}deg)`;
        };

        const advance = (now: number) => {
            if (m.phase === "idle") {
                if (!m.reduced && !m.dragging && now - m.idleSince > AUTOPLAY_WAIT) startSendRef.current(now);
            } else if (m.phase === "sending") {
                const e = now - m.t0;
                const pct = Math.round(clamp01((e - 250) / 1500) * 100);
                if (pct !== m.pct) {
                    m.pct = pct;
                    if (pctRef.current) pctRef.current.textContent = pct + "%";
                    if (barRef.current) barRef.current.style.width = pct + "%";
                }
                if (e > DONE_AT) {
                    m.phase = "done";
                    m.doneAt = now;
                    setPhase("done");
                }
            } else if (now - m.doneAt > DONE_HOLD) {
                m.phase = "idle";
                m.idleSince = now;
                setFileIndex((i) => (i + 1) % FILES.length);
                setPhase("idle");
            }
        };

        const drawBeam = (now: number) => {
            const sending = m.phase === "sending";
            const p = sending ? m.path : DEFAULT_PATH;
            const from = sending ? 0.16 : 0.22;
            const to = sending ? 0.8 : 0.78;
            ctx.beginPath();
            for (let i = 0; i <= 36; i++) {
                bez(p, from + ((to - from) * i) / 36, pt);
                if (i) ctx.lineTo(pt[0], pt[1]);
                else ctx.moveTo(pt[0], pt[1]);
            }
            ctx.lineCap = "round";
            ctx.setLineDash([]);
            ctx.strokeStyle = sending ? "rgba(90,140,255,0.28)" : "rgba(90,140,255,0.12)";
            ctx.lineWidth = sending ? 8 : 5;
            ctx.stroke();
            ctx.setLineDash([1.5, 9]);
            ctx.lineDashOffset = -now * 0.03;
            ctx.strokeStyle = sending ? "rgba(214,228,255,0.9)" : "rgba(170,195,255,0.5)";
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.setLineDash([]);
            if (!sending) {
                const t = from + (to - from) * ((now / 2600) % 1);
                bez(DEFAULT_PATH, t, pt);
                ctx.globalAlpha = 0.9;
                ctx.drawImage(glow, pt[0] - 14, pt[1] - 14, 28, 28);
                ctx.globalAlpha = 1;
            }
        };

        const drawParticles = (e: number) => {
            const fade = 1 - clamp01((e - FADE_AT) / FADE_LEN);
            if (fade <= 0) return;
            const p = m.path;

            for (let i = 0; i < P.n; i++) {
                const s = (e - P.delay[i]) / P.dur[i];
                const sz = P.size[i];
                let x: number;
                let y: number;
                let ap = 0;
                let k = 0;

                if (s <= 0) {
                    x = m.p0x + (P.u[i] - 0.5) * CARD_W + Math.sin(e * 0.02 + P.phase[i]) * 0.6;
                    y = m.p0y + (P.v[i] - 0.5) * CARD_H + Math.cos(e * 0.017 + P.phase[i]) * 0.6;
                } else {
                    k = s > 1 ? 1 : s;
                    const t = easeInOut(k);
                    bez(p, t, pt);
                    ap = t > 0.78 ? easeOut((t - 0.78) / 0.22) : 0;
                    const off = P.noise[i] * SPREAD * Math.sin(Math.PI * t) * (1 - ap) + Math.sin(e * 0.007 + P.phase[i]) * 2.2 * (1 - ap);
                    const fx = pt[0] + pt[2] * off;
                    const fy = pt[1] + pt[3] * off;
                    const tx = PHONE_CARD.x + (P.u[i] - 0.5) * PHONE_CARD_W;
                    const ty = PHONE_CARD.y + (P.v[i] - 0.5) * PHONE_CARD_H;
                    x = fx + (tx - fx) * ap;
                    y = fy + (ty - fy) * ap;

                    if (k < 1 && ap < 0.2 && k > 0.03) {
                        ctx.fillStyle = COLORS[P.col[i]];
                        for (let g = 1; g <= 2; g++) {
                            const tg = easeInOut(clamp01(k - g * 0.03));
                            bez(p, tg, pt2);
                            const og = P.noise[i] * SPREAD * Math.sin(Math.PI * tg) + Math.sin(e * 0.007 + P.phase[i]) * 2.2;
                            ctx.globalAlpha = (0.5 / g) * fade;
                            ctx.fillRect(pt2[0] + pt2[2] * og - sz / 2, pt2[1] + pt2[3] * og - sz / 2, sz, sz);
                        }
                    }

                    if (P.glow[i] && k < 1) {
                        ctx.globalAlpha = 0.6 * (1 - ap) * fade;
                        ctx.drawImage(glow, x - 13, y - 13, 26, 26);
                    }
                }

                ctx.globalAlpha = fade;
                ctx.fillStyle = COLORS[P.col[i]];
                ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
            }
            ctx.globalAlpha = 1;
        };

        const drawSparks = (e: number) => {
            const tau = (e - SPARK_AT) / 900;
            if (tau <= 0 || tau >= 1) return;
            for (let j = 0; j < S.n; j++) {
                const x = PHONE_CARD.x + Math.cos(S.ang[j]) * S.speed[j] * tau;
                const y = PHONE_CARD.y + Math.sin(S.ang[j]) * S.speed[j] * tau + 140 * tau * tau;
                ctx.globalAlpha = 1 - tau;
                ctx.fillStyle = COLORS[S.col[j]];
                ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
            }
            ctx.globalAlpha = 1;
        };

        const drawMotes = (now: number) => {
            for (let i = 0; i < M.n; i++) {
                const y = (((M.y[i] - now * M.v[i]) % H) + H) % H;
                const x = M.x[i] + Math.sin(now * 0.0004 + M.p[i]) * 14;
                ctx.globalAlpha = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.002 + M.p[i]));
                ctx.fillStyle = COLORS[M.c[i]];
                ctx.fillRect(x, y, M.s[i], M.s[i]);
            }
            ctx.globalAlpha = 1;
        };

        const draw = (now: number) => {
            const sc = m.scale * m.dpr;
            ctx.setTransform(sc, 0, 0, sc, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = "lighter";
            if (!m.reduced) drawMotes(now);
            drawBeam(now);
            if (m.phase !== "idle") {
                const e = now - m.t0;
                if (e < 3000) {
                    drawParticles(e);
                    drawSparks(e);
                }
            }
            ctx.globalCompositeOperation = "source-over";
        };

        let raf = 0;
        let running = false;

        const frame = (now: number) => {
            if (!running) return;
            raf = requestAnimationFrame(frame);
            tilt(now);
            advance(now);
            draw(now);
        };

        const sync = () => {
            const want = m.visible && !document.hidden;
            if (want && !running) {
                running = true;
                if (m.phase === "idle") m.idleSince = performance.now();
                raf = requestAnimationFrame(frame);
            } else if (!want && running) {
                running = false;
                cancelAnimationFrame(raf);
            }
        };

        const io = new IntersectionObserver(
            ([entry]) => {
                m.visible = entry.isIntersecting;
                sync();
            },
            { threshold: 0.15 }
        );
        io.observe(panel);
        document.addEventListener("visibilitychange", sync);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            io.disconnect();
            ro.disconnect();
            media.removeEventListener("change", onMedia);
            document.removeEventListener("visibilitychange", sync);
        };
    }, []);

    useEffect(() => {
        if (phase !== "sending") return;
        const id = window.setTimeout(() => {
            if (cardRef.current) cardRef.current.style.transform = "";
        }, 200);
        return () => window.clearTimeout(id);
    }, [phase]);

    const onPanelMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const m = sim.current;
        if (m.dragging || !panelRef.current) return;
        const r = panelRef.current.getBoundingClientRect();
        m.px = ((e.clientX - r.left) / r.width - 0.5) * 2;
        m.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        m.hover = true;
        panelRef.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
        panelRef.current.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const onPanelLeave = () => {
        sim.current.hover = false;
    };

    const onCardDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        const m = sim.current;
        if (m.phase !== "idle") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        m.dragging = true;
        m.moved = false;
        m.sx = e.clientX;
        m.sy = e.clientY;
        m.dx = 0;
        m.dy = 0;
        setDragging(true);
    };

    const onCardMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const m = sim.current;
        if (!m.dragging || !cardRef.current) return;
        m.dx = (e.clientX - m.sx) / m.scale;
        m.dy = (e.clientY - m.sy) / m.scale;
        if (Math.hypot(m.dx, m.dy) > 6) m.moved = true;
        cardRef.current.style.transform = `translate(${m.dx}px, ${m.dy}px) rotate(${(m.dx * 0.03).toFixed(2)}deg)`;
        const near = Math.hypot(LAPTOP_CARD.x + m.dx - PHONE_CARD.x, LAPTOP_CARD.y + m.dy - PHONE_CARD.y) < DROP_RADIUS;
        if (near !== m.over) {
            m.over = near;
            setOver(near);
        }
    };

    const onCardUp = () => {
        const m = sim.current;
        if (!m.dragging) return;
        m.dragging = false;
        setDragging(false);
        const near = Math.hypot(LAPTOP_CARD.x + m.dx - PHONE_CARD.x, LAPTOP_CARD.y + m.dy - PHONE_CARD.y) < DROP_RADIUS;
        if (!m.moved || near) {
            startSend(performance.now());
        } else {
            m.dx = 0;
            m.dy = 0;
            m.over = false;
            m.idleSince = performance.now();
            if (cardRef.current) cardRef.current.style.transform = "";
            setOver(false);
        }
    };

    const onCardKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startSend(performance.now());
        }
    };

    const file = FILES[fileIndex];
    const received = phase === "done";

    return (
        <div
            ref={panelRef}
            role="group"
            aria-label="Interactive demo: drag a file from the laptop to the phone"
            onPointerMove={onPanelMove}
            onPointerLeave={onPanelLeave}
            className={`relative w-full select-none overflow-hidden rounded-[2rem] shadow-2xl shadow-[#0a2280]/40 ring-1 ring-white/10 ${className}`}
            style={{ aspectRatio: "4 / 3", perspective: "1100px", background: PANEL_BG }}
        >
            <style>{CSS}</style>

            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(300px circle at var(--mx, 72%) var(--my, 28%), rgba(120,170,255,.22), rgba(120,170,255,0) 70%)",
                }}
            />

            <div ref={stageRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                <Layer z={0} scale={scale}>
                    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute left-0 top-0" aria-hidden="true">
                        <defs>
                            <radialGradient id={`${uid}fade`} cx="50%" cy="50%" r="50%">
                                <stop offset="0" stopColor="#fff" />
                                <stop offset="0.65" stopColor="#fff" stopOpacity="0.55" />
                                <stop offset="1" stopColor="#fff" stopOpacity="0" />
                            </radialGradient>
                            <mask id={`${uid}mask`}>
                                <rect x="20" y="262" width="600" height="220" fill={`url(#${uid}fade)`} />
                            </mask>
                            <linearGradient id={`${uid}plat`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#3b6bff" stopOpacity="0.28" />
                                <stop offset="1" stopColor="#0a2fd9" stopOpacity="0.06" />
                            </linearGradient>
                        </defs>
                        <g mask={`url(#${uid}mask)`}>
                            <path d={GRID} stroke="#7ea2ff" strokeOpacity="0.3" strokeWidth="1" fill="none" />
                        </g>
                        <polygon points="40,372 320,272 600,372 320,472" fill={`url(#${uid}plat)`} stroke="#7ea2ff" strokeOpacity="0.55" strokeWidth="1.2" />
                        <polygon points="110,372 320,297 530,372 320,447" fill="none" stroke="#7ea2ff" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 6" />
                        <polygon points="180,372 320,322 460,372 320,422" fill="none" stroke="#7ea2ff" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 6" />
                        {phase !== "idle" && <Ripple key={`l${rounds}`} cx={175} cy={350} />}
                        {received && <Ripple key={`p${rounds}`} cx={488} cy={352} />}
                    </svg>
                </Layer>

                <Layer z={24} scale={scale}>
                    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute left-0 top-0" aria-hidden="true">
                        <defs>
                            <linearGradient id={`${uid}frame`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#f7f9ff" />
                                <stop offset="1" stopColor="#c3cff3" />
                            </linearGradient>
                            <linearGradient id={`${uid}base`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#eef2ff" />
                                <stop offset="1" stopColor="#aebbe8" />
                            </linearGradient>
                            <linearGradient id={`${uid}screen`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stopColor="#0b2bb0" />
                                <stop offset="1" stopColor="#050f3f" />
                            </linearGradient>
                            <linearGradient id={`${uid}pscreen`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#0a2280" />
                                <stop offset="1" stopColor="#050f3f" />
                            </linearGradient>
                            <radialGradient id={`${uid}shadow`} cx="50%" cy="50%" r="50%">
                                <stop offset="0" stopColor="#000" stopOpacity="0.55" />
                                <stop offset="1" stopColor="#000" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id={`${uid}halo`} cx="50%" cy="50%" r="50%">
                                <stop offset="0" stopColor="#3b6bff" stopOpacity="0.5" />
                                <stop offset="1" stopColor="#3b6bff" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        <ellipse cx="175" cy="236" rx="210" ry="150" fill={`url(#${uid}halo)`} />
                        <ellipse cx="488" cy="226" rx="120" ry="150" fill={`url(#${uid}halo)`} />

                        <ellipse cx="175" cy="352" rx="170" ry="14" fill={`url(#${uid}shadow)`} />
                        <path d="M22 318H328Q332 318 332 322V328Q332 338 322 338H28Q18 338 18 328V322Q18 318 22 318Z" fill={`url(#${uid}base)`} />
                        <rect x="150" y="318" width="50" height="4" rx="2" fill="#8c9ad0" />
                        <rect x="30" y="112" width="290" height="206" rx="14" fill={`url(#${uid}frame)`} />
                        <rect x="40" y="122" width="270" height="186" rx="8" fill={`url(#${uid}screen)`} />
                        <circle cx="175" cy="117" r="1.6" fill="#7684b8" />

                        <circle cx="52" cy="134" r="2.4" fill="#fff" fillOpacity="0.45" />
                        <circle cx="60" cy="134" r="2.4" fill="#fff" fillOpacity="0.3" />
                        <circle cx="68" cy="134" r="2.4" fill="#fff" fillOpacity="0.2" />
                        <rect x="126" y="127" width="98" height="14" rx="7" fill="#fff" fillOpacity="0.1" />
                        <text x="175" y="137" textAnchor="middle" fontSize="7.5" fill="#fff" fillOpacity="0.7" fontFamily="var(--font-mono), monospace">airclip.app/7Q77NA</text>
                        {[0, 1, 2, 3].map((i) => (
                            <rect key={i} x="50" y={158 + i * 24} width="44" height="14" rx="5" fill="#fff" fillOpacity={0.09 - i * 0.015} />
                        ))}
                        {[0, 1, 2, 3].map((i) => (
                            <rect key={i} x="256" y={158 + i * 24} width="44" height="14" rx="5" fill="#fff" fillOpacity={0.09 - i * 0.015} />
                        ))}
                        <rect x="127" y="163" width="96" height="114" rx="12" fill="#fff" fillOpacity="0.04" stroke="#93b4ff" strokeOpacity="0.4" strokeDasharray="4 5" />

                        <ellipse cx="488" cy="354" rx="78" ry="9" fill={`url(#${uid}shadow)`} />
                        <rect x="430" y="98" width="116" height="240" rx="26" fill={`url(#${uid}frame)`} />
                        <rect x="545" y="170" width="3" height="32" rx="1.5" fill="#9aa8d8" />
                        <rect x="437" y="105" width="102" height="226" rx="20" fill={`url(#${uid}pscreen)`} />
                        <rect x="475" y="111" width="26" height="7" rx="3.5" fill="#02071f" />
                        <text x="488" y="140" textAnchor="middle" fontSize="8" fontWeight="600" fill="#fff" fillOpacity="0.7" fontFamily="var(--font-sans), system-ui, sans-serif">AirClip</text>
                        <rect x="448" y="157" width="80" height="118" rx="12" fill="#fff" fillOpacity="0.04" stroke="#93b4ff" strokeOpacity="0.6" strokeDasharray="4 5" />
                        {!received && (
                            <g className="ts-anim" style={{ animation: "ts-arrow 1.8s ease-in-out infinite" }}>
                                <path d="M488 202v28m0 0l-9-9m9 9l9-9" stroke="#93b4ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </g>
                        )}
                        <rect x="468" y="321" width="40" height="3" rx="1.5" fill="#fff" fillOpacity="0.4" />
                    </svg>

                    <div
                        style={{
                            position: "absolute",
                            left: 437,
                            top: 105,
                            width: 102,
                            height: 226,
                            borderRadius: 20,
                            opacity: over || received ? 1 : 0,
                            transition: "opacity .3s ease",
                            boxShadow: "0 0 0 2px rgba(130,175,255,.95), 0 0 44px 8px rgba(70,120,255,.7)",
                        }}
                    />
                </Layer>

                <Layer z={52} scale={scale}>
                    <div
                        ref={cardRef}
                        role="button"
                        tabIndex={0}
                        aria-label={`Send ${file.name} to the phone`}
                        onPointerDown={onCardDown}
                        onPointerMove={onCardMove}
                        onPointerUp={onCardUp}
                        onPointerCancel={onCardUp}
                        onKeyDown={onCardKey}
                        className="pointer-events-auto absolute outline-none"
                        style={{
                            left: LAPTOP_CARD.x - CARD_W / 2,
                            top: LAPTOP_CARD.y - CARD_H / 2,
                            width: CARD_W,
                            height: CARD_H,
                            touchAction: "none",
                            cursor: dragging ? "grabbing" : "grab",
                            opacity: phase === "idle" ? 1 : 0,
                            transition: dragging
                                ? "none"
                                : phase === "idle"
                                  ? "transform .45s cubic-bezier(.2,.9,.25,1.15), opacity .5s ease"
                                  : "transform .45s cubic-bezier(.2,.9,.25,1.15), opacity .12s ease",
                        }}
                    >
                        <div
                            className="ts-anim"
                            style={{ animation: dragging || phase !== "idle" ? "none" : "ts-float 3.2s ease-in-out infinite" }}
                        >
                            <FileCard file={file} w={CARD_W} h={CARD_H} />
                        </div>
                    </div>

                    <div
                        className="absolute"
                        style={{
                            left: PHONE_CARD.x - PHONE_CARD_W / 2,
                            top: PHONE_CARD.y - PHONE_CARD_H / 2,
                            width: PHONE_CARD_W,
                            height: PHONE_CARD_H,
                            opacity: received ? 1 : 0,
                            transform: received ? "scale(1)" : "scale(.9)",
                            transition: "opacity .35s ease, transform .5s cubic-bezier(.2,.9,.25,1.2)",
                        }}
                    >
                        <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${PHONE_CARD_W / CARD_W})`, transformOrigin: "0 0" }}>
                            <FileCard file={file} w={CARD_W} h={CARD_H} />
                        </div>
                        {received && (
                            <div
                                key={`ok${rounds}`}
                                className="ts-anim absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-[#052e1b]"
                                style={{ animation: "ts-pop .45s cubic-bezier(.2,.9,.25,1.2) .15s both", boxShadow: "0 0 0 3px rgba(255,255,255,.9), 0 6px 14px rgba(0,0,0,.35)" }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                            </div>
                        )}
                    </div>
                </Layer>

                <Layer z={64} scale={scale}>
                    <canvas ref={canvasRef} className="absolute left-0 top-0" style={{ width: W, height: H }} aria-hidden="true" />
                </Layer>

                <div className="pointer-events-none absolute inset-0" style={{ transform: "translateZ(92px)" }} aria-hidden="true">
                    <div className="absolute bottom-[6%] left-[6.5%] flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                        <span className="relative flex h-2 w-2">
                            <span
                                className="ts-anim absolute inline-flex h-full w-full rounded-full bg-emerald-400/70"
                                style={{ animation: "ts-ping 1.8s cubic-bezier(0,0,.2,1) infinite" }}
                            />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        Room 7Q77NA
                    </div>

                    <Chip left="27.3%" top="14%">
                        {phase === "sending" ? (
                            <>
                                Sending <span ref={pctRef}>0%</span>
                                <div
                                    ref={barRef}
                                    className="absolute bottom-0 left-0 h-[2px] bg-[#7ea2ff]"
                                    style={{ width: "0%" }}
                                />
                            </>
                        ) : received ? (
                            <>Sent in 0.8 s</>
                        ) : (
                            <span className="inline-flex items-center gap-1.5">
                                Drag to send
                                <span className="ts-anim inline-block" style={{ animation: "ts-nudge 1.2s ease-in-out infinite" }}>
                                    &rarr;
                                </span>
                            </span>
                        )}
                    </Chip>

                    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "51.5%", top: "12.7%" }}>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="11" width="14" height="9" rx="2" />
                                <path d="M8 11V8a4 4 0 018 0v3" />
                            </svg>
                        </div>
                    </div>

                    <Chip left="76.2%" top="11%">
                        {received ? (
                            <span className="text-emerald-300">Received</span>
                        ) : phase === "sending" ? (
                            <>Incoming</>
                        ) : (
                            <>Phone ready</>
                        )}
                    </Chip>
                </div>
            </div>
        </div>
    );
};

export default TransferScene;
