import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Name of the demo repository folder.
 */
export const DEMO_REPOSITORY = 'weather-analysis';

const AUTHORS = {
  alice: { name: 'Alice', email: 'alice@example.com' },
  bob: { name: 'Bob', email: 'bob@example.com' }
};

type Author = keyof typeof AUTHORS;

interface ICommit {
  author: Author;
  message: string;
  /**
   * Commit date, relative to now, so the history always looks recent.
   */
  hoursAgo: number;
  files: Record<string, string>;
  branch?: string;
}

/**
 * Version of Python run by the kernel, to write the notebook metadata
 * the same way JupyterLab does once the kernel started.
 */
function pythonVersion(): string | undefined {
  try {
    return execFileSync('python', [
      '-c',
      'import platform; print(platform.python_version())'
    ])
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Serialize a notebook like JupyterLab does, so that saving it from
 * JupyterLab only changes what was edited.
 */
function notebook(
  cells: { cell_type: 'markdown' | 'code'; id: string; source: string }[]
): string {
  return (
    JSON.stringify(
      {
        cells: cells.map(({ cell_type, id, source }) => ({
          cell_type,
          ...(cell_type === 'code' ? { execution_count: null } : {}),
          id,
          metadata: {},
          ...(cell_type === 'code' ? { outputs: [] } : {}),
          source: source.split(/(?<=\n)/)
        })),
        metadata: {
          kernelspec: {
            display_name: 'Python 3 (ipykernel)',
            language: 'python',
            name: 'python3'
          },
          language_info: {
            codemirror_mode: { name: 'ipython', version: 3 },
            file_extension: '.py',
            mimetype: 'text/x-python',
            name: 'python',
            nbconvert_exporter: 'python',
            pygments_lexer: 'ipython3',
            version: pythonVersion()
          }
        },
        nbformat: 4,
        nbformat_minor: 5
      },
      null,
      1
    ) + '\n'
  );
}

const README_V1 = `# Weather analysis

Exploring daily temperatures recorded in Paris.
`;

const README_V2 = `# Weather analysis

Exploring daily temperatures recorded in Paris.

## Getting started

\`\`\`bash
pip install -r requirements.txt
jupyter lab analysis.ipynb
\`\`\`
`;

const TEMPERATURES = [
  'date,min,max',
  '2025-01-01,2.1,7.4',
  '2025-01-02,1.4,6.9',
  '2025-01-03,-0.3,5.2',
  '2025-01-04,0.8,6.1',
  '2025-01-05,3.2,9.8',
  '2025-01-06,4.5,11.0',
  '2025-01-07,2.9,8.3',
  ''
].join('\n');

const UTILS = `import pandas as pd


def load_temperatures(path):
    """Load the daily temperatures, indexed by date."""
    return pd.read_csv(path, parse_dates=["date"], index_col="date")
`;

const ANALYSIS = notebook([
  {
    cell_type: 'markdown',
    id: 'a1f3c2d4',
    source:
      '# Daily temperatures\n\nLoad the measurements and look at the trend.'
  },
  {
    cell_type: 'code',
    id: 'b7e9d0c1',
    source:
      'from utils import load_temperatures\n\ndf = load_temperatures("data/temperatures.csv")\ndf.head()'
  },
  {
    cell_type: 'code',
    id: 'c4a8b6e2',
    source: 'df.plot(title="Temperatures in Paris")'
  }
]);

const HISTORY: ICommit[] = [
  {
    author: 'alice',
    message: 'Initial commit',
    hoursAgo: 75,
    files: {
      'README.md': README_V1,
      '.gitignore': '.ipynb_checkpoints/\n__pycache__/\n'
    }
  },
  {
    author: 'bob',
    message: 'Add the temperature measurements',
    hoursAgo: 52,
    files: {
      'data/temperatures.csv': TEMPERATURES,
      'requirements.txt': 'pandas\nmatplotlib\n'
    }
  },
  {
    author: 'alice',
    message: 'Add a helper to load the data',
    hoursAgo: 28,
    files: { 'utils.py': UTILS }
  },
  {
    author: 'bob',
    message: 'Explore the daily temperatures',
    hoursAgo: 6,
    files: { 'analysis.ipynb': ANALYSIS }
  },
  {
    author: 'alice',
    message: 'Document how to run the analysis',
    hoursAgo: 2,
    files: { 'README.md': README_V2 }
  },
  {
    author: 'bob',
    message: 'Add a monthly summary',
    hoursAgo: 1,
    branch: 'monthly-summary',
    files: {
      'utils.py':
        UTILS +
        `

def monthly_mean(df):
    """Average the temperatures by month."""
    return df.resample("MS").mean()
`
    }
  }
];

/**
 * Create the demo git repository and pack it in a tarball.
 *
 * @returns The path to the tarball, in a temporary directory to remove once done
 */
export function createDemoRepository(): string {
  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'jupyterlab-git-'));
  const repository = path.join(workdir, DEMO_REPOSITORY);
  fs.mkdirSync(repository);

  const git = (args: string[], env: Record<string, string> = {}) =>
    execFileSync('git', args, {
      cwd: repository,
      // Ignore the user and system git configuration
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: os.devNull,
        GIT_CONFIG_NOSYSTEM: '1',
        ...env
      }
    });

  git(['init', '--quiet', '--initial-branch', 'main']);
  // Identity used by the commits made during the recording
  git(['config', 'user.name', AUTHORS.alice.name]);
  git(['config', 'user.email', AUTHORS.alice.email]);
  git(['config', 'commit.gpgsign', 'false']);

  const now = Date.now();
  for (const commit of HISTORY) {
    if (commit.branch) {
      git(['checkout', '--quiet', '-b', commit.branch]);
    }
    for (const [file, content] of Object.entries(commit.files)) {
      const filePath = path.join(repository, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
    const { name, email } = AUTHORS[commit.author];
    const date = new Date(now - commit.hoursAgo * 3600 * 1000).toISOString();
    git(['add', '--all']);
    git(['commit', '--quiet', '--message', commit.message], {
      GIT_AUTHOR_NAME: name,
      GIT_AUTHOR_EMAIL: email,
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: name,
      GIT_COMMITTER_EMAIL: email,
      GIT_COMMITTER_DATE: date
    });
    if (commit.branch) {
      git(['checkout', '--quiet', 'main']);
    }
  }

  const tarball = path.join(workdir, `${DEMO_REPOSITORY}.tar.gz`);
  execFileSync('tar', ['-czf', tarball, '-C', workdir, DEMO_REPOSITORY]);
  return tarball;
}
