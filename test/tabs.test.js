import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fixtureSync } from '@open-wc/testing-helpers';
import { keyDownOn, keyUpOn } from '@polymer/iron-test-helpers/mock-interactions.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import '../vaadin-tabs.js';

describe('tabs', () => {
  let tabs;

  function listenOnce(element, eventName, callback) {
    const listener = (e) => {
      element.removeEventListener(eventName, listener);
      callback(e);
    };
    element.addEventListener(eventName, listener);
  }

  beforeEach(() => {
    tabs = fixtureSync(`
      <vaadin-tabs style="width: 400px; height: 400px;">
        <vaadin-tab>Foo</vaadin-tab>
        <vaadin-tab>Bar</vaadin-tab>
        <separator>___</separator>
        <vaadin-tab disabled>Baz</vaadin-tab>
        <vaadin-tab>
          <a>Baz</a>
        </vaadin-tab>
      </vaadin-tabs>
    `);
    tabs._observer.flush();
  });

  describe('custom element definition', () => {
    let tagName;

    beforeEach(() => {
      tagName = tabs.tagName.toLowerCase();
    });

    it('should be defined in custom element registry', () => {
      expect(customElements.get(tagName)).to.be.ok;
    });

    it('should have a valid static "is" getter', () => {
      expect(customElements.get(tagName).is).to.equal(tagName);
    });

    it('should have a valid version number', () => {
      expect(customElements.get(tagName).version).to.match(/^(\d+\.)?(\d+\.)?(\d+)(-(alpha|beta)\d+)?$/);
    });
  });

  describe('items', () => {
    it('should only add vaadin-tab components to items', () => {
      expect(tabs.items.length).to.equal(4);
      tabs.items.forEach((item) => {
        expect(item.tagName.toLowerCase()).to.equal('vaadin-tab');
      });
    });
  });

  ['horizontal', 'vertical'].forEach((orientation) => {
    ['ltr', 'rtl'].forEach((direction) => {
      describe(`Overflow ${orientation} ${direction}`, () => {
        let horizontalRtl;

        before(() => {
          document.documentElement.setAttribute('dir', direction);
        });

        beforeEach(() => {
          horizontalRtl = orientation === 'horizontal' && direction === 'rtl';
          tabs.orientation = orientation;
        });

        after(() => {
          document.documentElement.removeAttribute('dir');
        });

        describe('large viewport', () => {
          it(`when orientation=${orientation} should not have overflow`, () => {
            expect(tabs.hasAttribute('overflow')).to.be.false;
          });
        });

        describe('small viewport', () => {
          beforeEach((done) => {
            tabs.style.width = '200px';
            tabs.style.height = '100px';
            tabs._updateOverflow();
            afterNextRender(tabs, done);
          });

          it(`when orientation=${orientation} should have overflow="end" if scroll is at the beginning`, () => {
            expect(tabs.getAttribute('overflow')).to.be.equal('end');
          });

          it(`when orientation=${orientation} should have overflow="start end" if scroll is at the middle`, (done) => {
            listenOnce(tabs._scrollerElement, 'scroll', () => {
              expect(tabs.getAttribute('overflow')).to.contain('start');
              expect(tabs.getAttribute('overflow')).to.contain('end');
              done();
            });
            tabs._scroll(horizontalRtl ? -2 : 2);
          });

          it(`when orientation=${orientation} should have overflow="start" if scroll is at the end`, (done) => {
            listenOnce(tabs._scrollerElement, 'scroll', () => {
              expect(tabs.getAttribute('overflow')).to.be.equal('start');
              done();
            });
            tabs._scroll(horizontalRtl ? -400 : 400);
          });

          it(`when orientation=${orientation} should not have overflow="start" when over-scrolling`, () => {
            const scroll = tabs._scrollerElement;

            // Cannot set negative values to native scroll, monkey patching the properties
            let pixels = 0;
            Object.defineProperty(scroll, orientation == 'horizontal' ? 'scrollLeft' : 'scrollTop', {
              get: () => pixels,
              set: (v) => (pixels = v)
            });

            // Simulate over-scrolling
            tabs._scroll(horizontalRtl ? 400 : -400);
            scroll.dispatchEvent(new CustomEvent('scroll'));

            expect(tabs.getAttribute('overflow')).to.be.equal('end');
          });
        });
      });
    });
  });

  describe('slotted anchor', () => {
    let anchor, tab, spy;

    beforeEach(() => {
      anchor = tabs.querySelector('a');
      tab = anchor.parentElement;
      spy = sinon.spy();
      anchor.addEventListener('click', spy);
    });

    it('should propagate click to the anchor element when Enter key pressed', () => {
      keyDownOn(tab, 13, [], 'Enter');
      keyUpOn(tab, 13, [], 'Enter');
      expect(spy.calledOnce).to.be.true;
    });

    it('should propagate click to the anchor element when Space key pressed', () => {
      keyDownOn(tab, 27, [], ' ');
      keyUpOn(tab, 27, [], ' ');
      expect(spy.calledOnce).to.be.true;
    });

    it('should not propagate click to the anchor when other key pressed', () => {
      keyDownOn(tab, 39, [], 'ArrowRight');
      keyUpOn(tab, 39, [], 'ArrowRight');
      expect(spy.calledOnce).to.be.false;
    });
  });

  describe('ARIA roles', () => {
    it('should set "tablist" role on the tabs container', () => {
      expect(tabs.getAttribute('role')).to.equal('tablist');
    });
  });
});
