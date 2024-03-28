import { GapiAPILoader } from './gapi-api-loader.js';
import { GapiAuthService } from './gapi-auth.service.js';
import { HeaderColumns } from '../constants/header-columns.constant.js'


export class GapiService {

    constructor() {
        this.onInit();
    }

    onInit() {
        this.loader = new GapiAPILoader();
        this.ready = this._apiLoader();
    }

    listSheets() {
        return gapi.client.sheets.spreadsheets
            .get({ spreadsheetId: '1c1sK-MHYcgF81omqHobdEh5Cr4t-qkGRgnl1EJN30-E' })
            .then((response) => response.result.sheets || [])
            .then((sheets) =>
                sheets.map((sheet) => ({
                    id: sheet.properties?.sheetId,
                    title: sheet.properties?.title,
                }
                ))
            );
    }

    getRows(sheet) {
        return gapi.client.sheets.spreadsheets
            .get({
                spreadsheetId: '1c1sK-MHYcgF81omqHobdEh5Cr4t-qkGRgnl1EJN30-E',
                ranges: [sheet],
                includeGridData: true,
            })
            .then((response) =>
                response.result.sheets[0].data[0].rowData
                    .reduce((acc, rowData) => [...acc, rowData], [])
                    .map((rowData) =>
                        rowData.values.map((value) => ({
                            value: value.formattedValue,
                        }))
                    )
            );
    }


    async updateCell(
        sheet,
        columnIndex,
        rowIndex,
        value
    ) {

        const range = `${sheet}!${this.indexToSpreadsheetColumn(columnIndex)}${rowIndex + 1}`;

        return await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: '1c1sK-MHYcgF81omqHobdEh5Cr4t-qkGRgnl1EJN30-E',
            range,
            valueInputOption: 'RAW',
            resource: {
                values: [[value]],
            }
        });
    }

    async updateCells(sheet, data) {
        console.log(data,'updateCells')
        return await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1c1sK-MHYcgF81omqHobdEh5Cr4t-qkGRgnl1EJN30-E',
            valueInputOption: "USER_ENTERED",
            data: data.map(([columnIndex, rowIndex, value]) => ({
                range: `${sheet}!${this.indexToSpreadsheetColumn(columnIndex)}${rowIndex + 1}`,
                values: [[value]],
            })),
        });
    }


    indexToSpreadsheetColumn(num) {
        let s = "";
        let t;

        num++;

        while (num > 0) {
            t = (num - 1) % 26;
            s = String.fromCharCode(65 + t) + s;
            num = ((num - t) / 26) | 0;
        }

        return s;
    }


    getRowsParams(sheet) {
        return new Promise((resolve, reject) => {
            let allRows;
            let headers;

            this.getRows(sheet).then((rows) => {
                const [headerRows, ...rest] = rows;
                headers = headerRows.map((row) =>
                    row.value,
                );

                allRows = rest
                    .map((row, index) => this.filterRows(index + 1, row, headers))
                    .filter(Boolean);

                resolve({ headers, allRows })
            });

        });
    }


    getRowsEmptyParams(sheet) {
        return new Promise((resolve, reject) => {
            let allRows;
            let headers;

            this.getRows(sheet).then((rows) => {
                const [headerRows, ...rest] = rows;
                headers = headerRows.map((row) =>
                    row.value,
                );

                allRows = rest
                    .map((row, index) => this.filterRowsEmpty(index + 1, row, headers))
                    .filter(Boolean);

                resolve({ headers, allRows })
            });

        });
    }

    filterRowsEmpty(rowIndex, row, headers) {
        const rows = (row.reduce(
            (task, cell, headerIndex) => ({
                ...task,
                [headers[headerIndex]]: cell.value,
            }),
            { rowIndex }
        ));

        if (rows[HeaderColumns.coordinates] && rows['Торговая точка (аптека)']) {
            return null;
        }

        return rows;
    }

    filterRows(rowIndex, row, headers) {
        const rows = (row.reduce(
            (task, cell, headerIndex) => ({
                ...task,
                [headers[headerIndex]]: cell.value,
            }),
            { rowIndex }
        ));
        return rows;
    }

    _apiLoader() {
        return new Promise((resolve, reject) => {
            this.loader.load().then(async (gapi) => {
                this.api = gapi;
                this.auth = new GapiAuthService();
                setTimeout(() => resolve(true), 2000);

            }).catch((error) => resolve(false));
        });
    }

};
