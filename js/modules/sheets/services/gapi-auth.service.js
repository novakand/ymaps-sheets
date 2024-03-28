import { JsenCryptAPILoader } from './jsen-crypt-api.loader.js';
import { CryptoAPILoader } from './crypto-api-loader.js';

export class GapiAuthService {

    constructor() {
        this._jsenLoader = new JsenCryptAPILoader();
        this._cryptoLoader = new CryptoAPILoader();
        this.onInit();
    }

    async onInit() {
        this._importLib();
        this._onLoadClient();
    }

    async _onInitGapiClient() {

        const API_KEY = 'AIzaSyDl350J8sBphuaftwR09t-GYXTv-JFLR2s';
        const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],

        });
        this.token = await this._getAuthToken();
      
        gapi.client.setToken(this.token);
    }

    _getAuthToken() {

        const private_key = "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDMCyYu6ElUSu5m\nevE73XcLDecPtvXBUZC7kxRglIXUvE3JkOYsBl0Cb2/b5BlTQz4/5hAh3LhIfmRH\nt9tJNLMY56ThggeRCcTZZgzkE9LeadJhO5EE4sa3e7SuNVpncjAl0eSrI76ioeTU\nt+y6zsUnyF3wQpdeAIRQbG7A/5bGYhwvLT8Q7FpCsKi4Tz2ne9ZIcQ4UW/ZdKEV4\ngBi+765bNP1A0cjujVePDiXJ8k6WOgOCgltrhUmOMoOkMrQGY8h1uf/zuQnNdbH9\nX/gY7wkqfGnYqOM4cfW3vB257tPxdXB9k1vm4wrKWqdfKvYLffrcheYOksw1VhGK\nSBhQlPTvAgMBAAECggEAFsUZvjtSz5LLFumaWQ1mVvf2tJS8yRWCmsQXjo2Uf8CB\nx8AhR4FwSLDJ4VaLkvSakkPowfahJAniw/QbBwjYAav8BORfVsqpyn7ualdh/Ur+\n3LXqgYqTFW+7IoO2snuWLupE4+pJwFljsW9S/ifL7ZwZC5JK1QUmvtjS5TvAhiPC\nscisx9oP3+G7rHwPKrYNBOilkPWIpFzxvpu2+CvUKS1dN36iFa5+UdP22Dkronsk\nP7JR/UE9PM2YSqNgeBTnheNL861ZkqHpCS+E8nAM6R0HFYLTyBMXiG0uBm9Wbe6v\n1DsQYibRPz6vgIH40Jc5GSXWNdsABmcW3VyxQ3K4QQKBgQDlDV3R/YiXB4uZWGoz\n1FSmqqcL6Z5ezxIn0WmXM22tXptz0midrrZzMVYK6v2hTpUBhKz5wRUA8ROWyHdy\ne9YQrIRUSxxyyOkZdWsLoy9rPWJr9JLAjmD363YYKy8ymYrHvsFgXDTZ5jMddpcv\ns26lGqte85ti3WUJ/Ey5BVScLwKBgQDkDJFKyeMmoE1HBd/Vw8dfZd1iSJhloDKj\n322KSEpIo6MGzV0f95bD3xDMZ0cCvHo5orvbdW9WvH1zFu83IQoHtPLjk/vg/7On\ndPKgVAo7k88hGnfJIM213VSVwGf8TwoDbO7E6SqCqGfHixnCBNHTpxzvUoKSuKug\nDNnehxdDQQKBgQDY6f+fjep8nLinUAPDcaF49MOdlHBWeONIshi9CAcl2CJ/XROV\nwI8oJ+DEFiZ7TF/wQCVPoHqzmZpjgRUdZgkjYT0wVrFqQrn9UiU9sByIAmnisosH\nr85E+seru7nGwYGcCBo5lxi2AjsF+/jRQ6vUz5zbHvhYeDHncvd1gIbQIQKBgQCM\nsPQyH7tz6RHD72vYhaBKyp16NS9QAzU6xGzgExlBFzNMzwXU4vqwfL3wXQcCOSVu\nyWb8TccSy9bZWhza9hcqCgiPPoz2kspTVWMaZr6pYtc2pQ2hmAtRV+sHOFzu3BRh\naKMl+HOxiBP+l2KcwDxzR3Yib9T+j8/SPhtrngxMAQKBgQCrFIMvEj53dCL3Q4ru\nWWTY6zuYinMwonZ7MS0qoGOXdsLGWC1O2odBvvcjFdFrBksC0L708Hrds0elpQdI\nefeW1IMrcWq+C+zkfFO8ZpT/ZZGKLULZpISWLzhdGo5mnS4cVlwQhQiqAqWvyZ82\nqRwgyC2gZzmVCntDqtl6MzE9TA==\n-----END PRIVATE KEY-----\n";
        const client_email = "notest@novakand.iam.gserviceaccount.com";
        const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

        const url = "https://www.googleapis.com/oauth2/v4/token";
        const header = { alg: "RS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);
        const claim = {
            iss: client_email,
            scope: scopes.join(" "),
            aud: url,
            exp: (now + 3600).toString(),
            iat: now.toString(),
        };
        const signature =
            btoa(JSON.stringify(header)) + "." + btoa(JSON.stringify(claim));
        const sign = new JSEncrypt();
        sign.setPrivateKey(private_key);
        const jwt =
            signature + "." + sign.sign(signature, CryptoJS.SHA256, "sha256");
        const params = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                assertion: jwt,
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            }),
        };

        const obj = fetch(url, params)
            .then((res) => res.json())
            .catch((err) => console.log(err));

        return obj;
    }

    async _importLib() {
        await this._jsenLoader.load();
        await this._cryptoLoader.load();
    }

    async _onLoadClient() {
        gapi.load('client', await this._onInitGapiClient.bind(this));
    }

}