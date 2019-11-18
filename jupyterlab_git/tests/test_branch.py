# python lib
import pytest
from subprocess import PIPE
from mock import patch, call, Mock

# local lib
from jupyterlab_git.git import Git


def test_is_branch():
    test_cases = [
        ('refs/heads/feature-foo', True),
        ('refs/heads/master', True),
        ('refs/remotes/origin/feature-foo', True),
        ('refs/remotes/origin/HEAD', True),
        ('refs/stash', False),
        ('refs/tags/v0.1.0', False),
        ('refs/tags/blah@0.2.0', False)
    ]
    for test_case in test_cases:
        actual_response = Git(root_dir='/bin')._is_branch(test_case[0])
        assert test_case[1] == actual_response


def test_is_current_branch():
    current_branch = 'feature-foo'
    test_cases = [
        ('feature-foo', True),
        ('master', False),
        ('origin/feature-foo', False),
        ('origin/HEAD', False)
    ]
    for test_case in test_cases:
        actual_response = Git(root_dir='/bin')._is_current_branch(test_case[0], current_branch)
        assert test_case[1] == actual_response


def test_is_remote_branch():
    test_cases = [
        ('refs/heads/feature-foo', False),
        ('refs/heads/master', False),
        ('refs/remotes/origin/feature-foo', True),
        ('refs/remotes/origin/HEAD', True),
        ('refs/stash', False),
        ('refs/tags/v0.1.0', False),
        ('refs/tags/blah@0.2.0', False)
    ]
    for test_case in test_cases:
        actual_response = Git(root_dir='/bin')._is_remote_branch(test_case[0])
        assert test_case[1] == actual_response


def test_get_branch_name():
    good_test_cases = [
        ('refs/heads/feature-foo', 'feature-foo'),
        ('refs/heads/master', 'master'),
        ('refs/remotes/origin/feature-foo', 'origin/feature-foo'),
        ('refs/remotes/origin/HEAD', 'origin/HEAD')
    ]
    bad_test_cases = [
        'refs/stash',
        'refs/tags/v0.1.0',
        'refs/tags/blah@0.2.0'
    ]
    for test_case in good_test_cases:
        actual_response = Git(root_dir='/bin')._get_branch_name(test_case[0])
        assert test_case[1] == actual_response

    for test_case in bad_test_cases:
        with pytest.raises(ValueError):
            Git(root_dir='/bin')._get_branch_name(test_case)


@patch('subprocess.Popen')
def test_get_current_branch_success(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('feature-foo'.encode('utf-8'), ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').get_current_branch(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert 'feature-foo' == actual_response

@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value=None)
def test_checkout_branch_noref_success(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    curr_path='test_curr_path'
    stdout_message='checkout output from git'
    stderr_message=''
    rc=0

    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')),
        'returncode': rc
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(branchname=branch, current_path=curr_path)

    # Then
    mock__get_branch_reference.assert_has_calls([ call(branch, curr_path) ])

    cmd=['git', 'checkout', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/{}'.format(curr_path)),
        call().communicate()
    ])

    assert { "code": rc, "message": stdout_message } == actual_response


@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value=None)
def test_checkout_branch_noref_failure(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    curr_path='test_curr_path'
    stdout_message=''
    stderr_message="error: pathspec '{}' did not match any file(s) known to git".format(branch)
    rc=1

    # Given
    process_mock = Mock()
    attrs = { 'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')), 'returncode': rc }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(branchname=branch, current_path=curr_path)

    # Then
    mock__get_branch_reference.assert_has_calls([ call(branch, curr_path) ])

    cmd=['git', 'checkout', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/{}'.format(curr_path)),
        call().communicate()
    ])

    assert { "code": rc, "message": stderr_message,  "command": ' '.join(cmd) } == actual_response


@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value="refs/remotes/remote_branch")
def test_checkout_branch_remoteref_success(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    curr_path='test_curr_path'
    stdout_message='checkout output from git'
    stderr_message=''
    rc=0

    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')),
        'returncode': rc
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(branchname=branch, current_path=curr_path)

    # Then
    mock__get_branch_reference.assert_has_calls([ call(branch, curr_path) ])

    cmd=['git', 'checkout', '--track', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/{}'.format(curr_path)),
        call().communicate()
    ])
    assert { "code": rc, "message": stdout_message } == actual_response


