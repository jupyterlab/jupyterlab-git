from subprocess import PIPE

from mock import patch, call, Mock

from jupyterlab_git.git import Git


@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
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
            ['git', 'pull', '--no-commit'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': 'Authentication failed'} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_pull_with_auth_fail(mock_git_auth_input_wrapper):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'".encode('utf-8'),
        'returncode': 1
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').pull('test_curr_path', auth)


    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git pull --no-commit',
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'"} == actual_response

@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
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
            ['git', 'pull', '--no-commit'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_pull_with_auth_success(mock_git_auth_input_wrapper):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').pull('test_curr_path', auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git pull --no-commit',
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response

@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
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
            ['git', 'push', 'test_origin', 'HEAD:test_master'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': 'Authentication failed'} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_push_with_auth_fail(mock_git_auth_input_wrapper):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'".encode('utf-8'),
        'returncode': 1
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').push('test_origin', 'HEAD:test_master', 'test_curr_path', auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git push test_origin HEAD:test_master',
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 1, 'message': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'"} == actual_response


@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
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
            ['git', 'push', '.', 'HEAD:test_master'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_push_with_auth_success(mock_git_auth_input_wrapper):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': 'does not matter'.encode('utf-8'),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').push('.', 'HEAD:test_master', 'test_curr_path', auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git push . HEAD:test_master',
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response