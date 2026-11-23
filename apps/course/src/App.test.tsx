import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('renders the course heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'React Field Guide' })).toBeInTheDocument();
});
