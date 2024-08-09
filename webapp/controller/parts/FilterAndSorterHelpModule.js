sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/base/strings/formatMessage",
	"sap/base/util/deepExtend",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox"
], function (DateFormat, FormatMessage, DeepExtend, JSONModel, FilterOperator, Sorter, Fragment, MessageBox) {
	"use strict";

	return {
		onContext: function(oEvent) {
			this.oCol = oEvent.getParameter("column");
			if (!this._oMenuFragment) {
				this._oMenuFragment = Fragment.load({
					name: "by.mda.bn.ehstick_out.fragment.tableMenu",
					controller: this
				}).then(function(oMenu) {
					this.getView().addDependent(oMenu);
					oMenu.openBy(this.oCol);
					this._oMenuFragment = oMenu;
					return this._oMenuFragment;
				}.bind(this));
			} else {
				this._oMenuFragment.openBy(this.oCol);
			}
			oEvent.preventDefault();
		},

		onSortAction: function(oEvent) {
			const sAction = oEvent.getParameter("item").getProperty("key");
			const oTable = this.byId("idMainTable");
			switch (sAction) {
				case "Descending":
				case "Ascending":
					oTable.sort(this.oCol, sAction, true);
					break;
				case "Custom":
					this._openSortDialog();
					break;
				default:		
			}
		},

		onClearSorter: function() {
			const oTable = this.byId("idMainTable");
			const aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
			const oBinding = oTable.getBinding("rows");
			if (oBinding) {
				oBinding.sort(null);
			}
			this._clearTableSorters(oTable);
		},

		_openSortDialog: function() {
			const oDialog = this.byId("idSortColumns").getDependents()[0];
			oDialog.setShowResetEnabled(true);
			const oSortPanel = oDialog.getPanels()[0];				
			const oTable = this.byId("idMainTable");
			const aSortedColumns = oTable.getSortedColumns();

			const mCorrectColumns = new Map();
			aSortedColumns.forEach(oColumn => mCorrectColumns.set(oColumn.getId(), oColumn));

			oSortPanel.removeAllSortItems();
			mCorrectColumns.forEach(oColumn => {
				oSortPanel.addSortItem(new sap.m.P13nSortItem({
					columnKey: oColumn.data("prop"),
					operation: oColumn.getSortOrder()
				}));
			});
			oDialog.open();
		},

		onOpenSortDialogPress: function(oEvent) {
			this._openSortDialog();
		},

		onSortDialogOkPress: function(oEvent) {
			const oDialog = oEvent.getSource();
			const aConditions = oDialog.getPanels()[0]._getConditions();
			if (aConditions.length === 0) {
				this.onClearSorter();
			} else {
				const oTable = this.byId("idMainTable");
				const mSortColumns = {};
				oTable.getColumns().forEach(oColumn => mSortColumns[oColumn.data("prop")] = oColumn);
				this._clearTableSorters(oTable);
				aConditions.forEach(oCondition => {
					oTable.sort(mSortColumns[oCondition.keyField], oCondition.operation, true)
				});
			}

			oDialog.close();
		},

		onSortDialogAfterClose: function(oEvent) {
			// oEvent.getSource().destroy();
		},

		onSortDialogCancelPress: function(oEvent) {
			oEvent.getSource().close();
		},

		onSortDialogResetPress: function(oEvent) {
			const oDialog = oEvent.getSource();
			const oPanel = oDialog.getPanels()[0];
			oPanel.removeAllSortItems();
			this.onClearSorter();
			oDialog.close();
			oDialog.setShowResetEnabled(true);
		},

		onSearch: async function() {
			const oFilters = this.getModel("filterModel").getData();
			const sFilterData = this._parseFilters(oFilters);
			const sFilter = sFilterData ? `?filter=${sFilterData}` : "";
			let oResponse = "";
			this.setBusy(true);
			try {
				// TODO: change request
				oResponse = await this.fetchDataWithoutBaseUrl(`/zehs/zapi_tickout/tickout${sFilter}`);
				const aData = JSON.parse(oResponse);
				this.getModel("data").setData(aData);
			} catch (oError) {
				oResponse = JSON.parse(oError.message);
				switch (oResponse[0].KEY) {
					default:
						MessageBox.error(oResponse[0].VALUE);	
				}	
			} finally {
				this.setBusy(false);
			}
		},

		_prepareSelectionModel: async function(oEvent) {
			const oFilters = this.getModel("filterModel").getData();
			const oValid = {};
			let oSource;
			if (oEvent) {
				oSource = oEvent.getSource();
				oSource.setBusy(true);
				const sKey = oSource.getProperty("descriptionKey");
				for (let key in oFilters) {
					if (key === sKey) continue;
					oValid[key] = oFilters[key];
				}			
			}
			const sFilterData = this._parseFilters(oValid);
			const sFilter = sFilterData ? `?filter=${sFilterData}` : "";
			let oResponse = "";
			this.getView().setBusy(true);
			try {
				const sResponse = await this.fetchDataWithoutBaseUrl(`/zehs/zapi_tickout/tickout${sFilter}`);
				const oResponse = JSON.parse(sResponse);
				let oFiltersList = {};
				let oSet = {};
				if (!!oResponse.length) {
					for (let key in oResponse[0]) {
						oSet[key] = new Set();
						oFiltersList[key] = [];
					}
					oResponse.forEach(oItem => {
						for (let key in oItem) {
							let sKey = typeof oItem[key] === "object" ? oItem[key].VALUE : oItem[key];
							if (!oSet[key].has(sKey)) {
								oSet[key].add(sKey)
								oFiltersList[key].push({[key]: String(sKey)});
							}	
						}
					})
				}
				this.getModel("filterListModel").setData(oFiltersList);
			} catch (oError) {
				oResponse = JSON.parse(oError.message);
				switch (oResponse[0].KEY) {
					default:
						MessageBox.error(oResponse[0].VALUE);	
				}	
			} finally {
				this.getView().setBusy(false);
			}
			if (oSource) {
				oSource.update();
				oSource.setBusy(false);
			}
		},

		onCancel: function() {
			this.getModel("filterModel").setData(this._oFilterData);
		},

		handelFilterDialogOpen: function() {
			this._oFilterData = DeepExtend({}, this.getModel("filterModel").getData());
		},

		_parseFilters: function(oFilters) {
			let aFilters = Object.keys(oFilters).map(sKey => oFilters[sKey]);
			aFilters = aFilters.filter(vItem => Array.isArray(vItem));
			aFilters = aFilters.filter(aRanges => aRanges.length !== 0);
			if (aFilters.length === 0) {
				return "";
			} else {
				const sFilter = aFilters.map((aRanges) => {
					return "(" + aRanges.map((oRange) => {
						if (["CREATE_DATA", "DATA_OUT", "DATA_CANCEL"].includes(oRange.keyField)) {
							return this._getStringFilters(
								oRange.range.keyField, 
								oRange.range.operation, 
								DateFormat.getDateInstance({ pattern: "yyyyMMdd" }).format(oRange.range.value1), 
								DateFormat.getDateInstance({ pattern: "yyyyMMdd" }).format(oRange.range.value2)
							);
						} else if (!!oRange.row) {
							return this._getStringFilters(oRange.keyField, FilterOperator.EQ, oRange.key);
						} else if (oRange.keyField === "STAT_CANCEL") {
							return this._getStringFilters(oRange.keyField, oRange.operation, oRange.value1 === "true");
						} else if (oRange.keyField === "NUM_TICK_RES_TYPE") {
							return this._getStringFilters("NUM_TICK", oRange.operation, oRange.value1);
						} else {
							return this._getStringFilters(oRange.range.keyField, oRange.range.operation, oRange.range.value1);
						}	
					}).join(" OR ") + ")";
				}).join(" AND ");
				return aFilters.length === 1 ? sFilter : `(${sFilter})`;
			}
		},

		onClearFilter: function () {
			this.setModel(new JSONModel({}), "filterModel");
		},

		_formatCharCode: function (sValue) {
			return sValue.split("").map(sChar => `0x000${(sChar.charCodeAt(0) + "").substring(-4)}`).join("");
		},

		_getStringFilters: function(sFieldName, sFilterOperator_1, sValue1, sValue2) {
			let sFilterOperator = sFilterOperator_1;
			if (sFieldName === "NUM_TICK" && sFilterOperator === FilterOperator.Contains) {
				sFilterOperator = FilterOperator.EQ;
			}
			switch (sFilterOperator) {
				case FilterOperator.EQ:
				case FilterOperator.GE:
				case FilterOperator.GT:
				case FilterOperator.LE:
				case FilterOperator.LT:
				case FilterOperator.StartsWith:
				case FilterOperator.EndsWith:
				case FilterOperator.Contains:
					if (typeof sValue1 === "boolean") {
						return FormatMessage("{0} {2} {1}", sFieldName, sValue1, sFilterOperator);						
					}
					return FormatMessage("{0} {2} ''{1}''", sFieldName, this._formatCharCode(sValue1), sFilterOperator);
				case FilterOperator.BT:
					return FormatMessage("{0} {3} ''{1}'' AND ''{2}''", sFieldName, sValue1, sValue2, sFilterOperator);
				// case FilterOperator.NotEndsWith:
				// case FilterOperator.NotStartsWith:
				// case FilterOperator.NotContains:
				//     return FormatMessage("{0} {2} ''{1}''", sFieldName, sValue, "NC");
				// case FilterOperator.Contains:
				//     return FormatMessage("(substringof(''{0}'',toupper({1})))", sValue, sFieldName);
				// case FilterOperator.StartsWith:
				//     return FormatMessage("(startswith(toupper({0}),''{1}''))", sFieldName, sValue);
				// case FilterOperator.EndsWith:
				//     return FormatMessage("(endswith(toupper({0}),''{1}''))", sFieldName, sValue);
				default:
					throw new Error("Unsupported filter operator: " + sFilterOperator);
			}
		},

		_clearTableSorters: function(oTable) {
			oTable._aSortedColumns = [];
		},
	};
});