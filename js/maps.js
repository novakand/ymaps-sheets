import { YaMapService } from './modules/maps/services/ya-map.service.js';
import { GapiService } from './modules/sheets/services/gapi.service.js';
import { MapState as state } from './modules/maps/constants/map-state.constant.js'
import { MapOptions as options } from './modules/maps/constants/map-options.constant.js';
import { MapConfig as config } from './modules/maps/constants/map-config.constant.js';

let map;
let mapService;
let gapiService;

async function onInit() {
    onInitMap();
    onInitGap();
    console.log(gapiService, 'gapiService')
}

function onInitMap() {
    const mapOptions = { state, options, config };
    mapService = new YaMapService('map', mapOptions);
    mapService.ready.then((yaMap) => {
        console.log('mapready', mapService)
        map = yaMap;
    });
}


function getColl(data) {
    return new Promise((resolve, reject) => {
        const geoObjects = new ymaps.GeoObjectCollection();
        data.allRows.forEach((item) => {
            console.log(item, 'item')
            geoObjects.add(new ymaps.GeoObject({
                geometry: {
                    type: "Point",
                    coordinates: item['Координаты'].split(',').map(parseFloat)
                },
                properties: {
                    ...item,
                    balloonContentHeader: `<div>Название аптечной сети ${item['Название аптечной сети']}</div><div>Торговая точка (аптека): ${item['Торговая точка (аптека)']}</div>`,
                    balloonContentBody: `<div><a href="${item['Ссылка на штрихкод']}" target="_blank">Ссылка на штрихкод</a></div></div> <div><a href="${item['Ссылка на логотип']}" target="_blank">Ссылка на логотип</a></div>`,
                }
            }));
        });

        resolve(geoObjects);
    })

}

function onInitGap() {
    gapiService = new GapiService();
    gapiService.ready.then(() => {



        gapiService.getRowsParams('Sheet1')
            .then((data) => {
                const res = [];
                console.log(data, 'data')
                //const geoObjects = new ymaps.GeoObjectCollection();




                getColl(data).then((objs) => {

                    console.log(objs, 'objs')
                    map.geoObjects.add(objs);
                });

            });
       

    });
}

async function update(d) {


    const data = await testUpdate(d);

    console.log(data, 'data')

    gapiService.updateCells(
        'Sheet1',
        [...data]
    );

}

function testUpdate(data) {
    const result = [];
    return new Promise((resolve, reject) => {
        data.each(async (reg) => {


            console.log(reg, 'OBJ')
            if (reg.properties.get('rowIndex')) {
                result.push([6, reg.properties.get('rowIndex'), reg.geometry.getCoordinates().toString()])

            }
        });

        resolve(result);
    })
}


document.addEventListener('DOMContentLoaded', onInit);
