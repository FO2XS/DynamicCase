/*jshint maxlen: 256*/
define("StdDynamicFieldItemSchema", ["ServiceHelper", "ProcessModuleUtilities"], function(ServiceHelper, ProcessModuleUtilities) {
	return {
		entitySchemaName: "Case",
		attributes: {
		},
		messages: {
			/**
			 * Сохранить значения полей в БД.
			 */
			"SaveFieldsValue": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.BIDIRECTIONAL
			},

			/**
			 * Получить значение динамического поля.
			 */
			"GetDynamicField": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.BIDIRECTIONAL
			},
		},
		mixins: { },
		diff: [
			//todo: проверить можно ли удалить эту поеботу
			{
				"operation": "insert",
				"parentName": "DinamicFielsModule",
				"values": {
					"itemType": this.Terrasoft.ViewItemType.CONTAINER,
					"items": []
				}
			},
			{
				"operation": "insert",
				"name": "DinamicFielsModule_GridLayout",
				"values": {
					"itemType": this.Terrasoft.ViewItemType.GRID_LAYOUT,
					"items": [],
				},
				"parentName": "DinamicFielsModule",
				"propertyName": "items",
				"index": 0
			}
		],
		methods: {
			/**
			 * Обработка изменения поля.
			 */
			onItemFocused: function() {
				this.set("ShowSaveButton", true);
				this.set("ShowDiscardButton", true);
				this.set("IsChanged", true, {silent: true});
			},

			/**
			 * Initializes features view model class.
			 * @protected
			 */
			init: function() {
				this.callParent(arguments);
				document.dModule = this;
				
				this.sandbox.subscribe("SaveFieldsValue", this.onSaveFieldsValue, this, [this.sandbox.id]);
				this.sandbox.subscribe("GetDynamicField", this.getDynamicFieldsValue, this, ["StdDynamicFieldSandbox"]);
			},

			/**
			 * Обработчик сообщения сохранения динамических полей.
			 * @param {Object} args Объект данных.
			 */
			onSaveFieldsValue: function(args) {
				let caseId = args.CaseId;
				let dynamicAttributes = args.Fields;


				_.each(dynamicAttributes, (item) => {
					let value = this.get(item.name);
					item.value = value;
				});

				ServiceHelper.callService(
					"StdFieldsService",
					"SaveCaseFields", 
					function (response) {
						let a = 0;
					},
					{
						caseId: caseId,
						fieldsJson: JSON.stringify(dynamicAttributes)
					}, this);
			},
			
			/**
			 * Возвращает динамическое поле по переданному имени.
			 * @param {string} fieldName Имя поля.
			 * @returns Объём поля.
			 */
			getDynamicFieldsValue: function(fieldName) {
				if (Ext.isEmpty(fieldName)){
					return;
				}

				return this.get(fieldName);
			}
		}
	};
});
