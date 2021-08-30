c.ServerApp.port = 8888
c.ServerApp.token = ""
c.ServerApp.password = ""
c.ServerApp.disable_check_xsrf = True
c.ServerApp.open_browser = False
c.LabServerApp.extra_labextensions_path = "/opt/labextension"
# Workaround bug: https://github.com/ipython/traitlets/issues/668
c.LabServerApp.extra_labextensions_path = "/dev/null"
