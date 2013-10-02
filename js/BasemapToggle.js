define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has",
    "esri/kernel",
    "dijit/_WidgetBase",
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dojo/on",
    // load template
    "dojo/text!zesri/dijit/templates/BasemapToggle.html",
    "dojo/i18n!zesri/nls/jsapi",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "esri/geometry/webMercatorUtils"
],
function (
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    domClass, domStyle, domConstruct,
    webMercatorUtils
) {
    var basePath = require.toUrl("esri/dijit");
    var Widget = declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin, Evented], {
        declaredClass: "esri.dijit.BasemapToggle",
        templateString: dijitTemplate,
        options: {
            theme: "BasemapToggle",
            map: null,
            visible: true,
            basemap: "hybrid",
            defaultBasemap: "streets",
            basemaps: {
                "streets": {
                    label: i18n.widgets.basemapToggle.basemapLabels.streets,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/streets.jpg"
                }, 
                "satellite": {
                    label: i18n.widgets.basemapToggle.basemapLabels.satellite,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/satellite.jpg"
                }, 
                "hybrid": {
                    label: i18n.widgets.basemapToggle.basemapLabels.hybrid,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/hybrid.jpg"
                }, 
                "topo": {
                    label: i18n.widgets.basemapToggle.basemapLabels.topo,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/topo.jpg"
                }, 
                "gray": {
                    label: i18n.widgets.basemapToggle.basemapLabels.gray,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/gray.jpg"
                }, 
                "oceans": {
                    label: i18n.widgets.basemapToggle.basemapLabels.oceans,
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/oceans.jpg"
                }, 
                "national-geographic": {
                    label: i18n.widgets.basemapToggle.basemapLabels['national-geographic'],
                    tileUrl: location.protocol + '//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
                    url: basePath + "/images/basemaps/national-geographic.jpg"
                }, 
                "osm": {
                    label: i18n.widgets.basemapToggle.basemapLabels.osm,
                    tileUrl: location.protocol + '//c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    url: basePath + "/images/basemaps/osm.jpg"
                }
            }
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
            this.set("defaultBasemap", this.options.defaultBasemap);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            // classes
            this._css = {
                container: "basemapContainer",
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
                console.log('BasemapToggle::map required');
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
            var bm = this.map.getBasemap();
            if(bm){
                this.set("defaultBasemap", bm);
            }
            var currentBasemap = this.get("defaultBasemap");
            var basemap = this.get("basemap");
            if(currentBasemap !== basemap){
                this.map.setBasemap(basemap);
                this.set("basemap", currentBasemap);
                this._basemapChange();
                this.emit("toggle", {
                    previousBasemap: currentBasemap,
                    currentBasemap: basemap
                });
            }
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            this._visible();
            this._basemapChange();
            on(this.map, "basemap-change", lang.hitch(this, function() {
                this._basemapChange();
            }));
            on(this.map, "extent-change", lang.hitch(this, function() {
                this._updateImage();
            }));
            this.set("loaded", true);
            this.emit("load", {});
        },
        _getBasemapInfo: function(basemap) {
            var basemaps = this.get("basemaps");
            if (basemaps && basemaps.hasOwnProperty(basemap) ) {
                return basemaps[basemap];
            }
        },
        _pointToTile: function(point, tileInfo, currentLevel) {
            //console.log(point,tileInfo,currentLevel);
            var tileWidth = tileInfo.width * tileInfo.lods[currentLevel].resolution;
            var tileHeight = tileInfo.height * tileInfo.lods[currentLevel].resolution;
            var column = Math.floor((point.x - tileInfo.origin.x) / tileWidth);
            var row = Math.floor((tileInfo.origin.y - point.y) / tileHeight);
            return {'z':currentLevel, 'y':row, 'x':column};
        },
        _updateImage: function(){
            var basemap = this.get("basemap");
            var info = this._getBasemapInfo(basemap);
            var imageUrl = info.url;
            if(info.tileUrl){
                var center = this.map.extent.getCenter();
                var tileInfo = this.map.__tileInfo;
                var tile = this._pointToTile(center, tileInfo, this.map.getLevel());
                var imageUrl = lang.replace(info.tileUrl, {
                     z: tile.z,
                     y: tile.y,
                     x: tile.x
                });
            }
            var html = '';
            html += '<div class="' + this._css.basemapImage + '"><img alt="' + info.label + '" src="' + imageUrl + '" /></div>';
            html += '<div class="' + this._css.basemapTitle + '">' + info.label + '</div>';
            domConstruct.empty(this._toggleNode);
            domConstruct.place(html, this._toggleNode, 'only');
        },
        _basemapChange: function() {
            var bm = this.map.getBasemap();
            if(bm){
                this.set("defaultBasemap", bm);
            }
            var currentBasemap = this.get("defaultBasemap");
            var basemap = this.get("basemap");
            this._updateImage();
            domClass.remove(this._toggleNode, currentBasemap);
            domClass.add(this._toggleNode, basemap);
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
    if (has("extend-esri")) {
        lang.setObject("dijit.BasemapToggle", Widget, esriNS);
    }
    return Widget;
});