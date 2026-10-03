(() => {
  'use strict';
  if (customElements.get('everstory-material-guide')) return;

  class EverstoryMaterialGuide extends HTMLElement {
    connectedCallback() {
      if (this.events) return;
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.panels = [...this.querySelectorAll('[data-emg-panel]')];
      if (!this.panels.length) return;
      this.design = this.panels[0].dataset.emgPanel;
      this.view = 'samples';
      this.dialog = this.querySelector('[data-emg-dialog]');
      this.trigger = null;
      this.classList.add('has-js');
      this.querySelectorAll('[data-emg-controls]').forEach(node => { node.hidden = false; });
      this.querySelectorAll('[data-emg-zoom]').forEach(node => {
        node.hidden = typeof this.dialog?.showModal !== 'function';
      });
      this.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button || !this.contains(button)) return;
        if (button.hasAttribute('data-emg-design')) {
          const next = button.dataset.emgDesign;
          if (this.panels.some(panel => panel.dataset.emgPanel === next)) this.design = next;
          this.render();
        } else if (button.hasAttribute('data-emg-view')) {
          this.view = button.dataset.emgView === 'full' ? 'full' : 'samples';
          this.render();
        } else if (button.hasAttribute('data-emg-zoom')) {
          this.enlarge(button);
        } else if (button.hasAttribute('data-emg-close')) {
          this.dialog?.close();
        }
      }, options);
      this.addEventListener('error', event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement)) return;
        const card = image.closest('.emg-card');
        if (card && !card.querySelector('.emg-error')) {
          const message = document.createElement('p');
          message.className = 'emg-error';
          message.setAttribute('role', 'status');
          message.textContent = 'This photo could not be loaded.';
          card.append(message);
          image.hidden = true;
          card.querySelector('[data-emg-zoom]')?.setAttribute('hidden', '');
        }
      }, { ...options, capture: true });
      this.dialog?.addEventListener('close', () => {
        this.querySelector('[data-emg-zoom-stage]')?.replaceChildren();
        if (this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
      }, options);
      this.dialog?.addEventListener('click', event => {
        if (event.target !== this.dialog) return;
        const box = this.dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.dialog.close();
      }, options);
      this.render();
    }

    disconnectedCallback() {
      if (this.dialog?.open) this.dialog.close();
      this.events?.abort();
      this.events = null;
    }

    render() {
      this.panels.forEach(panel => {
        panel.hidden = panel.dataset.emgPanel !== this.design;
        panel.querySelectorAll('[data-emg-layout]').forEach(layout => {
          layout.hidden = layout.dataset.emgLayout !== this.view;
        });
      });
      this.querySelectorAll('[data-emg-design]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.emgDesign === this.design));
      });
      this.querySelectorAll('[data-emg-view]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.emgView === this.view));
      });
    }

    enlarge(button) {
      if (!button.dataset.emgSrc || typeof this.dialog?.showModal !== 'function') return;
      const image = document.createElement('img');
      image.src = button.dataset.emgSrc;
      image.alt = button.dataset.emgAlt || '';
      image.decoding = 'async';
      const stage = this.querySelector('[data-emg-zoom-stage]');
      const d = button.dataset;
      const crop = [d.emgCropX, d.emgCropY, d.emgCropWidth, d.emgCropHeight, d.emgSourceWidth].map(Number);
      if (crop.every(Number.isFinite) && crop[0] >= 0 && crop[1] >= 0 && crop[2] > 0 && crop[3] > 0 && crop[4] > 0) {
        const [x, y, width, height, sourceWidth] = crop;
        const frame = document.createElement('div');
        frame.className = 'emg-zoom-window';
        frame.style.aspectRatio = `${width} / ${height}`;
        frame.style.width = `min(${width}px, 100%, calc((100dvh - 170px) * ${width / height}))`;
        image.style.width = `${sourceWidth / width * 100}%`;
        image.style.left = `${-x / width * 100}%`;
        image.style.top = `${-y / height * 100}%`;
        frame.append(image);
        stage.replaceChildren(frame);
      } else {
        stage.replaceChildren(image);
      }
      image.addEventListener('error', () => {
        if (!stage.contains(image)) return;
        const message = document.createElement('p');
        message.className = 'emg-error';
        message.setAttribute('role', 'status');
        message.textContent = 'The enlarged photo could not be loaded.';
        stage.replaceChildren(message);
      }, { once: true });
      this.querySelector('[data-emg-zoom-title]').textContent = button.dataset.emgTitle || 'Material detail';
      this.trigger = button;
      this.dialog.showModal();
    }
  }
  customElements.define('everstory-material-guide', EverstoryMaterialGuide);
})();
