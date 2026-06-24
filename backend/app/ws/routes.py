from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/progress/{client_id}")
async def progress_ws(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # client sends: {"action": "ping"}
            await websocket.send_json({"status": "connected", "client_id": client_id})
    except WebSocketDisconnect:
        manager.disconnect(client_id)
