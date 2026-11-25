// MockContext — global demo/mock-mode state.
// When mock mode is enabled the TelemetryContext uses generated data
// instead of polling the real AWS API endpoint.

import { createContext, useContext, useState, useCallback } from "react";

const MockContext = createContext(null);

const STORAGE_KEY = "cellguard.mockMode";

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const DEFAULT_MOCK_STATE = {
  enabled: false,
  scenario: "nominal",
  overrides: {},
  animating: true,
};

export function MockProvider({ children }) {
  const [mockState, setMockStateRaw] = useState(() => {
    const stored = readStored();
    return stored ? { ...DEFAULT_MOCK_STATE, ...stored } : DEFAULT_MOCK_STATE;
  });

  const setMockState = useCallback((updater) => {
    setMockStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      writeStored(next);
      return next;
    });
  }, []);

  const enableMock = useCallback((scenario = "nominal") => {
    setMockState({ enabled: true, scenario, overrides: {}, animating: true });
  }, [setMockState]);

  const disableMock = useCallback(() => {
    setMockState(DEFAULT_MOCK_STATE);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, [setMockState]);

  const setScenario = useCallback((scenario) => {
    setMockState((s) => ({ ...s, scenario, overrides: {} }));
  }, [setMockState]);

  const setOverrides = useCallback((overrides) => {
    setMockState((s) => ({ ...s, overrides: { ...s.overrides, ...overrides } }));
  }, [setMockState]);

  const toggleAnimating = useCallback(() => {
    setMockState((s) => ({ ...s, animating: !s.animating }));
  }, [setMockState]);

  const value = {
    ...mockState,
    setMockState,
    enableMock,
    disableMock,
    setScenario,
    setOverrides,
    toggleAnimating,
  };

  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
}

export function useMock() {
  const ctx = useContext(MockContext);
  if (!ctx) throw new Error("useMock must be used within MockProvider");
  return ctx;
}
