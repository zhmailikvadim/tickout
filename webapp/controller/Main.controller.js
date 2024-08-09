sap.ui.define(
	[
		"by/mda/bn/ehstick_out/controller/BaseController",
		"by/mda/bn/ehstick_out/controller/parts/FilterAndSorterHelpModule",
		"sap/base/strings/formatMessage",
		"sap/base/util/deepExtend",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/ui/core/Fragment",
		"sap/m/MessageBox",
		"../model/formatter",
		"../model/models",
		"../model/constants",
	],
	function (
		Controller,
		FilterAndSorterHelpModule,
		formatMessage,
		deepExtend,
		JSONModel,
		FilterOperator,
		Sorter,
		Fragment,
		MessageBox,
		formatter,
		models,
		constants
	) {
		"use strict";

		return Controller.extend("by.mda.bn.ehstick_out.controller.TasksScreen", {
			...FilterAndSorterHelpModule,

			formatter: formatter,

			onInit: function () {
				Controller.prototype.onInit.call(this, arguments);
				this._initControllerProperties();
				this._oRouter
					.getRoute("Main")
					.attachPatternMatched(this._onRouteMatched, this);
				this._initModels();
				this.setModel(new JSONModel({}), "filterModel");
				this.setModel(new JSONModel({}), "filterListModel");
				this._bFirstLoad = true;
			},

			onViewButtonPress: function () {
				this._onRowSelectNav(constants.MODES.VIEW);
			},

			onEditButtonPress: function () {
				this._onRowSelectNav(constants.MODES.EDIT);
			},

			onCreateButtonPress: function () {
				this._oRouter.navTo("Detail", {
					mode: constants.MODES.CREATE,
					id: "",
				});
			},

			formatRespType: function (sNum) {
				return !!sNum ? this.getText("optionT") : this.getText("optionD");
			},

			onNavigate: async function (oEvent) {
				const oLink = oEvent.getSource();
				const sId = oLink.getText();

				const oNavigator = await sap.ushell.Container.getServiceAsync(
					"CrossApplicationNavigation"
				);
				const sHref = oNavigator.hrefForExternal({
					target: {
						semanticObject: "Z_EHS_LOGPWOT",
						action: `manage&/Detail/display/${sId}`,
					},
				});

				oNavigator.toExternal({
					target: {
						shellHash: sHref,
					},
				});
			},

			handleSelectionFinish: function (oEvent) {
				const aSelected = oEvent.getParameter("selectedItems");
				const aFIlter = aSelected.map((oItem) => ({
					keyField: "STAT_CANCEL",
					operation: FilterOperator.EQ,
					value1: oItem.getKey(),
				}));
				this.getModel("filterModel").setProperty("/STAT_CANCEL", aFIlter);
			},

			handleSelectionResTypeFinish: function (oEvent) {
				const aSelected = oEvent.getParameter("selectedItems");
				const aFilters = [];
				aSelected.forEach((oItem) => {
					const sKey = oItem.getKey();
					if (sKey === "d") {
						aFilters.push({
							keyField: "NUM_TICK_RES_TYPE",
							operation: FilterOperator.EQ,
							value1: "",
						});
					} else if (sKey === "t") {
						for (let i = 0; i < 3; i++) {
							aFilters.push({
								keyField: "NUM_TICK_RES_TYPE",
								operation: FilterOperator.EQ,
								value1: `${i + 1}`,
							});
						}
					}
				});
				this.getModel("filterModel").setProperty("/RES_TYPE", aFilters);
			},

			_onRowSelectNav: function (sMode) {
				const aSelectedIndices = this._oMainTable.getSelectedIndices();
				if (!aSelectedIndices.length) {
					this.showMessage("noSelectedRow");
					return;
				}

				const oContext = this._oMainTable.getContextByIndex(
					aSelectedIndices[0]
				);
				const oSelectedRowData = oContext.getProperty();

				const oUser = this.getModelData("user");

				if (
					sMode === constants.MODES.EDIT &&
					oSelectedRowData.CR_USER != oUser.PERNR
				) {
					MessageBox.error(this.getText("noAccess"));
					return;
				}

				this._oRouter.navTo("Detail", {
					mode: sMode,
					id: oSelectedRowData.ID,
				});
			},

			_initModels: function () {
				this.setModel(new JSONModel(models.createConfig()), "configModel");
			},

			_initControllerProperties: function () {
				this._oMainTable = this.byId("idMainTable");
			},

			_loadData: async function () {
				try {
					this.setBusy(true);

					const aData = this.parseList(
						await this.fetchDataWithoutBaseUrl("/zehs/zapi_tickout/tickout")
					);
					const oUserData = JSON.parse(
						await this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/user`)
					);

					this.setModel(new JSONModel(aData), "data");
					this.setModel(new JSONModel(oUserData), "user");
				} catch (oError) {
					this.showAndLogParsedError("errorLoadData", oError);
				} finally {
					this.setBusy(false);
				}
			},

			_onRouteMatched: function () {
				this._initModels();

				if (this._bFirstLoad) {
					this._bFirstLoad = false;
					this.setModel(
						new JSONModel({
							items: [],
							columns: this.byId("idMainTable")
								.getColumns()
								.map((oColumn) => {
									const sI18nPath = oColumn.getLabel().getBindingInfo("text")
										.parts[0].path;
									return {
										columnKey: oColumn.data("prop"),
										text: this.getText(sI18nPath),
									};
								}),
						}),
						"sortModel"
					);
					this.onClearSorter();
					this._loadData();
				} else {
					this.onSearch();
				}
			},
		});
	}
);
