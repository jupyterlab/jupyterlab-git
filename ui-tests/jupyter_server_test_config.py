"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
import sys
from tempfile import mkdtemp

try:
    import jupyter_archive
except ImportError:
    print("You must install `jupyter-archive` for the integration tests.")
    sys.exit(1)

c.ServerApp.port = 8888
c.ServerApp.port_retries = 0
c.ServerApp.open_browser = False

c.ServerApp.root_dir = mkdtemp(prefix="galata-test-")
c.ServerApp.token = ""
c.ServerApp.password = ""
c.ServerApp.disable_check_xsrf = True
c.LabApp.expose_app_in_browser = True

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
