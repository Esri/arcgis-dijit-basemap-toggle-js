define([
    "require",
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
    "dojo/text!application/dijit/templates/BasemapToggle.html",
    "dojo/i18n!application/nls/jsapi",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "esri/basemaps"
],
function (
    require,
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, a11yclick, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    domClass, domStyle, domConstruct, esriBasemaps
) {
    var Widget = declare("esri.dijit.BasemapToggle", [_WidgetBase, _TemplatedMixin, Evented], {
        templateString: dijitTemplate,
        options: {
            theme: "BasemapToggle",
            map: null,
            visible: true,
            basemap: "hybrid",
            defaultBasemap: "streets",
            basemaps: esriBasemaps
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
                basemapImageContainer: "basemapImageContainer",
                basemapImageBG: "basemapBG",
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
                console.log("BasemapToggle::map required");
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
            var imageUrl = info.thumbnailUrl;
            var html = "";
            html += "<div class=\"" + this._css.basemapImageContainer + "\">";
            html += "<div class=\"" + this._css.basemapImage + "\"><div class=\"" + this._css.basemapImageBG + "\" style=\"background-image:url(" + imageUrl + ")\" title=\"" + info.title + "\"></div></div>";
            html += "<div title=\"" + info.title + "\" class=\"" + this._css.basemapTitle + "\">" + info.title + "</div>";
            html += "<div>";
            domConstruct.empty(this._toggleNode);
            domConstruct.place(html, this._toggleNode, "only");
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
                domStyle.set(this.domNode, "display", "block");
            } else {
                domStyle.set(this.domNode, "display", "none");
            }
        }
    });
    if (has("extend-esri")) {
        lang.setObject("dijit.BasemapToggle", Widget, esriNS);
    }
    return Widget;
});