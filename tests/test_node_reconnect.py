import logging
import os
import sys
from types import SimpleNamespace

import importlib.machinery
import importlib.util
import types
import pytest

MODULE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "xray", "operations.py"))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

dummy_sa = types.ModuleType("sqlalchemy")
dummy_exc = types.ModuleType("sqlalchemy.exc")
dummy_exc.SQLAlchemyError = Exception
sys.modules.setdefault("sqlalchemy", dummy_sa)
sys.modules.setdefault("sqlalchemy.exc", dummy_exc)

class DummyDB:
    pass

class DummyContext:
    def __enter__(self):
        return DummyDB()
    def __exit__(self, exc_type, exc, tb):
        pass

holder = {}
fake_dbnode = SimpleNamespace(id=1, name='test')

dummy_app = types.ModuleType("app")
dummy_app.logger = logging.getLogger("test")
dummy_app.xray = types.SimpleNamespace(
    nodes={},
    config=types.SimpleNamespace(include_db_users=lambda: {}),
    operations=types.SimpleNamespace(add_node=lambda dbnode: holder.get('node')),
    core=types.SimpleNamespace(restart=lambda cfg: None),
)
sys.modules["app"] = dummy_app
sys.modules["app.db"] = types.SimpleNamespace(GetDB=lambda: DummyContext(), crud=types.SimpleNamespace(get_node_by_id=lambda db, node_id: fake_dbnode))
sys.modules["app.models.node"] = types.SimpleNamespace(NodeStatus=types.SimpleNamespace(connected="connected", connecting="connecting", error="error", disabled="disabled"))
sys.modules["app.models.user"] = types.SimpleNamespace(UserResponse=None)
sys.modules["app.utils.concurrency"] = types.SimpleNamespace(threaded_function=lambda f: f)
sys.modules["app.xray.node"] = types.SimpleNamespace(XRayNode=None)
sys.modules["config"] = types.SimpleNamespace(NODE_RECONNECT_ATTEMPTS=5, NODE_RECONNECT_BACKOFF=0)

spec = importlib.util.spec_from_loader("operations", importlib.machinery.SourceFileLoader("operations", MODULE_PATH))
operations = importlib.util.module_from_spec(spec)
spec.loader.exec_module(operations)

def test_reconnect_attempts(monkeypatch, caplog):
    attempts = []
    class FakeNode:
        def __init__(self):
            self.start_calls = 0
            self.connected = False
        def start(self, config):
            self.start_calls += 1
            attempts.append(self.start_calls)
            if self.start_calls < 3:
                raise Exception('fail')
            self.connected = True
        def get_version(self):
            return '1.0'
    fake_node = FakeNode()
    holder['node'] = fake_node

    fake_dbnode = SimpleNamespace(id=1, name='test')
    monkeypatch.setattr(operations, 'GetDB', lambda: DummyContext())
    monkeypatch.setattr(operations.crud, 'get_node_by_id', lambda db, node_id: fake_dbnode)
    monkeypatch.setattr(operations, '_connecting_nodes', {})
    monkeypatch.setattr(operations.xray, 'nodes', {1: fake_node})
    monkeypatch.setattr(operations.xray.config, 'include_db_users', lambda: {})
    monkeypatch.setattr(operations, '_change_node_status', lambda *a, **k: None)
    called = {'restart': 0}
    monkeypatch.setattr(operations.xray.core, 'restart', lambda cfg: called.__setitem__('restart', called['restart']+1))
    monkeypatch.setattr(logging, 'info', logging.getLogger().info)
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(operations, 'NODE_RECONNECT_ATTEMPTS', 5)
    monkeypatch.setattr(operations, 'NODE_RECONNECT_BACKOFF', 0)
    monkeypatch.setattr(operations.time, 'sleep', lambda s: None)

    operations._connect_node(1)
    assert fake_node.connected
    assert called['restart'] == 0
    assert len(attempts) == 3
