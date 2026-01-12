/* eslint-disable max-len */
class Pin {
  constructor(preliminary) {
    this.lat = preliminary.lat;
    this.lng = preliminary.lng;
    this.id = preliminary.id || this.generateHash(`${this.lat}_${this.lng}_${Date.now()}`);
    this.title = preliminary.title || Language.get('map.user_pins.default_title');
    this.description = preliminary.description || Language.get('map.user_pins.default_desc');
    this.shape = preliminary.shape || 'default';
    this.icon = preliminary.icon || 'pin';
    this.color = preliminary.color || 'orange';
  }

  generateHash(str) {
    let hash = 0;

    if (str.length === 0) return hash;

    for (let i = 0, l = str.length; i < l; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  updateMarkerContent() {
    let snippet;

    if (Settings.isPinsEditingEnabled) {
      const markerShapes = ['default', 'pushpin'];
      const markerIcons = ['boats', 'trains', 'campfires', 'hideouts', 'bounty', 'dynamic_bounties', 'camps', 'plants', 'fence', 'fme', 'gfh', 'random_encounters', 'animals', 'birds', 'fish', 'nazar', 'fast_travel', 'treasure', 'daily_locations', 'harrietum_animals', 'sightseeing', 'discoverables', 'singleplayer'];

      const inputVal = colorNameToHexMap[this.color] || this.color;

      snippet = document.createElement('div');
      snippet.innerHTML = `
          <h1>
            <input id="${this.id}_name" class="marker-popup-pin-input-name" type="text" value="${this.title}"
            placeholder="${Language.get('map.user_pins.placeholder_title')}">
          </h1>
          <p>
            <textarea id="${this.id}_desc" class="marker-popup-pin-input-desc" rows="5" value="${this.description}"
            placeholder="${Language.get('map.user_pins.placeholder_desc')}">${this.description}</textarea>
          </p>
          <hr class="marker-popup-pin-input-divider">
          <div style="display: grid; margin-bottom: 10px;">
            <label for="${this.id}_shape" class="marker-popup-pin-label" data-text="map.user_pins.shape">
              ${Language.get('map.user_pins.shape')}
            </label>
            <select id="${this.id}_shape" class="marker-popup-pin-input-shape">
              ${markerShapes.map(shape => `
                <option value="${shape}" data-text="map.user_pins.shape.${shape}"
                  ${shape === this.shape ? 'selected' : ''}>
                  ${Language.get(`map.user_pins.shape.${shape}`)}
                </option>
              `).join('')}
            </select>
            <label for="${this.id}_icon" class="marker-popup-pin-label" data-text="map.user_pins.icon">
              ${Language.get('map.user_pins.icon')}
            </label>
            <select id="${this.id}_icon" class="marker-popup-pin-input-icon">
              ${markerIcons.map(icon => `
                <option value="${icon}" data-icon="${icon}" data-text="map.user_pins.icon.${icon}"
                  ${icon === this.icon ? 'selected' : ''}>
                  ${Language.get(`map.user_pins.icon.${icon}`)}
                </option>
              `).join('')}
            </select>
            <label for="${this.id}_color" class="marker-popup-pin-label" data-text="map.user_pins.color">
              ${Language.get('map.user_pins.color')}
            </label>
            <div class="input-pickr-wrapper">
              <input type="text" id="${this.id}_color" class="input-text pickr-userpin" readonly value="${inputVal}" style="background-color: ${inputVal}">
            </div>
          </div>
          <div style="display: grid;">
            <button type="button" class="btn btn-info save-button" data-text="map.user_pins.save">
              ${Language.get('map.user_pins.save')}
            </button>
            <button type="button" class="btn btn-danger remove-button" data-text="map.user_pins.remove">
              ${Language.get('map.user_pins.remove')}
            </button>
            <small class="popupContentDebug">
              <span data-text="map.latitude">${Language.get('map.latitude')}</span>: ${this.lat} / <span data-text="map.longitude">${Language.get('map.longitude')}</span>: ${this.lng}
            </small>
          </div>
      `;

      this.enhanceIconSelect(snippet, `${this.id}_icon`, '/assets/images/icons');

      const inputEl = snippet.querySelector('.pickr-userpin');

      const pickr = Pickr.create({
        theme: 'nano',
        useAsButton: true,
        el: inputEl,
        container: snippet,
        default: inputEl.value,
        swatches: Object.keys(colorNameMap),
        components: {
          preview: true,
          hue: true,
          opacity: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        },
        i18n: {
         'btn:reset': Language.get('map.color_picker.reset'),
         'btn:save': Language.get('map.color_picker.save'),
      }
      }).on('save', (color) => {
        const colorStr = color.toHEXA().toString().toLowerCase();
        inputEl.style.backgroundColor = colorStr;
        inputEl.value = colorStr;
        pickr.hide();
      }); 

      snippet.querySelector('.save-button').addEventListener('click', () => {
        const name = document.getElementById(`${this.id}_name`).value;
        const desc = document.getElementById(`${this.id}_desc`).value;
        const shape = document.getElementById(`${this.id}_shape`).value;
        const icon = document.getElementById(`${this.id}_icon`).value;
        const color = document.getElementById(`${this.id}_color`).value;

        this.save(name, desc, shape, icon, colorNameMap[color] || color);
      });
      
      snippet.querySelector('.remove-button').addEventListener('click', () => this.remove());
    } else {
      snippet = document.createElement('div');
      snippet.innerHTML = `
        <h1 id="${this.id}_name">${this.title}</h1>
        <p id="${this.id}_desc">${this.description}</p>
      `;
    }

    return snippet;
  }

  enhanceIconSelect(snippet, selectId, iconBasePath = '/assets/icons') {
    const select = snippet.querySelector(`#${CSS.escape(selectId)}`);
    if (!select) return;

    const baseSelectClass = select.className;

    const wrapper = document.createElement('div');
    wrapper.className = 'pin-icon-select';

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    select.classList.add('pin-icon-select__native');
    select.tabIndex = -1;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${baseSelectClass} pin-icon-select__btn`;

    const btnIco = document.createElement('span');
    btnIco.className = 'pin-icon-select__ico';

    const btnText = document.createElement('span');
    btnText.className = 'pin-icon-select__text';

    btn.appendChild(btnIco);
    btn.appendChild(btnText);

    const panel = document.createElement('div');
    panel.className = 'pin-icon-select__panel';
    panel.setAttribute('role', 'listbox');

    const options = Array.from(select.options);
    const iconUrl = (icon) => `${iconBasePath}/${icon}.png`;

    const syncFromSelect = () => {
      const opt = select.selectedOptions[0] || select.options[0];
      const icon = opt?.dataset?.icon || opt?.value || '';
      btnIco.style.backgroundImage = `url(${iconUrl(icon)})`;
      btnText.textContent = opt?.textContent?.trim() || '';

      panel.querySelectorAll('.pin-icon-select__opt').forEach(el => {
        el.setAttribute('aria-selected', el.dataset.value === select.value ? 'true' : 'false');
      });
    };

    options.forEach(opt => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'pin-icon-select__opt';
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;

      const ico = document.createElement('span');
      ico.className = 'pin-icon-select__ico';
      ico.style.backgroundImage = `url(${iconUrl(opt.dataset.icon || opt.value)})`;

      const text = document.createElement('span');
      text.className = 'pin-icon-select__text';
      text.textContent = opt.textContent.trim();

      item.appendChild(ico);
      item.appendChild(text);

      item.addEventListener('click', () => {
        select.value = opt.value;
        options.forEach(o => { o.selected = (o.value === opt.value); });
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncFromSelect();
        closeDropdown();
      });

      panel.appendChild(item);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(panel);

    let isBound = false;

    const getEventPath = (e) => (typeof e.composedPath === 'function' ? e.composedPath() : null);
    const isInsideWrapper = (e) => {
      const path = getEventPath(e);
      if (path) return path.includes(wrapper);
      return wrapper.contains(e.target);
    };

    const closeDropdown = () => {
      wrapper.classList.remove('is-open');
      unbindOutsideHandlers();
    };

    const openDropdown = () => {
      document.querySelectorAll('.pin-icon-select.is-open').forEach(el => {
        if (el !== wrapper) el.classList.remove('is-open');
      });

      wrapper.classList.add('is-open');
      syncFromSelect();
      bindOutsideHandlers();
    };

    const onOutside = (e) => {
      if (!wrapper.classList.contains('is-open')) return;
      if (isInsideWrapper(e)) return;
      closeDropdown();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeDropdown();
    };

    const getLeafletContainers = () => {
      const els = [];

      try {
        if (window.MapBase?.map?.getContainer) {
          const c = MapBase.map.getContainer();
          if (c) els.push(c);
        }
      } catch (_) {}

      const popupPane = document.querySelector('.leaflet-pane.leaflet-popup-pane');
      if (popupPane) els.push(popupPane);

      const mapRoot = document.getElementById('map');
      if (mapRoot) els.push(mapRoot);

      els.push(document);

      return Array.from(new Set(els));
    };

    let boundTargets = [];

    const bindOutsideHandlers = () => {
      if (isBound) return;
      isBound = true;

      boundTargets = getLeafletContainers();

      boundTargets.forEach(t => t.addEventListener('pointerdown', onOutside, true));
      boundTargets.forEach(t => t.addEventListener('wheel', onOutside, true));

      document.addEventListener('keydown', onKeyDown, true);
    };

    const unbindOutsideHandlers = () => {
      if (!isBound) return;
      isBound = false;

      boundTargets.forEach(t => t.removeEventListener('pointerdown', onOutside, true));
      boundTargets.forEach(t => t.removeEventListener('wheel', onOutside, true));
      boundTargets = [];

      document.removeEventListener('keydown', onKeyDown, true);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (wrapper.classList.contains('is-open')) closeDropdown();
      else openDropdown();
    });

    const observer = new MutationObserver(() => {
      if (!document.body.contains(wrapper)) {
        unbindOutsideHandlers();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    select.addEventListener('change', syncFromSelect);
    syncFromSelect();
  }


  save(title, desc, shape, icon, color) {
    this.title = title;
    this.description = desc;
    this.shape = shape;
    this.icon = icon;
    this.color = color;

    Pins.layer.removeLayer(
      Object.keys(Pins.layer._layers)
        .find(marker => {
          this.lat = Pins.layer._layers[marker]._latlng.lat;
          this.lng = Pins.layer._layers[marker]._latlng.lng;
          return Pins.layer._layers[marker].options.id === this.id;
        }));

    Pins.pinsList = Pins.pinsList.filter(_pin => _pin.id !== this.id);

    Pins.addPin(JSON.parse(JSON.stringify(this)));

    Pins.save();

    MapBase.updateTippy('pins');
  }

  remove() {
    let id = this.id;
    Pins.pinsList = Pins.pinsList.filter(function (pin) {
      return pin.id !== id;
    });

    Pins.layer.removeLayer(Object.keys(Pins.layer._layers).find(marker => Pins.layer._layers[marker].options.id === this.id));

    Pins.save();
  }
}

class Pins {
  static init() {
    this.layer = L.layerGroup();

    document.getElementById('pins-place-mode').addEventListener('change', function () {
      Settings.isPinsPlacingEnabled = this.checked;
      Pins.onMap = true;
    });

    document.getElementById('pins-edit-mode').addEventListener('change', function () {
      Settings.isPinsEditingEnabled = this.checked;
      Pins.onMap = true;
      Pins.loadPins();
    });

    document.getElementById('pins-place-new').addEventListener('click', function () {
      Pins.onMap = true;
      Pins.addPinToCenter();
      Pins.save();
    });

    const removeAllPinsModal = new bootstrap.Modal(document.getElementById('remove-all-pins-modal'));
    document.getElementById('open-remove-all-pins-modal').addEventListener('click', function () {
      removeAllPinsModal.show();
    });

    document.getElementById('remove-all-pins').addEventListener('click', function () {
      Pins.removeAllPins();
    });

    document.getElementById('pins-export').addEventListener('click', function () {
      try {
        Pins.exportPins();
      } catch (error) {
        console.error(error);
        alert(Language.get('alerts.feature_not_supported'));
      }
    });

    document.getElementById('pins-import').addEventListener('click', function () {
      try {
        let file = document.getElementById('pins-import-file').files[0];
        let fallback = false;

        if (!file) {
          alert(Language.get('alerts.file_not_found'));
          return;
        }

        try {
          file.text().then((text) => {
            Pins.importPins(text);
          });
        } catch (error) {
          fallback = true;
        }

        if (fallback) {
          const reader = new FileReader();

          reader.addEventListener('loadend', (e) => {
            const text = e.target.result;
            Pins.importPins(text);
          });

          reader.readAsText(file);
        }

        MapBase.updateTippy('pins');
      } catch (error) {
        console.error(error);
        alert(Language.get('alerts.feature_not_supported'));
      }
    });

    document.getElementById('pins-place-mode').checked = Settings.isPinsPlacingEnabled;
    document.getElementById('pins-edit-mode').checked = Settings.isPinsEditingEnabled;

    this.context = document.querySelector('.menu-option[data-type=user_pins]');
    this.context.classList.toggle('disabled', !this.onMap);
    this.context.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.context);

    this.loadPins();

    if (this.onMap)
      this.layer.addTo(MapBase.map);
  }

  static loadPins() {
    this.layer.clearLayers();
    this.pinsList = [];

    //Check if exists old pins data
    let oldPinnedItems = localStorage.getItem('pinned-items');
    if (oldPinnedItems != null) {
      oldPinnedItems.split(';').forEach(oldItem => {
        if (oldItem === '') return;
        const properties = oldItem.split(':');
        this.addPin(JSON.parse(`{"lat": ${properties[0]}, "lng": ${properties[1]}, "id": ${properties[2]}, "title": "${properties[3]}", "description": "${properties[4]}", "icon": "${properties[5]}", "color": "red"}`));
      });
    }

    if (Pins.isValidJSON(localStorage.getItem('rdo.pinned-items'))) {
      JSON.parse(localStorage.getItem('rdo.pinned-items')).forEach(pinnedItem => {
        this.addPin(pinnedItem);
      });
    }
  }

  static addPin(data) {
    const marker = new Pin(data);
    this.pinsList.push(marker);

    const match = marker.color.match(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?/);
    const color = match ? marker.color : colorNameToHexMap[marker.color];

    const svgBg = marker.shape === 'pushpin'
     ? `<svg width="45px" height="45px" viewBox="2 2 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(-45deg);" stroke="${color}"><g stroke-linecap="round" stroke-linejoin="round"></g><path d="M14.6358 3.90949C15.2888 3.47412 15.6153 3.25643 15.9711 3.29166C16.3269 3.32689 16.6044 3.60439 17.1594 4.15938L19.8406 6.84062C20.3956 7.39561 20.6731 7.67311 20.7083 8.02888C20.7436 8.38465 20.5259 8.71118 20.0905 9.36424L18.4419 11.8372C17.88 12.68 17.5991 13.1013 17.3749 13.5511C17.2086 13.8845 17.0659 14.2292 16.9476 14.5825C16.7882 15.0591 16.6889 15.5557 16.4902 16.5489L16.2992 17.5038C16.2986 17.5072 16.2982 17.5089 16.298 17.5101C16.1556 18.213 15.3414 18.5419 14.7508 18.1351C14.7497 18.1344 14.7483 18.1334 14.7455 18.1315C14.7322 18.1223 14.7255 18.1177 14.7189 18.1131C11.2692 15.7225 8.27754 12.7308 5.88691 9.28108C5.88233 9.27448 5.87772 9.26782 5.86851 9.25451C5.86655 9.25169 5.86558 9.25028 5.86486 9.24924C5.45815 8.65858 5.78704 7.84444 6.4899 7.70202C6.49113 7.70177 6.49282 7.70144 6.49618 7.70076L7.45114 7.50977C8.44433 7.31113 8.94092 7.21182 9.4175 7.05236C9.77083 6.93415 10.1155 6.79139 10.4489 6.62514C10.8987 6.40089 11.32 6.11998 12.1628 5.55815L14.6358 3.90949Z" fill="${color}" stroke="${color}" stroke-width="2.4"></path><path d="M5 19L9.5 14.5" stroke="${color}" stroke-width="2.4" stroke-linecap="round"></path></svg>`
      : `<svg width="45px" height="45px" viewBox="1.1 -0.9 16.80 16.80" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="${color}" stroke="${color}" stroke-width="0.00015"><path d="M7.5,0C5.0676,0,2.2297,1.4865,2.2297,5.2703C2.2297,7.8378,6.2838,13.5135,7.5,15c1.0811-1.4865,5.2703-7.027,5.2703-9.7297C12.7703,1.4865,9.9324,0,7.5,0z"></path> </g></svg>`;

    const background = MapBase.colorOverride
      ? `<img class="background" src="assets/images/icons/marker_${MapBase.colorOverride}.png" alt="Background">`
      : `<div class="background">${svgBg}</div>`;
    
    const shadow = Settings.isShadowsEnabled ?
      `<img class="shadow" width="${35 * Settings.markerSize}" height="${16 * Settings.markerSize}" src="./assets/images/markers-shadow.png" alt="Shadow">` : '';
    const tempMarker = L.marker([marker.lat, marker.lng], {
      opacity: Settings.markerOpacity,
      icon: new L.DivIcon.DataMarkup({
        iconSize: [35 * Settings.markerSize, 45 * Settings.markerSize],
        iconAnchor: [17 * Settings.markerSize, 42 * Settings.markerSize],
        popupAnchor: [1 * Settings.markerSize, -29 * Settings.markerSize],
        html: `<div>
          <img class="icon" src="assets/images/icons/${marker.icon}.png" alt="Icon">
          ${background}
          ${shadow}
        </div>`,
        marker: this.key,
        tippy: marker.title,
      }),
      id: marker.id,
      draggable: Settings.isPinsEditingEnabled,
    });
    tempMarker.bindPopup(marker.updateMarkerContent(), { minWidth: 300, maxWidth: 400 });

    Pins.layer.addLayer(tempMarker);
    if (Settings.isMarkerClusterEnabled && !Settings.isPinsEditingEnabled)
      Layers.oms.addMarker(tempMarker);
    Pins.save();

    tempMarker.addEventListener('dragend', function () {
      Pins.pinsList.forEach(pin => {
        pin.save(pin.title, pin.description, pin.shape, pin.icon, pin.color);
      });
      Pins.save();
    }, { capture: false });
  }

  static addPinToCenter() {
    const center = MapBase.map.getCenter();
    Pins.addPin({ lat: center.lat, lng: center.lng });
  }

  static save() {
    localStorage.removeItem('pinned-items');
    localStorage.setItem('rdo.pinned-items', JSON.stringify(this.pinsList));
  }

  static importPins(text) {
    if (Pins.isValidJSON(text)) {
      console.log('📌', text);
      localStorage.setItem('rdo.pinned-items', text);
      this.loadPins();
    } else {
      alert(Language.get('alerts.file_not_valid'));
      console.log(text);
    }
  }

  static exportPins() {
    const text = localStorage.getItem('rdo.pinned-items');
    const filename = 'pinned-items.txt';

    if (text === null) {
      alert(Language.get('alerts.nothing_to_export'));
      return;
    }

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  static isValidJSON(str) {
    try {
      if (str == null)
        return false;
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  static set onMap(state) {
    if (state) {
      this.layer.addTo(MapBase.map);
      if (!MapBase.isPreviewMode)
        localStorage.setItem('rdo.pins-enabled', 'true');
      this.context.classList.remove('disabled');
    } else {
      this.layer.remove();
      if (!MapBase.isPreviewMode)
        localStorage.removeItem('rdo.pins-enabled');
      this.context.classList.add('disabled');
    }

    MapBase.updateTippy('pins');
  }

  static get onMap() {
    return !!localStorage.getItem('rdo.pins-enabled');
  }

  static removeAllPins() {
    Pins.pinsList = [];
    Object.keys(Pins.layer._layers).forEach(pin => {
      Pins.layer.removeLayer(pin);
    });
    Pins.save();
  }
}
