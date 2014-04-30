define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has",
    "esri/kernel",
    "dijit/_WidgetBase",
    "dijit/a11yclick",
    "dijit/_TemplatedMixin",
    "dojo/on",
    // load template
    "dojo/text!./dijit/templates/BasemapToggle.html",
    "dojo/i18n!./nls/jsapi",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct"
],
function (
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, a11yclick, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    domClass, domStyle, domConstruct
) {
    var basePath = require.toUrl("esri/dijit");
    var Widget = declare([_WidgetBase, _TemplatedMixin, Evented], {
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
                    url: basePath + "/images/basemaps/streets.jpg"
                }, 
                "satellite": {
                    label: i18n.widgets.basemapToggle.basemapLabels.satellite,
                    url: basePath + "/images/basemaps/satellite.jpg"
                }, 
                "hybrid": {
                    label: i18n.widgets.basemapToggle.basemapLabels.hybrid,
                    url: basePath + "/images/basemaps/hybrid.jpg"
                }, 
                "topo": {
                    label: i18n.widgets.basemapToggle.basemapLabels.topo,
                    url: basePath + "/images/basemaps/topo.jpg"
                }, 
                "gray": {
                    label: i18n.widgets.basemapToggle.basemapLabels.gray,
                    url: basePath + "/images/basemaps/gray.jpg"
                }, 
                "oceans": {
                    label: i18n.widgets.basemapToggle.basemapLabels.oceans,
                    url: basePath + "/images/basemaps/oceans.jpg"
                }, 
                "national-geographic": {
                    label: i18n.widgets.basemapToggle.basemapLabels['national-geographic'],
                    url: basePath + "/images/basemaps/national-geographic.jpg"
                }, 
                "osm": {
                    label: i18n.widgets.basemapToggle.basemapLabels.osm,
                    url: basePath + "/images/basemaps/osm.jpg"
                }
            }
        },
        // lifecycle: 1
        constructor: function(options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // widget node
            this.domNode = srcRefNode;
            this._i18n = i18n;
            // properties
            this.set("map", defaults.map);
            this.set("theme", defaults.theme);
            this.set("visible", defaults.visible);
            this.set("basemaps", defaults.basemaps);
            this.set("basemap", defaults.basemap);
            this.set("defaultBasemap", defaults.defaultBasemap);
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
        postCreate: function() {
            this.inherited(arguments);
            this.own(
                on(this._toggleNode, a11yclick, lang.hitch(this, this.toggle))
            );
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
                on.once(this.map, "load", lang.hitch(this, function() {
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
            var toggleEvt = {
                previousBasemap: currentBasemap,
                currentBasemap: basemap
            };
            if(currentBasemap !== basemap){
                this.map.setBasemap(basemap);
                this.set("basemap", currentBasemap);
                this._basemapChange();
            }
            else{
                toggleEvt.error = new Error("BasemapToggle::Current basemap is same as new basemap");
            }
            this.emit("toggle", toggleEvt);
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            this._visible();
            this._basemapChange();
            this.own(on(this.map, "basemap-change", lang.hitch(this, function() {
                this._basemapChange();
            })));
            this.set("loaded", true);
            this.emit("load", {});
        },
        _getBasemapInfo: function(basemap) {
            var basemaps = this.get("basemaps");
            if (basemaps && basemaps.hasOwnProperty(basemap) ) {
                return basemaps[basemap];
            }
        },
        _updateImage: function(){
            var basemap = this.get("basemap");
            var info = this._getBasemapInfo(basemap);
            var imageUrl = info.url;
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