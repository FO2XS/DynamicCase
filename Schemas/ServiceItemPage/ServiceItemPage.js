define("ServiceItemPage", [], function() {
	return {
		entitySchemaName: "ServiceItem",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"StdDynamicFieldsDetail": {
				"schemaName": "StdDynamicFieldsDetail",
				"entitySchemaName": "StdServiceField",
				"filter": {
					"detailColumn": "StdServiceItem",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		methods: {},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "DynamicFieldsTab",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.DynamicFieldsTabTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "StdDynamicFieldsDetail",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "DynamicFieldsTab",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "ServiceConditionsTab",
				"values": {
					"order": 1
				}
			},
			{
				"operation": "merge",
				"name": "RelationshipTab",
				"values": {
					"order": 2
				}
			},
			{
				"operation": "merge",
				"name": "UsersTab",
				"values": {
					"order": 3
				}
			},
			{
				"operation": "merge",
				"name": "HistoryTab",
				"values": {
					"order": 4
				}
			},
			{
				"operation": "merge",
				"name": "NotesFilesTab",
				"values": {
					"order": 5
				}
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 6
				}
			},
			{
				"operation": "move",
				"name": "ReactionTimeValue",
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "move",
				"name": "Status",
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "move",
				"name": "CaseCategory",
				"parentName": "Header",
				"propertyName": "items",
				"index": 6
			}
		]/**SCHEMA_DIFF*/
	};
});
