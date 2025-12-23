import asyncio
import json
import time
from typing import List

import commentjson
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.exc import IntegrityError
from starlette.websockets import WebSocketDisconnect

from app import xray
from app.db import Session, crud, get_db
from app.models.admin import Admin
from app.models.core import CoreStats
from app.models.xray_template import (
    XRayConfigTemplateCreate,
    XRayConfigTemplateResponse,
    XRayConfigTemplateUpdate,
)
from app.utils import responses
from app.xray import XRayConfig
from config import XRAY_JSON

router = APIRouter(tags=["Core"], prefix="/api", responses={401: responses._401})


@router.websocket("/core/logs")
async def core_logs(websocket: WebSocket, db: Session = Depends(get_db)):
    token = websocket.query_params.get("token") or websocket.headers.get(
        "Authorization", ""
    ).removeprefix("Bearer ")
    admin = Admin.get_admin(token, db)
    if not admin:
        return await websocket.close(reason="Unauthorized", code=4401)

    if not admin.is_sudo:
        return await websocket.close(reason="You're not allowed", code=4403)

    interval = websocket.query_params.get("interval")
    if interval:
        try:
            interval = float(interval)
        except ValueError:
            return await websocket.close(reason="Invalid interval value", code=4400)
        if interval > 10:
            return await websocket.close(
                reason="Interval must be more than 0 and at most 10 seconds", code=4400
            )

    await websocket.accept()

    cache = ""
    last_sent_ts = 0
    with xray.core.get_logs() as logs:
        while True:
            if interval and time.time() - last_sent_ts >= interval and cache:
                try:
                    await websocket.send_text(cache)
                except (WebSocketDisconnect, RuntimeError):
                    break
                cache = ""
                last_sent_ts = time.time()

            if not logs:
                try:
                    await asyncio.wait_for(websocket.receive(), timeout=0.2)
                    continue
                except asyncio.TimeoutError:
                    continue
                except (WebSocketDisconnect, RuntimeError):
                    break

            log = logs.popleft()

            if interval:
                cache += f"{log}\n"
                continue

            try:
                await websocket.send_text(log)
            except (WebSocketDisconnect, RuntimeError):
                break


@router.get("/core", response_model=CoreStats)
def get_core_stats(admin: Admin = Depends(Admin.get_current)):
    """Retrieve core statistics such as version and uptime."""
    return CoreStats(
        version=xray.core.version,
        started=xray.core.started,
        logs_websocket=router.url_path_for("core_logs"),
    )


@router.post("/core/restart", responses={403: responses._403})
def restart_core(admin: Admin = Depends(Admin.check_sudo_admin)):
    """Restart the core and all connected nodes."""
    startup_config = xray.build_default_config()
    xray.core.restart(startup_config)

    for node_id, node in list(xray.nodes.items()):
        if node.connected:
            xray.operations.restart_node(node_id)

    return {}


@router.get("/core/config", responses={403: responses._403})
def get_core_config(admin: Admin = Depends(Admin.check_sudo_admin)) -> dict:
    """Get the current core configuration."""
    with open(XRAY_JSON, "r") as f:
        config = commentjson.loads(f.read())

    return config


@router.put("/core/config", responses={403: responses._403})
def modify_core_config(
    payload: dict, admin: Admin = Depends(Admin.check_sudo_admin)
) -> dict:
    """Modify the core configuration and restart the core."""
    try:
        config = XRayConfig(payload, api_port=xray.config.api_port)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    xray.config = config
    with open(XRAY_JSON, "w") as f:
        f.write(json.dumps(payload, indent=4))

    startup_config = xray.build_default_config()
    xray.core.restart(startup_config)
    for node_id, node in list(xray.nodes.items()):
        if node.connected:
            xray.operations.restart_node(node_id)

    xray.hosts.update()

    return payload


@router.get(
    "/xray/templates",
    response_model=List[XRayConfigTemplateResponse],
    responses={403: responses._403},
)
def list_config_templates(
    db: Session = Depends(get_db), admin: Admin = Depends(Admin.check_sudo_admin)
):
    return crud.get_xray_templates(db)


@router.get(
    "/xray/templates/{template_id}",
    response_model=XRayConfigTemplateResponse,
    responses={403: responses._403},
)
def get_config_template(
    template_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(Admin.check_sudo_admin),
):
    db_template = crud.get_xray_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template


@router.post(
    "/xray/templates",
    status_code=201,
    response_model=XRayConfigTemplateResponse,
    responses={403: responses._403, 409: responses._409},
)
def create_config_template(
    payload: XRayConfigTemplateCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(Admin.check_sudo_admin),
):
    try:
        return crud.create_xray_template(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Template name already exists")


@router.put(
    "/xray/templates/{template_id}",
    response_model=XRayConfigTemplateResponse,
    responses={403: responses._403},
)
def update_config_template(
    template_id: int,
    payload: XRayConfigTemplateUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(Admin.check_sudo_admin),
):
    db_template = crud.get_xray_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    try:
        db_template = crud.update_xray_template(db, db_template, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Template name already exists")

    for node in crud.get_nodes_by_template(db, db_template.id):
        try:
            xray.operations.restart_node(node.id)
        except Exception:
            pass

    return db_template


@router.delete(
    "/xray/templates/{template_id}",
    status_code=200,
    responses={403: responses._403},
)
def delete_config_template(
    template_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(Admin.check_sudo_admin),
):
    db_template = crud.get_xray_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    affected_node_ids = [node.id for node in db_template.nodes]
    crud.remove_xray_template(db, db_template)

    for node_id in affected_node_ids:
        try:
            xray.operations.restart_node(node_id)
        except Exception:
            pass

    return {}
