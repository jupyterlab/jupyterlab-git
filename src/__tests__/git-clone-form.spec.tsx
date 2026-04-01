import { GitCloneForm } from '../widgets/GitCloneForm';
import { TranslationBundle } from '@jupyterlab/translation';

const trans = { __: (s: string) => s } as TranslationBundle;

describe('GitCloneForm.getValue', () => {
  let form: GitCloneForm;

  beforeEach(() => {
    form = new GitCloneForm(trans);
  });

  it('returns false for submodules and versioning if checkboxes are unchecked', () => {
    (form.node.querySelector('#submodules') as HTMLInputElement).checked =
      false;
    (form.node.querySelector('#download') as HTMLInputElement).checked = false;
    (form.node.querySelector('#input-link') as HTMLInputElement).value =
      'https://github.com/example/repo.git';

    const value = form.getValue();
    expect(value.url).toBe(
      encodeURIComponent('https://github.com/example/repo.git')
    );
    expect(value.submodules).toBe(false);
    expect(value.versioning).toBe(false);
  });

  it('returns true if checkboxes are checked', () => {
    (form.node.querySelector('#submodules') as HTMLInputElement).checked = true;
    (form.node.querySelector('#download') as HTMLInputElement).checked = true;
    (form.node.querySelector('#input-link') as HTMLInputElement).value =
      'https://github.com/example/repo.git';

    const value = form.getValue();
    expect(value.submodules).toBe(true);
    expect(value.versioning).toBe(true);
  });
});
