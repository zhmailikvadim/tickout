sap.ui.define([
	"by/mda/bn/ehstick_out/controller/BaseController",
	"./parts/ValueHelpParts",
	"sap/base/strings/formatMessage",
	"sap/base/util/deepExtend",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"../model/formatter",
	"../model/models",
	"../model/constants",
], function (Controller, ValueHelpParts, formatMessage, deepExtend, JSONModel, FilterOperator, Sorter, Filter, Fragment, History, MessageBox, formatter, models, constants) {
	"use strict";

	return Controller.extend("by.mda.bn.ehstick_out.controller.Detail", {

		...ValueHelpParts,

		formatter: formatter,

		onInit: function () {
			Controller.prototype.onInit.call(this, arguments);
			this._initControllerProperties();
			this._oRouter.getRoute("Detail").attachPatternMatched(this._onRouteMatched, this);
			this._initModels();
		},

		onSelectionOption: function (oEvent) {
			const sSelectedKey = oEvent.getSource().getSelectedKey();
			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			if (sSelectedKey === "optionD") {
				oDetailData.NUM_TICK = "";
			} else {
				oDetailData.NUM_TICK = "1";
			}

			oDetailModel.refresh(true);
		},

		onDataOutChange: function (oEvent) {
			const oDatePicker = oEvent.getSource();
			const dDateValue = oDatePicker.getDateValue();
			if (!dDateValue) {
				const oDetailModel = this.getModel("detail");
				const oDetailData = oDetailModel.getData();

				oDetailData.DATA_OUT = "";
				oDetailData.STAT_CANCEL = false;
				oDetailData.DATA_CANCEL = "";
				oDetailData.COMM_CANCEL = "";

				oDetailModel.refresh(true);
			};
		},

		_initModels: function () {
			this.setModel(new JSONModel(models.createConfig()), "configModel");
			this.setModel(new JSONModel(models.createTickets()), "tickets");
		},

		_initControllerProperties: function () {
			this.dialogs = {
				_oOrgDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.OrgDialog`, this),
				_oOrgUnitDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.OrgUnitDialog`, this),
				_oMonitorDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.MonitorDialog`, this),
				_oPointDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.PointsDialog`, this),
				_oJournalRecordDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.JournalRecordDialog`, this),
				_openPersonDialog: sap.ui.xmlfragment(`${this.getFragmentPrefix()}.PersonDialog`, this)
			};

			Object.values(this.dialogs).forEach(oDialog => {
				this.getView().addDependent(oDialog);
			});
		},

		_validateRouteParams: function (sMode, sId) {
			const aValidModes = Object.values(constants.MODES);

			if (!aValidModes.includes(sMode)) {
				this.showMessage("routeValidationInvalidMode");
				this._navBack();
				return;
			}

			if (sMode !== constants.MODES.CREATE && !sId) {
				this.showMessage("routeValidationNoId");
				this._navBack();
				return;
			}
		},
		
		formatPageHeaderTitle: function (sMode, sId, sNum) {
			const bTickout = sNum != "";
			const sText = this.getText(bTickout ? "headerT" : "headerD");
			const aModes = constants.MODES;
			switch(sMode) {
				case aModes.CREATE:
					return this.getText("ticketHeaderCreate", [sText]);
				case aModes.EDIT:
					return this.getText("ticketHeaderEdit", [sText, sId]);
				case aModes.VIEW:
					return this.getText("ticketHeaderView", [sText, sId]);
				default:
					return this.getText("ticketHeaderUnknownMode");
			};
		},

		_navMainScreen: function () {
			this._oRouter.navTo("Main");
		},

		_handleEdit: async function () {
			try {
				this.setBusy(true);

				const oData = this.parseItem(await this.fetchDataWithoutBaseUrl(`/zehs/zapi_tickout/tickout?id=${this._sId}`));
				this.setModel(new JSONModel(this.formatter.formatDetailItem(oData)), "detail");
			} catch (oError){
				this.showAndLogParsedError("errorLoadData", oError);
				this._navBack();
			} finally {
				this.setBusy(false);
			}
		},

		_fixTicketDates: function (oTicket) {
			const dDate = new Date();
			if (!oTicket.CREATE_DATA) {
				oTicket.CREATE_DATA = dDate;
			};
			if (!oTicket.DATA_OUT) {
				oTicket.DATA_OUT = dDate;
			};
			return oTicket;
		},

		_mergeUser: function (oDetail, oUserData) {
			oDetail.CR_USER = oUserData.USER;
			oDetail.CR_USER_TEXT = oUserData.USER_FIO;

			oDetail.KOKRS = oUserData.KOKRS;
			oDetail.KOKRS_TEXT = oUserData.KOKRS_TEXT;

			oDetail.BUKRS = oUserData.BUKRS;
			oDetail.BUKRS_TEXT = oUserData.BUKRS_TEXT;

			oDetail.ORG_UNIT = oUserData.ORGEH;
			oDetail.ORG_UNIT_TEXT = oUserData.ORGEH_TEXT;

			oDetail.POST1 = oUserData.PLANS;
			oDetail.POST1_TEXT = oUserData.PLANS_TEXT;
		},

		_handleCreate: async function (sId, sPointId, sTalon, UUID) {
			const oDetail = models.createDetailModel();
			this.setModel(new JSONModel(oDetail), "detail");

			this.setBusy(true);
			try {

				const oUserData = JSON.parse(await this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/user`));

				this._mergeUser(oDetail, oUserData);

				if (sId) {
					if (!sPointId) {
						throw new Error(this.getText("errorWrongPointId"));
					};
	
					const oJournalRecord = this.parseItem(await this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/preventive_journal?id=${sId}`),
						this.getText("errorLoadJournalRecordById", [sId]));
	
					this._mergeRecord(oJournalRecord, sPointId, sTalon, UUID);
					this.setModelProperty("configModel", "/fromOutside", true);
				} else {
					this.setModel(new JSONModel(oDetail), "detail");
				}

			} catch (oError) {
				this.showAndLogParsedError("errorLoadData", oError);
				this._navBack();
			} finally {
				this.setBusy(false);
			};

		},

		onPersonSearch: function (oEvent) {
			this._applySeach(oEvent, "FIO");
		},

		onOrgSearch: function (oEvent) {
			this._applySeach(oEvent, "VAL");
		},

		onJournalSearch: function (oEvent) {
			this._applySeach(oEvent, "ID");
		},

		onMonitorSearch: function (oEvent) {
			this._applySeach(oEvent, "REVISION_DESCR");
		},

		onPointSearch: function (oEvent) {
			this._applySeach(oEvent, "ATWRT");
		},

		onPressSave: function () {
			this.setBusy(true);
			this.showConfirmDialog(
				this.getText("confirmSave"),
				this.getText("confirmApprove")
			).then(() => {
				this._pressSaveHandle();
			}).finally(() => {
				this.setBusy(false);
			});
		},

		_validateEntity: function (oDetail) {
			const aSimpleFields = ["CREATE_DATA", "CNTRL_POINT", "LOCAT", "KOKRS", "BUKRS", "ORG_UNIT", "POST1", "EMPL", "DATA_OUT", "POST", "COMM"];
			let bValid = true;

			for (let i = 0; i <aSimpleFields.length; i++) {
				const sField = aSimpleFields[i];
				if (!oDetail[sField]) {
					bValid = false;
					break;
				}
			};

			return bValid;
		},

		_pressSaveHandle: async function () {
			try {
				this.setBusy(true);

				const oDetail = deepExtend({}, this.getModelData("detail"));

				if (!this._validateEntity(oDetail)) {
					this.showAndLogParsedError("errorForbidenAction", new Error(this.getText("invalidTaskRequiredFields")));
					return;
				};

				const oPreparedDetail = this.formatter.formatDetailItemForServer(oDetail);

				const oOptions = {
					body: JSON.stringify([oPreparedDetail])
				};

				const sMethod = oPreparedDetail.ID ? constants.HTTP_METHODS.PUT : constants.HTTP_METHODS.POST;

				const vResponse = await this.fetchDataWithoutBaseUrl("/zehs/zapi_tickout/tickout", sMethod, oOptions);
				const oResponseItem = this.parseItem(vResponse);

				this.showMessage("infoSuccessTicketPressSave", [oResponseItem.ID]);
				this._navBack();

			} catch (oError) {
				this.showAndLogParsedError("errorCreateUpdateTicket", oError);
			} finally {
				this.setBusy(false);
			}
		},

		_applySeach: function (oEvent, sFieldName) {
			let sValue = oEvent.getParameter("value");
			let oFilter = new Filter(sFieldName, FilterOperator.Contains, sValue);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_mergeRecord: function (oRecord, sPointId, sTalon, UUID) {
			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			oDetailData.LOG_ID = oRecord.ID;
			oDetailData.NUM_TICK = (sTalon === "talon") ? "1": "";

			oDetailData.KOKRS = oRecord.KOKRS_TEXT.KEY;
			oDetailData.KOKRS_TEXT = oRecord.KOKRS_TEXT.VALUE;

			oDetailData.BUKRS = oRecord.BUKRS_TEXT.KEY;
			oDetailData.BUKRS_TEXT = oRecord.BUKRS_TEXT.VALUE;

			oDetailData.ORG_UNIT = oRecord.ORGEH_TEXT.KEY;
			oDetailData.ORG_UNIT_TEXT = oRecord.ORGEH_TEXT.VALUE;

			oDetailData.POST1 = oRecord.PLANS_TEXT.KEY;
			oDetailData.POST1_TEXT = oRecord.PLANS_TEXT.VALUE;

			const oPoint = oRecord.CONTROL_POINTS.find(oPoint => oPoint.CNTRL_POINT == sPointId && oPoint.UUID == UUID );

			if (!oPoint) {
				throw new Error(this.getText("errorNotFoundPoint", [sPointId]));
			};

			if (oPoint.STAT === "1") {
				throw new Error(this.getText("errorForbidRecordCreation"));
			};

			oDetailData.CNTRL_POINT = oPoint.CNTRL_POINT;
			oDetailData.UUID= oPoint.UUID;
			const sText = oPoint.CONTROL_POINT.VALUE ? oPoint.CONTROL_POINT.VALUE : oPoint.CNTRL_POINT;
			oDetailData.CNTRL_POINT_TEXT = sText;

			oDetailData.LOCAT = oPoint.EHFND_LOCATION_TEXT.KEY;
			oDetailData.REVISION_ID_TEXT = oPoint.EHFND_LOCATION_TEXT.VALUE;

			oDetailData.CR_USER = oRecord.BNAME;
			oDetailData.CR_USER_TEXT = oRecord.BNAME_TEXT.VALUE ? oRecord.BNAME_TEXT.VALUE : oRecord.BNAME;

			oDetailModel.refresh(true);
		},

		_createTreeStructureForOrgeh: function (aData) {
			const oOrg = {};
			const aTreeData = [];
			aData.forEach(oData => {
				oOrg[oData.ID] = oData;
				oData.childs = [];
			});

			aData.forEach(oData => {
				const oStructData = oOrg[oData.R_OBJ_ID];
				if (!oStructData) {
					aTreeData.push(oData)
				} else {
					oStructData.childs.push(oData);
				}
			});

			return aTreeData;
		},

		_onRouteMatched: function (oEvent) {
			this._initModels();

			const oParams = oEvent.mParameters.arguments;
			const sId = oParams.id;
			const sPointId = oParams.point;
			const sTalon = oParams.isTalon
			const sMode = oParams.mode;
			const UUID= oParams.UUID;

            this._validateRouteParams(sMode, sId);

			this._sId = sId;
			this.setModel(new JSONModel(models.createConfig(sMode)), "configModel");
			this.setModel(new JSONModel(models.createOrgDialogConfig()), "orgDialogModel");

            if (sMode !== constants.MODES.CREATE) {
				this._handleEdit();
			} else {
				this._handleCreate(sId, sPointId, sTalon, UUID);
            };

			this.getOwnerComponent().getService("BnShellUIService").then((oShellService) => {
				oShellService.setBackNavigation(() => {
					const oConfigData = this.getModelData("configModel");
					const sMode = oConfigData.mode;

					if (sMode !== constants.MODES.VIEW) {
						this.setBusy(true);

						this.showConfirmDialog(
							this._oBundle.getText("confirmNavBack"),
							this._oBundle.getText("confirmApprove")
						).then(() => {
							this._navBack();
						}).finally(() => {
							this.setBusy(false);
						});
					} else {
						this._navBack();
					}
				});
			});
		},

		_navBack: function () {
			const oHistory = History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this._navMainScreen();
			}
		}
	});
});