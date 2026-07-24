import os
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from prisma import Prisma
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from ai.parser import parse_raw_idea
from ai.architect import generate_architecture_task
from ai.prompter import generate_prompts_task

load_dotenv()

# Initialize Prisma Client
db = Prisma()

# Initialize Supabase Client for JWT verification
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(title="Prompt Master API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rawIdea: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rawIdea: Optional[str] = None
    status: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "api"}

@app.post("/projects")
async def create_project(project: ProjectCreate, current_user = Depends(get_current_user)):
    user_id = current_user.id
    # Check if user exists in DB, if not create them
    db_user = await db.user.find_unique(where={"id": user_id})
    if not db_user:
        await db.user.create(data={"id": user_id, "email": current_user.email})

    # Call the AI Parser to analyze the raw idea (runs in a thread pool to avoid blocking)
    try:
        analysis = await asyncio.to_thread(parse_raw_idea, project.rawIdea)
        status_val = "architecture"  # Advancing to next step
    except Exception as e:
        print(f"AI Parsing failed: {e}")
        analysis = None
        status_val = "draft"

    new_project = await db.project.create(
        data={
            "name": project.name,
            "description": project.description,
            "rawIdea": project.rawIdea,
            "status": status_val,
            "userId": user_id
        }
    )
    
    if analysis:
        await db.aianalysis.create(
            data={
                "projectId": new_project.id,
                "intent": analysis.intent,
                "domain": analysis.domain,
                "subDomains": analysis.subDomains,
                "features": analysis.features,
                "targetAudience": analysis.targetAudience
            }
        )
        
    return new_project

@app.get("/projects/{project_id}/analysis")
async def get_project_analysis(project_id: str, current_user = Depends(get_current_user)):
    # Verify project ownership
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    analysis = await db.aianalysis.find_unique(where={"projectId": project_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@app.post("/projects/{project_id}/architecture/generate", status_code=status.HTTP_202_ACCEPTED)
async def trigger_architecture_generation(project_id: str, background_tasks: BackgroundTasks, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    existing = await db.projectarchitecture.find_unique(where={"projectId": project_id})
    if existing:
        return {"status": "already_generated"}
        
    background_tasks.add_task(generate_architecture_task, project_id, db)
    return {"status": "accepted"}

@app.get("/projects/{project_id}/architecture")
async def get_project_architecture(project_id: str, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    arch = await db.projectarchitecture.find_unique(where={"projectId": project_id})
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")
    return arch

@app.post("/projects/{project_id}/prompts/generate", status_code=status.HTTP_202_ACCEPTED)
async def trigger_prompts_generation(project_id: str, background_tasks: BackgroundTasks, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check if already exists
    existing_prompts = await db.prompt.find_first(where={"projectId": project_id})
    if existing_prompts:
        return {"status": "already_generated"}
        
    background_tasks.add_task(generate_prompts_task, project_id, db)
    return {"status": "accepted"}

@app.get("/projects/{project_id}/prompts")
async def get_project_prompts(project_id: str, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    prompts = await db.prompt.find_many(where={"projectId": project_id}, order={"order": "asc"})
    return prompts

@app.get("/projects")
async def get_projects(current_user = Depends(get_current_user)):
    projects = await db.project.find_many(where={"userId": current_user.id}, order={"createdAt": "desc"})
    return projects

@app.get("/projects/{project_id}")
async def get_project(project_id: str, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/projects/{project_id}")
async def update_project(project_id: str, update_data: ProjectUpdate, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    updated_project = await db.project.update(
        where={"id": project_id},
        data=update_dict
    )
    return updated_project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user = Depends(get_current_user)):
    project = await db.project.find_first(where={"id": project_id, "userId": current_user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.project.delete(where={"id": project_id})
    return {"message": "Project deleted successfully"}
