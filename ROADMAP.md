 ## CI/CD:
 - Integration Testing
   - **What?** Test suite that actually exercises UI and API against an actual Git repo without mocking out Git calls.
   - **Why?** Enables us to better test against an actual Git process. Stepping stone to x-OS testing such as Windows.
 
 ## Features
 - Plaintext diffs
   - **What?** Diff of non-notebook files such as .py files
   - **Why?** Fully featured diff experience for most types of files
 - Credentials
   - **What?** Credential management during push/pull/clone without actually storing credentials
   - **Why?** Better UX when a user doesn't have credentials for accessing a Git repo.
 - Merge resolution
   - **What?** UI to handle the conflicts for notebook and plain text files.
   - **Why?** Various Git operations may result in conflicts.

 ## Maintenance
 - Issue & Bug triage
    - **What?** Triage issues and fix bugs in existing featutes 
    - **Why?** Operational maintenance of the extension
