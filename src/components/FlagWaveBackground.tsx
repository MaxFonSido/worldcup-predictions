// Beautiful static flag image — manual on/off via Admin toggle.
// The image sits fixed in the viewport behind content at reduced opacity.
// Place the flag image at public/flag-bg.png in the repo.
export default function FlagWaveBackground() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/flag-bg.png"
      alt=""
      aria-hidden="true"
      className="flag-bg-img"
    />
  );
}
