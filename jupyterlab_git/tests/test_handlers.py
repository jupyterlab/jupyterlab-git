import json
from unittest.mock import Mock, ANY, patch

from jupyterlab_git.handlers import (
    GitAllHistoryHandler,
    GitBranchHandler,
    GitLogHandler,
    GitPushHandler,
    GitUpstreamHandler,
    setup_handlers
)

def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {
        'base_url': 'nb_base_url'
    }
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


@patch('jupyterlab_git.handlers.GitAllHistoryHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitAllHistoryHandler.get_json_body', Mock(return_value={'current_path': 'test_path', 'history_count': 25}))
@patch('jupyterlab_git.handlers.GitAllHistoryHandler.git')
@patch('jupyterlab_git.handlers.GitAllHistoryHandler.finish')
def test_all_history_handler_localbranch(mock_finish, mock_git):
    # Given
    show_top_level = {'code': 0, 'foo': 'top_level'}
    branch = 'branch_foo'
    log = 'log_foo'
    status = 'status_foo'

    mock_git.show_top_level.return_value = show_top_level
    mock_git.branch.return_value = branch
    mock_git.log.return_value = log
    mock_git.status.return_value = status

    # When
    GitAllHistoryHandler().post()

    # Then
    mock_git.show_top_level.assert_called_with('test_path')
    mock_git.branch.assert_called_with('test_path')
    mock_git.log.assert_called_with('test_path', 25)
    mock_git.status.assert_called_with('test_path')

    mock_finish.assert_called_with(json.dumps({
        'code': show_top_level['code'],
        'data': {
            'show_top_level': show_top_level,
            'branch': branch,
            'log': log,
            'status': status,
        }
    }))


@patch('jupyterlab_git.handlers.GitBranchHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitBranchHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitBranchHandler.git')
@patch('jupyterlab_git.handlers.GitBranchHandler.finish')
def test_branch_handler_localbranch(mock_finish, mock_git):
    # Given
    branch = {
        'code': 0,
        'branches': [
            {
                'is_current_branch': True,
                'is_remote_branch': False,
                'name': 'feature-foo',
                'upstream': 'origin/feature-foo',
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            },
            {
                'is_current_branch': False,
                'is_remote_branch': False,
                'name': 'master',
                'upstream': 'origin/master',
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            },
            {
                'is_current_branch': False,
                'is_remote_branch': False,
                'name': 'feature-bar',
                'upstream': None,
                'top_commit': '01234567899999abcdefghijklmnopqrstuvwxyz',
                'tag': None
            },
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/feature-foo',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            },
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/master',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            }
        ]
    }

    mock_git.branch.return_value = branch

    # When
    GitBranchHandler().post()

    # Then
    mock_git.branch.assert_called_with('test_path')

    mock_finish.assert_called_with(json.dumps({
        'code': 0,
        'branches': branch['branches']
    }))

@patch('jupyterlab_git.handlers.GitLogHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitLogHandler.get_json_body', Mock(return_value={'current_path': 'test_path', 'history_count': 20}))
@patch('jupyterlab_git.handlers.GitLogHandler.git')
@patch('jupyterlab_git.handlers.GitLogHandler.finish')
def test_log_handler(mock_finish, mock_git):
    # Given
    log = {'code': 0, 'commits': []}
    mock_git.log.return_value = log

    # When
    GitLogHandler().post()

    # Then
    mock_git.log.assert_called_with('test_path', 20)
    mock_finish.assert_called_with(json.dumps(log))


@patch('jupyterlab_git.handlers.GitLogHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitLogHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitLogHandler.git')
@patch('jupyterlab_git.handlers.GitLogHandler.finish')
def test_log_handler_no_history_count(mock_finish, mock_git):
    # Given
    log = {'code': 0, 'commits': []}
    mock_git.log.return_value = log

    # When
    GitLogHandler().post()

    # Then
    mock_git.log.assert_called_with('test_path', 25)
    mock_finish.assert_called_with(json.dumps(log))


@patch('jupyterlab_git.handlers.GitPushHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitPushHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitPushHandler.git')
@patch('jupyterlab_git.handlers.GitPushHandler.finish')
def test_push_handler_localbranch(mock_finish, mock_git):
    # Given
    mock_git.get_current_branch.return_value = 'foo'
    mock_git.get_upstream_branch.return_value = 'localbranch'
    mock_git.push.return_value = {'code': 0}

    # When
    GitPushHandler().post()

    # Then
    mock_git.get_current_branch.assert_called_with('test_path')
    mock_git.get_upstream_branch.assert_called_with('test_path', 'foo')
    mock_git.push.assert_called_with('.', 'HEAD:localbranch', 'test_path', None)
    mock_finish.assert_called_with('{"code": 0}')


@patch('jupyterlab_git.handlers.GitPushHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitPushHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitPushHandler.git')
@patch('jupyterlab_git.handlers.GitPushHandler.finish')
def test_push_handler_remotebranch(mock_finish, mock_git):
    # Given
    mock_git.get_current_branch.return_value = 'foo'
    mock_git.get_upstream_branch.return_value = 'origin/remotebranch'
    mock_git.push.return_value = {'code': 0}

    # When
    GitPushHandler().post()

    # Then
    mock_git.get_current_branch.assert_called_with('test_path')
    mock_git.get_upstream_branch.assert_called_with('test_path', 'foo')
    mock_git.push.assert_called_with('origin', 'HEAD:remotebranch', 'test_path', None)
    mock_finish.assert_called_with('{"code": 0}')


@patch('jupyterlab_git.handlers.GitPushHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitPushHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitPushHandler.git')
@patch('jupyterlab_git.handlers.GitPushHandler.finish')
def test_push_handler_noupstream(mock_finish, mock_git):
    # Given
    mock_git.get_current_branch.return_value = 'foo'
    mock_git.get_upstream_branch.return_value = ''
    mock_git.push.return_value = {'code': 0}

    # When
    GitPushHandler().post()

    # Then
    mock_git.get_current_branch.assert_called_with('test_path')
    mock_git.get_upstream_branch.assert_called_with('test_path', 'foo')
    mock_git.push.assert_not_called()
    mock_finish.assert_called_with('{"code": 128, "message": "fatal: The current branch foo has no upstream branch."}')


@patch('jupyterlab_git.handlers.GitUpstreamHandler.__init__', Mock(return_value=None))
@patch('jupyterlab_git.handlers.GitUpstreamHandler.get_json_body', Mock(return_value={'current_path': 'test_path'}))
@patch('jupyterlab_git.handlers.GitUpstreamHandler.git')
@patch('jupyterlab_git.handlers.GitUpstreamHandler.finish')
def test_upstream_handler_localbranch(mock_finish, mock_git):
    # Given
    mock_git.get_current_branch.return_value = 'foo'
    mock_git.get_upstream_branch.return_value = 'bar'

    # When
    GitUpstreamHandler().post()

    # Then
    mock_git.get_current_branch.assert_called_with('test_path')
    mock_git.get_upstream_branch.assert_called_with('test_path', 'foo')
    mock_finish.assert_called_with('{"upstream": "bar"}')
