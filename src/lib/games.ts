import packedGames from './packed-games.json';
import downloadFiles from './downloads.json';

// Covers are game screenshots saved as src/assets/covers/<game id>.webp. Small WebP
// files get hashed, long-cached URLs and load far faster than the old CDN PNGs.
const covers = import.meta.glob<string>('@/assets/covers/*.webp', { eager: true, import: 'default' });
const coverFor = (id: string) => Object.entries(covers).find(([p]) => p.endsWith(`/${id}.webp`))?.[1] ?? '';

// Windows downloads are split into parts by `npm run pack-downloads` (so any static
// host can serve them) and rebuilt by public/download.html. Files missing from
// downloads.json show as "Download soon".
const downloads: Record<string, { dir: string; parts: number; size: number; v: string }> = downloadFiles;

export type GameVersion = { label: string; file: string; latest?: boolean };
export type GameDownload = { file: string; size: string };
export type Game = { id: string; name: string; subtitle: string; cover: string; edition: string; versions: GameVersion[]; download?: GameDownload };
export const downloadUrl = (d: GameDownload) => {
  const p = downloads[d.file];
  return p ? `/download.html?${new URLSearchParams({ d: p.dir, n: String(p.parts), s: String(p.size), v: p.v, f: d.file })}` : '';
};
export const games: Game[] = [
  { id: 'v1', name: 'High Seas V1', subtitle: 'The original. Just you and the ocean.', cover: coverFor('v1'), edition: 'THE ORIGINAL', versions: [
    { label: 'V1.2', file: 'highseasv1.2.html', latest: true },
    { label: 'V1.1', file: 'highseasv1.1.html' },
    { label: 'V1.0', file: 'highseasv1.html' },
  ] },
  { id: 'v2', name: 'High Seas V2', subtitle: 'Bigger waves. A whole new challenge.', cover: coverFor('v2'), edition: 'THE NEXT CHAPTER', versions: [
    { label: 'V2.1', file: 'highseasv2.1.html', latest: true },
    { label: 'V2.0', file: 'highseasv2.html' },
    { label: 'V2 Beta Hotfix', file: 'highseasv2betahotfix.html' },
    { label: 'V2 Beta', file: 'highseasv2beta.html' },
  ] },
  // Godot games run as web exports published with `npm run pack-godot`; the .exe stays a download.
  { id: 'mtbullerski', name: 'Mt Buller Ski', subtitle: 'Ski the real Mt Buller resort.', cover: coverFor('mtbullerski'), edition: 'SKI SIMULATOR',
    versions: [{ label: 'Web', file: '/games/mtbullerski/index.html', latest: true }], download: { file: 'MtBullerSki.exe', size: '212 MB' } },
  { id: 'scpfoundation', name: 'SCP: Foundation', subtitle: 'Contain the breach. Survive the facility.', cover: coverFor('scpfoundation'), edition: 'TACTICAL SHOOTER',
    versions: [{ label: 'Web', file: '/games/scpfoundation/index.html', latest: true }], download: { file: 'SCP-Foundation.exe', size: '105 MB' } },
  { id: 'rally', name: 'Rally', subtitle: 'Full PC game for Windows.', cover: coverFor('rally'), edition: 'PC GAME',
    versions: [], download: { file: 'Rally.exe', size: '1.2 GB' } },
  { id: 'iphoneduotracker', name: 'iPhone Duo Tracker', subtitle: 'Portable app for Windows.', cover: coverFor('iphoneduotracker'), edition: 'PC APP',
    versions: [], download: { file: 'iPhone-Duo-Tracker-2.2.0-portable.exe', size: '139 MB' } },
];

