import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

const html = readFileSync('index.html', 'utf8');
const serviceWorker = readFileSync('service-worker.js', 'utf8');
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

test('JavaScript embutido e service worker têm sintaxe válida', () => {
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(inlineScripts.length > 0, 'nenhum script embutido encontrado');

  inlineScripts.forEach((match, index) => {
    assert.doesNotThrow(() => new Script(match[1]), `script embutido ${index + 1} inválido`);
  });
  assert.doesNotThrow(() => new Script(serviceWorker), 'service worker inválido');
});

test('manifesto referencia apenas ícones existentes', () => {
  assert.equal(manifest.lang, 'pt-BR');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  manifest.icons.forEach(icon => assert.ok(existsSync(icon.src), `ícone ausente: ${icon.src}`));
});

test('recursos locais essenciais são pré-armazenados para uso offline', () => {
  ['./index.html', './manifest.json', ...manifest.icons.map(icon => `./${icon.src}`)]
    .forEach(asset => assert.match(serviceWorker, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
});

test('conteúdo editável é escapado e não cria manipuladores inline dinâmicos', () => {
  assert.match(html, /escapeHtml\(ex\.name\)/);
  assert.match(html, /escapeHtml\(item\.notes\)/);
  assert.doesNotMatch(html, /onclick="[^"]*\$\{/);
});

test('reconexão dispara sincronização dos dados pendentes', () => {
  assert.match(html, /addEventListener\('online', \(\) => saveToFirestore\(\)\)/);
});

test('backup inclui preferências e histórico de cargas', () => {
  assert.match(html, /currentTab, nextTab, weightHistoryData, autoStartTimer/);
  assert.match(html, /file\.size > 2 \* 1024 \* 1024/);
});

test('renomear o próximo treino preserva a sequência', () => {
  assert.match(html, /const oldName = currentTab/);
  assert.match(html, /if \(nextTab === oldName\) nextTab = newName/);
});

test('painel editorial usa métricas reais e navegação móvel acessível', () => {
  ['weekly-goal-value', 'hero-tab-name', 'weekly-chart', 'workout-section']
    .forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`)));
  assert.match(html, /function renderDashboard\(\)/);
  assert.match(html, /function startNextWorkout\(\)/);
  assert.match(html, /aria-label="Navegação principal"/);
});

test('cache e manifesto usam a identidade visual atualizada', () => {
  assert.equal(manifest.name, 'Treinos Cristal');
  assert.equal(manifest.theme_color, '#f6f2ea');
  assert.match(serviceWorker, /treinos-ricardo-v4/);
});
