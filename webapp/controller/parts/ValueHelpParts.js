sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function (JSONModel) {
	"use strict";

	return {

		_cleanConfig: {
			"KOKRS": ["BUKRS", "ORG_UNIT", "LOG_ID", "LOCAT", "CNTRL_POINT", "EMPL", "CR_USER", "POST", "POST1"],
			"BUKRS": ["ORG_UNIT", "LOG_ID", "LOCAT", "CNTRL_POINT", "EMPL", "CR_USER", "POST", "POST1"],
			"ORG_UNIT": ["LOCAT", "CNTRL_POINT", "LOG_ID", "EMPL", "CR_USER", "POST", "POST1"],
			"LOCAT": ["CNTRL_POINT"]
		},

		_fieldsToClean: {
			"KOKRS": ["BUKRS", "ORG_UNIT", "POST", "POST1", "EMPL", "LOCAT", "CNTRL_POINT"],
			"BUKRS": ["ORG_UNIT", "POST", "POST1", "EMPL", "LOCAT", "CNTRL_POINT"],
			"ORG_UNIT": ["POST", "POST1", "EMPL", "LOCAT", "CNTRL_POINT"],
			"LOCAT": ["CNTRL_POINT"]
		},

		_translateMappings: {
			"KOKRS": "KOKRS_TEXT",
			"BUKRS": "BUKRS_TEXT",
			"ORG_UNIT": "ORG_UNIT_TEXT",
			"POST": "POST_TEXT",
			"POST1": "POST1_TEXT",
			"EMPL": "EMPL_TEXT",
			"LOCAT": "REVISION_ID_TEXT",
			"CNTRL_POINT": "CNTRL_POINT_TEXT"
		},

		_clearDependField: function (oModelData, sField) {
			const aFields = this._fieldsToClean[sField];
			if (aFields && aFields.length) {
				aFields.forEach(sCleanField => {
					oModelData[sCleanField] = "";

					const sTranslateField = this._translateMappings[sCleanField];
					if (oModelData[sTranslateField]) {
						oModelData[sTranslateField] = "";
					};

					if (sCleanField === "LOCAT") {
						oModelData.REVISION_ID = "";
						oModelData.LOG_ID = "";
					}

				});				
			}
		},

		onOrgValueHelpClose: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (!oSelectedItem) {
				return;
			}

			const sModelName = "orgData";
			const sPath = oSelectedItem.getBindingContext(sModelName).getPath();
			const oSelectedOrg = this.getModelProperty(sModelName, sPath);

			const oOrgDialogData = this.getModelData("orgDialogModel");

			this._applyOrgValueHelpCloseSelection(oOrgDialogData.applyField, oSelectedOrg);
		},

		onMonitorValueHelpClose: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (!oSelectedItem) {
				return;
			};

			const sModelName = "monitors";
			const sPath = oSelectedItem.getBindingContext(sModelName).getPath();
			const oSelected = this.getModelProperty(sModelName, sPath);


			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			const sField = "LOCAT";

			if (oDetailData[sField] == oSelected.KEY) {
				return;
			};

			oDetailData[sField] = oSelected.KEY;
			oDetailData.REVISION_ID = oSelected.ID;
			oDetailData.REVISION_ID_TEXT = oSelected.REVISION_DESCR;

			this.setModel(new JSONModel(oSelected.POINTS), "points");

			this._clearDependField(oDetailData, sField);
			oDetailModel.refresh(true);
		},

		onPointValueHelpClose: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (!oSelectedItem) {
				return;
			};

			const sModelName = "points";
			const sPath = oSelectedItem.getBindingContext(sModelName).getPath();
			const oSelected = this.getModelProperty(sModelName, sPath);

			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			const sField = "CNTRL_POINT";

			if (oDetailData[sField] == oSelected.KEY) {
				return;
			};

			oDetailData[sField] = oSelected.KEY;
			oDetailData.CNTRL_POINT_TEXT = oSelected.ATWRT;
			this._clearDependField(oDetailData, sField);
			oDetailModel.refresh(true);
		},

		onJournalRecordsValueHelpClose: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (!oSelectedItem) {
				return;
			};

			const sModelName = "journalRecords";
			const sPath = oSelectedItem.getBindingContext(sModelName).getPath();
			const oSelected = this.getModelProperty(sModelName, sPath);

			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			const sField = "LOG_ID";

			if (oDetailData[sField] == oSelected.ID) {
				return;
			};

			oDetailData[sField] = oSelected.ID;
			oDetailData.LOCAT = oSelected.LOCATION.KEY;
			oDetailData.REVISION_ID_TEXT = oSelected.LOCATION.VALUE;
			oDetailData.CNTRL_POINT = oSelected.CONTROL_POINT.KEY;
			oDetailData.CNTRL_POINT_TEXT = oSelected.CONTROL_POINT.VALUE;

			oDetailModel.refresh(true);
		},

		onPersonValueHelpClose: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (!oSelectedItem) {
				return;
			};

			const sModelName = "persons";
			const sPath = oSelectedItem.getBindingContext(sModelName).getPath();
			const oSelected = this.getModelProperty(sModelName, sPath);

			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			const sField = this.getModelProperty("orgDialogModel", "/applyField");

			if (oDetailData[sField] == oSelected.PERSON) {
				return;
			};

			oDetailData[sField] = oSelected.PERSON;
			oDetailData[`${sField}_TEXT`] = oSelected.FIO;

			oDetailData.POST = oSelected.JOB_POS;
			oDetailData.POST_TEXT = oSelected.JOB_POS_TEXT;

			oDetailModel.refresh(true);
		},

		onLogIdValueHelp: function () {
			const oDetailData = this.getModelData("detail");
			const aFilters = [
				`controlling_area=${oDetailData.KOKRS}`,
				`bukrs=${oDetailData.BUKRS}`,
				`org_unit=${oDetailData.ORG_UNIT}`,
				`workr=${oDetailData.POST1}`
			];

			this.setBusy(true);

			this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/preventive_journal?${aFilters.join("&")}`).then(aResponse => {
				let aData = this.parseList(aResponse);
				aData.forEach(oData => {
					oData.ID = `${oData.ID}`;
				});
				this.setModel(new JSONModel(aData), "journalRecords");
				this.dialogs._oJournalRecordDialog.open();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "journalRecords");
				this.showAndLogParsedError("errorLoadJournalRecords", oError);
			}).finally(() => {
				this.setBusy(false);
			});
		},

		onCntrlPointValueHelp: function () {
			const oDetailData = this.getModelData("detail");

			this.setBusy(true);
			this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/point_info?id=${oDetailData.REVISION_ID}`).then(aResponse => {
				const aPoints = this.parseList(aResponse);
				this.setModel(new JSONModel(aPoints), "points");
				this.dialogs._oPointDialog.open();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "points");
				this.showAndLogParsedError("errorLoadPoints", oError);
			}).finally(() => {
				this.setBusy(false);
			});
		},

        onKokrsValueHelp: function () {
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitleKokrs"));
			this.setModelProperty("orgDialogModel", "/applyField", "KOKRS");

			this._loadOrgData(`/zehs/zapi_checklist/ke`);
		},

		onBukrsValueHelp: function () {
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitleBukrs"));
			this.setModelProperty("orgDialogModel", "/applyField", "BUKRS");

			this._loadOrgData(`/zehs/zapi_checklist/hr_structure`);
		},

		onCrUserValueHelp: function () {
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitleEmployee"));
			this.setModelProperty("orgDialogModel", "/applyField", "CR_USER");

			this._loadPersonData();
		},

		onEmplValueHelp: function () {
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitleEmployee"));
			this.setModelProperty("orgDialogModel", "/applyField", "EMPL");

			this._loadPersonData();
		},

		_loadPersonData: function () {
			const oConfigData = this.getModelData("configModel");
			const bFromOutside = oConfigData.fromOutside;
			const oDetailData = this.getModelData("detail");

			const sOutsideUrl = `/zehs/zapi_task_exec/responsible?org_unit=${oDetailData.ORG_UNIT}`;

			const sURL = bFromOutside ? sOutsideUrl : `/zehs/zapi_checklist/hr_positions?id=${oDetailData.ORG_UNIT}`;
			
			this.setBusy(true);
			this.fetchDataWithoutBaseUrl(sURL).then(aResponse => {
				let aData = this.parseList(aResponse);
				if (bFromOutside) {
					aData = aData.map(oData => {
						return {
							PERSON: oData.PERNR,
							FIO: oData.ENAME,
							JOB_POS_TEXT: oData.STEXT,
							JOB_POS: oData.PLANS
						};
					});
				}
				this.setModel(new JSONModel(aData), "persons");
				this.dialogs._openPersonDialog.open();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "persons");
				this.showAndLogParsedError("errorLoadData", oError);
			}).finally(() => {
				this.setBusy(false);
			});	
		},

		onOrgUnitValueHelp: function () {
			const oDetailData = this.getModelData("detail");
	
			this.setBusy(true);

			this.fetchDataWithoutBaseUrl(`/zehs/zapi_checklist/hr_structure?id=${oDetailData.BUKRS}`).then(aResponse => {
				const aUnits = this.parseList(aResponse);
				this.setModel(new JSONModel(this._createTreeStructureForOrgeh(aUnits)), "orgDataTree");
				this.dialogs._oOrgUnitDialog.open();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "orgDataTree");
				this.showAndLogParsedError("errorLoadData", oError);
			}).finally(() => {
				this.setBusy(false);
			});
		},

		onPostValueHelp: function () {
			const oDetailData = this.getModelData("detail");
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitlePosition"));
			this.setModelProperty("orgDialogModel", "/applyField", "POST");

			this._loadOrgData(`/zehs/zapi_checklist/hr_positions?id=${oDetailData.ORG_UNIT}`);
		},

		onPost1ValueHelp: function () {
			const oDetailData = this.getModelData("detail");
			this.setModelProperty("orgDialogModel", "/title", this.getText("orgTitlePosition"));
			this.setModelProperty("orgDialogModel", "/applyField", "POST1");

			this._loadOrgData(`/zehs/zapi_checklist/hr_positions?id=${oDetailData.ORG_UNIT}`);
		},

		onLocatValueHelp: function () {
			const oDetailData = this.getModelData("detail");

			this.setBusy(true);
			this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/mon_objs?ctrl_area=${oDetailData.KOKRS}&comp_code=${oDetailData.BUKRS}&org_unit=${oDetailData.ORG_UNIT}`).then(aResponse => {
				const aData = this.parseList(aResponse);
				this.setModel(new JSONModel(aData), "monitors");
				this.dialogs._oMonitorDialog.open();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "monitors");
				this.showAndLogParsedError("errorLoadMonitors", oError);
			}).finally(() => {
				this.setBusy(false);
			});
		},

		onCloseUnitSelectionDialog: function () {
			if (this.dialogs._oOrgUnitDialog) {
				this.dialogs._oOrgUnitDialog.close();
			};
		},

		onUnitSelectionChange: function () {
			if (this.dialogs._oOrgUnitDialog) {
				const aElements = this.dialogs._oOrgUnitDialog.findElements();
				const oTreeTable = 	aElements[0];

				const aSelectedIndices = oTreeTable.getSelectedIndices();
				if (!aSelectedIndices.length) {
					this.showMessage("errorOrgUnitNoSelected");
					return;
				};

				const oContext = oTreeTable.getContextByIndex(aSelectedIndices[0]);
				const oSelectedOrg = oContext.getProperty();

				const oDetailModel = this.getModel("detail");
				const oDetailData = oDetailModel.getData();

				const sField = "ORG_UNIT";
	
				if (oDetailData[sField] == oSelectedOrg.ID) {
					return;
				};
	
				oDetailData[sField] = oSelectedOrg.ID;
				oDetailData[`${sField}_TEXT`] = oSelectedOrg.VAL;
				this._clearDependField(oDetailData, sField);
				oDetailModel.refresh(true);

				this.dialogs._oOrgUnitDialog.close();
			}
		},

		_applyOrgValueHelpCloseSelection: function (sField, oSelectedOrg) {
			const oDetailModel = this.getModel("detail");
			const oDetailData = oDetailModel.getData();

			if (oDetailData[sField] == oSelectedOrg.ID) {
				return;
			};

			oDetailData[sField] = oSelectedOrg.ID;
			oDetailData[`${sField}_TEXT`] = oSelectedOrg.VAL;
			this._clearDependField(oDetailData, sField);
			oDetailModel.refresh(true);
		},

		_loadOrgData: function (sUrl) {
			this.setBusy(true);
			this.fetchDataWithoutBaseUrl(sUrl).then(aResponse => {
				const aData = this.parseList(aResponse);
				this.setModel(new JSONModel(aData), "orgData");
				this._openOrgDialog();
			}).catch(oError => {
				this.setModel(new JSONModel([]), "orgData");
				this.showAndLogParsedError("errorLoadData", oError);
			}).finally(() => {
				this.setBusy(false);
			});			
		},

		_openOrgDialog: function () {
			this.dialogs._oOrgDialog.open();
		}
	};
});