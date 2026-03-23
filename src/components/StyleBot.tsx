"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ShoppingBag,
  Heart,
  ChevronDown,
  Loader2,
  Star,
  MessageSquarePlus,
  CheckCircle2,
  ChevronRight,
  Smile,
} from "lucide-react";
import Image from "next/image";
import { useProducts } from "@/libs/products-context";
import { useFavorites } from "@/libs/favorites-context";
import { fmt, categoryOf, vibesOf, type Product } from "@/libs/products";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════ */

const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "";
const FEEDBACK_AFTER_REPLIES = 4;

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Role = "user" | "assistant";
interface TextPart {
  type: "text";
  text: string;
}
interface ProductPart {
  type: "products";
  items: Product[];
}
interface FeedbackPart {
  type: "feedback";
}
type MessagePart = TextPart | ProductPart | FeedbackPart;

interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  ts: number;
}
interface FeedbackData {
  stars: number;
  ux: string;
  productQuality: string;
  featureSuggestion: string;
  wantProducts: string;
}
type FeedbackStep =
  | "stars"
  | "ux"
  | "productQuality"
  | "featureSuggestion"
  | "wantProducts"
  | "done";

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const uid = () => Math.random().toString(36).slice(2);

function parseAssistantReply(raw: string, all: Product[]): MessagePart[] {
  const parts: MessagePart[] = [];
  const re = /\[PRODUCTS:([\w,\s-]+)\]/g;
  let last = 0,
    m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      const t = raw.slice(last, m.index).trim();
      if (t) parts.push({ type: "text", text: t });
    }
    const found = m[1]
      .split(",")
      .map((s) => s.trim())
      .map((id) => all.find((p) => p.id === id))
      .filter(Boolean) as Product[];
    if (found.length) parts.push({ type: "products", items: found });
    last = m.index + m[0].length;
  }
  const tail = raw.slice(last).trim();
  if (tail) parts.push({ type: "text", text: tail });
  return parts.length ? parts : [{ type: "text", text: raw }];
}

function buildSystemPrompt(products: Product[]): string {
  const catalog = products
    .map((p) => {
      const cat = categoryOf(p);
      const vibes = vibesOf(p).join(", ") || "—";
      const price = p.price > 0 ? fmt(p.price) : "Liên hệ";
      return `ID:${p.id} | ${p.title} | ${cat} | vibe: ${vibes} | ${price}`;
    })
    .join("\n");

  return `Bạn là Shoo — trợ lý thời trang dễ thương của Inshoo, shop thời trang nữ online Việt Nam.
KHÁCH HÀNG: Nữ 15–26 tuổi, yêu fashion.
PHONG CÁCH: Thân thiện, vui vẻ, tiếng Việt tự nhiên, gọi khách là "bạn" xưng "mình", emoji vừa phải.
KHẢ NĂNG: Gợi ý outfit, tìm sản phẩm, tư vấn phối đồ.
GỢI Ý SẢN PHẨM: Chèn [PRODUCTS:id1,id2,id3] vào đúng chỗ. Tối đa 4 sản phẩm.
CATALOG:\n${catalog}`;
}

/* ══════════════════════════════════════════════════════════════
   EMAILJS
══════════════════════════════════════════════════════════════ */
async function sendFeedbackEmail(feedback: FeedbackData, summary: string) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stars: feedback.stars,
      ux: feedback.ux,
      productQuality: feedback.productQuality,
      featureSuggestion: feedback.featureSuggestion,
      wantProducts: feedback.wantProducts,
      chatSummary: summary,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

