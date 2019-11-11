
function ClassDescriptor(className, descriptor) {
    className = StringUtils.toClassCase(className);
    const apiName = StringUtils.toApiCase(className);
    let classObject = null;
    for(var element of descriptor){ // for each function of the descriptor (constructor is one of these functions)
        if(element.hasOwnProperty("id")){ // If it's a base CRUD function
            const funcName = element.id;
            if(StringUtils.singularOf(apiName)+"-representation" == funcName) // If it's the constructor
                classObject = defineClass(className, element.descriptor); // create the class
            else if("create-"+StringUtils.pluralOf(apiName) == funcName){
                addStaticCreate(classObject, element);
            }else if("get-"+StringUtils.pluralOf(apiName) == funcName){
                addStaticGetAll(classObject, element);
            }else if("get-"+StringUtils.singularOf(apiName) == funcName){
                addStaticGet(classObject, element);
            }else if("delete-"+StringUtils.singularOf(apiName) == funcName){
                addDeleteMethods(classObject, element);
            }
        }else if(element.hasOwnProperty("name")){ // If it's a custom search function
            addStaticQuery(classObject, element);
        }
    }

    return classObject;
}

function defineClass(className, descriptor){
    let class_prop_list = new Map();

    let classObject = class{
        /**
         * This constructor will define each value of the current object acording to the value pass in the input.
         * 
         * @param input Input allow multiple variables. 
         * If it was only one as an Object, then it will define the Object with the value of each keys.
         * If it was other type of input or multiple input, that will define the object with each vars in the order of API JSON output.
         * if it wasn't any input, it will initialise the object with all vars equal to null.
         */
        constructor(...input){
            this._params = {};
            this._alteredValues = []; // this will for patch
            if(input.length == 0){ // define all properties to null.
                for(let property of descriptor){
                    this._params[property.name] = null;
                }
            }else if(input.length == 1 && typeof input[0] == 'object'){ // define all properties with the object keys and values.
                for(let property of descriptor){
                    let prop = property.name;
                    let param = input[0][prop];
                    if(input[0]._links && input[0]._links[prop])
                        param = input[0]._links[prop];
                        
                    if(param === undefined){
                        this._params[prop] = null;
                    }else{
                        if(Array.isArray(param)){ // I didn't know why but sometimes, param is an array with self and linked object
                            if(param[0].className){
                                this[prop] = param;
                            }else{
                            this[prop] = param[1]; // param[0] is self so the object I looked for is param[1];
                            }
                        }else{
                            this[prop] = param;
                        }
                    }
                }

                if(input[0]._links){ // find the element from API response in parameters input
                    Object.keys(input[0]._links).forEach((value, key, arr)=>{
                        if(value !== "self" && value !== StringUtils.singularOf(StringUtils.toApiCase(className.toLowerCase()))){
                            this._params[value] = input[0]._links[value];
                        }
                    });
                    this._alteredValues = [];
                }
            }else{ // define all properties with the input values in the order of the API JSON output.
                descriptor.forEach((param, index, arr)=>{
                    if(input[index] !== undefined)
                        this[param.name] = input[index];
                    else
                        this._params[param.name] = null;
                });
            }

            if(this.id)
                classObject._cacheData.set(this.id, Object.create(this));
        }

        /**
         * Allow to get the classname of this class
         */
        static get className(){
            return className
        }
        /**
         * Allow to get the classname of this object
         */
        get className(){
            return this.constructor.className
        }

        /**
         * Transform the object into a JSON representation that can be send to the API
         * @param fields if fields is defined, that will return only thats fields into the JSON string
         */
        toJSON(fields){
            if(fields !== true)
                fields = false;

            let params = this._params;
            let json = {};

            let altred = [];
            if(fields){
                for(let alteredValue of this._alteredValues){
                    altred.push(alteredValue.id);
                }
            }

            class_prop_list.forEach((type, prop, arr)=>{
                const param = this._params[prop];
                if(type === "string"){
                    if(Array.isArray(param)){
                        let arr = [];
                        for (const val of param) {
                            arr.push(val);
                        }
                        json[prop] = arr;
                    }else
                        json[prop] = this._params[prop];
                }else{
                    if(Array.isArray(param)){
                        const arr = [];
                        for (const val of param) {
                            if(!val)
                                arr.push(val);
                            else if(val.id)
                                arr.push(val.id);
                            else if(val.href)
                                arr.push(val.href);
                            else if(val.className)
                                arr.push(val.toJSON(fields));
                            else
                                arr.push(val);
                        }
                        json[prop] = arr;
                    }else{
                        const val = this._params[prop];
                        if(!val)
                            json[prop] = val;
                        else if(val.id)
                            json[prop] = val.id;
                        else if(val.href)
                            json[prop] = val.href;
                        else if(val.className)
                            json[prop] = val.toJSON(fields);
                        else
                            json[prop] = val;
                    }
                }
            });

            return JSON.stringify(json, fields?altred:null);
        }

        /**
         * This is for check if the object has been altered and need to be saved to database.
         */
        get altered(){
            return this._alteredValues.length != 0;
        }

    }
    classObject._cacheData = new Map();

    for(let property of descriptor){ // define each properties getter and setter

        const prop = property.name;
        let prop_type = "string";
        if(property.rt){
            prop_type = property.rt.split('/');
            prop_type = prop_type[prop_type.length-1].split('#');
            prop_type = StringUtils.toClassCase(prop_type[0]);
        }
        
        class_prop_list.set(prop, prop_type);

        Object.defineProperty(classObject.prototype, prop, {
            get: async function(){ // TODO: Dynamicaly get the foreign object if it has the href property. (Try to avoid async here | possibility to just get the link and force user to use Class.get(link))
                if(this._params[prop] && this._params[prop].href){
                    if(classObject._cacheData.has(this._params[prop].href))
                        return classObject._cacheData.get(this._params[prop].href);
                    else{
                        const type = class_prop_list.get(prop);
                        const ReferenceClass = await ClassManager[type];
                        if(!ReferenceClass)
                            throw new Error("Unkown type "+type+" for "+ prop);
                        let reference;
                        if(Array.isArray(this._params[prop])){
                            reference = [];
                            for (const el of this._params[prop]) {
                                reference.push(await ReferenceClass.get(el));
                            }
                        }else{
                            reference = await ReferenceClass.get(this._params[prop]);
                        }
                        this[prop] = reference;
                        return reference;
                    }
                }
                return this._params[prop];
            },
            set: function(value){
                let alteredIndex = this._alteredValues.findIndex((element)=>{
                    return element.id == prop;
                });
                let old;
                if(alteredIndex != -1){
                    old = this._alteredValues.splice(alteredIndex, 1);
                    old.new = value;
                }else
                    old = {
                        id: prop,
                        old: this._params[prop],
                        new: value
                    };
                this._params[prop] = value;
                if(old.old !== value)
                    this._alteredValues.push(old);
            }
        });
    }
    
    Object.defineProperty(classObject, "properties", {
        value: class_prop_list,
        writable: false
    });

    classObject.describe = function(){
        let params = [];
        let methods = Object.keys(classObject);
        for(let property of classObject.properties){
            params.push({value: property.name, type: classObject.properties[property]});
        }
        return {
            properties: params,
            staticMethods: methods
        };
    }

    return classObject;
}

