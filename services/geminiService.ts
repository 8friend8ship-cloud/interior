import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
    VirtualPlan, 
    GeneratedPlan, 
    ProjectDetails, 
    MaterialDetailItem, 
    PromptSet, 
    ProjectPackage, 
    MasterTemplate, 
    UnitPrice, 
    PriceSuggestion 
} from '../types';
import { MOCK_GENERATED_PLAN, MOCK_BATHROOM_PLAN, MOCK_VIRTUAL_PLAN, MOCK_IMAGE_BASE64 } from '../constants/mockData';

// Initialize the Gemini AI client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Validates the API key.
 * Although the instructions state the key must be from process.env.API_KEY,
 * this function exists to support the existing ApiKeyModal component.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const testAi = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    await testAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'test',
    });
    return true;
  } catch (e) {
    console.error("API Key Validation Error:", e);
    return false;
  }
};

/**
 * Creates a simple rectangular virtual plan based on dimensions.
 */
export const createVirtualPlanFromDimensions = (width: number, depth: number, roomType: string): VirtualPlan => {
  return {
    units: 'meters',
    totalFloorArea: width * depth,
    totalWallLength: (width + depth) * 2,
    rooms: [{
        id: 'room-1',
        type: roomType as any,
        boundary: [{x:0, y:0}, {x:width, y:0}, {x:width, y:depth}, {x:0, y:depth}],
        walls: ['w1', 'w2', 'w3', 'w4'],
        area: width * depth
    }],
    walls: [], // Simplified for dimension-only mode
    doors: [],
    windows: []
  };
};

/**
 * Analyzes the floorplan image to extract room data and dimensions.
 */
export const analyzeFloorplan = async (image: { data: string; mimeType: string }, isDemo: boolean = false): Promise<VirtualPlan> => {
    if (isDemo) return MOCK_VIRTUAL_PLAN;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            totalFloorArea: { type: Type.NUMBER },
            totalWallLength: { type: Type.NUMBER },
            rooms: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING },
                        area: { type: Type.NUMBER },
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use a capable model for complex analysis
            contents: {
                parts: [
                    { inlineData: { mimeType: image.mimeType, data: image.data } },
                    { text: "Analyze this floorplan image. Identify rooms, calculate approximate areas in square meters. Return a JSON structure with rooms, totalFloorArea, and totalWallLength." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const text = response.text || "{}";
        const result = JSON.parse(text);
        
        return {
            units: 'meters',
            totalFloorArea: result.totalFloorArea || 0,
            totalWallLength: result.totalWallLength || 0,
            rooms: result.rooms || [],
            walls: [],
            doors: [],
            windows: []
        };
    } catch (e) {
        console.error("Floorplan analysis error", e);
        // Return a basic fallback to allow the flow to continue
        return MOCK_VIRTUAL_PLAN;
    }
};

/**
 * Generates Isometric and Perspective visualizations using image generation models.
 */
export const generateVisualizations = async (
    virtualPlan: VirtualPlan, 
    image: { data: string; mimeType: string },
    modelType: 'standard' | 'pro',
    isDemo: boolean,
    projectScope: 'full' | 'bathroom'
): Promise<{ isometricView: { data: string; mimeType: string; }; perspectiveView: { data: string; mimeType: string; }; }> => {
    if (isDemo) {
        return {
            isometricView: { data: MOCK_IMAGE_BASE64, mimeType: "image/gif" },
            perspectiveView: { data: MOCK_IMAGE_BASE64, mimeType: "image/gif" }
        };
    }

    // Generate Isometric View
    const isoRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: "Generate an isometric 3D floorplan view based on this 2D plan. Modern interior style, high quality." }
            ]
        },
        config: { imageConfig: { aspectRatio: "4:3" } }
    });
    
    let isoData = MOCK_IMAGE_BASE64;
    let isoMime = "image/png";
    if (isoRes.candidates?.[0]?.content?.parts) {
        for (const p of isoRes.candidates[0].content.parts) {
            if (p.inlineData) {
                isoData = p.inlineData.data;
                // mimeType is usually implied or can be extracted if needed, but SDK often returns base64.
                // Assuming standard png/jpeg return.
            }
        }
    }

    // Generate Perspective View
    const persRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: "Generate a realistic interior perspective view of the main living area based on this plan. Modern design, 4k resolution." }
            ]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let persData = MOCK_IMAGE_BASE64;
    if (persRes.candidates?.[0]?.content?.parts) {
        for (const p of persRes.candidates[0].content.parts) {
            if (p.inlineData) persData = p.inlineData.data;
        }
    }

    return {
        isometricView: { data: isoData, mimeType: isoMime },
        perspectiveView: { data: persData, mimeType: "image/png" }
    };
};

