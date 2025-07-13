## General Instructions:

-Never try to use "git" shell commands, always use the Github MCP Tool
-Never try to install python3 packages globally, always use a virtual environment
-If you ever need to make the background of an image transparent, use python3 and https://github.com/danielgatis/rembg
-For image generation tasks, always create a script to use tne Gemini REST API, below is a working example and working API key. Note that this API cannot generate images with a true transparent background

curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict" -H "x-goog-api-key: AIzaSyDv-FZkUVrFL3IhPTw0B_DhqCzOB6HVdWc" -H "Content-Type: application/json" -d '{"instances": [{"prompt": "Robot holding a red skateboard with a completely transparent background"}],"parameters": {"sampleCount": 4}}' | grep -o '"bytesBase64Encoded": "[^"]*"' | cut -d'"' -f4 | base64 --decode > gemini-native-image.png