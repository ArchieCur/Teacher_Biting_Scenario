// Storyline completion bridge.
//
// Two routes, both tried every time (each is harmless if the other works):
//   A. Same origin: find GetPlayer() on a parent frame (or the opener window)
//      and set the True/False variable directly.
//   B. Any origin: post a message to every ancestor frame and the opener. A
//      listener in Storyline sets the variable. The message carries no learner
//      data.
// The variable name and target origin come from module.yaml, and query
// parameters can override them: ?sv=VariableName&origin=https://host
// ?bridge=a or ?bridge=b limits the routes, for testing in the harness.

export const MESSAGE_SOURCE = 'scenario-engine';

export function bridgeConfig(moduleId, storyline, search = '') {
  const params = new URLSearchParams(search);
  const mode = params.get('bridge');
  return {
    moduleId,
    variable: params.get('sv') || storyline.variable,
    targetOrigin: params.get('origin') || storyline.targetOrigin || '*',
    mode: mode === 'a' || mode === 'b' ? mode : 'both',
  };
}

/** Parent frames from nearest to top, then the opener window if there is one. */
function hostWindows(win) {
  const found = [];
  try {
    let w = win;
    for (let depth = 0; depth < 10 && w.parent && w.parent !== w; depth += 1) {
      w = w.parent;
      found.push(w);
    }
  } catch {
    // Reading .parent is allowed across origins, but be safe.
  }
  try {
    if (win.opener && !found.includes(win.opener)) found.push(win.opener);
  } catch {
    // Opener blocked.
  }
  return found;
}

/**
 * @returns {{ setVar: boolean, messages: number }} what was attempted successfully
 */
export function notifyComplete(cfg, win = globalThis) {
  const report = { setVar: false, messages: 0 };
  const hosts = hostWindows(win);

  if (cfg.mode !== 'b') {
    for (const host of hosts) {
      try {
        if (typeof host.GetPlayer === 'function') {
          const player = host.GetPlayer();
          if (player && typeof player.SetVar === 'function') {
            player.SetVar(cfg.variable, true);
            report.setVar = true;
            break;
          }
        }
      } catch {
        // Cross-origin parent: route A is not possible here.
      }
    }
  }

  if (cfg.mode !== 'a') {
    const message = { source: MESSAGE_SOURCE, type: 'complete', moduleId: cfg.moduleId };
    for (const host of hosts) {
      try {
        host.postMessage(message, cfg.targetOrigin);
        report.messages += 1;
      } catch {
        // A bad targetOrigin throws. Keep going.
      }
    }
  }

  return report;
}
