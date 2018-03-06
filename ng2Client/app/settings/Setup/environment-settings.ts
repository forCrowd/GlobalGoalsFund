export class EnvironmentSettings {

    /**
     * Google Analytics domain name
     * Leave blank to disable analytics
     */
    static get analyticsDomainName(): string { return ""; }

    /**
     * Google Analytics tracking code (e.g. UA-XXXXXXXX-X)
     * Leave blank to disable analytics
     */
    static get analyticsTrackingCode(): string { return ""; }

    /**
     * Enables angular production mode
     */
    static get enableProdMode(): boolean { return false; }

    /**
     * Service application (Backbone WebAPI) url
     */
    static get serviceAppUrl(): string { return "https://api.backbone.forcrowd.org"; }

    /**
     * Service application (Backbone WebAPI) project ID: https://backbone.forcrowd.org/projects/9
     */
    static get projectId(): number { return 9 };
}
