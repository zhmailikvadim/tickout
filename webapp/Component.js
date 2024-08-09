sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/SimpleType"
], function (UIComponent, SimpleType) {
	"use strict";

	SimpleType.extend("by.mda.bn.ehstick_out.type.keyValue", {
		parseValue: function (vValue, sType) {
			return vValue;
		},

		formatValue: function (vValue, sType) {
			if (vValue) return vValue.VALUE ? vValue.VALUE : vValue.KEY;
		},

		validateValue: function (vValue, sType) {
			return vValue && vValue.KEY && vValue.VALUE;
		}
	});

	sap.ui.loader.config({
		paths: {
		  "by/mda/bn/z_ehs_library_1": "/sap/bc/ui5_ui5/sap/z_ehs_library_1"
		}
	});

	return UIComponent.extend("by.mda.bn.ehstick_out.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			sap.ui.getCore().getConfiguration().setLanguage("ru");

			this.getRouter().initialize();
		}
	});

});