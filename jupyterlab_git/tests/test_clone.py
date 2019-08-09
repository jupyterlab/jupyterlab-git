from subprocess import PIPE

from mock import patch, call, Mock

from jupyterlab_git.git import Git, git_auth_input_wrapper


@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
def test_git_clone_success(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('output', 'error'.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').clone(current_path='test_curr_path', repo_url='ghjkhjkl')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'clone', 'ghjkhjkl'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response


@patch('subprocess.Popen')
@patch('os.environ', {'TEST': 'test'})
def test_git_clone_failure_from_git(mock_subproc_popen):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('test_output', 'fatal: Not a git repository'.encode('utf-8')),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').clone(current_path='test_curr_path', repo_url='ghjkhjkl')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'clone', 'ghjkhjkl'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 128, 'message': 'fatal: Not a git repository'} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_clone_with_auth_success(mock_git_auth_input_wrapper):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': '',
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').clone(current_path='test_curr_path', repo_url='ghjkhjkl', auth=auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git clone ghjkhjkl -q',
            cwd = '/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 0} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_clone_with_auth_wrong_repo_url_failure_from_git(mock_git_auth_input_wrapper):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': "fatal: repository 'ghjkhjkl' does not exist".encode('utf-8'),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').clone(current_path='test_curr_path', repo_url='ghjkhjkl', auth=auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git clone ghjkhjkl -q',
            cwd = '/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 128, 'message': "fatal: repository 'ghjkhjkl' does not exist"} == actual_response

@patch('jupyterlab_git.git.git_auth_input_wrapper')
@patch('os.environ', {'TEST': 'test'})
def test_git_clone_with_auth_auth_failure_from_git(mock_git_auth_input_wrapper):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'".encode('utf-8'),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_git_auth_input_wrapper.return_value = process_mock

    # When
    auth = {
        'username' : 'asdf', 
        'password' : 'qwerty'
    }
    actual_response = Git(root_dir='/bin').clone(current_path='test_curr_path', repo_url='ghjkhjkl', auth=auth)

    # Then
    mock_git_auth_input_wrapper.assert_has_calls([
        call(
            command = 'git clone ghjkhjkl -q',
            cwd = '/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '1'},
            username = 'asdf',
            password = 'qwerty'
        ),
        call().communicate()
    ])
    assert {'code': 128, 'message': "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'"} == actual_response
