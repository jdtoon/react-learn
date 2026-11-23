<script lang="ts">
  import { emit } from '@react-field-guide/mfe-contracts';

  const code = 'FIELD10';
  const percentOff = 10;
  let applied = $state(false);

  function apply() {
    emit('promo:applied', { code, percentOff }, 'svelte-promo');
    applied = true;
  }
</script>

<section class="promo" data-framework="svelte">
  <p class="promo-lead">
    <strong class="promo-title">Spring sale</strong>
    <span class="promo-offer">Take {percentOff}% off everything in your cart.</span>
  </p>
  <div class="promo-row">
    <code class="promo-code">{code}</code>
    <button type="button" class="promo-apply" disabled={applied} onclick={apply}>
      {applied ? 'Applied to cart' : 'Apply code'}
    </button>
  </div>
</section>

<style>
  .promo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem 1rem;
    color: var(--fg);
    font-family: var(--font-body);
    font-size: 0.85rem;
  }

  .promo-lead {
    display: grid;
    gap: 0.15rem;
    margin: 0;
  }

  .promo-title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--svelte);
  }

  .promo-offer {
    color: var(--muted);
  }

  .promo-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .promo-code {
    padding: 0.2rem 0.5rem;
    border: 1px dashed var(--svelte);
    border-radius: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }

  .promo-apply {
    min-height: 1.9rem;
    padding: 0 0.8rem;
    border: 1px solid var(--svelte);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
    font: inherit;
    font-size: 0.78rem;
  }

  .promo-apply:hover:not(:disabled) {
    background: var(--surface);
  }

  .promo-apply:disabled {
    border-color: var(--line);
    opacity: 0.7;
  }

  .promo-apply:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
