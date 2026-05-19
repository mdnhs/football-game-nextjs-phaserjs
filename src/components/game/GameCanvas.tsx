import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("./PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#000814]">
      <div className="text-center">
        <div className="mb-4 text-4xl">⚽</div>
        <p className="text-sm text-green-400 animate-pulse">Loading game...</p>
      </div>
    </div>
  ),
});

export default function GameCanvas() {
  return <PhaserGame />;
}
