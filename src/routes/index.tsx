import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bolt, Boxes, ChevronDown, Gamepad2, Grid2X2, Layers, Maximize, Play, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/game-card';
import { games, otherGames, type Game, type GameVersion } from '@/lib/games';

const pad = (n: number) => String(n).padStart(2, '0');
const allVersions = [...games, ...otherGames].reduce((n, g) => n + g.versions.length, 0);

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Crack Launcher — High Seas Game Library' },
    { name: 'description', content: 'Play High Seas V1 and V2 in Crack Launcher. Jump into the latest release or revisit every original version.' },
    { property: 'og:title', content: 'Crack Launcher — High Seas Game Library' },
    { property: 'og:description', content: 'Your ocean. Your adventure. Play all six High Seas versions right in your browser.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<'library' | 'versions' | 'other'>('library');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState<{ game: Game; version: GameVersion } | null>(null);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const featured = games[1];
  const launch = (game: Game, version: GameVersion) => setPlaying({ game, version });
  const allGames = [...games, ...otherGames];
  const query = search.trim().toLowerCase();
  const matches = (game: Game) => [game.name, game.edition, ...game.versions.map(v => v.label)].some(s => s.toLowerCase().includes(query));
  const visibleGames = (view === 'versions' ? allGames : games).filter(matches);
  const otherVisible = otherGames.filter(matches);
  return <div className="launcher">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Bolt fill="currentColor" strokeWidth={1.5} /></span><span>crack<br />launcher<span className="text-primary">.</span></span></div>
      <div className="sidebar-label">YOUR SPACE</div>
      <nav className="side-nav" aria-label="Launcher navigation">
        <Button variant="ghost" className={`nav-item ${view === 'library' ? 'active' : ''}`} aria-label="Game library" onClick={() => setView('library')}><Grid2X2 /><span className="nav-text">Game library</span><span className="nav-count">{pad(games.length)}</span></Button>
        <Button variant="ghost" className={`nav-item ${view === 'versions' ? 'active' : ''}`} aria-label="All versions" onClick={() => setView('versions')}><Layers /><span className="nav-text">All versions</span><span className="nav-count">{pad(allVersions)}</span></Button>
        <Button variant="ghost" className={`nav-item ${view === 'other' ? 'active' : ''}`} aria-label="Other games" onClick={() => setView('other')}><Boxes /><span className="nav-text">Other games</span><span className="nav-count">{pad(otherGames.length)}</span></Button>
      </nav>
      <div className="sidebar-bottom"><p><span className="online-dot" />All systems ready</p><p className="mt-3 opacity-60">Crack Launcher / 2026</p></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-title">Crack Launcher<span className="text-primary">.</span></div><label className="search"><Search size={16} /><input placeholder="Find your next game" aria-label="Search games" value={search} onChange={e => setSearch(e.target.value)} /></label></header>
      {view !== 'other' && featured && <section className="feature" aria-label="Featured game">
        <img className="feature-image" src={featured.cover} fetchPriority="high" alt="High Seas V2 tugboat sailing across blue ocean waves" />
        <div className="feature-meta">{featured.versions[0]?.label} · LATEST RELEASE</div>
        <div className="feature-content"><div className="eyebrow"><Sparkles size={13} /> THE NEXT CHAPTER</div><h1>HIGH SEAS<span>V2<span className="text-primary">.</span></span></h1><p className="feature-description">Take the helm. Chase the horizon.<br />The ocean just got a whole lot wilder.</p><div className="feature-actions"><Button className="play-feature" onClick={() => { const latest = featured.versions[0]; if (latest) launch(featured, latest); }}><Play fill="currentColor" /> Launch game<ArrowUpRight /></Button><span className="version-note">{featured.versions[0]?.label} · Ready to play</span></div></div>
        <div className="feature-index"><i /><i /></div>
      </section>}
      <section aria-label={view === 'other' ? 'Other games' : 'Game library'}>
        <div className="library-header"><div className="library-heading"><h2>{view === 'other' ? 'Other games' : view === 'versions' ? 'All game versions' : 'Your game library'}</h2><span>{view === 'other' ? String(otherVisible.length).padStart(2, '0') : view === 'library' ? pad(games.length) : pad(allVersions)}</span></div><div className="library-filter"><Gamepad2 size={14} />{view === 'other' ? 'External games' : 'All games'}<ChevronDown size={13} /></div></div>
        {view === 'other' ? <>
          <div className="game-grid dense">{otherVisible.map(game => <GameCard key={game.id} game={game} showVersions={false} onPlay={launch} />)}{otherGames.length === 0 && [1, 2, 3].map(i => <div className="game-slot" key={i}><span className="slot-plus"><Plus size={15} /></span><span className="slot-title">Empty slot</span><span className="slot-note">Room for a new game later</span></div>)}</div>
          {otherGames.length > 0 && otherVisible.length === 0 && <p className="empty-state">No games found for “{search}”.</p>}
        </> : <>
          <div className={`game-grid ${view === 'versions' ? 'dense' : ''}`}>{visibleGames.map(game => <GameCard key={game.id} game={game} showVersions={view === 'versions'} onPlay={launch} />)}</div>
          {visibleGames.length === 0 && <p className="empty-state">No games found for “{search}”.</p>}
        </>}
      </section>
      <footer className="launcher-footer"><span>GOOD GAMES. NO DETOURS.</span><span>{games.length + otherGames.length} games<span className="mx-3">/</span>{allVersions} versions<span className="mx-3">/</span>One launcher.</span></footer>
    </main>
    {playing && <div className="player" role="dialog" aria-modal="true" aria-label={`Playing ${playing.game.name}`}>
      <div className="player-bar"><div className="player-bar-title"><Button variant="ghost" onClick={() => setPlaying(null)}><ArrowLeft /><span>Library</span></Button><span className="player-label">{playing.game.name}</span></div><div className="flex items-center gap-2"><select aria-label="Playing version" value={playing.version.file} onChange={e => { const version = playing.game.versions.find(v => v.file === e.target.value); if (version) setPlaying({ ...playing, version }); }}>{playing.game.versions.map(version => <option value={version.file} key={version.file}>{version.label}{version.latest ? ' · Latest' : ''}</option>)}</select><Button variant="ghost" size="icon" title="Fullscreen" aria-label="Fullscreen game" onClick={() => { const player = document.querySelector('.player'); if (player && !document.fullscreenElement) player.requestFullscreen().catch(() => {}); else if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }}><Maximize /></Button></div></div>
      {loadedFile !== playing.version.file && <div className="player-loading" aria-hidden><span className="player-spinner" /><p>Loading {playing.game.name}…</p></div>}
      <iframe key={playing.version.file} src={playing.version.file.startsWith('http') || playing.version.file.startsWith('/') ? playing.version.file : `/games/${playing.version.file}`} title={`${playing.game.name} ${playing.version.label}`} allow="fullscreen; autoplay" onLoad={() => setLoadedFile(playing.version.file)} />
    </div>}
  </div>;
}
