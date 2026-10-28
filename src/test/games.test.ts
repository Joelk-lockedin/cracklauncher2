import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { games, otherGames } from "@/lib/games";
import packedGames from "@/lib/packed-games.json";

const root = path.resolve(__dirname, "../..");

// Adding a game is one line in games.ts, so catch typos and forgotten files here
// instead of as a broken player frame.
describe("Game catalog", () => {
  it("points every version at a playable file", () => {
    for (const game of [...games, ...otherGames]) {
      for (const version of game.versions) {
        const routed = /^(https?:|\/play\.html\?|\/api\/public\/game\/)/.test(version.file);
        const local = version.file.startsWith("/games/")
          ? existsSync(path.join(root, "public", version.file))
          : existsSync(path.join(root, "public/games", version.file));
        expect(routed || local, `${game.name} / ${version.label}: ${version.file}`).toBe(true);
      }
    }
  });

  it("gives every game a cover", () => {
    const missing = [...games, ...otherGames].filter((game) => !game.cover).map((game) => game.id);
    expect(missing).toEqual([]);
  });

  it("has every packed part on disk", () => {
    for (const [file, { dir, parts }] of Object.entries(packedGames)) {
      for (let i = 0; i < parts; i++) {
        expect(existsSync(path.join(root, "public/games/packed", dir, `${i}.bin`)), `${file} part ${i}`).toBe(true);
      }
    }
  });
});
