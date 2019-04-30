import { Widget } from '@phosphor/widgets';

/**
 * The UI for the commit author form
 */
export class GitAuthorForm extends Widget {
  /**
   * Create a redirect form.
   */
  constructor() {
    super({ node: GitAuthorForm.createFormNode() });
  }

  private static createFormNode(): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    const name = document.createElement('input');
    const email = document.createElement('input');

    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = 'Enter your name and email for commit';
    name.placeholder = 'Name';
    email.placeholder = 'Email';

    label.appendChild(text);
    label.appendChild(name);
    label.appendChild(email);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    let lines = this.node.querySelectorAll('input');
    let credentials = {
      name: lines[0].value,
      email: lines[1].value
    };
    return encodeURIComponent(JSON.stringify(credentials));
  }
}
