<script setup lang="ts">
import { computed, ref } from 'vue';

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  helpful: number;
}

const reviews = ref<Review[]>([
  {
    id: 1,
    author: 'Nomsa',
    rating: 5,
    text: 'Kept me dry through a whole weekend in the Drakensberg.',
    helpful: 12,
  },
  {
    id: 2,
    author: 'Pieter',
    rating: 4,
    text: 'Warm and light. The pockets could be a little deeper.',
    helpful: 7,
  },
  {
    id: 3,
    author: 'Thandi',
    rating: 5,
    text: 'Survived two winters of daily commuting without a loose thread.',
    helpful: 4,
  },
]);
const voted = ref<number[]>([]);

const average = computed(
  () => reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length,
);

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function toggleHelpful(review: Review): void {
  const has = voted.value.includes(review.id);
  review.helpful += has ? -1 : 1;
  voted.value = has ? voted.value.filter((id) => id !== review.id) : [...voted.value, review.id];
}
</script>

<template>
  <section class="rv" data-framework="vue">
    <h4 class="rv-title">Field jacket</h4>
    <p class="rv-summary">
      <strong>{{ average.toFixed(1) }}</strong> out of 5 from {{ reviews.length }} reviews
    </p>
    <ul class="rv-list" aria-label="Reviews">
      <li v-for="review in reviews" :key="review.id" class="rv-item">
        <p class="rv-head">
          <strong class="rv-author">{{ review.author }}</strong>
          <span class="rv-stars" role="img" :aria-label="`${review.rating} out of 5`">
            {{ stars(review.rating) }}
          </span>
        </p>
        <p class="rv-text">{{ review.text }}</p>
        <button
          type="button"
          class="rv-helpful"
          :aria-pressed="voted.includes(review.id)"
          @click="toggleHelpful(review)"
        >
          Helpful ({{ review.helpful }})
        </button>
      </li>
    </ul>
  </section>
</template>
