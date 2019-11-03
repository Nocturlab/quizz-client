'use strict';

class EventHandler {
    constructor(){
        this.__events = {};
    }

    on(event, callback){
        if(!this.__events[event])
            this.__events[event] = [];
        this.__events[event].push(callback);
    }

    off(event){
        this.__events[event] = [];
    }

    emit(event, ...params){
        var res = true;
        if(this.__events[event]) {
            for(var i in this.__events[event])
                if(this.__events[event][i](...params) === false)
                    res = false;
        }
        return res;
    }
}