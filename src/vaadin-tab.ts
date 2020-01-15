import { customElement } from 'lit-element';
import { TabBase } from './vaadin-tab-base';
import { TabMixin } from './vaadin-tab-mixin';

/**
 * `<vaadin-tab>` is a Web Component providing an accessible and customizable tab.
 */
@customElement('vaadin-tab')
export class VaadinTab extends TabMixin(TabBase) {
  static is = 'vaadin-tab';

  static get version() {
    return '3.0.5';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaadin-tab': VaadinTab;
  }
}
