export class YaGeocodingService {

    constructor() { }

    geocode(requests, options) {

        if (requests.length === 0) return;
        let size = requests.length;
        let result = [];
        let geoObjects = new ymaps.GeoObjectCollection();

        return new Promise((resolve, reject) => {
            requests.forEach((request, index) => {
                ymaps.geocode(request?.address, ymaps.util.extend({}, {}, options))
                    .then(
                        (response) => {
                            let geoObject = response.geoObjects.get(0);

                            if (!geoObject) {
                                geoObject = new ymaps.GeoObject({
                                    geometry: {
                                        type: "Point",
                                        coordinates: [0, 0]
                                    },
                                    properties: {}
                                })
                            }

                            geoObject.properties.set({
                                ...request,
                                ...request.properties

                            })

                            geoObject && (result[index] = geoObject);

                            --size || (result.forEach(geoObjects.add, geoObjects), resolve({ geoObjects: geoObjects }));
                        },
                        (err) => {
                            console.log(err, 'err')
                            reject(err);
                        }
                    );
            });
        });

    }


}