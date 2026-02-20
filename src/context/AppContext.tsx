import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { Project, AppState, LoadingState, AuditResult, SAMPLE_PROJECTS } from "@/types/synaps";

type Action =
  | { type: "SET_PROJECTS"; projects: Project[] }
  | { type: "ADD_PROJECT"; project: Project }
  | { type: "UPDATE_PROJECT"; project: Project }
  | { type: "DELETE_PROJECT"; id: string }
  | { type: "SET_CURRENT_PROJECT"; id: string | null }
  | { type: "SET_LOADING"; loading: Partial<LoadingState> }
  | { type: "SET_DEMO_MODE"; enabled: boolean }
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
    case "ADD_PROJECT":
  return { 
    ...state, 
    projects: [...state.projects, { 
      ...action.project, 
      createdAt: action.project.createdAt || new Date().toISOString(),
      updatedAt: action.project.updatedAt || new Date().toISOString()
    }] 
  };
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.project.id ? action.project : p
        ),
      };
    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        currentProjectId:
          state.currentProjectId === action.id ? null : state.currentProjectId,
      };
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProjectId: action.id };
    case "SET_LOADING":
      return { ...state, isLoading: { ...state.isLoading, ...action.loading } };
    case "SET_DEMO_MODE":
      return { ...state, demoMode: action.enabled };
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("synaps_projects");
      if (saved) {
        dispatch({ type: "SET_PROJECTS", projects: JSON.parse(saved) });
      } else {
        dispatch({ type: "SET_PROJECTS", projects: SAMPLE_PROJECTS });
      }
      const demoMode = localStorage.getItem("synaps_demo_mode");
      if (demoMode === "true") {
        dispatch({ type: "SET_DEMO_MODE", enabled: true });
      }
    } catch {
      dispatch({ type: "SET_PROJECTS", projects: SAMPLE_PROJECTS });
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.projects.length > 0) {
      localStorage.setItem("synaps_projects", JSON.stringify(state.projects));
    }
  }, [state.projects]);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.projects.length > 0) {
        localStorage.setItem("synaps_projects", JSON.stringify(state.projects));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [state.projects]);

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
