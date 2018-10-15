## Product Goals: 
- Give users a good set of handrails so in their use of the UI, they don’t get themselves stuck.
  - Provide a ‘happy path’ that the extension doesn’t deviate from. Make it easy for users to follow this happy path and difficult for them to deviate from it.
- Help establish a good working rhythm with Git that will help them develop a useful mental model .
  - Expose the most frequently used commands that cover the majority of daily git use.
- Increase Usability of Git
  - Shield user from repetitive actions.
  - Increase visibility of the state of Git Repos; surface state-related information. 
  - Unblock advanced commands by easing transition to terminal when necessary.

## Research Requirements: 
- Surface the most used commands, and in what context they are used.
- Discover Git functionality that is frequently helpful, but difficult to execute.

## Design Requirements:
### First Stage
- Add remote functionality (Push to Origin [default], Pull from Origin [default], Expose Remotes?)
  - Merge/diff conflicts handled in the terminal
- Branches
  - Add new Branch
  - Switch Branches
- Surface reasons for disabled actions (create/switch)
- Repos (Through File Browser)
  - Clone Repo (Button in file browser)
  - Init Repo (In file menu) ← Expose this elsewhere?
  - Select Repo (Through File Browser) ← Give feedback in filebrowser as to existence of repo?
- Commits
  - Commit
  - Stage
  - Remove
### First Stage Stretch goals.
- Give Git feedback in the file browsers
  - Allow users to link to the git extension directly from the file browser.
- Add Stash Functionality.
  - Migrate changes to new branch when created.