// Slots for future releases — the launcher's "Other games" section reads from here.
// A version file starting with http launches an external game in the player frame.
export const otherGames: Game[] = [
  { id: 'real-engine-simulator', name: 'Real Engine Simulator', subtitle: 'Pick an engine. Hear it roar.', cover: coverFor('real-engine-simulator'), edition: 'WEB SIMULATOR', versions: [
    { label: 'Play online', file: 'https://realenginesimulator.com', latest: true },
  ] },
  { id: 'worldshardestgame', name: "World's Hardest Game", subtitle: 'Dodge everything. Die anyway.', cover: coverFor('worldshardestgame'), edition: 'RAGE CLASSIC', versions: [
    { label: 'WHG 3', file: 'worldshardestgame3.html', latest: true },
    { label: 'WHG 2', file: 'worldshardestgame2.html' },
    { label: 'WHG 1', file: 'worldshardestgame.html' },
  ] },
  { id: 'zombierush', name: 'Zombie Rush', subtitle: 'Blast through the undead horde.', cover: coverFor('zombierush'), edition: 'PIXEL SHOOTER', versions: [
    { label: 'Play', file: 'zombierush.html', latest: true },
  ] },
  { id: 'wordleunlimited', name: 'Wordle Unlimited', subtitle: 'One word. Endless rounds.', cover: coverFor('wordleunlimited'), edition: 'WORD PUZZLE', versions: [
    { label: 'Play', file: 'wordleunlimited.html', latest: true },
  ] },
];
// ---- QUICK ADD ----------------------------------------------------------
// To add a game, add ONE line to quickGames below and make its file reachable:
//  - Packed (preferred, any size): `npm run pack-games -- path/to/game.html`
//    writes public/games/packed/ and src/lib/packed-games.json. It launches through
//    /play.html, which streams the gzip parts in parallel and caches them so
//    replays start instantly.
//  - Anything else is served as-is from public/games (keep those under 10 MB).
// Covers resolve by game id from src/assets/covers/<id>.webp; missing covers get
// an automatic title card.
const packed: Record<string, { dir: string; parts: number; bytes: number; v: string }> = packedGames;
const fileUrl = (f: string, title: string) => {
  const p = packed[f];
  if (p) return `/play.html?${new URLSearchParams({ g: p.dir, n: String(p.parts), b: String(p.bytes), v: p.v, t: title })}`;
  return f;
};
type Quick = [id: string, name: string, edition: string, subtitle: string, versions: [label: string, file: string][], cover?: string];
const quick = ([id, name, edition, subtitle, versions, cover = '']: Quick): Game => ({
  id, name, edition, subtitle, cover: cover || coverFor(id),
  versions: versions.map(([label, file], i) => ({ label, file, latest: i === 0 })),
});

