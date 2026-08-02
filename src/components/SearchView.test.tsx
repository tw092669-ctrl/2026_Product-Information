import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchView } from './SearchView';
import type { ACProduct } from '../types';

const sampleProducts: ACProduct[] = [
  {
    id: 'p1',
    brand: '重工',
    model: 'ABC-123',
    type: '一對一',
    environment: '室內機',
    price: 1000,
  },
];

test('SearchView can render without throwing when product filters are evaluated', () => {
  assert.doesNotThrow(() => {
    renderToStaticMarkup(
      <SearchView
        products={sampleProducts}
        setProducts={() => {}}
        selectedProducts={[]}
        onToggleProduct={() => {}}
        onNavigateToQuote={() => {}}
        language="zh"
        onToggleLanguage={() => {}}
      />,
    );
  });
});
