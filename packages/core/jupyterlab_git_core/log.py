import logging

from traitlets.config import Application


class _ExtensionLogger:
    _LOGGER = None  # type: Optional[logging.Logger]

    @classmethod
    def get_logger(cls) -> logging.Logger:
        if cls._LOGGER is None:
            app = Application.instance()
            cls._LOGGER = logging.getLogger("{!s}.jupyterlab_git".format(app.log.name))

        return cls._LOGGER


get_logger = _ExtensionLogger.get_logger
