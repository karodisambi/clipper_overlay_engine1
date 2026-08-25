# Clipper Overlay Engine Backend V1.1

Backend untuk auto transcription Project Clipper.

## Render
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:
- `OPENAI_API_KEY` = API key OpenAI
- `FRONTEND_ORIGIN` = `https://karodisambi.github.io`

Endpoints:
- `GET /health`
- `POST /transcribe`
  - multipart/form-data
  - field file: `file`
  - maksimum V1.1: 24 MB

Jangan pernah memasukkan API key ke index.html atau commit ke GitHub.
