"use client";

// V-ribbon — a black mourning ribbon folded across the top-left corner,
// with a small Portugal flag, in memory of the fallen. 🖤🇵🇹
// Purely decorative: fixed position, pointer-events disabled, aria-hidden.

export default function MourningRibbon() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "110px",
        height: "110px",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 70,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "26px",
          left: "-34px",
          width: "160px",
          transform: "rotate(-45deg)",
          background: "linear-gradient(180deg, #1a1a1a 0%, #000000 55%, #262626 100%)",
          color: "#ffffff",
          textAlign: "center",
          padding: "5px 0",
          fontSize: "14px",
          lineHeight: 1,
          boxShadow: "0 3px 8px rgba(0,0,0,0.45)",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          borderBottom: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        🇵🇹
      </div>
      {/* Folded-corner shadow tips, giving the band its classic ribbon look */}
      <div
        style={{
          position: "absolute",
          top: "76px",
          left: "0px",
          borderStyle: "solid",
          borderWidth: "0 0 7px 7px",
          borderColor: "transparent transparent transparent #000000",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "0px",
          left: "76px",
          borderStyle: "solid",
          borderWidth: "0 7px 7px 0",
          borderColor: "transparent #000000 transparent transparent",
          opacity: 0.55,
        }}
      />
    </div>
  );
}
