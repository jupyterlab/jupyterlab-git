import pytest
from mock import Mock, ANY

from jupyterlab_git import handlers


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {
        'base_url': 'nb_base_url'
    }
    handlers.setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)
