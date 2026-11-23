import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { AccountComponent } from './account.component';

const tag = 'rfg-angular-account';

if (!customElements.get(tag)) {
  const app = await createApplication();
  customElements.define(tag, createCustomElement(AccountComponent, { injector: app.injector }));
}
