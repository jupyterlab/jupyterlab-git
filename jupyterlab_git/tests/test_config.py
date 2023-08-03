import json
from unittest.mock import call, patch

from jupyterlab_git.handlers import NAMESPACE

from .testutils import maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_get_config_success(mock_execute, jp_fetch, jp_root_dir):
    # Given
    mock_execute.return_value = maybe_future(
        (0, "user.name=John Snow\nuser.email=john.snow@iscoming.com", "")
    )
    local_path = jp_root_dir / "test_path"

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "config", body="{}", method="POST"
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "config", "--list"],
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "options": {
            "user.name": "John Snow",
            "user.email": "john.snow@iscoming.com",
        },
    }


@patch("jupyterlab_git.git.execute")
async def test_git_get_config_multiline(mock_execute, jp_fetch, jp_root_dir):
    # Given
    output = (
        "user.name=John Snow\n"
        "user.email=john.snow@iscoming.com\n"
        'alias.summary=!f() {     printf "Summary of this branch...\n'
        '";     printf "%s\n'
        '" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
        "Most-active files, with churn count\n"
        '"; git churn | head -7;   }; f\n'
        'alias.topic-base-branch-name=!f(){     printf "main\n'
        '";   };f\n'
        'alias.topic-start=!f(){     topic_branch="$1";     git topic-create "$topic_branch";     git topic-push;   };f'
    )
    mock_execute.return_value = maybe_future((0, output, ""))
    local_path = jp_root_dir / "test_path"

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "config", body="{}", method="POST"
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "config", "--list"],
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "options": {
            "user.name": "John Snow",
            "user.email": "john.snow@iscoming.com",
        },
    }


@patch("jupyterlab_git.git.execute")
@patch(
    "jupyterlab_git.handlers.ALLOWED_OPTIONS",
    ["alias.summary", "alias.topic-base-branch-name"],
)
async def test_git_get_config_accepted_multiline(mock_execute, jp_fetch, jp_root_dir):
    # Given
    output = (
        "user.name=John Snow\n"
        "user.email=john.snow@iscoming.com\n"
        'alias.summary=!f() {     printf "Summary of this branch...\n'
        '";     printf "%s\n'
        '" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
        "Most-active files, with churn count\n"
        '"; git churn | head -7;   }; f\n'
        'alias.topic-base-branch-name=!f(){     printf "main\n'
        '";   };f\n'
        'alias.topic-start=!f(){     topic_branch="$1";     git topic-create "$topic_branch";     git topic-push;   };f'
    )
    mock_execute.return_value = maybe_future((0, output, ""))
    local_path = jp_root_dir / "test_path"

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "config", body="{}", method="POST"
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "config", "--list"],
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "options": {
            "alias.summary": '!f() {     printf "Summary of this branch...\n'
            '";     printf "%s\n'
            '" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
            "Most-active files, with churn count\n"
            '"; git churn | head -7;   }; f',
            "alias.topic-base-branch-name": '!f(){     printf "main\n";   };f',
        },
    }


@patch("jupyterlab_git.git.execute")
async def test_git_set_config_success(mock_execute, jp_fetch, jp_root_dir):
    # Given
    mock_execute.return_value = maybe_future((0, "", ""))
    local_path = jp_root_dir / "test_path"

    # When
    body = {
        "options": {
            "user.name": "John Snow",
            "user.email": "john.snow@iscoming.com",
        },
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "config", body=json.dumps(body), method="POST"
    )

    # Then
    assert mock_execute.call_count == 2
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "config", "--add", "user.email", "john.snow@iscoming.com"],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "config", "--add", "user.name", "John Snow"],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ],
        any_order=True,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {"code": 0, "message": ""}
