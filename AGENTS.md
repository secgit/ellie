## General Instructions:

1. ALWAYS use GitHub CLI (`gh`) to create pull requests, authentication has already been configured.
2. For image generation tasks, always use the Gemini REST API, below is a working example using curl. `GEMINI_API_KEY` is provided via an environment variable. Do **not** expose or persist secrets.

curl -s -X POST
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
      ]
    }]
  }' \
  | grep -o '"data": "[^"]*"' \
  | cut -d'"' -f4 \
  | base64 --decode > gemini-native-image.png