from subprocess import PIPE

from mock import patch, call, Mock

from jupyterlab_git.git import Git


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
            ['git clone ghjkhjkl'],
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
            ['git clone ghjkhjkl'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path',
            env={'TEST': 'test', 'GIT_TERMINAL_PROMPT': '0'},
        ),
        call().communicate()
    ])
    assert {'code': 128, 'message': 'fatal: Not a git repository'} == actual_response
