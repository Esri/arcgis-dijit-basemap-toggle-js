define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dojo/on",
    // load template
    "dojo/text!./templates/basemapToggle.html",
    "dojo/i18n!./nls/basemapToggle",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-construct"
],
function (
    declare,
    lang,
    _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    dom, domClass, domStyle, domAttr, domConstruct
) {
    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        declaredClass: "modules.basemapToggle",
        templateString: dijitTemplate,
        options: {
            theme: "basemapToggle",
            map: null,
            visible: true,
            alternateBasemap: "hybrid"
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
            this.set("alternateBasemap", this.options.alternateBasemap);
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
                return new Error('map required');
            }
            // map domNode
            this._mapNode = dom.byId(this.map.id);
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
        onLoad: function() {
            this.set("loaded", true);
        },
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
            var basemaps = this.get("basemaps");
            var nextBasemap = basemaps[0]
            if (this.get("basemap") === basemaps[0]) {
                nextBasemap = basemaps[1];
            }
            if(this.map.getBasemap() !== nextBasemap){
                this.map.setBasemap(nextBasemap);
                this.set("basemap", nextBasemap);   
            }
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            this._visible();
            this.onLoad();
            var currentBasemap = this.map.getBasemap();
            this.set("basemaps", [
            currentBasemap, this.get("alternateBasemap")]);
            this.set("basemap", currentBasemap);
            this._basemapChange();
            on(this.map, "basemap-change", lang.hitch(this, function() {
                this._basemapChange();
            }));
        },
        _basemapChange: function() {
            var basemaps = this.get("basemaps");
            var currentBasemap = this.get("basemap");
            var nextBasemap = basemaps[1];
            if (currentBasemap === basemaps[1]) {
                nextBasemap = basemaps[0];
            }
            this._imgNode.innerHTML = '<img src="images/basemaps/' + nextBasemap + '.png" />';
            domClass.remove(this._toggleNode, currentBasemap);
            domClass.add(this._toggleNode, nextBasemap);
            this._titleNode.innerHTML = nextBasemap;
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