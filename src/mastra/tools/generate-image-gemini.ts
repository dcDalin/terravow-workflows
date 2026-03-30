import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

/**
 * Tool to generate images using Google Gemini 3.1 Flash Image Preview
 *
 * The AI uses reference images (logo, product photos) to understand what
 * the product looks like, then generates a NEW image that incorporates
 * the product into the composition described by the prompt.
 */

export const generateImageGeminiTool = createTool({
  id: 'generate-image-gemini',
  description: 'Generate images using Gemini 3.1 Flash Image Preview with reference images',

  inputSchema: z.object({
    prompt: z.string().describe('Detailed image generation prompt describing the desired scene'),
    referenceImages: z.array(z.object({
      data: z.string().describe('Base64 encoded image data'),
      mimeType: z.string().describe('Image MIME type (e.g., image/png, image/jpeg)'),
    })).optional().describe('Reference images for context (logo, product images) - max 14 images'),
    aspectRatio: z.enum([
      "1:1", "1:4", "1:8", "2:3", "3:2", "3:4",
      "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "21:9"
    ]).default("1:1").describe('Image aspect ratio'),
    imageSize: z.enum(["512", "1K", "2K", "4K"]).default("2K").describe('Image resolution'),
  }),

  outputSchema: z.object({
    imageData: z.string().describe('Base64 encoded generated image'),
    mimeType: z.string().describe('Image MIME type'),
    generationTime: z.number().describe('Time taken in milliseconds'),
    modelUsed: z.string().describe('Model identifier'),
  }),

  execute: async ({ prompt, referenceImages, aspectRatio, imageSize }) => {
    const startTime = Date.now();

    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required. Please add it to your .env file.');
    }

    // Validate reference images limit
    if (referenceImages && referenceImages.length > 14) {
      console.warn(`⚠️  Too many reference images (${referenceImages.length}). Gemini supports max 14. Using first 14 only.`);
      referenceImages = referenceImages.slice(0, 14);
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Build contents array with prompt + reference images
    const contents = [
      { text: prompt },
      ...(referenceImages || []).map(img => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        }
      }))
    ];

    console.log(`📸 Generating image with Gemini (${aspectRatio}, ${imageSize})...`);
    if (referenceImages && referenceImages.length > 0) {
      console.log(`   Using ${referenceImages.length} reference image(s)`);
    }

    try {
      // Call Gemini API
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio,
            imageSize,
          }
        }
      });

      // Extract image from response
      console.log('🔍 Response structure:', JSON.stringify({
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length,
        firstCandidate: response.candidates?.[0] ? 'exists' : 'missing'
      }));

      const candidate = response.candidates?.[0];
      if (!candidate) {
        console.error('Full response:', JSON.stringify(response, null, 2));
        throw new Error('No candidates returned from Gemini. The model may have refused to generate the image.');
      }

      // Validate response structure
      if (!candidate.content) {
        console.error('Invalid response: candidate.content is missing', JSON.stringify(candidate, null, 2));
        throw new Error('Invalid response structure: candidate.content is missing');
      }

      if (!candidate.content.parts) {
        console.error('Invalid response: candidate.content.parts is missing', JSON.stringify(candidate.content, null, 2));
        throw new Error('Invalid response structure: candidate.content.parts is missing');
      }

      if (!Array.isArray(candidate.content.parts)) {
        console.error('Invalid response: candidate.content.parts is not an array', typeof candidate.content.parts, JSON.stringify(candidate.content.parts, null, 2));
        throw new Error('Invalid response structure: candidate.content.parts is not an array');
      }

      if (candidate.content.parts.length === 0) {
        console.error('Invalid response: candidate.content.parts is empty');
        throw new Error('Invalid response structure: candidate.content.parts is empty');
      }

      // Find the image part in the response
      const imagePart = candidate.content.parts.find(part => part && part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        // Log response for debugging
        console.error('No image in response. Response parts:', candidate.content.parts);
        throw new Error('No image generated in response. The prompt may not be suitable for image generation.');
      }

      const generationTime = Date.now() - startTime;

      console.log(`✅ Image generated successfully in ${generationTime}ms`);

      return {
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
        generationTime,
        modelUsed: 'gemini-3.1-flash-image-preview',
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error(`❌ Image generation failed after ${generationTime}ms:`, error);
      throw error;
    }
  },
});
