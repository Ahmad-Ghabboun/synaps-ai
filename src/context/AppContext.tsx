import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { Project, AppState, LoadingState, DEMO_PROJECT } from "@/types/synaps";

type Action =
  | { type: "SET_PROJECTS"; projects: Project[] }
  | { type: "UPDATE_PROJECT"; project: Project }
  | { type: "SET_CURRENT_PROJECT"; id: string | null }
  | { type: "SET_LOADING"; loading: Partial<LoadingState> }
  | { type: "SET_SHOW_RAW_JSON"; enabled: boolean };

const initialState: AppState = {
  projects: [],
  currentProjectId: null,
  isLoading: { architect: false, auditor: false, optimizer: false },
  demoMode: false,
  showRawJson: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PROJECTS":
      return { ...state, projects: action.projects };
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.project.id ? action.project : p
        ),
      };
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProjectId: action.id };
    case "SET_LOADING":
      return { ...state, isLoading: { ...state.isLoading, ...action.loading } };
    case "SET_SHOW_RAW_JSON":
      return { ...state, showRawJson: action.enabled };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentProject: Project | null;
  updateCurrentProject: (updates: Partial<Project>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Always load only the demo project
  useEffect(() => {
    dispatch({ type: "SET_PROJECTS", projects: [DEMO_PROJECT] });
  }, []);

  const currentProject =
    state.projects.find((p) => p.id === state.currentProjectId) || null;

  const updateCurrentProject = useCallback(
    (updates: Partial<Project>) => {
      if (!currentProject) return;
      dispatch({
        type: "UPDATE_PROJECT",
        project: { ...currentProject, ...updates, updatedAt: new Date().toISOString() },
      });
    },
    [currentProject]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, currentProject, updateCurrentProject }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
