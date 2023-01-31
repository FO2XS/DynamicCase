namespace Terrasoft.Configuration
{
    using System;
    using System.Web;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net;
    using System.ServiceModel;
    using System.ServiceModel.Web;
    using System.ServiceModel.Activation;
    using Newtonsoft.Json;
    using Terrasoft.Core;
    using Terrasoft.Web.Common;
    using Terrasoft.Web.Common.ServiceRouting;
    using Terrasoft.Core.Entities;

    [ServiceContract]
    [DefaultServiceRoute]
    [SspServiceRoute]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class StdFieldsService : BaseService
    {
        private string DefaultFiledNameMask = "DomField{0}";
        private SystemUserConnection _systemUserConnection;

        private SystemUserConnection SystemUserConnection {
            get {
                AppConnection appConnection =
                    AppConnection ?? HttpContext.Current?.Application["AppConnection"] as AppConnection;
                return _systemUserConnection ??
                    (_systemUserConnection = (SystemUserConnection)appConnection?.SystemUserConnection);
            }
        }

        public StdFieldsService() { }

        public StdFieldsService(SystemUserConnection connection) {
            _systemUserConnection = connection;
        }

        /// <summary>
        /// Возвращает json динамических полей для нового обращения.
        /// </summary>
        /// <param name="serviceId">Идентификатор сервиса.</param>
        /// <returns>json динамических полей</returns>
        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
            ResponseFormat = WebMessageFormat.Json)]
        public string GetFields(Guid serviceId = default(Guid)) {
            var response = new Dictionary<string, object> {
                { "customDiff", string.Empty },
                { "customAttributes", string.Empty }
            };
            
            if (serviceId == Guid.Empty) {
                return JsonConvert.SerializeObject(response);
            }

            try {
                var fields = new List<Field>();
                var esqServiceFields =
                    new EntitySchemaQuery(SystemUserConnection.EntitySchemaManager, "StdServiceField");

                esqServiceFields.PrimaryQueryColumn.IsAlwaysSelect = true;
                var fieldId = esqServiceFields.AddColumn("StdFieldDictionary.Id").Name; // id динамического поля
                var fieldName =
                    esqServiceFields.AddColumn("StdFieldDictionary.Name").Name; // название динамического поля
                var fieldCaption =
                    esqServiceFields.AddColumn("StdFieldDictionary.StdCaption").Name; // заголовок динамического поля
                var fieldType =
                    esqServiceFields.AddColumn("StdFieldDictionary.StdFieldType.StdCode")
                        .Name; // тип динамического поля (число)
                var fieldLookupSchema =
                    esqServiceFields.AddColumn("StdFieldDictionary.StdSchema")
                        .Name; // схема динамического СПРАВОЧНОГО поля

                esqServiceFields.Filters.Add(esqServiceFields.CreateFilterWithParameters(FilterComparisonType.Equal,
                    "StdServiceItem", serviceId));

                var entities = esqServiceFields.GetEntityCollection(SystemUserConnection);

                foreach (var entity in entities) {
                    var data = new Field();

                    data.dictionaryId = entity.GetTypedColumnValue<Guid>(fieldId);
                    data.name = entity.GetTypedColumnValue<string>(fieldName);
                    data.dataValueType = (CreatioDataType)entity.GetTypedColumnValue<int>(fieldType);
                    data.caption = entity.GetTypedColumnValue<string>(fieldCaption);
                    data.value = null;

                    //todo: Понять как узнать имя справочника. Доработать получение имени справочника.

                    fields.Add(data);
                }

                response["customDiff"] = GetDiff(fields);
                response["customAttributes"] = GetAttributes(fields);
            } catch (Exception e) {
                response.Add("error", e.Message);
            }
            
            
            
            return JsonConvert.SerializeObject(response);
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
            ResponseFormat = WebMessageFormat.Json)]
        public string GetCaseFields(Guid caseId, Guid serviceId = default(Guid)) {
            
            var response = new Dictionary<string, object> {
                { "customDiff", string.Empty },
                { "customAttributes", string.Empty }
            };
            
            var fields = new List<Field>();
            
            if (caseId == Guid.Empty && serviceId != Guid.Empty) {
                return GetFields(serviceId);
            }

            try {
                var esq = new EntitySchemaQuery(SystemUserConnection.EntitySchemaManager, "StdCaseFieldsValue");
                esq.AddAllSchemaColumns();
            
                var fieldId = esq.AddColumn("StdFieldDictionary.Id").Name; // id динамического поля
                var fieldName = esq.AddColumn("StdFieldDictionary.Name").Name; // название динамического поля
                var fieldCaption = esq.AddColumn("StdFieldDictionary.StdCaption").Name; // заголовок динамического поля
                var fieldType = esq.AddColumn("StdFieldDictionary.StdFieldType.StdCode")
                    .Name; // тип динамического поля (число)
                var fieldLookupSchema = esq.AddColumn("StdFieldDictionary.StdSchema")
                    .Name; // схема динамического СПРАВОЧНОГО поля
            
                esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "StdCase", caseId));
            
                var entities = esq.GetEntityCollection(SystemUserConnection);

                foreach (var entity in entities) {
                    var data = new Field();

                    data.id = entity.PrimaryColumnValue;
                    data.dictionaryId = entity.GetTypedColumnValue<Guid>(fieldId);
                    data.name = entity.GetTypedColumnValue<string>(fieldName);
                    data.dataValueType = (CreatioDataType)entity.GetTypedColumnValue<int>(fieldType);
                    data.caption = entity.GetTypedColumnValue<string>(fieldCaption);
                    data.value = entity.GetColumnValue(GetValueColumnName(data.dataValueType));

                    fields.Add(data);
                }
            
                response["customDiff"] = GetDiff(fields);
                response["customAttributes"] = GetAttributes(fields);
            } 
            catch (Exception e) {
                response.Add("error", e.Message);
            }
            
            return JsonConvert.SerializeObject(response);
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
            ResponseFormat = WebMessageFormat.Json)]
        public string SaveCaseFields(Guid caseId, string fieldsJson) {

            var response = new Dictionary<string, object> {
                {"success", false},
                {"exception", ""}
            };
            
            if (caseId == Guid.Empty) {
                return JsonConvert.SerializeObject(response);
            }
            
            var fields = JsonConvert.DeserializeObject<List<Field>>(fieldsJson);
            
            var existingFields = fields.Where(field => field.id != Guid.Empty).ToList();
            var newFields = fields.Where(field => field.id == Guid.Empty).ToList();

            try {
                UpdateExistingFields(caseId, existingFields);
                SaveNewFields(caseId, newFields);
            } 
            catch (Exception e) {
                response["exception"] = e.Message;
                return JsonConvert.SerializeObject(response);
            }

            response["success"] = true;
            return JsonConvert.SerializeObject(response);
        }

        private void UpdateExistingFields(Guid caseId, IReadOnlyCollection<Field> fields) {
            var esq = new EntitySchemaQuery(SystemUserConnection.EntitySchemaManager, "StdCaseFieldsValue");
            esq.AddAllSchemaColumns();
            
            esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "StdCase", caseId));
            
            var entities = esq.GetEntityCollection(SystemUserConnection);
            
            foreach(var entity in entities) {
                var field = fields.FirstOrDefault(x => x.id == entity.GetTypedColumnValue<Guid>("Id"));
                
                if (field == null) {
                    continue;
                }
                
                var oldValue = entity.GetColumnValue(GetValueColumnName(field.dataValueType));
                
                if (oldValue == field.value) {
                    continue;
                }
                
                entity.SetColumnValue(GetValueColumnName(field.dataValueType), field.value);
                entity.Save();
            }
        }
        
        private void SaveNewFields(Guid caseId, IEnumerable<Field> fields) {
            foreach(var field in fields) {
                var entity = SystemUserConnection.EntitySchemaManager.GetInstanceByName("StdCaseFieldsValue")
                    .CreateEntity(SystemUserConnection);
                entity.SetDefColumnValues();
                entity.SetColumnValue("StdCaseId", caseId);
                entity.SetColumnValue("StdFieldDictionaryId", field.dictionaryId);
                entity.SetColumnValue(GetValueColumnName(field.dataValueType), field.value);
                entity.Save();
            }
        }

        /// <summary>
        /// Возвращает разметку динамических полей.
        /// </summary>
        /// <param name="fields">Динамическе поля.</param>
        /// <returns>JSON-разметка.</returns>
        private string GetDiff(List<Field> fields) {
            const string defaultParentName = "DinamicFielsModule_GridLayout";
            var diff = new List<object>();
            
            for (var i = 0; i < fields.Count; i++) {
                var diffValues = new Dictionary<string, object>() {
                    { "caption", fields[i].caption },
                    { "enabled", true },
                    { "visible", true },
                    { "bindTo", fields[i].name },
                    { "dataValueType", (int) fields[i].dataValueType },
                    { "layout", new Dictionary<string, object> {
                        {"colSpan", 24},
                        {"rowSpan", 1},
                        {"column", 0},
                        {"row", i},
                        {"layoutName", defaultParentName},
                    } }
                };

                var diffElement = new Dictionary<string, object> {
                    { "operation", "insert" },
                    { "name", fields[i].name },
                    { "parentName", defaultParentName },
                    { "propertyName", "items" },
                    { "index", i },
                    { "values", diffValues },
                };
                
                diff.Add(diffElement);
            }

            return JsonConvert.SerializeObject(diff);
        }

        private string GetAttributes(List<Field> fields) {
            //todo: тут нужно будет доработать справочные поля. (Название справочника)
            var attributes = new Dictionary<string, object>();

            foreach (var field in fields) {
                if (attributes.ContainsKey(field.name)) {
                    continue;
                }
                attributes.Add(field.name, new Dictionary<string, object> {
                    {"name", field.name},
                    {"caption", field.caption},
                    {"dataValueType", (int)field.dataValueType},
                    {"value", field.value},
                    {"dictionaryId", field.dictionaryId},
                    {"id", field.id},
                });
            }

            return JsonConvert.SerializeObject(attributes);
        }
        
        /// <summary>
        /// Возвращает название колонки для хранения значения.
        /// </summary>
        /// <param name="type">Тип данных.</param>
        /// <returns>Название столбца.</returns>
        private string GetValueColumnName(CreatioDataType type) {
            switch (type) {
                case CreatioDataType.Float:
                    return "StdFloat";
                case CreatioDataType.Integer:
                    return "StdInteger";
                case CreatioDataType.Guid:
                    return "StdGuid";
                case CreatioDataType.Text:
                    return "StdTextValue";
                default:
                    return "StdTextValue";
            }
        }
    }

    /// <summary>
    /// Объект данных поля.
    /// </summary>
    public class Field
    {
        /// <summary>
        /// Идентификатор динамического поля для обращения.
        /// </summary>
        public Guid id;
        
        /// <summary>
        /// Идентификатор динамического поля в перечне полей.
        /// </summary>
        public Guid dictionaryId { get; set; }

        public string name;
        public string caption;
        public CreatioDataType dataValueType;
        public object value;
        public string lookupName;
    }

    /// <summary>
    /// Типы данных в Creatio
    /// </summary>
    public enum CreatioDataType
    {
        /// <summary>
        /// Уникальный идентификатор.
        /// </summary>
        Guid = 0,
        
        /// <summary>
        /// Строка.
        /// </summary>
        Text = 1,
        
        /// <summary>
        /// Целое число.
        /// </summary>
        Integer = 4,
        
        /// <summary>
        /// Дробное число.
        /// </summary>
        Float = 5,
        
        /// <summary>
        /// Справочник.
        /// </summary>
        Lookup = 10,
    }
}
