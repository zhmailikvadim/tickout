sap.ui.define([], function () {
	"use strict";

	const oConstant = {};

	oConstant.HTTP_METHODS = {
		GET: "GET",
		PUT: "PUT",
		POST: "POST",
		DELETE: "DELETE"
	};

	oConstant.MODES = {
		"CREATE": "create",
		"EDIT": "edit",
		"VIEW": "view"
	};

	oConstant.BASE_URL = "/zehs/zapi_checklist/";

	oConstant.SAP_CLIENT = "";

	oConstant.EMPTY_DATE = "0000-00-00";

	oConstant.FRAGMENT_PREFIX = "by.mda.bn.ehstick_out.fragment";

	return oConstant;
});