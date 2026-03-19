/** Prefab save/load utility — stores reusable tile patterns in localStorage */

const LS_PREFABS_KEY = "trap_editor_prefabs";

export interface Prefab {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: number[][]; // [row][col]
  createdAt: number;
}

/** Default prefabs shipped with the editor */
const DEFAULT_PREFABS: Prefab[] = [
  {
    id: "prefab_platform",
    name: "Plataforma",
    width: 5,
    height: 1,
    tiles: [[1, 1, 1, 1, 1]],
    createdAt: 0,
  },
  {
    id: "prefab_spike_pit",
    name: "Poço de Espinhos",
    width: 4,
    height: 3,
    tiles: [
      [0, 0, 0, 0],
      [5, 5, 5, 5],
      [2, 2, 2, 2],
    ],
    createdAt: 0,
  },
  {
    id: "prefab_cannon_tower",
    name: "Torre de Canhões",
    width: 2,
    height: 4,
    tiles: [
      [47, 0],
      [2, 0],
      [47, 0],
      [2, 2],
    ],
    createdAt: 0,
  },
  {
    id: "prefab_lava_bridge",
    name: "Ponte sobre Lava",
    width: 6,
    height: 3,
    tiles: [
      [2, 19, 19, 19, 19, 2],
      [2, 0, 0, 0, 0, 2],
      [2, 13, 13, 13, 13, 2],
    ],
    createdAt: 0,
  },
];

export function loadPrefabs(): Prefab[] {
  if (typeof window === "undefined") return [...DEFAULT_PREFABS];
  try {
    const stored = localStorage.getItem(LS_PREFABS_KEY);
    const userPrefabs: Prefab[] = stored ? JSON.parse(stored) : [];
    return [...DEFAULT_PREFABS, ...userPrefabs];
  } catch {
    return [...DEFAULT_PREFABS];
  }
}

function saveUserPrefabs(prefabs: Prefab[]) {
  // Only save user-created prefabs (not defaults)
  const userOnly = prefabs.filter((p) => !p.id.startsWith("prefab_"));
  localStorage.setItem(LS_PREFABS_KEY, JSON.stringify(userOnly));
}

export function addPrefab(name: string, tiles: number[][]): Prefab {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const prefab: Prefab = {
    id,
    name: name.slice(0, 30),
    width: tiles[0]?.length ?? 0,
    height: tiles.length,
    tiles,
    createdAt: Date.now(),
  };

  const all = loadPrefabs();
  all.push(prefab);
  saveUserPrefabs(all);
  return prefab;
}

export function deletePrefab(id: string) {
  // Cannot delete default prefabs
  if (id.startsWith("prefab_")) return;
  const all = loadPrefabs().filter((p) => p.id !== id);
  saveUserPrefabs(all);
}
