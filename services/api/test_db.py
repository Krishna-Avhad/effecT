import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    p = await db.project.find_unique(where={"id": "801ca3a1-f571-4ce2-8331-35cea712dda0"})
    print(p.status if p else "Not found")
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
