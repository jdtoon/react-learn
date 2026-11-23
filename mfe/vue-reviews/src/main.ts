import { defineCustomElement } from 'vue';
import Reviews from './Reviews.vue';
import css from './reviews.css?inline';

const tag = 'rfg-vue-reviews';
const lightTag = `${tag}-light`;

function styleElement(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  return style;
}

class ShadowReviews extends defineCustomElement(Reviews) {
  constructor() {
    super();
    this.shadowRoot?.append(styleElement());
  }
}

if (!customElements.get(tag)) {
  customElements.define(tag, ShadowReviews);
}

if (!customElements.get(lightTag)) {
  document.head.append(styleElement());
  customElements.define(lightTag, defineCustomElement(Reviews, { shadowRoot: false }));
}
