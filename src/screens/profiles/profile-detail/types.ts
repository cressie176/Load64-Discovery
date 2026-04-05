export interface ProfileControllerRef {
  profileId: string;
  controllerId: string;
}

export interface ProfileKeyMapping {
  id: string;
  profileId: string;
  key: string;
  action: string;
}

export interface ProfileEnvVar {
  id: string;
  profileId: string;
  name: string;
  value: string;
}

export interface ProfileDetailState {
  controllerRefs: ProfileControllerRef[];
  keyMappings: ProfileKeyMapping[];
  envVars: ProfileEnvVar[];
}
