sap.ui.define([
	"../model/constants"
], function (constants) {
	"use strict";

	return {

		displayBusy: function (iBusyCounter) {
			return iBusyCounter > 0;
		},

		formatMark: function(vValue) {
			return !!vValue ? "sap-icon://accept" : "sap-icon://decline";
		},

		formatColor: function (vValue) {
			return vValue ? "Positive" : "Critical";
		},

		formattId: function (sId) {
			return sId == "0" ? "": sId;
		},

		formatUtcDate: function (sUtcDate) {
			const iTimestamp  = Date.parse(sUtcDate);
			if (isNaN(iTimestamp)) {
				return "";
			};

			const dDate = new Date(iTimestamp);

			const [sYear, sMonth, sDay] = dDate.toISOString().split('T')[0].split("-");
			return `${sDay}.${sMonth}.${sYear}`;
		},

		displayNotForView: function (sMode) {
			return sMode !== constants.MODES.VIEW;
		},

		formatDetailItem: function (oData) {
			oData.CREATE_DATA = this._convertData(oData.CREATE_DATA);
			oData.DATA_OUT = this._convertData(oData.DATA_OUT);
			oData.DATA_CANCEL = this._convertData(oData.DATA_CANCEL);
			return oData;
		},

		formatDetailItemForServer: function (oData) {
			oData.CREATE_DATA = this._convertDateToUTC(oData.CREATE_DATA);
			oData.DATA_OUT = this._convertDateToUTC(oData.DATA_OUT);
			oData.DATA_CANCEL = this._convertDateToUTC(oData.DATA_CANCEL);

			return oData;
		},

		_convertData: function (sDate) {
			const iTimestamp  = Date.parse(sDate);
			return isNaN(iTimestamp) ? "" : new Date(iTimestamp);
		},

		_convertDateToUTC: function (dDate) {
			if (!dDate) {
				return constants.EMPTY_DATE;
			};

			const iOffset = dDate.getTimezoneOffset()
			const dNewDate = new Date(dDate.getTime() - (iOffset * 60 * 1000));
			return dNewDate.toISOString().split('T')[0];
		}

	};
});