# Video Blueprint Generator

A web application that instantly converts any story or script into a structured video creation plan using Google's Gemini AI.

## Features
- **Premium UI:** Modern design with glassmorphism, glowing mesh backgrounds, and smooth animations.
- **AI-Powered Insights:** Uses Gemini 2.5 Flash to generate intelligent blueprints.
- **Structured Output:** Instantly breaks down stories into Scene by Scene visualization, Visual Direction, Narration Tone, and Publishing Format.
- **Export:** Download the generated blueprint as a PDF document.

## Tech Stack
- **Frontend:** Vanilla HTML, CSS (Custom styling), JavaScript
- **Backend:** Python, FastAPI, Uvicorn
- **AI Integration:** Google GenAI API

## Getting Started

### Prerequisites
- Python 3.9+ installed
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. Clone this repository (or download the files):
```bash
git clone <your-github-repo-url>
cd Video-Blueprint-Generator
```

2. Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set your Google Gemini API Key as an environment variable:
- **Windows (PowerShell):** `$env:GEMINI_API_KEY="your_api_key_here"`
- **Mac/Linux:** `export GEMINI_API_KEY="your_api_key_here"`

4. Run the development server:
```bash
uvicorn main:app --port 8080
```

5. Open your browser and navigate to `http://127.0.0.1:8080`!

### Export PDF
After generating a blueprint, click **Download PDF** to download `video_blueprint.pdf`.

If you still see **Download JSON**, hard refresh the page (Windows: `Ctrl+Shift+R`) or open in an incognito/private window.
