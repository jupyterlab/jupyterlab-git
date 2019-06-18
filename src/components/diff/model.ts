/**
 * Model which indicates the context in which a Git diff is being performed.
 */
export interface IDiffContext {
  currentRef: IGitRef | ISpecialRef;
  previousRef: IGitRef;
}

/**
 * Model which defines a regular Git ref, i.e, https://git-scm.com/book/en/v2/Git-Internals-Git-References
 */
export interface IGitRef {
  gitRef: string;
}

/**
 * Model which defines special/reserved references to differentiate them from other Git refs with the
 * same name. Currently, there are two values
 *
 * 1. WORKING: The Working Tree
 * 2. INDEX: The Staging Area
 */
export interface ISpecialRef {
  specialRef: 'WORKING' | 'INDEX';
}

/**
 * Utility method to get the string value of any type of ref.
 */
export function getRefValue(ref: ISpecialRef | IGitRef): string {
  if ('specialRef' in ref) {
    return ref.specialRef;
  } else {
    return ref.gitRef;
  }
}