/**
 * addStaticCreate is a method that will create the static method to create a new instance of this class in the database
 * 
 * @param classObject this object must be the class definition to append the statics methods
 * @param descriptor descriptor is an object that contain the definitions of the methods.
 */
function addStaticCreate(classObject, descriptor){
    /**
     * save is a method that will send the content of this instance to the API
     */
    classObject.prototype.save = async function(){
        const that = this;
        let url = new URL(StringUtils.toApiCase(this.className), loadClassManager.url); // the uri to create an object

        let opt = {
            method: 'POST', // post to create an element
            headers: {
                'Content-Type': 'application/json' // always send JSON
            },
            body: that.toJSON(that.altered), /* transform object into json, only needed element if it was altered, 
                                              * else send all of the object (case of update the object with obj._params[name] = 'something')
                                              */
            credentials: 'include' // to allow cookies
        };
        if(this.id != undefined){ // if this object was already on database, then just update it.
            opt.method = that.altered?'PATCH':'PUT';
            url = new URL(this.id); // an id is an URL so I can just send the request here
        }
        return await request(url.href, opt).then(async (response)=>{
            if(response.ok){
                return await response.json();
            }else
                throw new Error('['+response.status+'] - Error during the creation of the element : '+ response.statusText +" on url ["+opt.method+"] "+url.href+" -> "+ opt.body);
        }).then(async (response)=>{
            let res = response._links.self.href;
            Object.defineProperty(that, 'id', {value: res, writable: false}); // set the definitive Id of the object (ID was an URL)
            that._alteredValues = [];
            return that;
        });
    };
}

/**
 * addStaticQuery will create any static methods to get one or many instance of the class.
 * @param classObject this object must be the class definition to append the statics methods
 * @param descriptor descriptor is an object that contain the definitions of each methods.
 */
