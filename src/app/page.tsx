import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-2 tracking-wider" style={{ color: 'var(--void-cyan)' }}>
          VOIDCRAWL
        </h1>
        <p className="text-xl mb-8" style={{ color: 'var(--void-muted)' }}>
          Descend into the void. Turn-based roguelike dungeon crawler.
        </p>

        <div className="space-y-4 flex flex-col items-center">
          <Link
            href="/play"
            className="inline-block px-8 py-4 text-xl font-bold tracking-widest border-2 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: 'var(--void-cyan)',
              color: 'var(--void-cyan)',
              backgroundColor: 'transparent',
            }}
          >
            ENTER THE VOID
          </Link>
          <Link
            href="/play/daily"
            className="inline-block px-6 py-3 text-sm font-bold tracking-widest border-2 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: '#c084fc',
              color: '#c084fc',
              backgroundColor: 'transparent',
            }}
          >
            DAILY VOID
          </Link>
          <p className="text-xs" style={{ color: 'var(--void-muted)' }}>
            Same dungeon for everyone, once per day
          </p>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-sm" style={{ color: 'var(--void-muted)' }}>
          <div>
            <div className="text-2xl mb-2">&#9876;</div>
            <div className="font-bold mb-1">Turn-Based Combat</div>
            <div>Tactical fights against procedural enemies</div>
          </div>
          <div>
            <div className="text-2xl mb-2">&#9881;</div>
            <div className="font-bold mb-1">Procedural Dungeons</div>
            <div>Every run is different</div>
          </div>
          <div>
            <div className="text-2xl mb-2">&#9733;</div>
            <div className="font-bold mb-1">Loot & Progression</div>
            <div>Unlock heroes and discover items</div>
          </div>
        </div>
      </div>
    </div>
  );
}
