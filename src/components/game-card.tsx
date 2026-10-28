import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Download, Layers, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadUrl, type Game, type GameVersion } from '@/lib/games';

export function GameCard({ game, showVersions, onPlay }: { game: Game; showVersions: boolean; onPlay: (game: Game, version: GameVersion) => void }) {
  const [selected, setSelected] = useState<GameVersion | undefined>(game.versions[0]);
  const [open, setOpen] = useState(false);
  if (!selected && !game.download) return null;
  const href = game.download ? downloadUrl(game.download) : '';
  const badge = game.id === 'v2' ? 'LATEST RELEASE' : game.id === 'v1' ? 'CLASSIC' : game.download ? (selected ? 'PLAY OR DOWNLOAD' : 'PC DOWNLOAD') : 'EXTERNAL';
  const downloadButton = (variant: 'default' | 'secondary' | 'ghost', size?: 'sm') => game.download && (href
    ? <Button asChild variant={variant} size={size}><a href={href} target="_blank" rel="noopener"><Download /> Download {game.download.size}</a></Button>
    : <Button variant={variant} size={size} disabled title="The download link hasn't been set up yet"><Download /> Download soon</Button>);
  return <article className={`game-card ${open ? 'menu-open' : ''}`}>
    <div className="game-art">
      {game.cover ? <img src={game.cover} alt={`${game.name} gameplay`} width={640} height={352} loading="lazy" decoding="async" /> : <div className="cover-fallback" aria-hidden>{game.name.slice(0, 2).toUpperCase()}</div>}
      <span className="cover-badge">{badge}</span>
      <div className="cover-title"><small>{game.edition}</small>{(game.id === 'v1' || game.id === 'v2') ? `HIGH SEAS ${game.id.toUpperCase()}` : game.name.toUpperCase()}</div>
      <div className="cover-controls">
        {selected && <Button onClick={() => onPlay(game, selected)}><Play fill="currentColor" /> Play now</Button>}
        {selected && game.versions.length > 1 && <Button variant="secondary" className="version-hover" onClick={() => setOpen(!open)}><Layers /> Versions</Button>}
        {downloadButton(selected ? 'secondary' : 'default')}
      </div>
    </div>
    <div className="game-info">
      <div className="game-info-top"><h3>{game.name}</h3>{selected && <Button variant="ghost" size="icon" title={`Play ${game.name}`} aria-label={`Play ${game.name}`} onClick={() => onPlay(game, selected)}><ArrowUpRight /></Button>}</div>
      <p className="game-subtitle">{game.subtitle}</p>
      <div className="card-bottom">{selected ? <span><span className="online-dot" />Ready to play</span> : <span>Windows · {game.download?.size}</span>}
        {selected ? <div className="version-control">
          <Button size="sm" variant="ghost" aria-label={`Select ${game.name} version`} aria-expanded={open} onClick={() => setOpen(!open)}>{selected.label}{selected.latest ? ' · Latest' : ''}<ChevronDown /></Button>
          {open && <div className="version-menu" role="menu" aria-label={`${game.name} versions`}>
            {game.versions.map(version => <Button role="menuitem" variant="ghost" className="version-option" key={version.file} onClick={() => { setSelected(version); setOpen(false); }}><span>{version.label}{version.latest ? ' · Latest' : ''}</span>{selected.file === version.file && <Check />}</Button>)}
          </div>}
        </div> : downloadButton('ghost', 'sm')}
      </div>
      {showVersions && <div className="version-list">{game.versions.map(version => <Button key={version.file} variant="ghost" size="sm" onClick={() => onPlay(game, version)}>{version.label}{version.latest && ' · Latest'}<Play /></Button>)}{selected && downloadButton('ghost', 'sm')}</div>}
    </div>
  </article>;
}
