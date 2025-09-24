from fastapi import FastAPI, Request
import httpx

app = FastAPI()

# Example proxy route
@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    service_map = {
        "user": "http://user-service:8000",
        "transaction": "http://transaction-service:8000",
        "category": "http://category-service:8000",
        "reporting": "http://reporting-service:8000",
        "notification": "http://notification-service:8000",
    }
    if service not in service_map:
        return {"error": "Unknown service"}
    url = f"{service_map[service]}/{path}"
    async with httpx.AsyncClient() as client:
        response = await client.request(
            request.method, url, params=dict(request.query_params), json=await request.json() if request.method in ("POST", "PUT") else None
        )
    return response.json()