import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, computed, ContentChild, Directive, ElementRef, EventEmitter, input, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="status status--{{ tone() }}">{{ label() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  private readonly tones: Record<string, string> = {
    OPEN: 'accent',
    IN_PROGRESS: 'accent',
    CONFIRMED: 'success',
    COMPLETED: 'success',
    AVAILABLE: 'success',
    PENDING: 'warning',
    ON_HOLD: 'warning',
    CANCELLED: 'neutral',
    DELIVERED: 'neutral',
    UNAVAILABLE: 'danger'
  };

  readonly label = computed(() => this.status()
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' '));

  readonly tone = computed(() => {
    const status = this.status();
    if (status === 'OVERDUE') {
      return 'danger';
    }
    return this.tones[status] ?? 'neutral';
  });
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p class="secondary">{{ description() }}</p>
        }
      </div>
      <div class="page-actions"><ng-content select="[actions]"></ng-content></div>
    </header>
  `
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="state-block" role="status" aria-live="polite">
      <span>Loading records</span>
      @for (row of rowIndexes(); track row) {
        <div class="skeleton-row" style="width: 100%"></div>
      }
    </div>
  `
})
export class LoadingStateComponent {
  readonly rows = input<number>(3);
  readonly rowIndexes = computed(() => Array.from({ length: this.rows() }, (_, index) => index));
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="state-block">
      <h3>{{ message() }}</h3>
      @if (detail()) {
        <p class="secondary">{{ detail() }}</p>
      }
      @if (actionLink() && actionLabel()) {
        <a class="btn btn-primary" [routerLink]="actionLink()">{{ actionLabel() }}</a>
      }
    </div>
  `
})
export class EmptyStateComponent {
  readonly message = input<string>('No records yet');
  readonly detail = input<string>('Create the first record to begin.');
  readonly actionLabel = input<string>('');
  readonly actionLink = input<string>('');
}

@Component({
  selector: 'app-error-message',
  standalone: true,
  template: `
    <div class="error-banner" role="alert">
      <p>{{ message() }}</p>
      @if (canRetry()) {
        <button class="btn btn-text" type="button" (click)="retry.emit()">Retry</button>
      }
    </div>
  `
})
export class ErrorMessageComponent {
  readonly message = input.required<string>();
  readonly canRetry = input<boolean>(false);
  @Output() readonly retry = new EventEmitter<void>();
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <dialog #dialog class="dialog" (click)="onBackdrop($event)">
      <h2>{{ titleText() }}</h2>
      <p>{{ messageText() }}</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary" type="button" (click)="close()">Cancel</button>
        <button class="btn btn-danger" type="button" (click)="confirm()">{{ confirmLabelText() }}</button>
      </div>
    </dialog>
  `
})
export class ConfirmDialogComponent {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
  readonly titleText = signal('Delete this record?');
  readonly messageText = signal('This action cannot be undone.');
  readonly confirmLabelText = signal('Delete');
  @Output() readonly confirmed = new EventEmitter<void>();

  open(title: string, message: string, confirmLabel = 'Delete'): void {
    this.titleText.set(title);
    this.messageText.set(message);
    this.confirmLabelText.set(confirmLabel);
    this.dialog?.nativeElement.showModal();
  }

  close(): void {
    this.dialog?.nativeElement.close();
  }

  confirm(): void {
    this.confirmed.emit();
    this.close();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog?.nativeElement) {
      this.close();
    }
  }
}

let fieldSequence = 0;

@Component({
  selector: 'app-form-field',
  standalone: true,
  host: { '[attr.id]': 'null' },
  template: `
    <div class="field">
      <label class="field-label" [for]="id()">
        {{ label() }}
        @if (required()) {
          <span class="required" aria-hidden="true">(required)</span>
        }
      </label>
      <ng-content></ng-content>
      @if (error()) {
        <p class="field-error" [id]="helpId()">{{ error() }}</p>
      } @else if (hint()) {
        <p class="field-help" [id]="helpId()">{{ hint() }}</p>
      }
    </div>
  `
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly id = input<string>(`field-${++fieldSequence}`);
  readonly required = input<boolean>(false);
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly helpId = computed(() => `${this.id()}-help`);
}

@Directive({ selector: '[appRowActions]', standalone: true })
export class RowActionsDirective {
  constructor(public readonly template: TemplateRef<{ $implicit: unknown }>) {}
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'money' | 'number' | 'badge' | 'link' | 'promisedDate';
  linkKey?: string;
  linkPrefix?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) {
    return value;
  }
  const month = Number(parts[1]) - 1;
  return `${parts[2]} ${MONTHS[month] ?? ''} ${parts[0]}`;
}

