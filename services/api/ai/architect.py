import os
import asyncio
import time
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from prisma import Prisma

# --- Pydantic Schema (3-level depth, no recursion, no dict) ---

class FolderChild2(BaseModel):
    name: str = Field(description="Name of the file or folder")
    type: str = Field(description="Either 'file' or 'folder'")

class FolderChild1(BaseModel):
    name: str = Field(description="Name of the file or folder")
    type: str = Field(description="Either 'file' or 'folder'")
    children: Optional[List[FolderChild2]] = Field(None, description="List of children if type is 'folder'")

class FolderNode(BaseModel):
    name: str = Field(description="Name of the file or folder")
    type: str = Field(description="Either 'file' or 'folder'")
    children: Optional[List[FolderChild1]] = Field(None, description="List of children if type is 'folder'")

class DBField(BaseModel):
    name: str = Field(description="Name of the field (e.g. 'id', 'email')")
    type: str = Field(description="Data type (e.g. 'String', 'Int', 'DateTime', 'Boolean')")
    is_primary: bool = Field(False, description="Is this the primary key?")
    is_required: bool = Field(True, description="Is this field required?")
    relation: Optional[str] = Field(None, description="If this is a relation, which model does it relate to?")

class DBTable(BaseModel):
    name: str = Field(description="Name of the table/model")
    description: str = Field(description="Brief description of the table's purpose")
    fields: List[DBField] = Field(description="List of fields in the table")

class APIEndpoint(BaseModel):
    method: str = Field(description="HTTP Method (GET, POST, PUT, DELETE)")
    path: str = Field(description="Endpoint path (e.g. '/users/{id}')")
    description: str = Field(description="What does this endpoint do?")
    request_body: Optional[str] = Field(None, description="Description of the request body if applicable")
    response: str = Field(description="Description of the expected response")

class ArchitectureResult(BaseModel):
    frontendStack: str = Field(description="Recommended frontend tech stack")
    backendStack: str = Field(description="Recommended backend tech stack")
    databaseStack: str = Field(description="Recommended database")
    folderStructure: List[FolderNode] = Field(description="Root level folders and files")
    databaseSchema: List[DBTable] = Field(description="List of database tables")
    apiEndpoints: List[APIEndpoint] = Field(description="List of API endpoints")

# Models to try in order. Each has independent free-tier quotas.
MODEL_CHAIN = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.0-flash",
]

MAX_RETRIES = 3
RETRY_DELAY_SECS = 35  # Google says "retry in ~30s"


async def generate_architecture_task(project_id: str, db: Prisma):
    """Generate architecture with automatic retry + model fallback."""
    try:
        project = await db.project.find_unique(where={"id": project_id}, include={"aiAnalysis": True})
        if not project or not project.aiAnalysis:
            print("Project or AI Analysis not found")
            await _mark_project_status(db, project_id, "architecture_failed")
            return

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY is not set")
            await _mark_project_status(db, project_id, "architecture_failed")
            return

        client = genai.Client(api_key=api_key)

        prompt = f"""
        You are an expert software architect.
        Based on the following AI Analysis of a software idea, generate a complete technical architecture.
        
        Project Name: {project.name}
        Intent: {project.aiAnalysis.intent}
        Domain: {project.aiAnalysis.domain}
        Features: {', '.join(project.aiAnalysis.features)}
        
        Generate:
        1. Recommended Tech Stack (Frontend, Backend, Database)
        2. A complete Folder Structure representing the monorepo. Keep it to 3 levels deep max.
        3. Database Schema (Tables and Fields)
        4. Core API Endpoints
        """

        response = None
        last_error = None

        for model_name in MODEL_CHAIN:
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    print(f"[Architect] Trying model={model_name}, attempt={attempt}/{MAX_RETRIES}")
                    response = await asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=ArchitectureResult,
                            temperature=0.2,
                        )
                    )
                    # If we get here, it worked!
                    print(f"[Architect] Success with model={model_name} on attempt {attempt}")
                    break  # break retry loop
                except Exception as e:
                    last_error = e
                    error_str = str(e)
                    print(f"[Architect] model={model_name} attempt={attempt} failed: {error_str[:200]}")

                    # Only retry on rate-limit or transient errors
                    if "429" in error_str or "503" in error_str or "RESOURCE_EXHAUSTED" in error_str or "UNAVAILABLE" in error_str:
                        if attempt < MAX_RETRIES:
                            print(f"[Architect] Waiting {RETRY_DELAY_SECS}s before retry...")
                            await asyncio.sleep(RETRY_DELAY_SECS)
                            continue
                        else:
                            # Exhausted retries for this model, try next model
                            print(f"[Architect] Exhausted retries for {model_name}, trying next model...")
                            break
                    else:
                        # Non-retryable error (e.g. 404 model not found), skip to next model
                        print(f"[Architect] Non-retryable error for {model_name}, trying next model...")
                        break
            
            if response is not None:
                break  # break model loop — we got a response

        if response is None:
            print(f"[Architect] All models and retries exhausted. Last error: {last_error}")
            await _mark_project_status(db, project_id, "architecture_failed")
            return

        result = ArchitectureResult.model_validate_json(response.text)

        # Save to database
        await db.projectarchitecture.create(
            data={
                "projectId": project_id,
                "frontendStack": result.frontendStack,
                "backendStack": result.backendStack,
                "databaseStack": result.databaseStack,
                "folderStructure": json.dumps([node.model_dump() for node in result.folderStructure]),
                "databaseSchema": json.dumps([table.model_dump() for table in result.databaseSchema]),
                "apiEndpoints": json.dumps([endpoint.model_dump() for endpoint in result.apiEndpoints])
            }
        )

        # Update project status
        await _mark_project_status(db, project_id, "prompts")
        print(f"Architecture generated successfully for {project_id}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Architecture generation failed: {e}")
        await _mark_project_status(db, project_id, "architecture_failed")


async def _mark_project_status(db: Prisma, project_id: str, new_status: str):
    """Update the project status so the frontend can detect success or failure."""
    try:
        await db.project.update(where={"id": project_id}, data={"status": new_status})
    except Exception as e:
        print(f"[Architect] Failed to update project status: {e}")