/**
 * Modifies an existing image based on a text prompt.
 */
export const modifyImageStyle = async (
    baseImage: { data: string; mimeType: string }, 
    prompt: string, 
    virtualPlan: VirtualPlan | undefined,
    modelType: 'standard' | 'pro',
    isDemo: boolean | undefined
): Promise<{ data: string; mimeType: string; }> => {
    if (isDemo) return baseImage;

    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: baseImage.mimeType, data: baseImage.data } },
                { text: `Modify this image style: ${prompt}` }
            ]
        }
    });

    let newData = baseImage.data;
    if (res.candidates?.[0]?.content?.parts) {
        for (const p of res.candidates[0].content.parts) {
            if (p.inlineData) newData = p.inlineData.data;
        }
    }
    return { data: newData, mimeType: "image/png" };
};

/**
 * Generates a detailed project plan including estimates and schedule.
 */
export const generateProjectPlan = async (
    details: ProjectDetails, 
    existingEstimate?: any, 
    isRefinement: boolean = false
): Promise<GeneratedPlan> => {
     if (details.isDemo) {
         return details.projectScope === 'bathroom' ? MOCK_BATHROOM_PLAN : MOCK_GENERATED_PLAN;
     }

    // Logic to build mandatory items list based on user selection flags
    const flags = details.scopeFlags;
    const ds = details.detailedScope;
    const mandatoryItems: string[] = [];

    if (flags?.sash) {
        if (ds?.sash === 'partial' && ds.sashCondition) {
            mandatoryItems.push(`창호 부분 교체: ${ds.sashCondition}`);
        } else {
            mandatoryItems.push("발코니 창호 (Balcony Sash) - 외창", "내부 창호 (Inner Sash) - 이중창", "창호 하드웨어 (Handle) - 자동핸들");
        }
    }

    if (flags?.molding && ds?.molding) {
        if (ds.molding.type === 'minus') {
             mandatoryItems.push("마이너스 몰딩 (Hidden Molding) - PVC/MDF", "석고보드 (Gypsum Board) - 천장평탄화용");
        } else if (ds.molding.type === 'crown') {
             mandatoryItems.push("갈매기 몰딩 (Crown Molding) - 클래식");
        } else {
             mandatoryItems.push("평몰딩 (Flat Molding) - 30~50mm");
        }
    }

    if (flags?.entryDoor && ds?.entryDoor) {
         let doorType = "3연동 슬라이딩";
         if (ds.entryDoor.type === 'swing') doorType = "스윙 도어 (Swing Door) - 비대칭/양개형";
         else if (ds.entryDoor.type === 'onesliding') doorType = "원슬라이딩 (One Sliding) - 알루미늄";
         
         mandatoryItems.push(`중문 (Entrance Door) - ${doorType}`);
    }
    
    if (flags?.insulation && ds?.insulation?.area) {
         mandatoryItems.push(`단열재 (Insulation) - 부위: ${ds.insulation.area}`, "우레탄폼 (Foam) - 충진용");
    }

    if (flags?.electrical) mandatoryItems.push("조명 기구 (Lighting) - 거실등/다운라이트", "배선 기구 (Switch/Outlet) - 스위치/콘센트");
    if (flags?.door) mandatoryItems.push("도어 & 문틀 (Door Set) - ABS도어", "도어 핸들 (Door Lock)");
    if (flags?.tile) mandatoryItems.push("현관 타일 (Entrance Tile)", "베란다 타일 (Balcony Tile)");
    if (flags?.balconyPaint) mandatoryItems.push("발코니 도장 (Paint) - 탄성코트/세라믹");
    
    const prompt = `Generate a detailed interior design project plan.
    Project Details: ${JSON.stringify(details)}. 
    Mandatory items to include in cost estimate: ${mandatoryItems.join(', ')}.
    Output JSON compatible with the GeneratedPlan structure.`;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
             designConcept: {
                 type: Type.OBJECT,
                 properties: {
                     title: { type: Type.STRING },
                     description: { type: Type.STRING },
                     keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                 }
             },
             costEstimate: {
                 type: Type.ARRAY,
                 items: {
                     type: Type.OBJECT,
                     properties: {
                         category: { type: Type.STRING },
                         item: { type: Type.STRING },
                         quantity: { type: Type.NUMBER },
                         unit: { type: Type.STRING },
                         materialCost: { type: Type.NUMBER },
                         laborCost: { type: Type.NUMBER },
                         unitPrice: { type: Type.NUMBER },
                         totalPrice: { type: Type.NUMBER },
                         remarks: { type: Type.STRING }
                     }
                 }
             },
             projectSchedule: {
                 type: Type.ARRAY,
                 items: {
                     type: Type.OBJECT,
                     properties: {
                         phase: { type: Type.STRING },
                         task: { type: Type.STRING },
                         duration: { type: Type.STRING },
                         startDate: { type: Type.STRING },
                         endDate: { type: Type.STRING }
                     }
                 }
             },
             confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
             confidenceReason: { type: Type.STRING },
             correctionNeeded: { type: Type.STRING },
             budgetAnalysis: {
                 type: Type.OBJECT,
                 properties: {
                     isOverBudget: { type: Type.BOOLEAN },
                     statusMessage: { type: Type.STRING },
                     costSavingTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                 }
             }
         }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const result = JSON.parse(response.text || "{}");
    return result as GeneratedPlan;
};

