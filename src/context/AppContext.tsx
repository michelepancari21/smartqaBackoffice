import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { Project, TestCase, TestExecution, TestPlan, SharedStep } from '../types';
import { mockTestCases, mockTestExecutions, mockTestPlans, mockSharedSteps } from '../data/mockData';
import { projectsApiService } from '../services/projectsApi';
import { useAuth } from './AuthContext';

interface AppState {
  projects: Project[];
  testCases: TestCase[];
  testExecutions: TestExecution[];
  testPlans: TestPlan[];
  sharedSteps: SharedStep[];
  currentProject: Project | null;
  selectedProjectId: string | null; // Pour le filtrage
  isLoadingProjects: boolean;
}

type AppAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING_PROJECTS'; payload: boolean }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_SELECTED_PROJECT_ID'; payload: string | null }
  | { type: 'ADD_TEST_CASE'; payload: TestCase }
  | { type: 'UPDATE_TEST_CASE'; payload: TestCase }
  | { type: 'DELETE_TEST_CASE'; payload: string }
  | { type: 'ADD_TEST_EXECUTION'; payload: TestExecution }
  | { type: 'UPDATE_TEST_EXECUTION'; payload: TestExecution }
  | { type: 'ADD_TEST_PLAN'; payload: TestPlan }
  | { type: 'UPDATE_TEST_PLAN'; payload: TestPlan }
  | { type: 'ADD_SHARED_STEP'; payload: SharedStep }
  | { type: 'UPDATE_SHARED_STEP'; payload: SharedStep }
  | { type: 'CLEAR_DATA' };

const SELECTED_PROJECT_KEY = 'smartqa_selected_project_id';

const getStoredSelectedProjectId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_PROJECT_KEY);
  } catch {
    return null;
  }
};

const setStoredSelectedProjectId = (projectId: string | null): void => {
  try {
    if (projectId) {
      localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    } else {
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
};

const initialState: AppState = {
  projects: [],
  testCases: mockTestCases,
  testExecutions: mockTestExecutions,
  testPlans: mockTestPlans,
  sharedSteps: mockSharedSteps,
  currentProject: null,
  selectedProjectId: getStoredSelectedProjectId(),
  isLoadingProjects: false
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_LOADING_PROJECTS':
      return { ...state, isLoadingProjects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.some(p => p.id === action.payload.id)
          ? state.projects.map(p => p.id === action.payload.id ? action.payload : p)
          : [...state.projects, action.payload]
      };
    case 'DELETE_PROJECT':
      const newSelectedProjectId = state.selectedProjectId === action.payload ? null : state.selectedProjectId;
      if (newSelectedProjectId !== state.selectedProjectId) {
        setStoredSelectedProjectId(newSelectedProjectId);
      }
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        selectedProjectId: newSelectedProjectId
      };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_SELECTED_PROJECT_ID':
      setStoredSelectedProjectId(action.payload);
      return { ...state, selectedProjectId: action.payload };
    case 'ADD_TEST_CASE':
      return { ...state, testCases: [...state.testCases, action.payload] };
    case 'UPDATE_TEST_CASE':
      return {
        ...state,
        testCases: state.testCases.map(tc => tc.id === action.payload.id ? action.payload : tc)
      };
    case 'DELETE_TEST_CASE':
      return {
        ...state,
        testCases: state.testCases.filter(tc => tc.id !== action.payload)
      };
    case 'ADD_TEST_EXECUTION':
      return { ...state, testExecutions: [...state.testExecutions, action.payload] };
    case 'UPDATE_TEST_EXECUTION':
      return {
        ...state,
        testExecutions: state.testExecutions.map(te => te.id === action.payload.id ? action.payload : te)
      };
    case 'ADD_TEST_PLAN':
      return { ...state, testPlans: [...state.testPlans, action.payload] };
    case 'UPDATE_TEST_PLAN':
      return {
        ...state,
        testPlans: state.testPlans.map(tp => tp.id === action.payload.id ? action.payload : tp)
      };
    case 'ADD_SHARED_STEP':
      return { ...state, sharedSteps: [...state.sharedSteps, action.payload] };
    case 'UPDATE_SHARED_STEP':
      return {
        ...state,
        sharedSteps: state.sharedSteps.map(ss => ss.id === action.payload.id ? action.payload : ss)
      };
    case 'CLEAR_DATA':
      setStoredSelectedProjectId(null);
      return {
        ...state,
        projects: [],
        selectedProjectId: null,
        currentProject: null,
        isLoadingProjects: false
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getFilteredTestCases: () => TestCase[];
  getFilteredTestExecutions: () => TestExecution[];
  getFilteredTestPlans: () => TestPlan[];
  getSelectedProject: () => Project | null;
  loadProjects: () => Promise<void>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Load projects from API
  const loadProjects = async (force: boolean = false) => {
    // Only load projects if user is authenticated
    if (!authState.isAuthenticated) {
      console.log('User not authenticated, skipping project loading');
      return;
    }

    // Prevent multiple simultaneous requests using ref
    if (loadingRef.current) {
      console.log('Projects already loading, skipping duplicate request');
      return;
    }


    try {
      loadingRef.current = true;
      dispatch({ type: 'SET_LOADING_PROJECTS', payload: true });
      
      // Load projects for sidebar using dedicated method (no filters)
      const allProjects = await projectsApiService.getProjectsForSidebar();
      
      dispatch({ type: 'SET_PROJECTS', payload: allProjects });
      hasLoadedRef.current = true;
      
      // Only auto-select if no project is currently selected
      if (!state.selectedProjectId && allProjects.length > 0) {
        const storedProjectId = getStoredSelectedProjectId();
        if (storedProjectId && allProjects.some(p => p.id === storedProjectId)) {
          dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: storedProjectId });
        } else {
          dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: allProjects[0].id });
        }
      }
      
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      loadingRef.current = false;
      dispatch({ type: 'SET_LOADING_PROJECTS', payload: false });
    }
  };

  // Helper functions for filtered data
  const getFilteredTestCases = () => {
    if (!state.selectedProjectId) return state.testCases;
    return state.testCases.filter(tc => tc.projectId === state.selectedProjectId);
  };

  const getFilteredTestExecutions = () => {
    if (!state.selectedProjectId) return state.testExecutions;
    return state.testExecutions.filter(te => te.projectId === state.selectedProjectId);
  };

  const getFilteredTestPlans = () => {
    if (!state.selectedProjectId) return state.testPlans;
    return state.testPlans.filter(tp => tp.projectId === state.selectedProjectId);
  };

  const getSelectedProject = () => {
    if (!state.selectedProjectId) return null;
    return state.projects.find(p => p.id === state.selectedProjectId) || null;
  };

  // Effect to handle authentication state changes
  useEffect(() => {
    if (authState.isAuthenticated) {
      // User is authenticated, load projects only if not already loaded
      if (!hasLoadedRef.current && !loadingRef.current) {
        loadProjects();
      }
    } else {
      // User is not authenticated, clear data
      hasLoadedRef.current = false;
      loadingRef.current = false;
      dispatch({ type: 'CLEAR_DATA' });
    }
  }, [authState.isAuthenticated]); // Only depend on authentication state

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      getFilteredTestCases,
      getFilteredTestExecutions,
      getFilteredTestPlans,
      getSelectedProject,
      loadProjects
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};