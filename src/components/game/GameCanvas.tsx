import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("./PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#000814] px-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[#071225]/80 px-6 py-8 text-center shadow-2xl shadow-black/30">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-green-300/20 bg-green-400/10">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-green-300" />
          <div className="h-7 w-7 rounded-full bg-white shadow-[inset_-5px_-5px_0_rgba(0,0,0,0.16)]" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-300">
            Loading Match
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Setting the pitch for your next shot.
          </p>
        </div>
      </div>
    </div>
  ),
});

export default function GameCanvas() {
  return <PhaserGame />;
}