/* ══════════════════════════════════════════════════════════════
   STAR RATING
══════════════════════════════════════════════════════════════ */
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform active:scale-75 p-0.5"
        >
          <Star
            size={24}
            fill={(hover || value) >= n ? "var(--rose)" : "transparent"}
            strokeWidth={1.5}
            style={{
              color: (hover || value) >= n ? "var(--rose)" : "var(--border)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEEDBACK CARD
══════════════════════════════════════════════════════════════ */
const STEP_ORDER: FeedbackStep[] = [
  "stars",
  "ux",
  "productQuality",
  "featureSuggestion",
  "wantProducts",
  "done",
];
const STEP_META: Record<
  Exclude<FeedbackStep, "done">,
  {
    q: string;
    field: keyof FeedbackData;
    placeholder: string;
  }
> = {
  stars: { q: "Bạn chấm Inshoo mấy sao? ⭐", field: "stars", placeholder: "" },
  ux: {
    q: "Trải nghiệm dùng web thế nào? 🖥️",
    field: "ux",
    placeholder: "VD: Muốn có bộ lọc màu...",
  },
  productQuality: {
    q: "Chất lượng sản phẩm ổn không? 📦",
    field: "productQuality",
    placeholder: "VD: Vải đẹp, size chuẩn...",
  },
  featureSuggestion: {
    q: "Muốn Inshoo có thêm tính năng gì? 💡",
    field: "featureSuggestion",
    placeholder: "VD: Virtual try-on, filter màu...",
  },
  wantProducts: {
    q: "Muốn Inshoo bổ sung thêm sản phẩm gì? 🛍️",
    field: "wantProducts",
    placeholder: "VD: Giày sneaker, đồ vintage...",
  },
};

function FeedbackCard({
  onComplete,
}: {
  onComplete: (d: FeedbackData) => void;
}) {
  const [step, setStep] = useState<FeedbackStep>("stars");
  const [data, setData] = useState<FeedbackData>({
    stars: 0,
    ux: "",
    productQuality: "",
    featureSuggestion: "",
    wantProducts: "",
  });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const idx = STEP_ORDER.indexOf(step);
  const isLast = step === "wantProducts";
  const meta = step !== "done" ? STEP_META[step] : null;
  const total = STEP_ORDER.length - 1;

  const advance = useCallback(async () => {
    const updated: FeedbackData = {
      ...data,
      ...(meta && meta.field !== "stars" ? { [meta.field]: text } : {}),
    };
    setData(updated);
    setText("");
    if (isLast) {
      setSending(true);
      try {
        await onComplete(updated);
      } finally {
        setSending(false);
      }
      setStep("done");
    } else {
      setStep(STEP_ORDER[idx + 1]);
    }
  }, [data, meta, text, isLast, idx, onComplete]);

  if (step === "done")
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl p-4 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <CheckCircle2
          size={28}
          className="mx-auto mb-2"
          style={{ color: "var(--rose)" }}
        />
        <p
          className="text-[12px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          Cảm ơn bạn! 🎀
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
          Feedback của bạn giúp Inshoo tốt hơn ♡
        </p>
      </motion.div>
    );

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Progress */}
      <div className="h-[2px]" style={{ background: "var(--border)" }}>
        <motion.div
          className="h-full"
          style={{ background: "var(--rose)" }}
          animate={{ width: `${(idx / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex items-start gap-1.5">
          <MessageSquarePlus
            size={11}
            className="mt-0.5 shrink-0"
            style={{ color: "var(--rose)" }}
          />
          <p
            className="text-[11.5px] font-medium leading-snug"
            style={{ color: "var(--ink)" }}
          >
            {meta!.q}
          </p>
        </div>

        {step === "stars" && (
          <div className="flex justify-center pb-0.5">
            <StarRating
              value={data.stars}
              onChange={(n) => {
                setData((d) => ({ ...d, stars: n }));
                setTimeout(() => setStep("ux"), 300);
              }}
            />
          </div>
        )}

        {step !== "stars" && (
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={meta!.placeholder}
            className="w-full rounded-lg px-2.5 py-2 text-[11.5px] outline-none resize-none"
            style={{
              background: "var(--cream)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              lineHeight: 1.5,
            }}
          />
        )}

        {step !== "stars" && (
          <div className="flex gap-1.5">
            <button
              onClick={advance}
              className="flex-1 h-7 rounded-lg text-[10.5px] font-medium active:scale-95"
              style={{
                background: "var(--cream)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              Bỏ qua
            </button>
            <button
              onClick={advance}
              disabled={sending}
              className="flex-[2] h-7 rounded-lg text-[10.5px] font-semibold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-60"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              {sending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : isLast ? (
                <>
                  <CheckCircle2 size={11} /> Gửi
                </>
              ) : (
                <>
                  Tiếp <ChevronRight size={11} />
                </>
              )}
            </button>
          </div>
        )}
        <p
          className="text-center text-[9px]"
          style={{ color: "var(--muted)", opacity: 0.45 }}
        >
          {idx + 1} / {total}
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRODUCT MINI-CARD
══════════════════════════════════════════════════════════════ */
function ChatProductCard({ product }: { product: Product }) {
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(product.id);
  const router = useRouter();
  const isOrder = product.metadata.product_type === "order";

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-2 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div
        className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"
        style={{ background: "var(--border)" }}
      >
        <Image
          src={product.image_urls[0] || "/placeholder.png"}
          alt={product.title}
          fill
          className="object-cover"
          sizes="48px"
        />
        {isOrder && (
          <div
            className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-center py-px"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Pre-order
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10.5px] font-medium leading-snug line-clamp-2"
          style={{ color: "var(--ink)" }}
        >
          {product.title}
        </p>
        <p
          className="text-[11px] font-semibold mt-0.5"
          style={{ color: "var(--rose)" }}
        >
          {product.price > 0 ? fmt(product.price) : "Liên hệ giá"}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle(product.id);
        }}
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-75"
        style={{
          background: liked ? "var(--rose)" : "var(--cream)",
          border: liked ? "none" : "1px solid var(--border)",
        }}
      >
        <Heart
          size={10}
          style={{
            color: liked ? "white" : "var(--muted)",
            fill: liked ? "white" : "transparent",
          }}
        />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUICK PROMPTS
══════════════════════════════════════════════════════════════ */
const QUICK_PROMPTS = [
  { label: "Cafe ☕", text: "Gợi ý outfit đi cafe cuối tuần" },
  { label: "Y2K ✨", text: "Tìm đồ theo phong cách Y2K" },
  { label: "Đi học 🎒", text: "Đồ mặc đi học trông thanh lịch" },
  { label: "Rẻ 💸", text: "Tìm đồ đẹp giá dưới 300k" },
];

/* ══════════════════════════════════════════════════════════════
   SHOO AVATAR — SVG dễ thương
══════════════════════════════════════════════════════════════ */
function ShooFace({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Mặt */}
      <circle cx="32" cy="32" r="28" fill="#FADADD" />
      {/* Tai thỏ trái */}
      <ellipse cx="18" cy="10" rx="6" ry="11" fill="#FADADD" />
      <ellipse cx="18" cy="10" rx="3.5" ry="7.5" fill="#F4A0B0" />
      {/* Tai thỏ phải */}
      <ellipse cx="46" cy="10" rx="6" ry="11" fill="#FADADD" />
      <ellipse cx="46" cy="10" rx="3.5" ry="7.5" fill="#F4A0B0" />
      {/* Mắt trái */}
      <ellipse cx="24" cy="30" rx="4" ry="4.5" fill="#2D1B1B" />
      <circle cx="25.5" cy="28.5" r="1.2" fill="white" />
      {/* Mắt phải */}
      <ellipse cx="40" cy="30" rx="4" ry="4.5" fill="#2D1B1B" />
      <circle cx="41.5" cy="28.5" r="1.2" fill="white" />
      {/* Má hồng */}
      <ellipse cx="20" cy="37" rx="5" ry="3" fill="#F9A8B8" opacity="0.6" />
      <ellipse cx="44" cy="37" rx="5" ry="3" fill="#F9A8B8" opacity="0.6" />
      {/* Miệng cười */}
      <path
        d="M27 40 Q32 45 37 40"
        stroke="#C0607A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Mũi nhỏ */}
      <ellipse cx="32" cy="37" rx="2" ry="1.2" fill="#E8909A" />
      {/* Nơ nhỏ trên đầu */}
      <path d="M26 4 Q32 8 38 4 Q32 10 26 4Z" fill="#E8677A" />
      <circle cx="32" cy="6" r="1.5" fill="#C0384A" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════════ */
function MessageBubble({
  msg,
  onFeedbackComplete,
}: {
  msg: Message;
  onFeedbackComplete: (d: FeedbackData) => void;
}) {
  const isBot = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.34, 1.2, 0.64, 1] }}
      className={`flex items-end gap-1.5 ${isBot ? "" : "flex-row-reverse"}`}
    >
      {isBot && (
        <div className="shrink-0 mb-0.5">
          <ShooFace size={26} />
        </div>
      )}
      <div
        className={`max-w-[85%] space-y-1.5 ${isBot ? "" : "items-end flex flex-col"}`}
      >
        {msg.parts.map((part, i) => {
          if (part.type === "text")
            return (
              <div
                key={i}
                className="rounded-2xl px-3 py-2 text-[12px] leading-relaxed"
                style={
                  isBot
                    ? {
                        background: "var(--surface)",
                        color: "var(--ink)",
                        borderBottomLeftRadius: 5,
                        border: "1px solid var(--border)",
                      }
                    : {
                        background: "var(--ink)",
                        color: "var(--cream)",
                        borderBottomRightRadius: 5,
                      }
                }
              >
                {part.text}
              </div>
            );
          if (part.type === "products")
            return (
              <div key={i} className="space-y-1.5 w-full">
                {part.items.map((p) => (
                  <ChatProductCard key={p.id} product={p} />
                ))}
              </div>
            );
          if (part.type === "feedback")
            return (
              <div key={i} className="w-full">
                <FeedbackCard onComplete={onFeedbackComplete} />
              </div>
            );
          return null;
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TYPING INDICATOR
══════════════════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-1.5"
    >
      <ShooFace size={26} />
      <div
        className="rounded-2xl px-3 py-2 flex gap-1"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderBottomLeftRadius: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--muted)",
              animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function StyleBot() {
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [botReplyCount, setBotReplyCount] = useState(0);
  const [feedbackShown, setFeedbackShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open && !hasGreeted && products.length > 0) {
      setHasGreeted(true);
      setMessages([
        {
          id: uid(),
          role: "assistant",
          ts: Date.now(),
          parts: [
            {
              type: "text",
              text: "Chào bạn! 🐰 Mình là Shoo — trợ lý thời trang của Inshoo.\n\nBạn đang tìm phong cách gì, hay cần gợi ý outfit hôm nay? ✨",
            },
          ],
        },
      ]);
    }
  }, [open, hasGreeted, products.length]);

  // Auto-trigger feedback sau N reply
  useEffect(() => {
    if (!feedbackShown && botReplyCount >= FEEDBACK_AFTER_REPLIES) {
      setFeedbackShown(true);
      setTimeout(() => insertFeedbackCard(), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botReplyCount, feedbackShown]);

  // Chèn feedback card vào chat
  const insertFeedbackCard = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        ts: Date.now(),
        parts: [
          {
            type: "text",
            text: "Bạn có 1 phút góp ý cho Inshoo không? 🙏 Mình rất muốn nghe!",
          },
          { type: "feedback" },
        ],
      },
    ]);
  }, []);

  const handleFeedbackComplete = useCallback(
    async (data: FeedbackData) => {
      const summary = messages
        .slice(-8)
        .filter((m) => m.role === "user")
        .map((m) =>
          m.parts
            .filter((p): p is TextPart => p.type === "text")
            .map((p) => p.text)
            .join(""),
        )
        .filter(Boolean)
        .join(" | ");
      try {
        await sendFeedbackEmail(data, summary || "(không có)");
      } catch (e) {
        console.warn("EmailJS:", e);
      }
    },
    [messages],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || products.length === 0) return;

      const userMsg: Message = {
        id: uid(),
        role: "user",
        ts: Date.now(),
        parts: [{ type: "text", text: text.trim() }],
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setLoading(true);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.parts
            .filter((p): p is TextPart => p.type === "text")
            .map((p) => p.text)
            .join("\n"),
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: buildSystemPrompt(products) },
              ...history,
            ],
          }),
        });
        const data = await res.json();
        const raw =
          data.choices?.[0]?.message?.content ??
          "Mình chưa hiểu lắm, bạn nói lại nhé 😅";
        const parts = parseAssistantReply(raw, products);

        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", ts: Date.now(), parts },
        ]);
        setBotReplyCount((c) => c + 1);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            ts: Date.now(),
            parts: [
              {
                type: "text",
                text: "Ôi mình bị lỗi rồi 😢 Bạn thử lại sau nhé!",
              },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, products],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(input);
      }
    },
    [input, send],
  );

  const showQuickPrompts = messages.length <= 1 && !loading;

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%,60%,100%{transform:translateY(0);opacity:.4}
          30%{transform:translateY(-3px);opacity:1}
        }
        @keyframes shooBounce {
          0%,100%{transform:translateY(0) scale(1)}
          50%{transform:translateY(-4px) scale(1.04)}
        }
      `}</style>

      {/* ── FAB: Shoo cute ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 16, stiffness: 280 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-0.5"
            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
          >
            {/* Name tag */}
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm"
              style={{
                background: "var(--ink)",
                color: "var(--cream)",
                letterSpacing: "0.06em",
              }}
            >
              Shoo ✦
            </span>

            {/* Avatar with bounce */}
            <div style={{ animation: "shooBounce 2.2s ease-in-out infinite" }}>
              <ShooFace size={52} />
            </div>

            {/* Unread dot */}
            {!hasGreeted && (
              <span
                className="absolute top-5 right-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                style={{
                  background: "var(--rose)",
                  border: "1.5px solid white",
                }}
              >
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CHAT PANEL (compact) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 380 }}
            className="fixed bottom-20 right-3 z-50"
            style={{ width: "min(92vw, 340px)" }}
          >
            <div
              className="rounded-[22px] overflow-hidden flex flex-col shadow-2xl"
              style={{
                background: "var(--cream)",
                border: "1px solid var(--border)",
                height: "62dvh",
                maxHeight: "480px",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 shrink-0"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background:
                    "color-mix(in srgb, var(--cream) 90%, transparent)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <ShooFace size={32} />
                <div className="flex-1">
                  <p
                    className="text-[12px] font-semibold leading-tight"
                    style={{ color: "var(--ink)" }}
                  >
                    Shoo
                  </p>
                  <p className="text-[9.5px]" style={{ color: "var(--muted)" }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 align-middle" />
                    Trợ lý Inshoo
                  </p>
                </div>

                {/* ── NÚT GÓP Ý ── */}
                <button
                  onClick={() => {
                    if (!feedbackShown) {
                      setFeedbackShown(true);
                      insertFeedbackCard();
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-95 mr-1"
                  style={{
                    background: "var(--blush)",
                    color: "var(--rose)",
                    border:
                      "1px solid color-mix(in srgb, var(--rose) 30%, transparent)",
                  }}
                >
                  <Smile size={11} />
                  Góp ý
                </button>

                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0"
                  style={{ background: "var(--surface)" }}
                >
                  <ChevronDown size={14} style={{ color: "var(--muted)" }} />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5"
                style={{ overscrollBehavior: "contain" }}
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onFeedbackComplete={handleFeedbackComplete}
                  />
                ))}

                {showQuickPrompts && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-1.5 pt-0.5"
                  >
                    <p
                      className="text-[9.5px] font-bold tracking-wider uppercase px-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      Gợi ý nhanh
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_PROMPTS.map((q) => (
                        <button
                          key={q.text}
                          onClick={() => send(q.text)}
                          className="text-[10.5px] font-medium px-2.5 py-1 rounded-full active:scale-95 transition-all"
                          style={{
                            background: "var(--surface)",
                            color: "var(--body)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {loading && <TypingIndicator />}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div
                className="px-3 pb-3 pt-2 shrink-0"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="flex items-end gap-1.5 rounded-xl px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    boxShadow: "0 0 0 1px var(--border)",
                  }}
                >
                  <ShoppingBag
                    size={13}
                    className="mb-px shrink-0"
                    style={{ color: "var(--muted)" }}
                  />
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi Shoo về outfit..."
                    disabled={loading}
                    className="flex-1 bg-transparent outline-none text-[12px] resize-none"
                    style={{
                      color: "var(--ink)",
                      lineHeight: "1.45",
                      maxHeight: "80px",
                    }}
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
                    style={{
                      background: input.trim() ? "var(--ink)" : "var(--border)",
                    }}
                  >
                    {loading ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                        color="var(--cream)"
                      />
                    ) : (
                      <Send
                        size={12}
                        color={input.trim() ? "var(--cream)" : "var(--muted)"}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
