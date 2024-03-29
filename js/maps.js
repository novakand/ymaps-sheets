import { YaMapService } from '../js/modules/maps/services/ya-map.service.js';
import { GapiService } from '../js/modules/sheets/services/gapi.service.js';
import { MapState as state } from '../js/modules/maps/constants/map-state.constant.js'
import { MapOptions as options } from '../js/modules/maps/constants/map-options.constant.js';
import { MapConfig as config } from '../js/modules/maps/constants/map-config.constant.js';
import { HeaderColumns } from '../js/modules/sheets/constants/header-columns.constant.js'

let map;
let mapService;
let gapiService;

async function onInit() {
    onPreloader(false)
    onInitMap();
    onInitGap();
}

async function onInitMap() {
    const isMobile = getDeviceMobile();
    const mapOptions = { state, options: { ...(isMobile ? { balloonPanelMaxMapArea: Infinity, ...options } : options) }, config };
    mapService = new YaMapService('map', mapOptions);
    mapService.ready.then((yaMap) => {
        map = yaMap;
        document.querySelector('#map').setAttribute('data-load', true);
        onPreloader(true);
    });
}

function onInitGap() {
    gapiService = new GapiService();
    gapiService.ready.then(async () => {
        buildRows();
    });
}

function onPreloader(isShow) {
    const preloader = document.querySelector('.mdc-linear-progress');
    delay(3000).then(() => isShow ? preloader.style.width = '100%' : preloader.style.width = '0');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDeviceMobile() {
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
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

    const geo = mapService.geocoding.geocode(data, {});

    geo.then(
        (responce) => {
            map.geoObjects.add(responce.geoObjects);
            fitBounds();
            updateRows(responce.geoObjects);
        },
        (error) => {
            console.log(error);
        }
    );
}

async function getEmptyRows() {

    const data = await updateTableRows();
    data?.forEach((sheets) => {
        if (sheets.length === 0) return;
        sheets && updateGeocoding(sheets);
    });
}

function updateGeocoding(data) {
    const geo = mapService.geocoding.geocode(data, {});

    geo.then(
        (responce) => {
            updateRows(responce.geoObjects);
        },
        (error) => {
            console.log(error);
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
    return data?.allRows.filter(item => item[HeaderColumns.coordinates])
}

function isEmptyCoord(data) {
    return data?.allRows
        .filter(item => !item[HeaderColumns.coordinates])
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
            coordinates: point[HeaderColumns.coordinates]?.split(',')?.map(parseFloat)
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
    onPreloader(true);
    getRows(sheet)
        .then((data) => {
            buildPoints({ ...data, sheet })
                .then((collection) => {
                    map.geoObjects.add(collection);
                    fitBounds();
                    onPreloader(false);
                });
        });
}


window.buildRows = buildRows;

async function getRows(sheet) {
    return await gapiService.getRowsParams(sheet);
}


document.addEventListener('DOMContentLoaded', onInit);
