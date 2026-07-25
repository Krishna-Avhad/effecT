import os
import asyncio
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from prisma import Prisma

class ImplementationPrompt(BaseModel):
    title: str = Field(description="Title of this implementation phase (e.g., 'Phase 1: Database & Core API')")
    content: str = Field(description="The actual markdown prompt to feed into the AI coding agent. Must be highly detailed, referencing the specific tech stack, architecture, and files.")
    order: int = Field(description="The sequential order of this prompt (e.g., 1, 2, 3)")

class PromptSequence(BaseModel):
    prompts: List[ImplementationPrompt] = Field(description="List of implementation prompts ordered sequentially")

async def generate_prompts_task(project_id: str, db: Prisma):
    try:
        project = await db.project.find_unique(
            where={"id": project_id}, 
            include={
                "aiAnalysis": True,
                "architecture": True
            }
        )
        if not project or not project.aiAnalysis or not project.architecture:
            print("Project, AI Analysis, or Architecture not found")
            return

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY is not set")
            return
        
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are an expert AI Agent orchestration engineer.
        Your task is to take the following software architecture and break it down into a sequence of 3 to 5 highly optimized implementation prompts.
        These prompts will be copy-pasted by a developer into an AI coding assistant (like Cursor or Claude Code) to build the app step-by-step.
        
        Project Name: {project.name}
        Intent: {project.aiAnalysis.intent}
        
        Architecture Tech Stack:
        - Frontend: {project.architecture.frontendStack}
        - Backend: {project.architecture.backendStack}
        - Database: {project.architecture.databaseStack}
        
        Folder Structure:
        {project.architecture.folderStructure}
        
        Database Schema:
        {project.architecture.databaseSchema}
        
        API Endpoints:
        {project.architecture.apiEndpoints}
        
        Guidelines for the Prompts:
        1. You MUST generate exactly 4 or 5 separate prompts. Each one is a different phase.
        2. Each prompt must be comprehensive and instruct the AI on exactly what files to create, what libraries to use, and what the database schema is.
        3. Sequence them logically:
           - Phase 1: Project Setup, Database Schema & Migrations
           - Phase 2: Core Backend API Routes & Business Logic
           - Phase 3: Frontend UI Components & Pages  
           - Phase 4: Integration, Auth & Data Flow
           - Phase 5: Polish, Testing & Deployment (optional)
        4. Make the 'content' field valid Markdown with code snippets where appropriate.
        5. Each prompt should be 200+ words with specific file paths, function names, and implementation details.
        """
        
        # Run blocking genai call in a thread
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PromptSequence,
                temperature=0.2,
            )
        )
        
        result = PromptSequence.model_validate_json(response.text)
        
        # Save to database
        for p in result.prompts:
            token_count = None
            try:
                token_response = await asyncio.to_thread(
                    client.models.count_tokens,
                    model='gemini-3.5-flash',
                    contents=p.content
                )
                token_count = token_response.total_tokens
            except Exception as token_err:
                print(f"Failed to count tokens: {token_err}")

            await db.prompt.create(
                data={
                    "projectId": project_id,
                    "title": p.title,
                    "content": p.content,
                    "order": p.order,
                    "tokenCount": token_count
                }
            )
        
        # Update project status
        await db.project.update(
            where={"id": project_id},
            data={"status": "prompts_generated"}
        )
        print(f"Prompts generated successfully for {project_id}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Prompt generation failed: {e}")
