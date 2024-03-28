import { YaMapService } from '../js/modules/maps/services/ya-map.service.js';
import { GapiService } from '../js/modules/sheets/services/gapi.service.js';
import { MapState as state } from '../js/modules/maps/constants/map-state.constant.js'
import { MapOptions as options } from '../js/modules/maps/constants/map-options.constant.js';
import { MapConfig as config } from '../js/modules/maps/constants/map-config.constant.js';

let map;
let mapService;
let gapiService;

async function onInit() {
    onInitMap();
    onInitGap();
}

async function onInitMap() {
    const mapOptions = { state, options, config };
    mapService = new YaMapService('map', mapOptions);
    mapService.ready.then((yaMap) => {
        map = yaMap;
        document.querySelector('#map').setAttribute('load')
    });
}

function buildPoints(data) {
    return new Promise((resolve, reject) => {
        const geoObjects = new ymaps.GeoObjectCollection();

        const isCoordinates = IsCoord(data);
        const isEmptyCoordinates = isEmptyCoord(data);

        if (!!isCoordinates.length) {
            isCoordinates?.forEach((point) => geoObjects.add(buildPoint(point)));
            resolve(geoObjects);
        }

        !!isEmptyCoordinates.length && geocoding(isEmptyCoordinates);

    });
}

function geocoding(data) {

    console.log()
    const geo = mapService.geocoding.geocode(data, {});

    geo.then(
        (res) => {
            map.geoObjects.add(res.geoObjects);
            fitBounds();
            updateRows(res.geoObjects);
        },
        (err) => {
            console.log(err)
        }
    );
}


async function getEmptyRows() {

    const data = await updateTableRows();
    data?.forEach((tab) => {
        if (tab.length === 0) return;
        tab && gc(tab);
    });
}

function gc(data) {
    const geo = mapService.geocoding.geocode(data, {});

    geo.then(
        (res) => {
            updateRows(res.geoObjects);
        },
        (err) => {
            console.log(err)
        }
    );
}

window.getEmptyRows = getEmptyRows;

async function updateTableRows() {
    const data = await getSheets();
    const isEmpty = data
        .map(async (sheet) => isEmptyCoord({ ...await getRows(sheet), sheet }));
    return await Promise.all(isEmpty);
}


window.updateTableRows = updateTableRows;

function updateRows(data) {
    const sheet = data.get(0).properties.get('sheet');
    const pointsRow = buildUpdateRows(data);

    gapiService.updateCells(
        sheet,
        [...pointsRow]
    );
}

function buildUpdateRows(data) {
    return data.toArray()
        .map((point) => ([6, point.properties.get('rowIndex'), point.geometry.getCoordinates().toString()]));
}

function IsCoord(data) {
    return data?.allRows.filter(item => item['Координаты'])
}

function isEmptyCoord(data) {
    return data?.allRows
        .filter(item => !item['Координаты'])
        .map((point) => ({ address: point['Торговая точка (аптека)'], properties: { ...point, sheet: data.sheet } }));
}

function fitBounds() {
    const options = {
        checkZoomRange: false,
        useMapMargin: true,
        duration: 180,
    };

    map.setBounds(map.geoObjects.getBounds(), options);

}

function buildPoint(point) {
    return new ymaps.GeoObject({
        geometry: {
            type: "Point",
            coordinates: point['Координаты'].split(',').map(parseFloat)
        },
        properties: {
            ...point,
            balloonContentHeader: `<div>${point['Название аптечной сети']}</div><div>Скидка: ${point['% скидки']}%</div> <div>Адрес: ${point['Торговая точка (аптека)']}</div>`,
            balloonContentBody: `<div><a href="${point['Ссылка на штрихкод']}" target="_blank">Ссылка на штрихкод</a></div></div> <div><a href="${point['Ссылка на логотип']}" target="_blank">Ссылка на логотип</a></div>`,
        }
    });
}

function getSheets() {
    return gapiService.listSheets()
        .then((sheets) => sheets.map((sheet) => sheet.title));
}

async function buildRows() {
    const data = await getSheets();
    data?.forEach((sheet) => sheet && buildRow(sheet));
}

function buildRow(sheet) {
    getRows(sheet)
        .then((data) => {
            buildPoints({ ...data, sheet })
                .then((collection) => {
                    map.geoObjects.add(collection);
                    fitBounds();
                });
        });
}

function onInitGap() {
    gapiService = new GapiService();
    gapiService.ready.then(async () => {
        buildRows();
    });
}

window.buildRows = buildRows;

async function getRows(sheet) {
    return await gapiService.getRowsParams(sheet);
}


document.addEventListener('DOMContentLoaded', onInit);
