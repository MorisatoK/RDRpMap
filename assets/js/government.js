class Government {
  static init() {
    this.locations = [];
    this.quickParams = [];
    this.context = document.querySelector('.menu-hidden[data-type=government]');

    return Loader.promises['government'].consumeJson(data => {
      data.forEach(item => {
        this.locations.push(new Government(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Government] Loaded!', 'color: #bada55; background: #242424');
      Menu.reorderMenu(this.context);
    });
  }

  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.layer = L.layerGroup();

    this.onLanguageChanged();

    this.element = document.createElement('div');
    this.element.classList.add('collectible-wrapper');
    Object.assign(this.element.dataset, { help: 'item', type: this.key, tippyContent: Language.get(`map.government.${this.key}.name`) });
    this.element.innerHTML = `
      <img class="collectible-icon" src="./assets/images/icons/${this.icon ? this.icon : this.key}.png">
      <span class="collectible-text ${!this.onMap ? 'disabled' : ''}">
        <p class="collectible" data-text="map.government.${this.key}.name"></p>
      </span>
    `;
    this.element.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.element);

    Government.context.appendChild(this.element);

    if (this.onMap)
      this.layer.addTo(MapBase.map);
  }

  onLanguageChanged() {
    this.markers = [];
    this.locations.forEach(item => this.markers.push(new Marker(item.text, item.x, item.y, 'government', this.key)));

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
              <span class="pin-icon-only__ico" style="background-image:url('assets/images/icons/${this.icon ? this.icon : this.key}.png')" aria-hidden="true"></span>
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

  set onMap(state) {
    if (state) {
      this.layer.addTo(MapBase.map);
      this.element.querySelector('span').classList.remove('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.setItem(`rdrp.${this.key}`, 'true');
    } else {
      this.layer.remove();
      this.element.querySelector('span').classList.add('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.setItem(`rdrp.${this.key}`, 'false');
    }
    MapBase.updateTippy('government');
  }
  get onMap() {
    const value = localStorage.getItem(`rdrp.${this.key}`);
    if (value === 'false') return false;
    if (value === null && !MapBase.isPreviewMode) localStorage.setItem(`rdrp.${this.key}`, 'true');
    return true;
  }

  static onLanguageChanged() {
    Government.locations.forEach(infra => infra.onLanguageChanged());
    Menu.reorderMenu(this.context);
  }

  static onSettingsChanged() {
    Government.locations.forEach(infra => infra.reinitMarker());
  }
}
