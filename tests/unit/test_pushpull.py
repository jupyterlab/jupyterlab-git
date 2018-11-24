from subprocess import PIPE

from mock import patch, call, Mock

from jupyterlab_git.git import Git


@patch('subprocess.Popen')
def test_git_pull_fail(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', 'Authentication failed'.encode('utf-8')),
        'returncode': 1
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').pull('test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['GIT_TERMINAL_PROMPT=0 git pull --no-commit'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            shell=True
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': 'Authentication failed'} == actual_response


@patch('subprocess.Popen')
def test_git_pull_success(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').pull('test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['GIT_TERMINAL_PROMPT=0 git pull --no-commit'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            shell=True
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response


@patch('subprocess.Popen')
def test_git_push_fail(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', 'Authentication failed'.encode('utf-8')),
        'returncode': 1
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').push('test_origin', 'HEAD:test_master', 'test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['GIT_TERMINAL_PROMPT=0 git push test_origin HEAD:test_master'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            shell=True
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': 'Authentication failed'} == actual_response


@patch('subprocess.Popen')
def test_git_push_success(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', 'does not matter'.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').push('.', 'HEAD:test_master', 'test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['GIT_TERMINAL_PROMPT=0 git push . HEAD:test_master'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            shell=True
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response
