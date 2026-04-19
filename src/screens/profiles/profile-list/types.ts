export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface GameProfileRef {
  gameId: string;
  profileId: string;
  order: number;
}

export interface ProfilesState {
  profiles: Profile[];
  gameProfileRefs: GameProfileRef[];
}