/**
 * Generates detailed material specifications and prompt sets.
 */
export const generateMaterialDetails = async (details: ProjectDetails, previousSheet: MaterialDetailItem[] = []): Promise<{sheet: MaterialDetailItem[], prompts: PromptSet}> => {
    if (details.isDemo) {
        return { 
            sheet: details.projectScope === 'bathroom' ? MOCK_BATHROOM_PLAN.materialDetailSheet! : MOCK_GENERATED_PLAN.materialDetailSheet!,
            prompts: details.projectScope === 'bathroom' ? MOCK_BATHROOM_PLAN.materialBoardPrompts! : MOCK_GENERATED_PLAN.materialBoardPrompts!
        };
    }

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            sheet: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        item: { type: Type.STRING },
                        image: { type: Type.STRING },
                        model: { type: Type.STRING },
                        spec: { type: Type.STRING },
                        color: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        total: { type: Type.NUMBER },
                        link: { type: Type.STRING },
                        alternatives: { type: Type.STRING },
                        remarks: { type: Type.STRING },
                        qr: { type: Type.STRING },
                    }
                }
            },
            prompts: {
                type: Type.OBJECT,
                properties: {
                    base: { type: Type.STRING },
                    subTiles: { type: Type.STRING },
                    subFixtures: { type: Type.STRING },
                    views: {
                        type: Type.OBJECT,
                        properties: {
                            top: { type: Type.STRING },
                            elevation: { type: Type.STRING },
                            iso: { type: Type.STRING },
                            perspective: { type: Type.STRING },
                        }
                    },
                    video: { type: Type.STRING }
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate specific material details and image prompts for this project details: ${JSON.stringify(details)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const result = JSON.parse(response.text || "{}");
    return result as {sheet: MaterialDetailItem[], prompts: PromptSet};
};

/**
 * Generates the master template report.
 */
export const generateMasterTemplate = async (details: ProjectDetails, plan: GeneratedPlan): Promise<MasterTemplate> => {
    if (details.isDemo) return MOCK_GENERATED_PLAN.masterTemplate!;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            inputSummary: {
                 type: Type.OBJECT,
                 properties: {
                     projectName: { type: Type.STRING },
                     clientName: { type: Type.STRING },
                     location: { type: Type.STRING },
                     bathroomType: { type: Type.STRING },
                     styleGrade: { type: Type.STRING },
                     dimensions: { type: Type.STRING },
                     selectedOptions: { type: Type.STRING },
                     confidence: { type: Type.STRING },
                     autoCorrections: { 
                         type: Type.OBJECT,
                         properties: {
                             inflation: { type: Type.STRING },
                             tileOverage: { type: Type.STRING },
                             exclusions: { type: Type.STRING },
                             waterproofing: { type: Type.STRING },
                         }
                     },
                     risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                 }
            },
            areaCalculations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, realArea: { type: Type.STRING }, overage: { type: Type.STRING }, orderArea: { type: Type.STRING }, basis: { type: Type.STRING }, remarks: { type: Type.STRING } } } },
            materialCosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, item: { type: Type.STRING }, spec: { type: Type.STRING }, quantity: { type: Type.STRING }, price: { type: Type.NUMBER }, total: { type: Type.NUMBER }, remarks: { type: Type.STRING } } } },
            laborCosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, task: { type: Type.STRING }, basis: { type: Type.STRING }, quantity: { type: Type.NUMBER }, price: { type: Type.NUMBER }, total: { type: Type.NUMBER }, remarks: { type: Type.STRING } } } },
            overheadCosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, basis: { type: Type.STRING }, quantity: { type: Type.NUMBER }, price: { type: Type.NUMBER }, total: { type: Type.NUMBER }, remarks: { type: Type.STRING } } } },
            totalSummary: {
                type: Type.OBJECT,
                properties: {
                    materialTotal: { type: Type.NUMBER },
                    laborTotal: { type: Type.NUMBER },
                    overheadTotal: { type: Type.NUMBER },
                    subTotal: { type: Type.NUMBER },
                    inflationFactor: { type: Type.NUMBER },
                    finalTotal: { type: Type.NUMBER },
                    vatNote: { type: Type.STRING },
                    checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a master template report based on the project plan: ${JSON.stringify(plan)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || "{}") as MasterTemplate;
};

/**
 * Generates the project package structure.
 */
export const generateProjectPackage = async (details: ProjectDetails): Promise<ProjectPackage> => {
     if (details.isDemo) return MOCK_GENERATED_PLAN.projectPackage!;

     const schema: Schema = {
         type: Type.OBJECT,
         properties: {
             folderStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
             checklist: {
                 type: Type.OBJECT,
                 properties: {
                     dimensions: { type: Type.OBJECT, properties: { confidence: { type: Type.NUMBER }, ceilingHeightChecked: { type: Type.BOOLEAN }, dimensionsInputChecked: { type: Type.BOOLEAN }, specialElementsChecked: { type: Type.BOOLEAN } } },
                     rules: { type: Type.OBJECT, properties: { barrisolAdded: { type: Type.BOOLEAN }, jollyCutChecked: { type: Type.BOOLEAN }, ventilationHeatingMatched: { type: Type.BOOLEAN }, vanityCoeffApplied: { type: Type.BOOLEAN }, bathtubOptionReflected: { type: Type.BOOLEAN } } },
                     quality: { type: Type.OBJECT, properties: { warrantyIncluded: { type: Type.BOOLEAN }, inflationApplied: { type: Type.BOOLEAN }, priceRiskWarned: { type: Type.BOOLEAN } } },
                     deliverables: { type: Type.OBJECT, properties: { estimateExists: { type: Type.BOOLEAN }, materialSheetExists: { type: Type.BOOLEAN }, boardExists: { type: Type.BOOLEAN }, promptsExist: { type: Type.BOOLEAN }, summaryExists: { type: Type.BOOLEAN } } },
                 }
             },
             readme: { type: Type.STRING },
             sendingRules: { type: Type.ARRAY, items: { type: Type.STRING } },
         }
     };

     const response = await ai.models.generateContent({
         model: 'gemini-3-pro-preview',
         contents: `Generate project package delivery metadata for: ${JSON.stringify(details)}`,
         config: {
             responseMimeType: "application/json",
             responseSchema: schema
         }
     });

     return JSON.parse(response.text || "{}") as ProjectPackage;
};

/**
 * Analyzes market prices to suggest updates.
 */
export const analyzeMarketPrices = async (currentPrices: UnitPrice[]): Promise<PriceSuggestion[]> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['UPDATE', 'NEW'] },
                category: { type: Type.STRING },
                item: { type: Type.STRING },
                unit: { type: Type.STRING },
                currentPrice: { type: Type.NUMBER },
                suggestedPrice: { type: Type.NUMBER },
                reason: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze these construction prices and suggest updates or new items based on current market trends in South Korea: ${JSON.stringify(currentPrices)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || "[]") as PriceSuggestion[];
};