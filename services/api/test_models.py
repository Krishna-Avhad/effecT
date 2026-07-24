import os
from google import genai

client = genai.Client()
for m in client.models.list():
    if "pro" in m.name:
        print(m.name)
