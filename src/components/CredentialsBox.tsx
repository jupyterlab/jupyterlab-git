import { Widget } from '@phosphor/widgets';

/**
 * The UI for the credentials form
 */
export class GitCredentialsForm extends Widget {
  /**
   * Create a redirect form.
   */
  constructor(
    textContent: string = 'Enter credentials for remote repository',
    warningContent: string = ''
  ) {
    super({
      node: GitCredentialsForm.createFormNode(textContent, warningContent)
    });
  }

  private static createFormNode(
    textContent: string,
    warningContent: string
  ): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    const user = document.createElement('input');
    const password = document.createElement('input');
    password.type = 'password';
    password.id = 'git_password';

    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = textContent;
    warning.textContent = warningContent;
    user.placeholder = 'username';
    password.placeholder = 'password';

    label.appendChild(text);
    label.appendChild(user);
    label.appendChild(password);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  setText(text: string): void {
    let textBox = this.node.querySelector('span');
    textBox.nodeValue = text;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    let lines = this.node.querySelectorAll('input');
    let credentials = {
      username: lines[0].value,
      password: lines[1].value
    };
    return encodeURIComponent(JSON.stringify(credentials));
  }
}
