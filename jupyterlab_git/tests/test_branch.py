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
def test_branch_success(mock_subproc_popen):
    # Given
    process_output = [
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/heads/feature-foo',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/heads/master',
        '01234567899999abcdefghijklmnopqrstuvwxyz refs/heads/feature-bar',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/remotes/origin/feature-foo',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/remotes/origin/HEAD',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/stash',
        '01234567890123abcdefghijklmnopqrstuvwxyz refs/tags/v0.1.0',
        '01234567890123abcdefghijklmnopqrstuvwxyz refs/tags/blah@v0.2.0'
    ]
    process_mock = Mock(returncode=0)
    process_mock.communicate.side_effect = [
        # Response for get all refs
        ('\n'.join(process_output).encode('utf-8'), ''.encode('utf-8')),
        # Response for get current branch
        ('feature-foo'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for get upstream branch and tag for each local branch
        ('origin/master'.encode('utf-8'), ''.encode('utf-8')),
        ('v0.3.0'.encode('utf-8'), ''.encode('utf-8')),
        ('origin/master'.encode('utf-8'), ''.encode('utf-8')),
        ('v0.3.0'.encode('utf-8'), ''.encode('utf-8')),
        ('origin/master'.encode('utf-8'), ''.encode('utf-8')),
        ('v0.3.1'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for get tag for remote branch
        ('v0.4.2'.encode('utf-8'), ''.encode('utf-8')),
        ('v0.4.1'.encode('utf-8'), ''.encode('utf-8')),
    ]
    mock_subproc_popen.return_value = process_mock

    expected_response = {
        'code': 0,
        'branches': [
            {
                'is_current_branch': True,
                'is_remote_branch': False,
                'name': 'feature-foo',
                'upstream': 'origin/master',
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': 'v0.3.0',
            },
            {
                'is_current_branch': False,
                'is_remote_branch': False,
                'name': 'master',
                'upstream': 'origin/master',
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': 'v0.3.0',
            },
            {
                'is_current_branch': False,
                'is_remote_branch': False,
                'name': 'feature-bar',
                'upstream': 'origin/master',
                'top_commit': '01234567899999abcdefghijklmnopqrstuvwxyz',
                'tag': 'v0.3.1'},
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/feature-foo',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': 'v0.4.2',
            },
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/HEAD',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': 'v0.4.1',
            }
        ]
    }

    # When
    actual_response = Git(root_dir='/bin').branch(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'show-ref'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # Call to get current branch
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # Calls to get upstream branch and tag for each local branch
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'feature-foo@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'master@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'feature-bar@{upstream}'],
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
        call().communicate(),
        # Calls to get tag for remote branch
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
    ], any_order=False)

    assert expected_response == actual_response


@patch('subprocess.Popen')
def test_branch_failure(mock_subproc_popen):
    # Given
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
        'command': 'git show-ref',
        'message': 'fatal: Not a git repository (or any of the parent directories): .git',
    }

    # When
    actual_response = Git(root_dir='/bin').branch(current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'show-ref'],
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
    process_output = [
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/heads/master',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/remotes/origin/feature-foo',
        'abcdefghijklmnopqrstuvwxyz01234567890123 refs/stash',
        '01234567890123abcdefghijklmnopqrstuvwxyz refs/tags/v0.1.0',
        '01234567890123abcdefghijklmnopqrstuvwxyz refs/tags/blah@v0.2.0'
    ]
    detached_head_output = [
        '* (HEAD detached at origin/feature-foo)',
        '  master',
        '  remotes/origin/feature-foo'
    ]
    process_mock = Mock(returncode=0)
    process_mock.communicate.side_effect = [
        # Response for get all refs
        ('\n'.join(process_output).encode('utf-8'), ''.encode('utf-8')),
        # Response for get current branch
        ('HEAD'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for get upstream branch and tag for each local branch
        ('origin/master'.encode('utf-8'), ''.encode('utf-8')),
        ('v0.3.0'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for get tag for remote branch
        ('v0.4.2'.encode('utf-8'), ''.encode('utf-8')),
        # Responses for detached head name
        ('\n'.join(detached_head_output).encode('utf-8'), ''.encode('utf-8')),
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
                'tag': 'v0.3.0',
            },
            {
                'is_current_branch': False,
                'is_remote_branch': True,
                'name': 'origin/feature-foo',
                'upstream': None,
                'top_commit': 'abcdefghijklmnopqrstuvwxyz01234567890123',
                'tag': 'v0.4.2',
            },
            {
                'is_current_branch': True,
                'is_remote_branch': False,
                'name': '(HEAD detached at origin/feature-foo)',
                'upstream': None,
                'top_commit': None,
                'tag': None,
            }
        ]
    }

    # When
    actual_response = Git(root_dir='/bin').branch(
        current_path='test_curr_path')

    # Then
    mock_subproc_popen.assert_has_calls([
        call(
            ['git', 'show-ref'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # Call to get current branch
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # Calls to get upstream branch and tag for each local branch
        call(
            ['git', 'rev-parse', '--abbrev-ref', 'master@{upstream}'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        # Calls to get tag for remote branch
        call(
            ['git', 'describe', '--tags', 'abcdefghijklmnopqrstuvwxyz01234567890123'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
        call(
            ['git', 'branch', '-a'],
            stdout=PIPE,
            stderr=PIPE,
            cwd='/bin/test_curr_path'
        ),
        call().communicate(),
    ], any_order=False)

    assert expected_response == actual_response


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
