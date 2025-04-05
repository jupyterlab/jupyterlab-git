"""
Module for executing SSH commands
"""

import re
import subprocess
import shutil
from .log import get_logger
from pathlib import Path

GIT_SSH_HOST = re.compile(r"git@(.+):.+")


class SSH:
    """
    A class to perform ssh actions
    """

    def is_known_host(self, hostname):
        """
        Check if the given git clone URL contains a known host
        """
        cmd = ["ssh-keygen", "-F", hostname.replace(" ", "")]
        try:
            code = subprocess.call(
                cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            return code == 0
        except subprocess.CalledProcessError as e:
            get_logger().debug("Error verifying host using keygen")
            raise e

    def add_host(self, hostname):
        """
        Add the host to the known_hosts file
        """
        get_logger().debug(f"adding host to the known hosts file {hostname}")
        try:
            result = subprocess.run(
                ["ssh-keyscan", hostname], capture_output=True, text=True, check=True
            )
            known_hosts_file = f"{Path.home()}/.ssh/known_hosts"
            with open(known_hosts_file, "a") as f:
                f.write(result.stdout)
            get_logger().debug(f"Added {hostname} to known hosts.")
        except Exception as e:
            get_logger().error(f"Failed to add host: {e}.")
            raise e
