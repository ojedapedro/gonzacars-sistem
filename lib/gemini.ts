
import { GoogleGenAI } from "@google/genai";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const improveDiagnosis = async (prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Actúa como un jefe de taller mecánico experto. Convierte la siguiente descripción informal en un diagnóstico técnico formal, profesional y breve para un informe de reparación: "${prompt}"`,
  });
  return response.text;
};

export const generateFinanceAudit = async (data: any) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analiza los siguientes datos financieros de un taller mecánico y tienda de repuestos llamado Gonzacars C.A. Proporciona un análisis estratégico breve (3 párrafos) con recomendaciones de ahorro y salud financiera para el periodo indicado (${data.period}): 
    Ventas totales: $${data.sales}, 
    Compras totales: $${data.purchases}, 
    Gastos operativos: $${data.expenses},
    Balance neto: $${data.balance}.`,
  });
  return response.text;
};

export const suggestExpenseCategory = async (description: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-lite-latest',
    contents: `Dada la descripción de un gasto: "${description}", clasifícalo en una de estas categorías: Limpieza, Oficina, Víveres, Impuesto, Aseo Urbano, Internet. Responde SOLO con el nombre de la categoría.`,
  });
  return response.text?.trim();
};
