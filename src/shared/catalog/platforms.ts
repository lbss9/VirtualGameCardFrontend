export type PlatformId =
  | "steam"
  | "playstation"
  | "xbox"
  | "nintendo"
  | "google-play"
  | "roblox";

export interface Platform {
  id: PlatformId;
  name: string;
  shortName: string;
  mark: string;
  logo: string;
  description: string;
}

export const PLATFORMS: Platform[] = [
  { id: "steam", name: "Steam", shortName: "Steam", mark: "S", logo: "/platforms/steam.svg", description: "PC, Mac e Linux" },
  { id: "playstation", name: "PlayStation Store", shortName: "PlayStation", mark: "PS", logo: "/platforms/playstation.svg", description: "PS5 e PS4" },
  { id: "xbox", name: "Xbox", shortName: "Xbox", mark: "X", logo: "/platforms/xbox.svg", description: "Xbox e Windows" },
  { id: "nintendo", name: "Nintendo eShop", shortName: "Nintendo", mark: "N", logo: "/platforms/nintendo.svg", description: "Nintendo Switch" },
  { id: "google-play", name: "Google Play", shortName: "Google Play", mark: "G", logo: "/platforms/google-play.svg", description: "Android e Play Games" },
  { id: "roblox", name: "Roblox", shortName: "Roblox", mark: "R", logo: "/platforms/roblox.svg", description: "Créditos e Robux" },
];

export function getPlatform(id: string): Platform {
  return PLATFORMS.find((platform) => platform.id === id) ?? PLATFORMS[0];
}
