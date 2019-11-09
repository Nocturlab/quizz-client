'use strict';

/**
 * The base url to the API.
 * Ex: http://my.example.com/api
 */
let __URL__ = "http://localhost/";
let classNameList = null;
/**
 * This proxy will capture each call of any assessors to allow the get of each classes but disallow to update it.
 */
const classManager = new Proxy({}, {
    get : async function(obj, prop) { // TODO: supprimer le async ici pour vérifier si une promesse est en cours
        const name = StringUtils.toClassCase(prop);
        const apiName = StringUtils.toApiCase(prop);
        let ret = obj[name];

        if(!ret){
            ret = await loadClass(name, apiName);
            obj[name] = ret;
        }

        return ret;

    },
    set: function(obj, prop, value) {
        throw new Error('Not able to override class definitions.');
    }
});

const loadClassManager = function(url){
    if(url)
        __URL__ = url;
    return classManager;
}

loadClassManager.getClassList = async function(){
    if(classNameList != null)
        return classNameList;
    
    let list = [];
    const url = new URL("profile/", __URL__);
    // TODO : charge the class from API
    const response = await fetch(url.href);
    const contentType = response.headers.get("content-type");
    if(contentType && contentType.indexOf("json") === -1)
        throw new Error("Return type is not JSON. Found "+ contentType);
    let result = await response.json();
    if(!response.ok)
        throw new Error("Class not found : "+ JSON.stringify(result));
    result = result._links;
    for(var index in result){
        if(index != 'self')
            list.push(StringUtils.toClassCase(index))
    }
    return classNameList = list;
}

Object.defineProperty(loadClassManager, 'url', {
    get: function(){
        return __URL__;
    }
});

async function loadClass(name, apiName) {
    const url = new URL("profile/"+apiName, __URL__);
    // TODO : charge the class from API
    const response = await fetch(url.href);
    const contentType = response.headers.get("content-type");
    if(contentType && contentType.indexOf("json") === -1)
        throw new Error("Return type is not JSON. Found "+ contentType);
    const result = await response.json();
    if(!response.ok)
        throw new Error("Class not found : "+ JSON.stringify(result));
    
    const descriptor = result.alps.descriptor;
    return ClassDescriptor(name, descriptor);
    
}
