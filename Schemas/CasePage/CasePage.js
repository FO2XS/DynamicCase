define("CasePage", ["ServiceHelper"], function (ServiceHelper) {
    return {
        entitySchemaName: "Case",
        attributes: {
            "DynamicFiledsList": {
                "dataValueType": this.Terrasoft.DataValueType.COLLECTION,
                "type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
                "value": Ext.create("Terrasoft.BaseViewModelCollection")
            },

            "SchemaBuilderClassName": {
                "dataValueType": this.Terrasoft.DataValueType.TEXT,
                "type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
                "value": "Terrasoft.SchemaBuilder"
            },

            "ServiceItem": {
                "dependencies": [{
                    columns: ["ServiceItem"],
                    methodName: "onServiceChanged"
                }]
            }
        },
        modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
        details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
        businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
        messages: {
            /**
             * Сохранить значения полей в БД.
             */
            "SaveFieldsValue": {
                mode: Terrasoft.MessageMode.PTP,
                direction: Terrasoft.MessageDirectionType.BIDIRECTIONAL
            },
        },
        methods: {

            /**
             * Генерирует динамические поля на странице.
             * @param callback
             * @param scope
             */
            generateDynamicFields: function (callback, scope) {
                Terrasoft.chain(
                    this.getDynamicFields,
                    this.buildDynamicFieldsSchema,
                    this.initDynamicFieldsList,
                    function () {
                        Ext.callback(callback, scope || this);
                    },
                    this
                );
            },

            onServiceChanged: function () {
                this.generateDynamicFields(Terrasoft.emptyFn, this);
            },

            getDynamicFields: function (callback, scope) {

                let data = {
                    serviceId: this.get("ServiceItem").value
                };

                let methodName = "GetFields";

                if (!this.isNewMode()) {
                    methodName = "GetCaseFields";
                    data.caseId = this.get("Id");
                }

                ServiceHelper.callService(
                    "StdFieldsService",
                    methodName,
                    function (response) {
                        if (Ext.isEmpty(response) && Ext.isEmpty(response[methodName + "Result"])) {
                            return;
                        }

                        let data = JSON.parse(response[methodName + "Result"]);

                        let custDiff = JSON.parse(data.customDiff);
                        let custAttr = JSON.parse(data.customAttributes);

                        this.customAttributes = custAttr;
                        this.customDiff = custDiff;

                        Ext.callback(callback, scope || this);
                    }, data, this);
            },

            /**
             *
             * @param callback
             * @param scope
             */
            buildDynamicFieldsSchema: function (callback, scope) {
                let schemaBuilder = this.Ext.create(this.get("SchemaBuilderClassName"));
                let generatorConfig = {
                    schemaName: "StdDynamicFieldItemSchema",
                    profileKey: "StdDynamicFieldItemSchema",
                    useCache: false,
                    additionalDiff: this.customDiff,
                    customAttributes: this.customAttributes
                };

                schemaBuilder.build(generatorConfig, function (viewModelClass, viewConfig) {
                    this.set("DynamicFieldsItemViewModelClass", viewModelClass);
                    this.set("DynamicFieldsItemViewConfig", viewConfig);
                    Ext.callback(callback, scope || this);
                }, this);
            },

            initDynamicFieldsList: function (callback, scope) {
                let fields = [];

                Terrasoft.each(this.customAttributes, function (item, name) {
                    fields.push({
                        Id: Terrasoft.generateGUID(),
                        Caption: item.caption,
                        Name: name,
                        Value: !Ext.isEmpty(item.value) ? item.value : null
                    });
                });

                fields.push({
                    Id: Terrasoft.generateGUID(),
                    Caption: "Case",
                    Name: "Case",
                    Value: this.get("Id")
                });

                this.prepareDynamicFieldsModels(fields);

                Ext.callback(callback, scope || this);
            },

            /**
             * Вызывается у разметки при загрузке
             * @param itemConfig
             */
            getDynamicItemsViewConfig: function (itemConfig) {
                let viewConfig = this.get("DynamicFieldsItemViewConfig");
                if (viewConfig) {
                    itemConfig.config = viewConfig[0];
                }
            },




            getDynamicFieldsItemViewModel: function (entity) {
                var viewModelClass = this.get("DynamicFieldsItemViewModelClass");

                var viewModel = Ext.create(viewModelClass, {
                    Terrasoft: this.Terrasoft,
                    Ext: this.Ext,
                    sandbox: this.sandbox,
                    values: entity //внутри схемы будет доступны через this.get, таким образом можно CaseId например прокинуть
                });

                viewModel.init();

                let columnNames = _.map(this.customAttributes, (item) => {
                    return item.name;
                });

                _.each(columnNames, (name) => {
                    viewModel.on(`change:${name}`, this.onDynamicFieldChanged, this);
                });

                return viewModel;
            },

            onDynamicFieldChanged: function (args) {
                this.onItemFocused();
            },

            onEntityInitialized: function () {
                this.callParent(arguments);

                if(!Ext.isEmpty(this.get("ServiceItem")))
                {
                    this.generateDynamicFields(Terrasoft.emptyFn, this);
                }
            },

            init: function () {
              this.callParent(arguments);

              this.set("DynamicFiledsList", Ext.create("Terrasoft.BaseViewModelCollection"));
            },

            onSaved: function (response, config) {
                this.callParent(arguments);

                if (response.dynamicFieldsSended) {
                    return;
                }

                this.saveDynamicFields();
                response.dynamicFieldsSended = true;
            },

            saveDynamicFields: function () {

                let data = {
                    CaseId: this.get("Id"),
                    Fields: Object.values(this.customAttributes)
                };

                this.sandbox.publish("SaveFieldsValue", data, [this.sandbox.id]);
            },

            prepareDynamicFieldsModels: function(fields) {

                let fieldsCollection = this.get("DynamicFiledsList");

                fieldsCollection.clear();
                let processedFieldsCollection = Ext.create("Terrasoft.Collection");

                let viewModel = this.getDynamicFieldsItemViewModel(fields);
                processedFieldsCollection.add(Terrasoft.generateGUID(), viewModel);

                fieldsCollection.loadAll(processedFieldsCollection);
            },
        },
        dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
        diff: /**SCHEMA_DIFF*/[
            {
                "operation": "insert",
                "name": "Statusa09a9500-73ef-4805-afbe-7db1a9820ff8",
                "values": {
                    "layout": {
                        "colSpan": 24,
                        "rowSpan": 1,
                        "column": 0,
                        "row": 12,
                        "layoutName": "ProfileContainer"
                    },
                    "bindTo": "Status"
                },
                "parentName": "ProfileContainer",
                "propertyName": "items",
                "index": 12
            },
            {
                "operation": "insert",
                "name": "DynamicTab",
                "values": {
                    "caption": {
                        "bindTo": "Resources.Strings.DynamicTabTabCaption"
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
                "name": "DynamicFieldGroup",
                "values": {
                    "caption": "Динамические поля",
                    "visible": true,
                    "itemType": 15,
                    "markerValue": "added-group",
                    "items": []
                },
                "parentName": "DynamicTab",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "insert",
                "name": "DynamicFielsModule",
                "values": {
                    "idProperty": "Id",
                    "generator": "ConfigurationItemGenerator.generateContainerList",
                    "onGetItemConfig": "getDynamicItemsViewConfig",
                    "collection": "DynamicFiledsList",
                    "dataItemIdPrefix": "feature-item",
                    "isAsync": false,
                    "visible": true,
                },
                "parentName": "DynamicFieldGroup",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "merge",
                "name": "ProcessingTab",
                "values": {
                    "order": 1
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
                "operation": "merge",
                "name": "SolutionTab",
                "values": {
                    "order": 2
                }
            },
            {
                "operation": "merge",
                "name": "SatisfactionLevelComment",
                "values": {
                    "layout": {
                        "colSpan": 24,
                        "rowSpan": 1,
                        "column": 0,
                        "row": 1
                    }
                }
            },
            {
                "operation": "merge",
                "name": "CaseInformationTab",
                "values": {
                    "order": 3
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
                "name": "TimelineTab",
                "values": {
                    "order": 4
                }
            },
            {
                "operation": "move",
                "name": "ResoluitonContainer",
                "parentName": "ProfileContainer",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "move",
                "name": "ServiceItem",
                "parentName": "ProfileContainer",
                "propertyName": "items",
                "index": 6
            },
            {
                "operation": "move",
                "name": "ConfItem",
                "parentName": "ProfileContainer",
                "propertyName": "items",
                "index": 7
            },
            {
                "operation": "move",
                "name": "ServicePact",
                "parentName": "ProfileContainer",
                "propertyName": "items",
                "index": 4
            },
            {
                "operation": "move",
                "name": "SolutionCaptionProfile",
                "parentName": "ResolutionGridLayout",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "move",
                "name": "SolutionFieldContainer",
                "parentName": "SolutionTab_gridLayout",
                "propertyName": "items",
                "index": 3
            },
            {
                "operation": "move",
                "name": "FirstSolutionProvidedOn",
                "parentName": "TermsControlGroup_GridLayout",
                "propertyName": "items",
                "index": 3
            }
        ]/**SCHEMA_DIFF*/
    };
});
