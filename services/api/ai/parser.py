import os
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

class ParsedIdea(BaseModel):
    intent: str = Field(description="The primary goal or intent of the user (e.g., 'Build a social network', 'Automate data entry')")
    domain: str = Field(description="The primary technical/business domain (e.g., 'E-commerce', 'Healthcare', 'SaaS', 'Mobile Game')")
    subDomains: List[str] = Field(description="List of relevant sub-domains (e.g., 'Fintech', 'Social', 'AI')")
    features: List[str] = Field(description="List of extracted core features from the idea")
    targetAudience: Optional[str] = Field(None, description="The intended audience or user base, if explicitly mentioned or obvious")

def parse_raw_idea(raw_idea: str) -> ParsedIdea:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert software architect and product manager.
    Analyze the following raw software idea and extract the core intent, business domain, main features, and target audience.
    
    Raw Idea:
    {raw_idea}
    """
    
    response = client.models.generate_content(
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ParsedIdea,
            temperature=0.1,
        ),
    )
    
    # Safely parse the JSON text returned by the model
    return ParsedIdea.model_validate_json(response.text)
