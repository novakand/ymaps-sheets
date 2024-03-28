export class YaGeocodingService {

    constructor() {

    }

    geocode(requests, options) {
        let size = requests.length;
        let result = [];
        let geoObjects = new ymaps.GeoObjectCollection();

        return new Promise((resolve, reject) => {
            requests.forEach((request, index) => {
                ymaps.geocode(request?.address, ymaps.util.extend({}, {}, options))
                    .then(
                        (response) => {
                            var geoObject = response.geoObjects.get(0);

                            geoObject.properties.set({
                                ...request,
                                ...request.properties

                            })
                            console.log(geoObject, 'geoObject')

                            geoObject && (result[index] = geoObject);

                            --size || (result.forEach(geoObjects.add, geoObjects), resolve({ geoObjects: geoObjects }));
                        },
                        (err) => {
                            reject(err);
                        }
                    );
            });
        });

    }


}