@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value="refs/heads/local_branch")
def test_checkout_branch_headsref_failure(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    curr_path='test_curr_path'
    stdout_message=''
    stderr_message="error: pathspec '{}' did not match any file(s) known to git".format(branch)
    rc=1

    # Given
    process_mock = Mock()
    attrs = { 'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')), 'returncode': rc }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(branchname=branch, current_path=curr_path)

    # Then
    mock__get_branch_reference.assert_has_calls([ call(branch, curr_path) ])

    cmd=['git', 'checkout', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/{}'.format(curr_path)),
        call().communicate()
    ])
    assert { "code": rc, "message": stderr_message,  "command": ' '.join(cmd) } == actual_response


@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value="refs/heads/local_branch")
def test_checkout_branch_headsref_success(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    stdout_message='checkout output from git'
    stderr_message=''
    rc=0

    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')),
        'returncode': rc
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(
        branchname=branch,
        current_path='test_curr_path')

    # Then
    cmd=['git', 'checkout', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/test_curr_path'),
        call().communicate()
    ])
    assert { "code": rc, "message": stdout_message } == actual_response


@patch('subprocess.Popen')
@patch.object(Git, '_get_branch_reference', return_value="refs/remotes/remote_branch")
def test_checkout_branch_remoteref_failure(mock__get_branch_reference, mock_subproc_popen):
    branch='test-branch'
    stdout_message=''
    stderr_message="error: pathspec '{}' did not match any file(s) known to git".format(branch)
    rc=1

    # Given
    process_mock = Mock()
    attrs = { 'communicate.return_value': (stdout_message.encode('utf-8'), stderr_message.encode('utf-8')), 'returncode': rc }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin').checkout_branch(branchname=branch, current_path='test_curr_path')

    # Then
    cmd=['git', 'checkout', '--track', branch]
    mock_subproc_popen.assert_has_calls([
        call(cmd, stdout=PIPE, stderr=PIPE, cwd='/bin/test_curr_path'),
        call().communicate()
    ])
    assert { "code": rc, "message": stderr_message,  "command": ' '.join(cmd) } == actual_response



