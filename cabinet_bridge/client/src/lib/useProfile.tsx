import { createContext, useContext, useState, type ReactNode } from "react";

interface ProfileContextType {
  currentProfileId: number;
  setCurrentProfileId: (id: number) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  currentProfileId: 1,
  setCurrentProfileId: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfileId, setCurrentProfileIdState] = useState<number>(() => {
    try { return Number(localStorage.getItem("cabinet_profile_id") || "1"); } catch { return 1; }
  });

  const setCurrentProfileId = (id: number) => {
    setCurrentProfileIdState(id);
    try { localStorage.setItem("cabinet_profile_id", String(id)); } catch {}
  };

  return (
    <ProfileContext.Provider value={{ currentProfileId, setCurrentProfileId }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
