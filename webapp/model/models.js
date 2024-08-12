sap.ui.define([
	"../model/constants"
], function (constants) {
	"use strict";

	return {

		createConfig: function (sMode) {
			const oConfig = {
				busyCounter: 0,
				fromOutside: false
			};
			if (sMode) {
				oConfig.mode = sMode
			}
			return oConfig;
		},

		createTickets: function () {
			return [
				{
					KEY: "1",
					VALUE: "Талон № 1"
				},
				{
					KEY: "2",
					VALUE: "Талон № 2"
				},
				{
					KEY: "3",
					VALUE: "Талон № 3"
				}
			];
		},

		createOrgDialogConfig: function () {
			return {
				title: "",
				applyField: ""
			}
		},

		createDetailModel: function () {
			const dDate = new Date();

			return {
				BUKRS: "",
				BUKRS_TEXT: "",
				CNTRL_POINT: "",
				CNTRL_POINT_TEXT: "",
				COMM: "",
				COMM_CANCEL: "",
				CREATE_DATA: dDate,
				CR_USER: "",
				CR_USER_TEXT: "",
				DATA_CANCEL: "",
				DATA_OUT: dDate,
				EMPL: "",
				EMPL_TEXT: "",
				ID: "",
				KOKRS: "",
				KOKRS_TEXT: "",
				LOCAT: "",
				LOG_ID: "",
				NUM_TICK: "1",
				ORG_UNIT: "",
				ORG_UNIT_TEXT: "",
				POST: "",
				POST1: "",
				POST1_TEXT: "",
				POST_TEXT: "",
				REVISION_ID: "",
				REVISION_ID_TEXT: "",
				STAT_CANCEL: false,
				UUID: "",
				TAKME: ""
			};
		},

	};
});