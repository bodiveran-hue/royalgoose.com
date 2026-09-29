export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return <img src="/logo.svg" alt="Royal Goose" className={className} />;
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Logo className="h-11 w-11" />
      <div className="leading-none">
        <div className="text-xl font-extrabold tracking-tight">
          <span className={light ? "text-white" : "text-slate-900"}>Royal</span>
          <span className="text-amber-500">Goose</span>
        </div>
        <div className={`text-[10px] font-semibold tracking-[0.18em] ${light ? "text-emerald-200" : "text-emerald-700"}`}>
          ELITE PLATFORM
        </div>
      </div>
    </div>
  );
}