@patch('subprocess.Popen')
def test_get_branch_reference_success(mock_subproc_popen):
    actual_response = 0
    branch='test-branch'
    reference = 'refs/remotes/origin/test_branch'
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (reference.encode('utf-8'), ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock
 
    # When
    actual_response = Git(root_dir='/bin')._get_branch_reference(
        branchname=branch,
        current_path='test_curr_path')
 
    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--symbolic-full-name', branch],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert actual_response == reference


@patch('subprocess.Popen')
def test_get_branch_reference_failure(mock_subproc_popen):
    actual_response = 0
    branch='test-branch'
    reference = 'test-branch'
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (
            reference.encode('utf-8'),
            "fatal: ambiguous argument '{}': unknown revision or path not in the working tree.".format(branch).encode('utf-8')
        ),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock
 
    # When
    actual_response = Git(root_dir='/bin')._get_branch_reference(
        branchname=branch,
        current_path='test_curr_path')
 
    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--symbolic-full-name', branch],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert actual_response is None


@patch('subprocess.Popen')
def test_get_current_branch_failure(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (
            '', 'fatal: Not a git repository (or any of the parent directories): .git'.encode('utf-8')),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    with pytest.raises(Exception) as error:
        Git(root_dir='/bin').get_current_branch(current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert 'Error [fatal: Not a git repository (or any of the parent directories): .git] ' \
           'occurred while executing [git rev-parse --abbrev-ref HEAD] command to get current branch.' == str(
        error.value)


@patch('subprocess.Popen')
def test_get_detached_head_name_success(mock_subproc_popen):
    # Given
    process_output = [
        '* (HEAD detached at origin/feature-foo)',
        '  master',
        '  remotes/origin/feature-foo',
        '  remotes/origin/HEAD'
    ]
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('\n'.join(process_output).encode('utf-8'), ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin')._get_detached_head_name(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'branch', '-a'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert '(HEAD detached at origin/feature-foo)' == actual_response


@patch('subprocess.Popen')
def test_get_detached_head_name_failure(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (
            '', 'fatal: Not a git repository (or any of the parent directories): .git'.encode('utf-8')),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    with pytest.raises(Exception) as error:
        Git(root_dir='/bin')._get_detached_head_name(current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'branch', '-a'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert 'Error [fatal: Not a git repository (or any of the parent directories): .git] ' \
           'occurred while executing [git branch -a] command to get detached HEAD name.' == str(error.value)


@patch('subprocess.Popen')
def test_get_upstream_branch_success(mock_subproc_popen):
    # Tuple structure : (branch_name, upstream_branch_name)
    test_cases = [
        ('feature-foo', 'origin/master'),
        ('master', 'origin/master'),
        ('feature-bar', 'feature-foo')
    ]

    for test_case in test_cases:
        # Given
        process_mock = Mock()
        attrs = {
            'communicate.return_value': (test_case[1].encode('utf-8'), ''.encode('utf-8')),
            'returncode': 0
        }
        process_mock.configure_mock(**attrs)
        mock_subproc_popen.return_value = process_mock

        # When
        actual_response = Git(root_dir='/bin').get_upstream_branch(
            current_path='test_curr_path', branch_name=test_case[0])

        # Then
        mock_subproc_popen.assert_has_calls([
            call(
                ['git', 'rev-parse', '--abbrev-ref',
                 '{}@{{upstream}}'.format(test_case[0])],
                stdout=PIPE,
                stderr=PIPE,
                cwd='/bin/test_curr_path'
            ),
            call().communicate()
        ])
        assert test_case[1] == actual_response
        mock_subproc_popen.reset_mock()
        process_mock.reset_mock()


@patch('subprocess.Popen')
def test_get_upstream_branch_failure(mock_subproc_popen):
    # Given
    process_mock = Mock(returncode=128)
    process_mock.communicate.side_effect = [
        ('', "fatal: no such branch: 'blah'".encode('utf-8')),
        ('', "fatal: no upstream configured for branch".encode('utf-8')),
        ('', "fatal: ambiguous argument 'blah@origin': unknown revision or path not in the working tree.".encode('utf-8'))
    ]
    mock_subproc_popen.return_value = process_mock

    # When: fatal: no such branch: 'blah'
    with pytest.raises(Exception) as error:
        Git(root_dir='/bin').get_upstream_branch(
            current_path='test_curr_path', branch_name='blah')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--abbrev-ref',
             'blah@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)
    assert "Error [fatal: no such branch: 'blah'] " \
           "occurred while executing [git rev-parse --abbrev-ref blah@{upstream}] command to get upstream branch." == str(
        error.value)

    # When: fatal: no upstream configured for branch
    actual_response = Git(root_dir='/bin').get_upstream_branch(
        current_path='test_curr_path', branch_name='test')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--abbrev-ref',
             'test@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)
    assert None == actual_response

    # When: "fatal: ambiguous argument 'blah@origin': unknown revision or path not in the working tree.
    actual_response = Git(root_dir='/bin').get_upstream_branch(
        current_path='test_curr_path', branch_name='blah')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'rev-parse', '--abbrev-ref',
             'blah@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)
    assert None == actual_response


@patch('subprocess.Popen')
def test_get_tag_success(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': ('v0.3.0'.encode('utf-8'), ''.encode('utf-8')),
        'returncode': 0
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin')._get_tag(
        current_path='test_curr_path', commit_sha='abcdefghijklmnopqrstuvwxyz01234567890123')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])
    assert 'v0.3.0' == actual_response


@patch('subprocess.Popen')
def test_get_tag_failure(mock_subproc_popen):
    # Given
    process_mock = Mock(returncode=128)
    process_mock.communicate.side_effect = [
        ('', "fatal: Not a valid object name blah".encode('utf-8')),
        ('', "fatal: No tags can describe '01234567899999abcdefghijklmnopqrstuvwxyz'.".encode('utf-8'))
    ]
    mock_subproc_popen.return_value = process_mock

    # When
    with pytest.raises(Exception) as error:
        Git(root_dir='/bin')._get_tag(
            current_path='test_curr_path', commit_sha='blah')

    assert "Error [fatal: Not a valid object name blah] " \
           "occurred while executing [git describe --tags blah] command to get nearest tag associated with branch." == str(
        error.value)

    actual_response = Git(root_dir='/bin')._get_tag(
        current_path='test_curr_path', commit_sha='01234567899999abcdefghijklmnopqrstuvwxyz')

    assert None == actual_response

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'describe', '--tags', 'blah'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'describe', '--tags', '01234567899999abcdefghijklmnopqrstuvwxyz'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)


@patch('subprocess.Popen')
def test_no_tags(mock_subproc_popen):
    # Given
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (b'', b'fatal: No names found, cannot describe anything.\n'),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock

    # When
    actual_response = Git(root_dir='/bin')._get_tag('/path/foo', '768c79ad661598889f29bdf8916f4cc488f5062a')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'describe', '--tags', '768c79ad661598889f29bdf8916f4cc488f5062a'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/path/foo'
        ),
        call().communicate()
    ])
    assert actual_response is None


