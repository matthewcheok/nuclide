'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const featureConfig = require('../../feature-config');
const path = require('path');

const openHealthPane = () => {
  atom.commands.dispatch(atom.views.getView(atom.workspace), 'nuclide-health:show');
};

function findHealthPaneAndItem(): {pane: ?atom$Pane; item: ?Object} {
  for (const pane of atom.workspace.getPanes()) {
    for (const item of pane.getItems()) {
      if (item.getTitle() === 'Health') {
        return {pane, item};
      }
    }
  }
  return {pane: null, item: null};
}

function sleep(ms: number): Promise {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

describe('Health', () => {

  beforeEach(() => {
    waitsForPromise(async () => {
      jasmine.unspy(window, 'setTimeout');
      const config = require('../package.json').nuclide.config;
      // $UPFixMe: With UP, the default settings are set by the loader, but
      // I don't have a good way to do that just for tests (yet).
      Object.keys(config).forEach(k =>
        featureConfig.setSchema(`nuclide-health.${k}`, config[k])
      );
      await Promise.all([
        atom.packages.activatePackage(path.join(__dirname, '..', '..', 'gadgets')),
        atom.packages.activatePackage(path.join(__dirname, '..')),
      ]);
    });
  });

  it('contains stats after its first refresh', () => {
    waitsForPromise(async () => {
      openHealthPane();
      const {item} = findHealthPaneAndItem();
      expect(item).toBeTruthy();
      if (item) {
        expect(item.getTitle()).toEqual('Health');
        const interval = featureConfig.get('nuclide-health.viewTimeout');
        expect(typeof interval).toEqual('number');
        const {element} = item;

        if (typeof interval === 'number') {
          // Flow considers atom config items to be mixed.
          await sleep((interval + 1) * 1000);
          // An extra second should be enough for this test not to be flakey.
          expect(element.innerHTML).toContain('Stats');
          expect(element.innerHTML).toContain('CPU');
          expect(element.innerHTML).toContain('Heap');
          expect(element.innerHTML).toContain('Memory');
          expect(element.innerHTML).toContain('Key latency');
          expect(element.innerHTML).toContain('Handles');
          expect(element.innerHTML).toContain('Event loop');
        }
      }
    });
  });

  it('disappears when closed', () => {
    waitsForPromise(async () => {
      openHealthPane();
      const {pane, item} = findHealthPaneAndItem();
      expect(item).toBeTruthy();
      if (pane && item) {
        pane.activateItem(item);
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'core:close');
        expect(findHealthPaneAndItem().item).toBeFalsy();
      }
    });
  });

});