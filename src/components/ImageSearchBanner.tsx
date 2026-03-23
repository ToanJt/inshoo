"use client";

interface Props {
  searching: boolean;
  modelReady: boolean;
  loadingPct: number;
  hasResults: boolean;
  error: string | null;
  onClear: () => void;
}

const STATUS_MESSAGES = {
  notReady: (pct: number) =>
    pct > 0 ? `Đang tải model AI… ${pct}%` : "Đang khởi tạo model AI…",
  searching: "Đang tìm sản phẩm tương tự…",
  results: "Kết quả tìm theo ảnh",
};

export function ImageSearchBanner({
  searching,
  modelReady,
  loadingPct,
  hasResults,
  error,
  onClear,
}: Props) {
  // Chỉ hiện khi có gì đó để nói
  const isLoadingModel = !modelReady && loadingPct > 0;
  const isVisible = isLoadingModel || searching || hasResults || !!error;

  if (!isVisible) return null;

  let label = "";
  if (error) label = error;
  else if (searching) label = STATUS_MESSAGES.searching;
  else if (isLoadingModel) label = STATUS_MESSAGES.notReady(loadingPct);
  else if (hasResults) label = STATUS_MESSAGES.results;

  const isProcessing = searching || isLoadingModel;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 16px",
        background: "var(--surface)",
        borderBottom:
          "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
      }}
    >
      {/* Spinner hoặc icon */}
      <div style={{ flexShrink: 0 }}>
        {isProcessing ? (
          <Spinner />
        ) : error ? (
          <span style={{ fontSize: 14 }}>⚠️</span>
        ) : (
          <span style={{ fontSize: 14 }}>🔍</span>
        )}
      </div>

      {/* Label */}
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 12,
          lineHeight: 1.4,
          color: error ? "#c00" : "var(--body)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>

      {/* Progress bar khi tải model */}
      {isLoadingModel && (
        <div
          style={{
            flexShrink: 0,
            width: 48,
            height: 3,
            borderRadius: 999,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${loadingPct}%`,
              background: "var(--rose, #e85d7a)",
              borderRadius: 999,
              transition: "width 0.3s",
            }}
          />
        </div>
      )}

      {/* Nút xoá — chỉ hiện khi không đang process */}
      {!isProcessing && (
        <button
          onClick={onClear}
          aria-label="Xoá kết quả"
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "none",
            background: "var(--border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "var(--muted)",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}

      <style>{`@keyframes _bannerSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 13,
        height: 13,
        border: "2px solid color-mix(in srgb, var(--rose, #e85d7a) 25%, transparent)",
        borderTopColor: "var(--rose, #e85d7a)",
        borderRadius: "50%",
        animation: "_bannerSpin 0.7s linear infinite",
      }}
    />
  );
}