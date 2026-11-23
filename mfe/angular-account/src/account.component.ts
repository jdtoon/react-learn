import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { emit } from '@react-field-guide/mfe-contracts';

@Component({
  selector: 'rfg-account-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrl: './account.component.css',
  template: `
    <section class="acct" data-framework="angular">
      @if (user(); as name) {
        <p class="acct-greeting">
          Signed in as <strong>{{ name }}</strong>
        </p>
        <button type="button" class="acct-button" (click)="signOut()">Sign out</button>
      } @else {
        <label class="acct-field">
          <span>Your name</span>
          <input
            #nameInput
            type="text"
            autocomplete="off"
            placeholder="Amara"
            [value]="draft()"
            (input)="draft.set(nameInput.value)"
            (keydown.enter)="signIn()"
          />
        </label>
        <button type="button" class="acct-button" (click)="signIn()">Sign in</button>
        <p class="acct-note">Signing in tells the rest of the page. Nothing leaves your browser.</p>
      }
    </section>
  `,
})
export class AccountComponent {
  protected readonly draft = signal('');
  protected readonly user = signal<string | null>(null);

  protected signIn(): void {
    const name = this.draft().trim() || 'Amara';
    this.user.set(name);
    emit('account:changed', { signedIn: true, name }, 'angular-account');
  }

  protected signOut(): void {
    this.user.set(null);
    this.draft.set('');
    emit('account:changed', { signedIn: false, name: null }, 'angular-account');
  }
}
