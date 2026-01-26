class Hospitality {
  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.element = document.createElement('div');
    this.element.className = 'collectible-wrapper';
    Object.assign(this.element.dataset, { help: 'item', type: this.key, tippyContent: Language.get(`map.hospitality.${this.key}.name`) });
    this.element.innerHTML = `
      <img class="collectible-icon" src="./assets/images/icons/${this.locationIcon}.png">
      <span class="collectible-text ${!this.onMap ? 'disabled' : ''}">
        <p class="collectible" data-text="map.hospitality.${this.key}.name"></p>
      </span>
    `;
    this.element.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.element);

    HospitalityCollection.context.appendChild(this.element);

    this.onLanguageChanged();

    if (this.onMap) {
      this.onMap = this.onMap;
    }
  }

  onLanguageChanged() {
    this.dataMarkers = [];
    this.locations.forEach((item) => {
      const marker = new Marker(item.text, item.x, item.y, 'hospitality', this.key, item.type);
      marker.type = item.type;
      this.dataMarkers.push(marker);
    });

    this.reinitMarker();
  }

  reinitMarker() {
    this.markers = [];
    const boxPx = 35 * Settings.markerSize;

    this.dataMarkers.forEach((marker) => {
      if (!HospitalityCollection.isLocation && marker.type === 'location') return;
      if (!HospitalityCollection.isDisplay && marker.type === 'display') return;

      const tempMarker = L.marker([marker.lat, marker.lng], {
        opacity: Settings.markerOpacity,
        icon: new L.DivIcon.DataMarkup({
          iconSize: [boxPx, boxPx],
          iconAnchor: [boxPx / 2, boxPx / 2],
          popupAnchor: [0, -boxPx / 2],
          html: `<div class="pin-icon-only">
            <span class="pin-icon-only__shadow" aria-hidden="true"></span>
            <span class="pin-icon-only__ico" style="background-image:url('assets/images/icons/${marker.type === 'location' ? this.locationIcon : this.displayIcon}.png')" aria-hidden="true"></span>
          </div>`,
          marker: this.key,
          tippy: marker.title,
        }),
      });

      tempMarker.bindPopup(marker.updateMarkerContent.bind(marker, () => this.onMap = false), { minWidth: 300, maxWidth: 400 });
      this.markers.push(tempMarker);
    });
  }

  set onMap(state) {
    if (!MapBase.isPreviewMode && !HospitalityCollection.onMap) return false;
    
    if (state) {
      if (!HospitalityCollection.enabledCategories.includes(this.key)) {
        HospitalityCollection.markers = HospitalityCollection.markers.concat(this.markers);
        HospitalityCollection.enabledCategories.push(this.key);
      }
    } else {
      HospitalityCollection.markers = HospitalityCollection.markers.filter((el) => !this.markers.includes(el));
      HospitalityCollection.enabledCategories = HospitalityCollection.enabledCategories.filter((el) => el !== this.key);
      MapBase.map.closePopup();
    }

    HospitalityCollection.layer.clearLayers();
    HospitalityCollection.markers.forEach(marker => HospitalityCollection.layer.addLayer(marker));

    if (!MapBase.isPreviewMode) {
      state ? localStorage.setItem(`rdo.${this.key}`, 'true') : localStorage.removeItem(`rdo.${this.key}`);
    }
    this.element.querySelector('span').classList.toggle('disabled', !state);

    MapBase.updateTippy('hospitality');
  }

  get onMap() {
    return !!localStorage.getItem(`rdo.${this.key}`);
  }
}

class HospitalityCollection {
  static init() {
    this.isLocation = true;
    this.isDisplay = true;
    this.layer = L.layerGroup();
    this.enabledCategories = [];
    this.markers = [];
    this.quickParams = [];

    HospitalityCollection.layer.addTo(MapBase.map);

    this.locations = [];
    this.context = document.querySelector('.menu-hidden[data-type=hospitality]');

    return Loader.promises['hospitality'].consumeJson((data) => {
      data.forEach((item) => {
        this.locations.push(new Hospitality(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Hospitality] Loaded!', 'color: #bada55; background: #242424');
      Menu.reorderMenu(this.context);
    });
  }

  static onLanguageChanged() {
    HospitalityCollection.locations.forEach(hosp => hosp.onLanguageChanged());
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
    MapBase.updateTippy('hospitality');
  }

  static set onMap(state) {
    if (state) {
      if (this.markers.length > 0) this.layer.addTo(MapBase.map);
    } else {
      this.layer.remove();
    }
    this.context.classList.toggle('disabled', !state);

    if (!MapBase.isPreviewMode) localStorage.setItem('rdo.hospitality', JSON.stringify(state));

    HospitalityCollection.locations.forEach((_hosp) => {
      if (_hosp.onMap) _hosp.onMap = state;
    });

    MapBase.updateTippy('hospitality');
  }
  
  static get onMap() {
      const value = JSON.parse(localStorage.getItem('rdo.hospitality'));
      return value || value == null;
  }
}
