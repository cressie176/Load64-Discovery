export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface GameProfileRef {
  gameId: string;
  profileId: string;
}

export interface ProfilesState {
  profiles: Profile[];
  gameProfileRefs: GameProfileRef[];
}
