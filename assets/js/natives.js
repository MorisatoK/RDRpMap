class Natives {
  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.onLanguageChanged();

    if (this.onMap) {
      this.onMap = this.onMap;
    }
  }

  onLanguageChanged() {
    this.dataMarkers = [];
    this.locations.forEach((item) => {
      const marker = new Marker(item.text, item.x, item.y, 'natives', this.key, item.type);
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
      if (!NativesCollection.isLocation && marker.type === 'location') return;
      if (!NativesCollection.isDisplay && marker.type === 'display') return;

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
    if (!MapBase.isPreviewMode && !NativesCollection.onMap) return false;
    
    if (state) {
      if (!NativesCollection.enabledCategories.includes(this.key)) {
        NativesCollection.markers = NativesCollection.markers.concat(this.markers);
        NativesCollection.enabledCategories.push(this.key);
      }
    } else {
      NativesCollection.markers = NativesCollection.markers.filter((el) => !this.markers.includes(el));
      NativesCollection.enabledCategories = NativesCollection.enabledCategories.filter((el) => el !== this.key);
      MapBase.map.closePopup();
    }

    NativesCollection.layer.clearLayers();
    NativesCollection.markers.forEach(marker => NativesCollection.layer.addLayer(marker));

    if (!MapBase.isPreviewMode) {
      state ? localStorage.setItem(`rdo.${this.key}`, 'true') : localStorage.removeItem(`rdo.${this.key}`);
    }

    NativesCollection.setMenuState(state);

    MapBase.updateTippy('natives');
  }

  get onMap() {
    return !!localStorage.getItem(`rdo.${this.key}`);
  }
}

class NativesCollection {
  static init() {
    this.isLocation = true;
    this.isDisplay = true;
    this.layer = L.layerGroup();
    this.enabledCategories = [];
    this.markers = [];
    this.quickParams = [];

    NativesCollection.layer.addTo(MapBase.map);

    this.locations = [];
    this.context = document.querySelector('.menu-option[data-type=natives]');

    return Loader.promises['natives'].consumeJson((data) => {
      data.forEach((item) => {
        this.locations.push(new Natives(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Natives] Loaded!', 'color: #bada55; background: #242424');
    });
  }

  static onLanguageChanged() {
    NativesCollection.locations.forEach(hosp => hosp.onLanguageChanged());
  }

  static refresh() {
    this.markers = [];
    this.locations.forEach((loc) => {
      loc.reinitMarker();
      if (loc.onMap) this.markers = this.markers.concat(loc.markers);
    });
    
    this.layer.clearLayers();
    this.markers.forEach(marker => this.layer.addLayer(marker));
    MapBase.updateTippy('natives');
  }

  static setMenuState(state) {
    this.context.classList.toggle('disabled', !state);
  }

  static set onMap(state) {
    if (state) {
      if (this.markers.length > 0) this.layer.addTo(MapBase.map);
    } else {
      this.layer.remove();
    }

    if (!MapBase.isPreviewMode) localStorage.setItem('rdo.natives', JSON.stringify(state));

    NativesCollection.locations.forEach((_loc) => {
      if (_loc.onMap) _loc.onMap = state;
    });

    MapBase.updateTippy('natives');
  }
  
  static get onMap() {
      const value = JSON.parse(localStorage.getItem('rdo.natives'));
      return value || value == null;
  }
}
