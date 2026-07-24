import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    projects = await db.project.find_many(include={"aiAnalysis": True, "architecture": True})
    for p in projects:
        print(f"Project ID: {p.id}")
        print(f"Status: {p.status}")
        print(f"Has Analysis: {p.aiAnalysis is not None}")
        print(f"Has Architecture: {p.architecture is not None}")
        print("---")
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
