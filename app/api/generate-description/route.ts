import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Use server-side only env vars (no NEXT_PUBLIC_ prefix for sensitive keys)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const PRODUCT_DESCRIPTION_PROMPT = process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION_PROMPT;

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { detail: 'Service configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  if (!PRODUCT_DESCRIPTION_PROMPT) {
     return NextResponse.json(
      { detail: 'Service configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { detail: 'Please upload an image to generate the product description.' },
        { status: 400 }
      );
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { detail: 'The uploaded file is not an image. Please upload a valid image file.' },
        { status: 400 }
      );
    }

    // Check for allowed image formats: JPG, WebP, and PNG only
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(image.type.toLowerCase())) {
      return NextResponse.json(
        { detail: 'Unsupported image format. Please upload an image in JPG, PNG, or WebP format only.' },
        { status: 400 }
      );
    }

    // Collect product details
    const productDetailsParts: string[] = [];
    const fields = [
      'name', 'category', 'price', 
      'color', 'material', 'dimensions', 'features', 'additional_info'
    ];

    fields.forEach(field => {
        const value = formData.get(field);
        if (value && typeof value === 'string' && value.trim() !== '') {
            // Format field name for display (e.g., "additional_info" -> "Additional Info")
            const displayName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            productDetailsParts.push(`${displayName}: ${value.trim()}`);
        }
    });

    const productDetailsText =
      productDetailsParts.length > 0
        ? productDetailsParts.join('\n')
        : 'No additional product details provided.';

    const prompt = PRODUCT_DESCRIPTION_PROMPT.replace('{{productDetailsText}}', productDetailsText);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: image.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const description = response.text().trim();

    return NextResponse.json({
      description: description,
      product_name: formData.get('name') || undefined,
    });

  } catch (error: any) {
    console.error('Error generating product description:', error);
    return NextResponse.json(
      { detail: 'We encountered an issue while generating the product description. Please try again or contact support if the problem persists.' },
      { status: 500 }
    );
  }
}

