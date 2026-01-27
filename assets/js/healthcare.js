class Healthcare {
  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.element = document.createElement('div');
    this.element.className = 'collectible-wrapper';
    Object.assign(this.element.dataset, { help: 'item', type: this.key, tippyContent: Language.get(`map.healthcare.${this.key}.name`) });
    this.element.innerHTML = `
      <img class="collectible-icon" src="./assets/images/icons/${this.locationIcon}.png">
      <span class="collectible-text ${!this.onMap ? 'disabled' : ''}">
        <p class="collectible" data-text="map.healthcare.${this.key}.name"></p>
      </span>
    `;
    this.element.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.element);

    HealthcareCollection.context.appendChild(this.element);

    this.onLanguageChanged();

    if (this.onMap) {
      this.onMap = this.onMap;
    }
  }

  onLanguageChanged() {
    this.dataMarkers = [];
    this.locations.forEach((item) => {
      const marker = new Marker(item.text, item.x, item.y, 'healthcare', this.key, item.type);
      marker.type = item.type;
      marker.locationIcon = item.locationIcon;
      marker.displayIcon = item.displayIcon;
      this.dataMarkers.push(marker);
    });

    this.reinitMarker();
  }

  reinitMarker() {
    this.markers = [];
    const boxPx = 35 * Settings.markerSize;

    this.dataMarkers.forEach((marker) => {
      if (!HealthcareCollection.isLocation && marker.type === 'location') return;
      if (!HealthcareCollection.isDisplay && marker.type === 'display') return;

      const tempMarker = L.marker([marker.lat, marker.lng], {
        opacity: Settings.markerOpacity,
        icon: new L.DivIcon.DataMarkup({
          iconSize: [boxPx, boxPx],
          iconAnchor: [boxPx / 2, boxPx / 2],
          popupAnchor: [0, -boxPx / 2],
          html: `<div class="pin-icon-only">
            <span class="pin-icon-only__shadow" aria-hidden="true"></span>
            <span class="pin-icon-only__ico" style="background-image:url('assets/images/icons/${this.getMarkerIcon(marker)}.png')" aria-hidden="true"></span>
          </div>`,
          marker: this.key,
          tippy: marker.title,
        }),
      });

      tempMarker.bindPopup(marker.updateMarkerContent.bind(marker, () => this.onMap = false), { minWidth: 300, maxWidth: 400 });
      this.markers.push(tempMarker);
    });
  }

  getMarkerIcon(marker) {
    if (marker.type === 'location') {
      return marker.locationIcon || this.locationIcon;
    }
    if (marker.type === 'display') {
      return marker.displayIcon || this.displayIcon;
    }
    return this.key;
  }

  set onMap(state) {
    if (!MapBase.isPreviewMode && !HealthcareCollection.onMap) return false;
    
    if (state) {
      if (!HealthcareCollection.enabledCategories.includes(this.key)) {
        HealthcareCollection.markers = HealthcareCollection.markers.concat(this.markers);
        HealthcareCollection.enabledCategories.push(this.key);
      }
    } else {
      HealthcareCollection.markers = HealthcareCollection.markers.filter((el) => !this.markers.includes(el));
      HealthcareCollection.enabledCategories = HealthcareCollection.enabledCategories.filter((el) => el !== this.key);
      MapBase.map.closePopup();
    }

    HealthcareCollection.layer.clearLayers();
    HealthcareCollection.markers.forEach(marker => HealthcareCollection.layer.addLayer(marker));

    if (!MapBase.isPreviewMode) {
      state ? localStorage.setItem(`rdrp.${this.key}`, 'true') : localStorage.setItem(`rdrp.${this.key}`, 'false');
    }
    this.element.querySelector('span').classList.toggle('disabled', !state);

    MapBase.updateTippy('healthcare');
  }

  get onMap() {
    const value = localStorage.getItem(`rdrp.${this.key}`);
    if (value === 'false') return false;
    if (value === null && !MapBase.isPreviewMode) localStorage.setItem(`rdrp.${this.key}`, 'true');
    return true;
  }
}

class HealthcareCollection {
  static init() {
    this.isLocation = true;
    this.isDisplay = true;
    this.layer = L.layerGroup();
    this.enabledCategories = [];
    this.markers = [];
    this.quickParams = [];

    HealthcareCollection.layer.addTo(MapBase.map);

    this.locations = [];
    this.context = document.querySelector('.menu-hidden[data-type=healthcare]');

    return Loader.promises['healthcare'].consumeJson((data) => {
      data.forEach((item) => {
        this.locations.push(new Healthcare(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Healthcare] Loaded!', 'color: #bada55; background: #242424');
      Menu.reorderMenu(this.context);
    });
  }

  static onLanguageChanged() {
    HealthcareCollection.locations.forEach(hosp => hosp.onLanguageChanged());
    Menu.reorderMenu(this.context);
  }

  static refresh() {
    this.markers = [];
    this.locations.forEach((hosp) => {
      hosp.reinitMarker();
      if (hosp.onMap) this.markers = this.markers.concat(hosp.markers);
    });
    
    this.layer.clearLayers();
    this.markers.forEach(marker => this.layer.addLayer(marker));
    MapBase.updateTippy('healthcare');
  }

  static set onMap(state) {
    if (state) {
      if (this.markers.length > 0) this.layer.addTo(MapBase.map);
    } else {
      this.layer.remove();
    }
    this.context.classList.toggle('disabled', !state);

    if (!MapBase.isPreviewMode) localStorage.setItem('rdrp.healthcare', JSON.stringify(state));

    HealthcareCollection.locations.forEach((_hosp) => {
      if (_hosp.onMap) _hosp.onMap = state;
    });

    MapBase.updateTippy('healthcare');
  }
  
  static get onMap() {
      const value = JSON.parse(localStorage.getItem('rdrp.healthcare'));
      return value || value == null;
  }
}
