import { createChecker } from './checker';

/**
 * The script injected into the sandboxed iframe.
 *
 * `createChecker` is stringified rather than duplicated as a string literal, so the
 * checker stays a real, type-checked, directly-testable function. Only the small
 * message-wiring below exists as source text.
 *
 * The iframe runs with `allow-scripts` and deliberately *without* `allow-same-origin`,
 * so it has an opaque origin and cannot reach the parent document, its storage, or
 * its cookies. postMessage is the only channel.
 */
export const SANDBOX_RUNTIME = `
(function () {
  var createChecker = ${createChecker.toString()};
  var checker = createChecker(document, window);

  function post(message) {
    try { parent.postMessage(message, '*'); } catch (e) { /* parent went away */ }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'bytelabs' || data.type !== 'evaluate') return;
    post({
      source: 'bytelabs-sandbox',
      type: 'results',
      runId: data.runId,
      outcomes: checker.evaluate(data.items || [])
    });
  });

  window.addEventListener('error', function (event) {
    post({
      source: 'bytelabs-sandbox',
      type: 'error',
      message: String(event.message || 'Script error'),
      line: event.lineno
    });
  });

  post({ source: 'bytelabs-sandbox', type: 'ready' });
})();
`;
