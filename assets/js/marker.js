class Marker {
  constructor(text, lat, lng, category, subdata, size) {
    this.text = text;
    this.lat = lat;
    this.lng = lng;
    this.category = category;
    this.subdata = subdata;
    this.size = size;
    this.title = (() => {
      switch (category) {
        case 'singleplayer':
          return Language.get(`${this.category}.${this.text}.name`);
        case 'sightseeing':
          return Language.get('map.sightseeing.name') + (this.text === 'hidden' ? ' - ' + Language.get('map.sightseeing.hidden') : '');
        default:
          return this.text ? this.text : '';
      }
    })();
    this.description = (() => '')();
  }
  updateMarkerContent(removeFromMapCallback) {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>${this.title}</h1>
      <span class="marker-content-wrapper">
        <p>${this.description}</p>
      </span>
      <p></p>
      <button class="btn btn-info remove-button full-popup-width" data-text="map.remove"></button>
      <small>Text: ${this.text} / Latitude: ${this.lat} / Longitude: ${this.lng}</small>
    `;

    container.querySelector('button').addEventListener('click', removeFromMapCallback);
    if (!Settings.isDebugEnabled) container.querySelector('small').style.display = 'none';
    Language.translateDom(container);

    return container;
  }
}
