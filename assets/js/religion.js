class Religion {
  static init() {
    this.locations = [];
    this.quickParams = [];
    this.context = document.querySelector('.menu-hidden[data-type=religion]');

    return Loader.promises['religion'].consumeJson(data => {
      data.forEach(item => {
        this.locations.push(new Religion(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Religion] Loaded!', 'color: #bada55; background: #242424');
    });
  }

  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.layer = L.layerGroup();

    this.onLanguageChanged();

    this.element = document.querySelector(`.menu-option[data-type="religion"]`);
    this.element.classList.toggle('disabled', !this.onMap);
    this.element.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.element);

    if (this.onMap)
      this.layer.addTo(MapBase.map);
}

  onLanguageChanged() {
    this.markers = [];
    this.locations.forEach((item) => {
      const marker = new Marker(item.text, item.x, item.y, 'religion', this.key);
      marker.icon = item.icon;
      this.markers.push(marker);
    });

    this.reinitMarker();
  }

  reinitMarker() {
    this.layer.clearLayers();
    this.markers.forEach(
      marker => {
        const boxPx = 35 * Settings.markerSize;
        var tempMarker = L.marker([marker.lat, marker.lng], {
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

        this.layer.addLayer(tempMarker);
        if (Settings.isMarkerClusterEnabled)
          Layers.oms.addMarker(tempMarker);
      }
    );
  }

  getMarkerIcon(marker) {
    return marker.icon || this.icon || this.key;
  }

  set onMap(state) {
    if (state) {
      this.layer.addTo(MapBase.map);
      this.element.classList.remove('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.setItem(`rdo.religion`, 'true');
    } else {
      this.layer.remove();
      this.element.classList.add('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.setItem(`rdo.religion`, 'false');
    }
    MapBase.updateTippy('religion');
  }

  get onMap() {
    const value = JSON.parse(localStorage.getItem(`rdo.religion`));
    return value || (value == null && !this.disabled);
  }

  static onLanguageChanged() {
    Religion.locations.forEach(rel => rel.onLanguageChanged());
  }

  static onSettingsChanged() {
    Religion.locations.forEach(rel => rel.reinitMarker());
  }
}
