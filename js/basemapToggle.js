define([
    "dojo/_base/declare",
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
                container: "container",
                toggleButton: "toggleButton",
                basemapImage: "basemapImage",
                basemapTitle: "basemapTitle"
            };
        },
        // start widget. called by user
        startup: function() {
            var _self = this;
            // map not defined
            if (!_self.map) {
                _self.destroy();
                return new Error('map required');
            }
            // map domNode
            _self._mapNode = dom.byId(_self.map.id);
            // when map is loaded
            if (_self.map.loaded) {
                _self._init();
            } else {
                on(_self.map, "load", function() {
                    _self._init();
                });
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
            var _self = this;
            var basemaps = _self.get("basemaps");
            var nextBasemap = basemaps[0]
            if (this.get("basemap") === basemaps[0]) {
                nextBasemap = basemaps[1];
            }
            if(_self.map.getBasemap() !== nextBasemap){
                _self.map.setBasemap(nextBasemap);
                _self.set("basemap", nextBasemap);   
            }
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            var _self = this;
            _self._visible();
            _self.onLoad();
            var currentBasemap = _self.map.getBasemap();
            _self.set("basemaps", [
            currentBasemap, _self.get("alternateBasemap")]);
            _self.set("basemap", currentBasemap);
            _self._basemapChange();
            on(_self.map, "basemap-change", function() {
                _self._basemapChange();
            });
        },
        _basemapChange: function() {
            var _self = this;
            var basemaps = _self.get("basemaps");
            var currentBasemap = _self.get("basemap");
            var nextBasemap = basemaps[1];
            if (currentBasemap === basemaps[1]) {
                nextBasemap = basemaps[0];
            }
            _self._imgNode.innerHTML = '<img src="images/basemaps/' + nextBasemap + '.png" />';
            domClass.remove(_self._toggleNode, currentBasemap);
            domClass.add(_self._toggleNode, nextBasemap);
            _self._titleNode.innerHTML = nextBasemap;
        },
        _updateThemeWatch: function(attr, oldVal, newVal) {
            var _self = this;
            if (_self.get("loaded")) {
                domClass.remove(_self.domNode, oldVal);
                domClass.add(_self.domNode, newVal);
            }
        },
        _visible: function() {
            var _self = this;
            if (_self.get("visible")) {
                domStyle.set(_self.domNode, 'display', 'block');
            } else {
                domStyle.set(_self.domNode, 'display', 'none');
            }
        }
    });
});