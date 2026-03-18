import os
from io import BytesIO
from xml.sax.saxutils import escape as _xml_escape
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Request Model
class GenerateRequest(BaseModel):
    story: str
    theme: str
    style_preset: str = Field(default="Cinematic", description="Visual style preset (e.g., Cinematic, Anime)")
    platform: str = Field(default="YouTube (16:9)", description="Target platform for the video")

# Structured Scene Model
class SceneBreakdown(BaseModel):
    title: str = Field(description="A short, catchy title for the scene.")
    visual: str = Field(description="Visual description, camera angles, or character action.")
    narration: str = Field(description="The voiceover script or on-screen text for this segment.")
    duration: str = Field(description="Estimated duration (e.g., '5-8 sec').")

# Response Models structure for structured output
class BlueprintResponse(BaseModel):
    scene_breakdown: list[SceneBreakdown] = Field(description="A breakdown of the video into sequential scenes.")
    visual_direction: str = Field(description="The overall aesthetic, camera angles, or animation style.")
    narration_tone: str = Field(description="The tone and pacing of the voiceover/narration.")
    publishing_format: str = Field(description="Recommended video aspect ratio and platform.")
    total_estimated_time: str = Field(description="Total estimated length of the video (e.g., '30-45 sec').")

def _build_blueprint_pdf(blueprint: BlueprintResponse) -> bytes:
    # Lazily import so the app can still start without PDF deps until this endpoint is called.
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        title="Video Blueprint",
        author="AI Video Blueprint",
    )
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Video Blueprint", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Total Estimated Time</b>", styles["Heading2"]))
    story.append(Paragraph(_xml_escape(blueprint.total_estimated_time), styles["BodyText"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Publishing Format</b>", styles["Heading2"]))
    story.append(Paragraph(_xml_escape(blueprint.publishing_format), styles["BodyText"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Visual Direction</b>", styles["Heading2"]))
    story.append(Paragraph(_xml_escape(blueprint.visual_direction), styles["BodyText"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Narration Tone</b>", styles["Heading2"]))
    story.append(Paragraph(_xml_escape(blueprint.narration_tone), styles["BodyText"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Scene Breakdown</b>", styles["Heading2"]))
    items = []
    for i, scene in enumerate(blueprint.scene_breakdown or [], start=1):
        scene_content = (
            f"<b>{_xml_escape(scene.title)}</b> ({_xml_escape(scene.duration)})<br/>"
            f"<b>Visual:</b> {_xml_escape(scene.visual)}<br/>"
            f"<b>Narration:</b> {_xml_escape(scene.narration)}"
        )
        items.append(
            ListItem(
                Paragraph(scene_content, styles["BodyText"]),
                leftIndent=12,
            )
        )
    if items:
        story.append(ListFlowable(items, bulletType="bullet"))
    else:
        story.append(Paragraph("No scenes provided.", styles["BodyText"]))

    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes

client = None
if os.environ.get("GEMINI_API_KEY"):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@app.post("/api/generate")
async def generate_blueprint(request: GenerateRequest):
    if not client:
        # Since the user might not have set the API key yet, return mock for testing UI, or error.
        # But we must support LLM if the API key is present.
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is not set. Please set it to use the AI generator.")
    
    prompt = f"""
    Convert the following story/script into a structured video creation blueprint.
    Theme: {request.theme}
    Target Platform: {request.platform}
    Visual Style Preset: {request.style_preset}
    
    Story: {request.story}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BlueprintResponse,
            ),
        )
        res_data = json.loads(response.text)
        return {
            "blueprint": res_data,
            "prompt_used": prompt.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blueprint/pdf")
async def download_blueprint_pdf(blueprint: BlueprintResponse):
    try:
        pdf_bytes = _build_blueprint_pdf(blueprint)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="video_blueprint.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {e}")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content=b"", media_type="image/x-icon")

# Mount static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
