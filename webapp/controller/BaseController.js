sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"../model/constants"
], function (Controller, MessageToast, MessageBox, constants) {
	"use strict";

	return Controller.extend("by.mda.bn.ehstick_out.controller.BaseController", {

		onInit: function () {
			this._oRouter = this.getRouter();
			this._oBundle = this.getResourceBundle();
		},

		parseList: function (vData) {
			if (vData === "[]") {
				return [];
			};
			return JSON.parse(vData);
		},

		parseItem: function (vData, sError = this.getText("errorLoadItem")) {
			const aData = this.parseList(vData);
			if (!aData.length) {
				throw new Error(sError);
			}
			const oItem = aData[0];
			return oItem;
		},

		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},

		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getText: function (sKey, aParams = []) {
			return this._oBundle.getText(sKey, aParams);
		},

		setModel: function (oModel, sModelName) {
			this.getView().setModel(oModel, sModelName);
		},

		getModel: function (sModelName) {
			return this.getView().getModel(sModelName);
		},

		getModelData: function (sModelName) {
			return this.getView().getModel(sModelName)?.getData();
		},

		showMessage: function (sKey, aParams = []) {
			MessageToast.show(this._oBundle.getText(sKey, [...aParams]));
		},

		getModelProperty: function(sModel, sProperty) {
			return this.getView().getModel(sModel).getProperty(sProperty);
		},

		setModelProperty: function(sModel, sProperty, oData) {
			this.getView().getModel(sModel).setProperty(sProperty, oData);
		},

		getFragmentPrefix: function () {
			return "by.mda.bn.ehstick_out.fragment";
		},

		setModelWithLimit: function(oJSONModel, sModelName) {
			oJSONModel.setSizeLimit(10000);
			this.setModel(oJSONModel, sModelName);			
		},

		showAndLogParsedError: function (sFallbackKey, oError) {
			let sMessage;
			if (oError) {
				console.error(oError && oError.message);
			}
			try {
				const vErrorBody = this.parseList(oError.message);
				const sErrorMessage = vErrorBody[0]?.VALUE;
				sMessage = this.getText("errorBaseText", [sErrorMessage]);
				MessageBox.error(sMessage);
			} catch (oCatchedError) {
				sMessage = `${this.getText(sFallbackKey)}: ${oError?.message}`;
				MessageBox.error(sMessage);
			}
		},

		showConfirmDialog: function(sMessage, sButtonAction) {
			return new Promise((resolve, reject) => {
				let bCompact = this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.confirm(
					sMessage, {
						actions: [sButtonAction, MessageBox.Action.CLOSE],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function(sAction) {
							if (sAction !== "CLOSE") {
								resolve();
							} else {
								reject();
							}
						}
					}
				);
			});
		},

		setBusy: function (bBusy) {
			const oConfigModel = this.getModel("configModel");
			const oConfigModelData = oConfigModel.getData();
			oConfigModelData.busyCounter = oConfigModelData.busyCounter + (bBusy ? 1 : -1);
			oConfigModel.refresh(true);
		},

		fetchDataWithoutBaseUrl: async function (sURL, sMethod = constants.HTTP_METHODS.GET, oOptions = {}) {
			let sToken = "";
			if (sMethod !== constants.HTTP_METHODS.GET) {
				sToken = await this._getToken();
			}
			return new Promise( (resolve, reject) => {
				if (sMethod !== constants.HTTP_METHODS.GET) {
					if (!oOptions.headers) {
						oOptions.headers = {};
					}
					oOptions.headers["x-csrf-token"] = sToken;
				}
				fetch(this._getSapClientParamForUrl(sURL), {
					...oOptions,
					method: sMethod
				}).then(oResponse => {
					if (!oResponse.ok) {
						return oResponse.text().then(oData => {
							reject(new Error(oData));
						})
					} else {
						return oResponse.text();					
					}
				}).then(aData => {
					resolve(aData);
				}).catch(oError => {
					reject(oError);
				})
			});
		},

		_getSapClientParamForUrl: function (sUrl) {
			if (!constants.SAP_CLIENT) {
				return sUrl;
			}
			const sSapClientParam = `sap-client=${constants.SAP_CLIENT}&sap-language=ru`;
			const sSapClientUrl = sUrl + (sUrl.includes("?") ? "&" : "?") + sSapClientParam;
			return sSapClientUrl;
		},

		_getToken: function () {
			const oHeader = {headers: {"x-csrf-token": "fetch"}}
			return new Promise((fnResolve, fnReject) => {
				fetch(this._getSapClientParamForUrl(`${constants.BASE_URL}`), {
					method: constants.HTTP_METHODS.GET,
					...oHeader
				}).then(oResponse => {
					fnResolve(oResponse.headers.get("x-csrf-token"));
				}).catch(oError => {
					fnReject(oError);
				})
			})
		},

		_getOptions: function (aData) {
			return {
				body: JSON.stringify(aData)
			}
		}
	});
});
