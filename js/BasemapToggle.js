define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dojo/on",
    // load template
    "dojo/text!./templates/BasemapToggle.html",
    "dojo/i18n!./nls/BasemapToggle",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct"
],
function (
    Evented,
    declare,
    lang,
    _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    dom, domClass, domStyle, domConstruct
) {
    var basePath = require.toUrl("esri/dijit");
    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        declaredClass: "esri.dijit.BasemapToggle",
        templateString: dijitTemplate,
        options: {
            theme: "BasemapToggle",
            map: null,
            visible: true,
            basemap: "hybrid",
            basemaps: [{
                name: "streets",
                label: i18n.basemapLabels.streets,
                url: basePath + "/images/streets.png"
            }, {
                name: "satellite",
                label: i18n.basemapLabels.satellite,
                url: basePath + "/images/satellite.png"
            }, {
                name: "hybrid",
                label: i18n.basemapLabels.hybrid,
                url: basePath + "/images/hybrid.png"
            }, {
                name: "topo",
                label: i18n.basemapLabels.topo,
                url: basePath + "/images/topo.png"
            }, {
                name: "gray",
                label: i18n.basemapLabels.gray,
                url: basePath + "/images/gray.png"
            }, {
                name: "oceans",
                label: i18n.basemapLabels.oceans,
                url: basePath + "/images/oceans.png"
            }, {
                name: "national-geographic",
                label: i18n.basemapLabels['national-geographic'],
                url: basePath + "/images/national-geographic.png"
            }, {
                name: "osm",
                label: i18n.basemapLabels.osm,
                url: basePath + "/images/osm.png"
            }]
        },
        // lifecycle: 1
        constructor: function(options, srcRefNode) {
            // mix in settings and defaults
            declare.safeMixin(this.options, options);
            // widget node
            this.domNode = srcRefNode;
            this._i18n = i18n;
            // properties
            this.set("map", this.options.map);
            this.set("theme", this.options.theme);
            this.set("visible", this.options.visible);
            this.set("basemaps", this.options.basemaps);
            this.set("basemap", this.options.basemap);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            // classes
            this._css = {
                container: "basemapCon",
                toggleButton: "toggleButton",
                basemapImage: "basemapImage",
                basemapTitle: "basemapTitle"
            };
        },
        // start widget. called by user
        startup: function() {
            // map not defined
            if (!this.map) {
                this.destroy();
                console.log('map required');
            }
            // when map is loaded
            if (this.map.loaded) {
                this._init();
            } else {
                on(this.map, "load", lang.hitch(this, function() {
                    this._init();
                }));
            }
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function() {
            this.inherited(arguments);
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        // toggle
        /* ---------------- */
        /* Public Functions */
        /* ---------------- */
        show: function() {
            this.set("visible", true);
        },
        hide: function() {
            this.set("visible", false);
        },
        toggle: function() {
            var currentBasemap = this.map.getBasemap();
            var basemap = this.get("basemap");
            this.map.setBasemap(basemap);
            this.set("basemap", currentBasemap);
            this.emit("toggle", {});
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            this._visible();
            this.set("loaded", true);
            this.emit("load", {});
            this._basemapChange();
            on(this.map, "basemap-change", lang.hitch(this, function() {
                this._basemapChange();
            }));
        },
        _getBasemapInfo: function(basemap) {
            var basemaps = this.get("basemaps");
            if (basemaps && basemaps.length) {
                for (var i = 0; i < basemaps.length; i++) {
                    if (basemaps[i].name === basemap) {
                        return basemaps[i];
                    }
                }
                return basemaps[0];
            }
        },
        _basemapChange: function() {
            var currentBasemap = this.map.getBasemap();
            var basemap = this.get("basemap");
            var info = this._getBasemapInfo(basemap);
            var html = '';
            html += '<div class="' + this._css.basemapImage + '"><img alt="' + info.label + '" src="' + info.url + '" /></div>';
            html += '<div class="' + this._css.basemapTitle + '">' + info.label + '</div>';
            domClass.remove(this._toggleNode, currentBasemap);
            domClass.add(this._toggleNode, basemap);
            domConstruct.empty(this._toggleNode);
            domConstruct.place(html, this._toggleNode, 'only');
        },
        _updateThemeWatch: function(attr, oldVal, newVal) {
            if (this.get("loaded")) {
                domClass.remove(this.domNode, oldVal);
                domClass.add(this.domNode, newVal);
            }
        },
        _visible: function() {
            if (this.get("visible")) {
                domStyle.set(this.domNode, 'display', 'block');
            } else {
                domStyle.set(this.domNode, 'display', 'none');
            }
        }
    });
});