## General Instructions:

1. Never try to use "git" shell commands
2. Never try to install python3 packages globally, always use a virtual environment
3. For image generation tasks, always use tne Gemini REST API, below is a working example and working API key:
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict" -H "x-goog-api-key: AIzaSyAg7AOOWf0sLexBbzc4R7RmfOcthDIaCT8" -H "Content-Type: application/json" -d '{"instances": [{"prompt": "Robot holding a red skateboard with a completely transparent background"}],"parameters": {"sampleCount": 4}}' | grep -o '"bytesBase64Encoded": "[^"]*"' | cut -d'"' -f4 | base64 --decode > example.png

4. For image editing tasks, use this example script which has a working API key, but do not use inline JSON like the example, create a separate JSON file which contains the raw base64:
IMG_PATH=/path/to/your/image1.jpeg

if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
  B64FLAGS="--input"
else
  B64FLAGS="-w0"
fi

IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent" \
    -H "x-goog-api-key: AIzaSyAg7AOOWf0sLexBbzc4R7RmfOcthDIaCT8" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
        \"parts\":[
            {\"text\": \"'Hi, This is a picture of me. Can you add a llama next to me\"},
            {
              \"inline_data\": {
                \"mime_type\":\"image/jpeg\",
                \"data\": \"$IMG_BASE64\"
              }
            }
        ]
      }],
      \"generationConfig\": {\"responseModalities\": [\"TEXT\", \"IMAGE\"]}
    }"  \
  | grep -o '"data": "[^"]*"' \
  | cut -d'"' -f4 \
  | base64 --decode > gemini-edited-image.png