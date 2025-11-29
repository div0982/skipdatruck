import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
    try {
        // Check if API key is set
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error: 'API Configuration Error',
                    details: 'GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.',
                    suggestion: 'Get your API key from https://aistudio.google.com/app/apikey',
                },
                { status: 500 }
            );
        }

        const { menuText } = await request.json();

        if (!menuText || menuText.trim().length < 10) {
            return NextResponse.json(
                { error: 'Menu text is required' },
                { status: 400 }
            );
        }

        console.log('Parsing menu text...');

        const prompt = `Parse this menu text into JSON:
${menuText}

Return only JSON with this structure:
{"items": [{"name": "string", "description": "string", "price": number, "category": "string"}]}

Extract all items, prices as numbers only, create descriptions if missing, categorize logically.`;

        // Try different model names in order of preference
        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-2.0-flash-exp',
            'models/gemini-2.0-flash',
            'models/gemini-1.5-flash',
        ];

        let response;
        let lastError: any = null;
        let successfulModel: string | null = null;

        // Try each model
        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                });
                successfulModel = modelName;
                console.log(`Successfully used model: ${modelName}`);
                break; // Success - exit loop
            } catch (apiError: any) {
                lastError = apiError;
                console.error(`Model ${modelName} failed:`, apiError.message);
                
                // If it's a rate limit, retry this model with backoff
                const isRateLimit = apiError.message?.includes('429') || 
                                   apiError.message?.includes('quota') || 
                                   apiError.message?.includes('Too Many Requests') ||
                                   apiError.message?.includes('rate limit');
                
                if (isRateLimit) {
                    // Retry this model with exponential backoff
                    const maxRetries = 3;
                    for (let attempt = 0; attempt < maxRetries; attempt++) {
                        const waitTime = Math.pow(2, attempt) * 1000;
                        console.log(`Rate limited on ${modelName}, retrying after ${waitTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        try {
                            response = await ai.models.generateContent({
                                model: modelName,
                                contents: prompt,
                            });
                            successfulModel = modelName;
                            console.log(`Successfully used model: ${modelName} after retry`);
                            break;
                        } catch (retryError: any) {
                            if (attempt === maxRetries - 1) {
                                // Last retry failed, try next model
                                break;
                            }
                        }
                    }
                    if (response) break; // Success after retry
                }
                
                // If it's a model not found error, try next model
                const isModelNotFound = apiError.message?.includes('404') || 
                                       apiError.message?.includes('not found') || 
                                       apiError.message?.includes('Model') ||
                                       apiError.message?.includes('model');
                
                if (isModelNotFound) {
                    continue; // Try next model
                }
                
                // For other errors, throw immediately
                throw apiError;
            }
        }

        if (!response) {
            throw lastError || new Error(`Failed to get response from any model. Tried: ${modelsToTry.join(', ')}`);
        }

        const text = response.text;

        if (!text) {
            throw new Error('No response text from AI model');
        }

        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleanJson = jsonMatch[0];

        const menuData = JSON.parse(cleanJson);

        if (!menuData.items || !Array.isArray(menuData.items)) {
            throw new Error('Invalid response');
        }

        const validItems = menuData.items.filter(
            (item: any) => item.name && item.name.length > 0
        );

        console.log(`Parsed ${validItems.length} items`);

        return NextResponse.json({
            success: true,
            items: validItems,
            message: `Found ${validItems.length} items`,
        });
    } catch (error: any) {
        console.error('Parse Menu Text Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });

        let userMessage = 'Parsing failed';
        let details = error.message || 'Unknown error occurred';

        // Check for API key errors
        if (error.message?.includes('API key') || error.message?.includes('authentication') || error.message?.includes('401')) {
            userMessage = 'API Key Error';
            details = 'Invalid or missing Google Gemini API key. Please check your .env file.';
        } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests') || error.message?.includes('rate limit')) {
            userMessage = 'Rate Limit Exceeded';
            details = 'You\'ve hit the API rate limit. The system will automatically retry. If this persists, please wait 60 seconds and try again. Free tier allows 15 requests per minute.';
        } else if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('Model') || error.message?.includes('model')) {
            userMessage = 'Model Not Available';
            details = `The AI model 'gemini-2.0-flash' is not available. This might be due to: 1) Model name is incorrect, 2) API key doesn't have access, 3) Model is temporarily unavailable. Error: ${error.message}. Try checking Google AI Studio for available models.`;
        } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
            userMessage = 'Invalid Response Format';
            details = 'The AI returned an invalid format. Please try again.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            userMessage = 'Network Error';
            details = 'Failed to connect to the AI service. Please check your internet connection.';
        }

        return NextResponse.json(
            {
                error: userMessage,
                details: details,
                suggestion: 'For now, you can manually add menu items in the merchant dashboard.',
                debug: process.env.NODE_ENV === 'development' ? {
                    errorType: error.name,
                    errorMessage: error.message,
                } : undefined,
            },
            { status: 500 }
        );
    }
}