const quickGames: Quick[] = [
  ['vex', 'Vex', 'STICKMAN PARKOUR', 'Run, jump, survive the traps.', [['Vex 8', 'vex8.htm'], ['Vex 7', 'vex7.htm'], ['Vex 6', 'vex6.htm'], ['Vex 5', 'vex5.html'], ['Vex 4', 'vex4.html']]],
  ['vex3m', 'Vex 3 Xmas', 'HOLIDAY PARKOUR', 'Festive traps, same rage.', [['Part 2', 'vexx3m2.html'], ['Part 1', 'vexx3m.html']]],
  ['tunnelrush', 'Tunnel Rush', 'REFLEX RUNNER', 'Dodge at lightspeed.', [['Play', 'tunnelrush.html']]],
  ['unicyclehero', 'Unicycle Hero', 'BALANCE', 'One wheel. Zero chill.', [['Play', 'unicyclehero.html']]],
  ['wheeliebike', 'Wheelie Bike', 'BALANCE', 'Keep that front wheel up.', [['Play', 'wheeliebike.html']]],
  ['randomsports', 'Random Sports', 'CHAOS SPORTS', 'One button. Total chaos.', [['Basket Random', 'basketrandom.html'], ['Soccer Random', 'soccerrandom.htm'], ['Boxing Random', 'boxingrandom.htm'], ['Volley Random', 'volleyrandom.html']]],
  ['webecomewhatwebehold', 'We Become What We Behold', 'STORY', 'A short game about news cycles.', [['Play', 'webecomewhatwebehold.html']]],
  ['wrestlebros', 'Wrestle Bros', 'MULTIPLAYER', 'Body-slam your bros in the ring.', [['Play', 'wrestlebros.html']]],
  ['eaglercraft', 'Eaglercraft', 'SANDBOX', 'Minecraft, right in your browser.', [['1.12', '1.12.html'], ['1.8', '1.8.html']]],
  ['slope', 'Slope', 'REFLEX RUNNER', "Roll fast. Don't fall off.", [['Slope', 'slope.html'], ['2 Player', 'slope2player.html']]],
  ['retrobowl', 'Retro Bowl', 'FOOTBALL', 'Run the team. Win the bowl.', [['Retro Bowl', 'retrobowl.html'], ['College', 'retrobowlcollege.html']]],
  ['subwaysurfers', 'Subway Surfers', 'ENDLESS RUNNER', 'Dodge trains. Outrun the inspector.', [['San Francisco', 'subwaysurferssanfrancisco.html'], ['Havana', 'subwaysurfershavana.html']]],
  ['motox3m', 'Moto X3M', 'BIKE STUNTS', 'Flips, loops and explosive tracks.', [['Spooky Land', 'motox3mspookyland.html'], ['Pool Party', 'motox3mpoolparty.html'], ['Winter', 'motox3mwinter.html'], ['Moto X3M 3', 'motox3m3.html'], ['Moto X3M 2', 'motox3m2.html'], ['Moto X3M', 'motox3m.htm']]],
  ['fireboywatergirl', 'Fireboy & Watergirl', 'CO-OP PUZZLE', 'Two heroes. Fire and water.', [['Crystal Temple', 'fireboyandwatergirl4.html'], ['Ice Temple', 'fireboyandwatergirl3.html'], ['Light Temple', 'fireboyandwatergirl2.html'], ['Forest Temple', 'fireboyandwatergirl.html']]],
  ['bloonstd', 'Bloons TD', 'TOWER DEFENSE', 'Pop every last bloon.', [['BTD 5', 'bloonsTD5.html'], ['BTD 4', 'bloonsTD4.html'], ['BTD 3', 'bloonsTD3.html']]],
  ['papas', "Papa's Restaurants", 'COOKING SIM', 'Take orders. Keep customers happy.', [['Cupcakeria', 'papascupcakeria.html'], ['Freezeria', 'papasfreezeria.html'], ['Taco Mia', 'papastacomia.html'], ['Burgeria', 'papasburgeria.html'], ['Pizzeria', 'papaspizzeria.html']]],
  ['run', 'Run', 'SPACE RUNNER', 'Run the tunnels of outer space.', [['Run 3', 'run3.html'], ['Run 2', 'run2.html'], ['Run 1', 'run.html']]],
  ['fnaf', "Five Nights at Freddy's", 'HORROR', 'Survive the night shift.', [['FNaF 2', 'fnaf2.html'], ['FNaF 1', 'fnaf.html']]],
  ['ducklife', 'Duck Life', 'TRAINING', 'Train your duck into a champion.', [['Duck Life 4', 'ducklife4.html'], ['Duck Life 3', 'ducklife3.html'], ['Duck Life 2', 'ducklife2.html'], ['Duck Life 1', 'ducklife.html']]],
  ['learntofly', 'Learn to Fly', 'LAUNCH', 'A penguin with big dreams.', [['Learn to Fly 3', 'learntofly3.html'], ['Learn to Fly 2', 'learntofly2.html'], ['Learn to Fly 1', 'learntofly.html']]],
  ['earntodie', 'Earn to Die', 'ZOMBIE DRIVING', 'Upgrade the car. Plow through zombies.', [['Earn to Die 2', 'earntodie2.html'], ['Earn to Die 1', 'earntodie.html']]],
  ['riddleschool', 'Riddle School', 'POINT & CLICK', 'Escape school one puzzle at a time.', [['Riddle School 3', 'riddleschool3.html'], ['Riddle School 2', 'riddleschool2.html'], ['Riddle School 1', 'riddleschool.html']]],
  ['badicecream', 'Bad Ice Cream', 'ARCADE PUZZLE', 'Grab the fruit. Dodge the monsters.', [['Bad Ice Cream 3', 'badicecream3.html'], ['Bad Ice Cream 2', 'badicecream2.html'], ['Bad Ice Cream 1', 'badicecream.html']]],
  ['ovo', 'OvO', 'PLATFORMER', 'Slide, dive and wall-jump.', [['OvO 2', 'ovo2.html'], ['OvO', 'ovo.html']]],
  ['geometrydash', 'Geometry Dash', 'RHYTHM', 'Jump to the beat.', [['Play', 'geometrydash.html']]],
  ['sportsbros', 'Sports Bros', 'MULTIPLAYER', 'Arcade sports with your bros.', [['Basket Bros', 'basketbros.html'], ['Football Bros', 'footballbros.html'], ['Soccer Bros', 'soccerbros.html']]],
  ['rooftopsnipers', 'Rooftop Snipers', '2 PLAYER', 'One shot. Knock them off the roof.', [['Rooftop Snipers 2', 'rooftopsnipers2.html'], ['Rooftop Snipers', 'rooftopsnipers.htm']]],
  ['sm64', 'Super Mario 64', 'PLATFORMER', 'The 3D classic, in a browser tab.', [['Play', 'sm64.html']]],
  ['angrybirds', 'Angry Birds', 'PHYSICS', 'Fling birds. Topple pigs.', [['Play', 'angrybirds.html']]],
  ['cookieclicker', 'Cookie Clicker', 'IDLE', 'Click cookies. Build an empire.', [['Play', 'cookieclicker.htm']]],
  ['2048', '2048', 'PUZZLE', 'Slide the tiles. Reach 2048.', [['Play', '2048.html']]],
  ['cuttherope', 'Cut the Rope', 'PHYSICS PUZZLE', 'Get the candy to Om Nom.', [['Play', 'cuttherope.html']]],
  ['jetpackjoyride', 'Jetpack Joyride', 'ENDLESS RUNNER', 'Jetpack through the lab.', [['Play', 'jetpackjoyride.html']]],
  ['templerun2', 'Temple Run 2', 'ENDLESS RUNNER', 'Grab the idol. Run for it.', [['Play', 'templerun2.htm']]],
  ['crossyroad', 'Crossy Road', 'ARCADE', 'Why did the chicken cross?', [['Play', 'crossyroad.htm']]],
  ['flappybird', 'Flappy Bird', 'ARCADE', 'Tap. Flap. Pipe. Repeat.', [['Play', 'flappybird.html']]],
  ['fruitninja', 'Fruit Ninja', 'ARCADE', 'Slice the fruit. Skip the bombs.', [['Play', 'fruitninja.html']]],
  ['pacman', 'Pac-Man', 'RETRO ARCADE', 'Eat the dots. Dodge the ghosts.', [['Play', 'pacman.html']]],
  ['googledino', 'Chrome Dino', 'OFFLINE CLASSIC', 'The no-internet dinosaur.', [['Play', 'googledino.html']]],
  ['doodlejump', 'Doodle Jump', 'PLATFORMER', 'Bounce higher and higher.', [['Play', 'doodlejump.html']]],
  ['stack', 'Stack', 'ARCADE', 'Stack the blocks sky high.', [['Play', 'stack.html']]],
  ['happywheels', 'Happy Wheels', 'RAGDOLL', 'Brutal physics obstacle courses.', [['Play', 'happywheels.html']]],
  ['basketballstars', 'Basketball Stars', 'SPORTS', 'One-on-one street hoops.', [['Play', 'basketballstars.html']]],
  ['drivemad', 'Drive Mad', 'PHYSICS DRIVING', 'Get the truck to the finish.', [['Play', 'drivemad.htm']]],
  ['driftboss', 'Drift Boss', 'ONE BUTTON', "Drift the corners. Don't fall.", [['Play', 'driftboss.htm']]],
  ['eggycar', 'Eggy Car', 'PHYSICS DRIVING', "Whatever you do, don't drop the egg.", [['Play', 'eggycar.html']]],
  ['snowrider', 'Snow Rider 3D', 'SLEDDING', 'Sled downhill. Dodge the trees.', [['Play', 'snowrider.htm']]],
  ['polytrack', 'PolyTrack', 'RACING', 'Low-poly time trials.', [['Play', 'polytrack.html']]],
  ['monkeymart', 'Monkey Mart', 'IDLE', 'Run a banana supermarket.', [['Play', 'monkeymart.htm']]],
  ['tinyfishing', 'Tiny Fishing', 'IDLE', 'Cast deep. Reel in rare fish.', [['Play', 'tinyfishing.html']]],
  ['idlebreakout', 'Idle Breakout', 'IDLE', 'Breakout that plays itself.', [['Play', 'idlebreakout.html']]],
  ['paperio2', 'Paper.io 2', 'IO', 'Claim land. Cut off your rivals.', [['Play', 'paperio2.htm']]],
  ['bitlife', 'BitLife', 'LIFE SIM', 'A whole life, one choice at a time.', [['Play', 'bitlife.html']]],
  ['baldisbasics', "Baldi's Basics", 'HORROR', 'Find the notebooks. Run from Baldi.', [['Play', 'baldisbasics.html']]],
  ['plantsvszombies', 'Plants vs. Zombies', 'TOWER DEFENSE', 'Defend your lawn.', [['Play', 'plantsvszombies.html']]],
  ['leveldevil', 'Level Devil', 'TROLL PLATFORMER', 'The level is out to get you.', [['Play', 'leveldevil.html']]],
  ['tombofthemask', 'Tomb of the Mask', 'ARCADE', 'Dash through a tomb maze.', [['Play', 'tombofthemask.htm']]],
  ['stickmanhook', 'Stickman Hook', 'SWING', 'Swing from rope to rope.', [['Play', 'stickmanhook.html']]],
  ['bowmasters', 'Bowmasters', 'ARCHERY', 'Aim. Fire. Knock them out.', [['Play', 'bowmasters.html']]],
  ['chess', 'Chess', 'BOARD GAME', 'Take on the computer.', [['Play', 'chess.html']]],
  ['minesweeper', 'Minesweeper', 'PUZZLE', 'Clear the board. Miss the mines.', [['Play', 'minesweeper.html']]],
  ['8ballclassic', '8 Ball Classic', 'POOL', 'Line up the shot.', [['Play', '8ballclassic.html']]],
  ['helixjump', 'Helix Jump', 'ARCADE', 'Drop down the tower.', [['Play', 'helixjump.html']]],
  ['superhot', 'Superhot', 'SHOOTER', 'Time moves only when you move.', [['Play', 'superhot.html']]],
  ['sprunki', 'Sprunki', 'MUSIC', 'Mix beats with the Sprunki crew.', [['Play', 'sprunki.html']]],
  ['melonplayground', 'Melon Playground', 'SANDBOX', 'Ragdoll sandbox chaos.', [['Play', 'melonplayground.html']]],
  ['capybaraclicker', 'Capybara Clicker', 'IDLE', 'Click capybaras. Get more capybaras.', [['Play', 'capybaraclicker.html']]],
  ['territorialio', 'Territorial.io', 'STRATEGY', 'Conquer the whole map.', [['Play', 'territorialio.html']]],
  ['hillclimbracing', 'Hill Climb Racing', 'PHYSICS DRIVING', 'Climb hills. Watch your fuel.', [['Play', 'hillclimbracinglite.html']]],
  ['amongus', 'Among Us', 'SOCIAL', 'Find the impostor.', [['Play', 'amongus.html']]],
  ['escaperoad', 'Escape Road', 'DRIVING', 'Outrun the cops.', [['Play', 'escaperoad.html']]],
  ['1v1lol', '1v1.LOL', 'BUILD & SHOOT', 'Build fast. Aim faster.', [['Play', '1v1.lol.html']]],
  ['getawayshootout', 'Getaway Shootout', '2 PLAYER', 'Race to the getaway car.', [['Play', 'getawayshootout.htm']]],
  ['houseofhazards', 'House of Hazards', 'PARTY', 'Do chores. Trap your friends.', [['Play', 'houseofhazards.html']]],
  ['ragdollhit', 'Ragdoll Hit', 'RAGDOLL', 'Floppy, physics-based fights.', [['Play', 'ragdollhit.html']]],
  ['candycrush', 'Candy Crush', 'MATCH 3', 'Match candies. Clear the board.', [['Play', 'candycrush.html']]],
  ['bubbleshooter', 'Bubble Shooter', 'PUZZLE', 'Match three. Pop the bubbles.', [['Play', 'bubbleshooter.html']]],
  ['crazycattle3d', 'Crazy Cattle 3D', 'BATTLE ROYALE', 'Last sheep standing wins.', [['Play', 'crazycattle3D.html']]],
];
otherGames.push(...quickGames.map(quick));
// Point every version at wherever its file lives: CDN proxy, packed parts, or public/games.
for (const game of otherGames) for (const version of game.versions) version.file = fileUrl(version.file, game.name);
