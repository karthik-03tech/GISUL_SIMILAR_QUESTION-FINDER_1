from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active[client_id] = ws

    def disconnect(self, client_id: str) -> None:
        self.active.pop(client_id, None)

    async def send_progress(self, client_id: str, step: str, detail: str = "") -> None:
        ws = self.active.get(client_id)
        if ws:
            try:
                await ws.send_json({"step": step, "detail": detail})
            except Exception:
                self.disconnect(client_id)


# Module-level singleton
manager = ConnectionManager()
