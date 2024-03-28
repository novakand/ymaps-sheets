ymaps.ready(init);

async function init() {
    var myMap = new ymaps.Map("map", {
        center: [37.749330, 54.300979],
        center: [60.159975, 78.762532],
       
        zoom: 10,
        controls: []
    }, {
        searchControlProvider: 'yandex#search'
    });
}