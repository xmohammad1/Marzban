from copy import deepcopy
from random import randint
from typing import TYPE_CHECKING, Dict, Sequence

from app.models.proxy import ProxyHostSecurity
from app.utils.store import DictStorage
from app.utils.system import check_port
from app.xray import operations
from app.xray.config import XRayConfig
from app.xray.core import XRayCore
from app.xray.node import XRayNode
from config import XRAY_ASSETS_PATH, XRAY_EXECUTABLE_PATH, XRAY_JSON
from xray_api import XRay as XRayAPI
from xray_api import exceptions, types
from xray_api import exceptions as exc

core = XRayCore(XRAY_EXECUTABLE_PATH, XRAY_ASSETS_PATH)

# Search for a free API port
try:
    for api_port in range(randint(10000, 60000), 65536):
        if not check_port(api_port):
            break
finally:
    config = XRayConfig(XRAY_JSON, api_port=api_port)
    del api_port

api = XRayAPI(config.api_host, config.api_port)

nodes: Dict[int, XRayNode] = {}


if TYPE_CHECKING:
    from app.db.models import ProxyHost


@DictStorage
def hosts(storage: dict):
    from app.db import GetDB, crud

    storage.clear()
    with GetDB() as db:
        for inbound_tag in config.inbounds_by_tag:
            inbound_hosts: Sequence[ProxyHost] = crud.get_hosts(db, inbound_tag)

            storage[inbound_tag] = [
                {
                    "remark": host.remark,
                    "address": [i.strip() for i in host.address.split(',')] if host.address else [],
                    "port": host.port,
                    "path": host.path if host.path else None,
                    "sni": [i.strip() for i in host.sni.split(',')] if host.sni else [],
                    "host": [i.strip() for i in host.host.split(',')] if host.host else [],
                    "alpn": host.alpn.value,
                    "fingerprint": host.fingerprint.value,
                    # None means the tls is not specified by host itself and
                    #  complies with its inbound's settings.
                    "tls": None
                    if host.security == ProxyHostSecurity.inbound_default
                    else host.security.value,
                    "allowinsecure": host.allowinsecure,
                    "mux_enable": host.mux_enable,
                    "fragment_setting": host.fragment_setting,
                    "noise_setting": host.noise_setting,
                    "random_user_agent": host.random_user_agent,
                    "use_sni_as_host": host.use_sni_as_host,
                } for host in inbound_hosts if not host.is_disabled
            ]


def _clone_config_dict(source):
    if isinstance(source, XRayConfig):
        return source.copy()
    return deepcopy(source)


def build_default_config():
    base = _clone_config_dict(config)
    return XRayConfig(base, api_port=config.api_port).include_db_users()


def build_node_config(dbnode):
    base = _clone_config_dict(config)
    try:
        if dbnode.template and dbnode.template.config:
            base = _clone_config_dict(dbnode.template.config)
    except AttributeError:
        pass

    cfg = XRayConfig(base, api_port=config.api_port)
    return cfg.include_db_users()


__all__ = [
    "config",
    "hosts",
    "core",
    "api",
    "nodes",
    "operations",
    "exceptions",
    "exc",
    "types",
    "XRayConfig",
    "XRayCore",
    "XRayNode",
    "build_node_config",
    "build_default_config",
]
