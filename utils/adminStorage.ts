
import { PRICE_TABLE, LABOR_DATA } from '../constants/prices';
import { MOCK_GENERATED_PLAN, MOCK_BATHROOM_PLAN } from '../constants/mockData';
import { GeneratedPlan, Persona, UnitPrice } from '../types';

const PRICES_KEY = 'johnson_admin_prices_v1';
const LABOR_KEY = 'johnson_admin_labor_v1';
const REFERENCES_KEY = 'johnson_admin_references_v1';
const PERSONA_KEY = 'johnson_admin_personas_v1';

// --- Prices ---
export const getStoredPriceTable = (): UnitPrice[] => {
  try {
    const stored = localStorage.getItem(PRICES_KEY);
    return stored ? JSON.parse(stored) : PRICE_TABLE;
  } catch (e) {
    console.error("Failed to load prices", e);
    return PRICE_TABLE;
  }
};

export const savePriceTable = (prices: UnitPrice[]) => {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
};

// --- Labor ---
export const getStoredLaborData = () => {
  try {
    const stored = localStorage.getItem(LABOR_KEY);
    return stored ? JSON.parse(stored) : LABOR_DATA;
  } catch (e) {
    console.error("Failed to load labor data", e);
    return LABOR_DATA;
  }
};

export const saveLaborData = (laborData: typeof LABOR_DATA) => {
  localStorage.setItem(LABOR_KEY, JSON.stringify(laborData));
};

// --- References ---
const DEFAULT_REFERENCES = `[존슨 지침: 전체 인테리어 필수 체크 리스트 (2025.02 업데이트)]
... (기존 내용 유지) ...
`;

export const getStoredReferenceGuidelines = (): string => {
    try {
        const stored = localStorage.getItem(REFERENCES_KEY);
        return stored || DEFAULT_REFERENCES;
    } catch (e) {
        return DEFAULT_REFERENCES;
    }
};

export const saveReferenceGuidelines = (text: string) => {
    localStorage.setItem(REFERENCES_KEY, text);
};

// --- NEW: Persona (Multi-Template) Management ---

export const getStoredPersonas = (): Persona[] => {
    try {
        const stored = localStorage.getItem(PERSONA_KEY);
        if (stored) return JSON.parse(stored);
        
        // Return Default Persona if empty
        const defaultPersona: Persona = {
            id: 'default_full_32py',
            name: '기본 데모: 32평형 전체 인테리어',
            description: '존슨 가이드라인의 기본 데모 데이터입니다.',
            tags: ['32py', 'Standard', 'Demo'],
            data: MOCK_GENERATED_PLAN,
            createdAt: new Date().toISOString()
        };
        return [defaultPersona];
    } catch (e) {
        console.error("Failed to load personas", e);
        return [];
    }
};

export const savePersonas = (personas: Persona[]) => {
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
};

export const addPersona = (persona: Persona) => {
    const current = getStoredPersonas();
    // Check duplication by ID or Name
    const existingIndex = current.findIndex(p => p.id === persona.id || p.name === persona.name);
    
    if (existingIndex >= 0) {
        // Update existing
        current[existingIndex] = persona;
    } else {
        // Add new
        current.push(persona);
    }
    savePersonas(current);
};

export const deletePersona = (id: string) => {
    const current = getStoredPersonas();
    const filtered = current.filter(p => p.id !== id);
    savePersonas(filtered);
};

// Backward Compatibility for the 'Demo Template' calls
export const getStoredDemoTemplate = (type: 'full' | 'bathroom'): GeneratedPlan => {
    const personas = getStoredPersonas();
    if (type === 'bathroom') return MOCK_BATHROOM_PLAN; // Simplified for now
    return personas[0]?.data || MOCK_GENERATED_PLAN;
};

// Save Demo Template (Deprecated - maps to default persona now)
export const saveDemoTemplate = (type: 'full' | 'bathroom', plan: GeneratedPlan) => {
    // No-op for now as we moved to Persona system
    console.warn("saveDemoTemplate is deprecated. Use addPersona instead.");
};

export const resetAdminSettings = () => {
  localStorage.removeItem(PRICES_KEY);
  localStorage.removeItem(LABOR_KEY);
  localStorage.removeItem(REFERENCES_KEY);
  localStorage.removeItem(PERSONA_KEY);
};
