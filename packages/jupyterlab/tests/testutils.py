"""Helpers for tests"""

import json

import tornado


def assert_http_error(error, expected_code, expected_message=None):
    """Check that the error matches the expected output error."""
    e = error.value
    if isinstance(e, tornado.web.HTTPError):
        assert (
            expected_code == e.status_code
        ), f"Expected status code {expected_code} != {e.status_code}"
        if expected_message is not None:
            assert expected_message in str(
                e
            ), f"Expected error message '{expected_message}' not in '{str(e)}'"

    elif any(
        [
            isinstance(e, tornado.httpclient.HTTPClientError),
            isinstance(e, tornado.httpclient.HTTPError),
        ]
    ):
        assert (
            expected_code == e.code
        ), f"Expected status code {expected_code} != {e.code}"
        if expected_message:
            message = json.loads(e.response.body.decode())["message"]
            assert (
                expected_message in message
            ), f"Expected error message '{expected_message}' not in '{message}'"


class FakeContentManager:
    def get(self, path=None):
        return {"content": ""}