export function formatDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return value;
  }
  const month = Number(match[2]) - 1;
  return `${match[3]} ${MONTHS[month] ?? ''} ${match[1]}, ${match[4]}:${match[5]}`;
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, RouterLink, StatusBadgeComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th scope="col">{{ column.label }}</th>
            }
            @if (rowActions) {
              <th scope="col" class="actions">Actions</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            <tr>
              <td [attr.colspan]="columnCount()"><app-loading-state [rows]="3" /></td>
            </tr>
          } @else if (!rows().length) {
            <tr>
              <td [attr.colspan]="columnCount()">
                <app-empty-state [message]="emptyMessage()" [detail]="emptyDetail()" [actionLabel]="emptyActionLabel()" [actionLink]="emptyActionLink()" />
              </td>
            </tr>
          } @else {
            @for (row of rows(); track trackRow) {
              <tr>
                @for (column of columns(); track column.key) {
                  <td [attr.data-label]="column.label" [class.num]="column.type === 'money' || column.type === 'number'">
                    @if (column.type === 'badge') {
                      <app-status-badge [status]="statusFor(row, column)" />
                    } @else if (column.type === 'link' && linkFor(row, column)) {
                      <a [routerLink]="linkFor(row, column)">{{ display(row, column) }}</a>
                    } @else if (column.type === 'promisedDate') {
                      <span>{{ display(row, column) }}</span>
                      @if (isOverdue(row, column)) {
                        <span class="overdue-label">Overdue</span>
                      }
                    } @else {
                      <span>{{ display(row, column) }}</span>
                    }
                  </td>
                }
                @if (rowActions) {
                  <td class="actions" data-label="Actions">
                    <ng-container *ngTemplateOutlet="rowActions.template; context: { $implicit: row }"></ng-container>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class DataTableComponent {
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input<unknown[]>([]);
  readonly loading = input<boolean>(false);
  readonly emptyMessage = input<string>('No records found');
  readonly emptyDetail = input<string>('Create a record or clear the filters to continue.');
  readonly emptyActionLabel = input<string>('');
  readonly emptyActionLink = input<string>('');
  @ContentChild(RowActionsDirective) rowActions?: RowActionsDirective;

  columnCount(): number {
    return this.columns().length + (this.rowActions ? 1 : 0);
  }

  trackRow(_: number, row: unknown): unknown {
    const candidate = row as { id?: unknown };
    return candidate.id ?? _;
  }

  raw(row: unknown, column: TableColumn): unknown {
    return (row as Record<string, unknown>)[column.key];
  }

  statusFor(row: unknown, column: TableColumn): string {
    return String(this.raw(row, column) ?? '');
  }

  display(row: unknown, column: TableColumn): string {
    const value = this.raw(row, column);
    if (value === undefined || value === null || value === '') {
      return 'Not set';
    }
    if (column.type === 'date' || column.type === 'promisedDate') {
      return formatDate(String(value));
    }
    if (column.type === 'money') {
      return formatMoney(Number(value));
    }
    return String(value);
  }

  linkFor(row: unknown, column: TableColumn): string | null {
    if (!column.linkKey || !column.linkPrefix) {
      return null;
    }
    const value = (row as Record<string, unknown>)[column.linkKey];
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return `${column.linkPrefix}/${value}`;
  }

  isOverdue(row: unknown, column: TableColumn): boolean {
    const value = String(this.raw(row, column) ?? '');
    const status = String((row as Record<string, unknown>)['jobStatus'] ?? '');
    const today = new Date().toISOString().slice(0, 10);
    return column.type === 'promisedDate' && value < today && status !== 'COMPLETED' && status !== 'DELIVERED';
  }

}