@patch('subprocess.Popen')
def test_branch_success(mock_subproc_popen):
    # Given
    process_output_heads = [
        'feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/feature-foo\t*',
        'master\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/master\t ',
        'feature-bar\t01234567899999abcdefghijklmnopqrstuvwxyz\t\t ',
    ]
    process_output_remotes = [
        'origin/feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123',
        'origin/master\tabcdefghijklmnopqrstuvwxyz01234567890123',
    ]
    process_mock = Mock(returncode=0)
    process_mock.communicate.side_effect = [
        # Response for get all refs/heads
        ('\n'.join(process_output_heads).encode('utf-8'), ''.encode('utf-8')),

        # Response for get all refs/remotes
        ('\n'.join(process_output_remotes).encode('utf-8'), ''.encode('utf-8')),
    ]
    mock_subproc_popen.return_value = process_mock

    expected_response = {
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

    # When
    actual_response = Git(root_dir='/bin').branch(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        # call to get refs/heads
        call(
            ["git", "for-each-ref", "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)", "refs/heads/"],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),

        # call to get refs/remotes
        call(
            ["git", "for-each-ref", "--format=%(refname:short)%09%(objectname)", "refs/remotes/"],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)

    assert expected_response == actual_response


@patch('subprocess.Popen')
def test_branch_failure(mock_subproc_popen):
    # Given
    expected_cmd = ["git", "for-each-ref", "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)", "refs/heads/"]
    process_mock = Mock()
    attrs = {
        'communicate.return_value': (
            '', 'fatal: Not a git repository (or any of the parent directories): .git'.encode('utf-8')),
        'returncode': 128
    }
    process_mock.configure_mock(**attrs)
    mock_subproc_popen.return_value = process_mock
    expected_response = {
        'code': 128,
        'command': ' '.join(expected_cmd),
        'message': 'fatal: Not a git repository (or any of the parent directories): .git',
    }

    # When
    actual_response = Git(root_dir='/bin').branch(current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            expected_cmd,
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ])

    assert expected_response == actual_response


@patch('subprocess.Popen')
def test_branch_success_detached_head(mock_subproc_popen):
    # Given
    process_output_heads = [
        'master\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/master\t '
    ]
    process_output_remotes = [
        'origin/feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123'
    ]
    detached_head_output = [
        '* (HEAD detached at origin/feature-foo)',
        '  master',
        '  remotes/origin/feature-foo'
    ]
    process_mock = Mock(returncode=0)
    process_mock.communicate.side_effect = [
        # Response for get all refs/heads
        ('\n'.join(process_output_heads).encode('utf-8'), ''.encode('utf-8')),

        # Response for get current branch
        ('HEAD'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for detached head name
        ('\n'.join(detached_head_output).encode('utf-8'), ''.encode('utf-8')),

        # Response for get all refs/remotes
        ('\n'.join(process_output_remotes).encode('utf-8'), ''.encode('utf-8')),
    ]
    mock_subproc_popen.return_value = process_mock

    expected_response = {
        'code': 0,
        'branches': [
            {
                'is_current_branch': False,
                'is_remote_branch': False,
                'name': 'master',
                'upstream': 'origin/master',
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            },
            {
                'is_current_branch': True,
                'is_remote_branch': False,
                'name': '(HEAD detached at origin/feature-foo)',
                'upstream': None,
                'top_commit': None,
                'tag': None,
            },
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/feature-foo',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': None,
            }
        ]
    }

    # When
    actual_response = Git(root_dir='/bin').branch(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        # call to get refs/heads
        call(
            ["git", "for-each-ref", "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)", "refs/heads/"],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),

        # call to get current branch
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # call to get detached head name
        call(
            ['git', 'branch', '-a'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),

        # call to get refs/remotes
        call(
            ["git", "for-each-ref", "--format=%(refname:short)%09%(objectname)", "refs/remotes/"],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate()
    ], any_order=False)

    assert expected_response == actual_response
