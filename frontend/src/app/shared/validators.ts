import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateOrderValidator(control: AbstractControl): ValidationErrors | null {
  const openedDate = control.get('openedDate')?.value;
  const promisedDate = control.get('promisedDate')?.value;
  if (!openedDate || !promisedDate || promisedDate >= openedDate) {
    return null;
  }
  return { dateOrder: true };
}
