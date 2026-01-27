class Infrastructure {
  static init() {
    this.locations = [];
    this.quickParams = [];
    this.context = document.querySelector('.menu-hidden[data-type=infrastructure]');

    return Loader.promises['infrastructure'].consumeJson(data => {
      data.forEach(item => {
        this.locations.push(new Infrastructure(item));
        this.quickParams.push(item.key);
      });
      console.info('%c[Infrastructure] Loaded!', 'color: #bada55; background: #242424');
      Menu.reorderMenu(this.context);
    });
  }

  constructor(preliminary) {
    Object.assign(this, preliminary);

    this.layer = L.layerGroup();

    this.onLanguageChanged();

    this.element = document.createElement('div');
    this.element.classList.add('collectible-wrapper');
    Object.assign(this.element.dataset, { help: 'item', type: this.key, tippyContent: Language.get(`map.infrastructure.${this.key}.name`) });
    this.element.innerHTML = `
      <img class="collectible-icon" src="./assets/images/icons/${this.icon ? this.icon : this.key}.png">
      <span class="collectible-text ${!this.onMap ? 'disabled' : ''}">
        <p class="collectible" data-text="map.infrastructure.${this.key}.name"></p>
      </span>
    `;
    this.element.addEventListener('click', () => this.onMap = !this.onMap);
    Language.translateDom(this.element);

    Infrastructure.context.appendChild(this.element);

    if (this.onMap)
      this.layer.addTo(MapBase.map);
  }

  onLanguageChanged() {
    this.markers = [];
    this.locations.forEach((item) => {
      const marker = new Marker(item.text, item.x, item.y, 'infrastructure', this.key);
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
      this.element.querySelector('span').classList.remove('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.setItem(`rdo.${this.key}`, 'true');
    } else {
      this.layer.remove();
      this.element.querySelector('span').classList.add('disabled');
      if (!MapBase.isPreviewMode)
        localStorage.removeItem(`rdo.${this.key}`);
    }
    MapBase.updateTippy('infrastructure');
  }

  get onMap() {
    return !!localStorage.getItem(`rdo.${this.key}`);
  }

  static onLanguageChanged() {
    Infrastructure.locations.forEach(infra => infra.onLanguageChanged());
    Menu.reorderMenu(this.context);
  }

  static onSettingsChanged() {
    Infrastructure.locations.forEach(infra => infra.reinitMarker());
  }
}
