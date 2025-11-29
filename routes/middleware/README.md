# Backend for Expo + Render + OpenAI

## Setup
1. Upload to Render
2. Set environment variable:
   OPENAI_API_KEY = your-key-here
3. Deploy

## Endpoints

POST /api/openai/text
{
   "prompt": "Hello"
}

POST /api/openai/vision
form-data:
  - image (file)
  - prompt (string)