function addStaticQuery(classObject, descriptor) {

    if(descriptor.descriptor === undefined){
        // if the function has no parameters
        let api_name = StringUtils.toApiCase(classObject.className);
        let url = new URL(api_name+"/search/"+descriptor.name, loadClassManager.url);
        classObject[descriptor.name] = async function(){
            return await request(url.href, {
                method: 'GET'
            }).then((response)=>{
                return response.json();
            }).then(async (response)=>{
                if(isNaN(response)){
                    for(const item in response._embedded){
                        let res = response._embedded[item];
                        if(Array.isArray(res)){
                            let arr = [];
                            for(let el of res){
                                let o = new classObject(el);
                                o.id = el._links.self.href;
                                arr.push(o);
                            }
                            return arr;
                        }else{
                            let o = new classObject(res);
                            o.id = res._links.self.href;
                            return o;
                        }
                    }
                }else{
                    throw new Error("check line 277 of file class_descriptor");
                    return res;
                }
            });
        };
    }else{
        // if the function has one or many parameters (parameters was in input and sorted in the order of the API return it to us)
        classObject[descriptor.name] = async function(...input){
            let url = new URL(StringUtils.toApiCase(classObject.className)+"/search/"+descriptor.name, loadClassManager.url);
            for(var i=0; i<descriptor.descriptor.length;++i){
                url.searchParams.set(descriptor.descriptor[i].name, input[i]);
            }
            return await request(url.href).then(async (response)=>{
                return await response.json();
            }).then((response)=>{
                if(isNaN(response)){
                    for(const item in response._embedded){
                        let res = response._embedded[item];
                        if(Array.isArray(res)){
                            let arr = [];
                            for(let el of res){
                                let o = new classObject(el);
                                o.id = el._links.self.href;
                                arr.push(o);
                            }
                            return arr;
                        }else{
                            let o = new classObject(res);
                            o.id = res._links.self.href;
                            return o;
                        }
                    }
                }else{
                    throw new Error("check line 310 of file class_descriptor");
                    return res;
                }
            });
        };
    }
}

/**
 * addStaticGetAll allow to generate the Class.getAll() static methods for the class specified in classObject.
 * 
 * @param {Object} classObject the class to alter
 * @param {Object} element the definition of the method
 */
function addStaticGetAll(classObject, element){
    /**
     * getAll allow to get all object of the class (in the page specified)
     * @param {*} input the args of the method
     */
    classObject.getAll = async function(...input){
        let url = new URL(loadClassManager.url+element.name);

        if(element.descriptor)
            for(var i=0; i<element.descriptor.length;++i){
                url.searchParams.set(element.descriptor[i].name, input[i]);
            }

        return await request(url.href).then(async (response)=>{
            return await response.json(); // TODO: transform the response into an instance of the class
        }).then((response)=>{
            let arr = [];
            for(let el of response._embedded[element.name]){
                let obj = new classObject(el);
                obj.id = el._links.self.href;
                arr.push(obj);
            }
            return arr;
        });
    };
}

function addStaticGet(classObject, element){
    classObject.get = async function(id){
        let url;
        if(id.href)
            url = new URL(id.href);
        else if(typeof id === "object")
            if(id.className && id.className === classObject.className){
                return id;
            } else
                throw new Error('Unable to get '+classObject.className+' from this type of resources : '+JSON.stringify(id));
        else if(isNaN(id))
            url = new URL(id);
        else
            url = new URL(StringUtils.toApiCase(classObject.className)+"/"+id, loadClassManager.url);

        if(classObject._cacheData.has(url.href)){
            return classObject._cacheData.get(url.href);
        }

        return await request(url.href).then(async (response)=>{
            return await response.json();
        }).then((response)=>{
            if(response._embedded){
                for(const item in response._embedded){
                    let res = response._embedded[item];
                    if(Array.isArray(res)){
                        const arr = [];
                        for (const el of res) {
                            let obj = new classObject(el);
                            obj.id = el._links.self.href;
                            classObject._cacheData.set(obj.id, Object.create(obj));
                            arr.push(obj);
                        }
                        return arr;
                    }
                }
            }else{
                let obj = new classObject(response);
                obj.id = response._links.self.href;
                classObject._cacheData.set(url.href, Object.create(obj));
                return obj;
            }
        });
    };
}

function addDeleteMethods(classObject, element){
    classObject.prototype.delete = async function(){
        let url = new URL(this.id);
        classObject._cacheData.delete(this.id);
        return await request(url.href, {method: 'DELETE'}).then(async (response)=>{
            return await response.json();
        });
    };
}
