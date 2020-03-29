import {IEmitter, IEvent, EventType } from './emitter'

class Event implements IEvent {
    type: string
    timeStamp: Date 

    constructor(type: string) {
        this.type = type
        this.timeStamp = new Date()
    }
}

class Emitter implements IEmitter{
    events: {
        [key: string]: Array<Function>
    }
    
    constructor() {
        this.events = {}
    }

    public on (this: Emitter, type: string, handler: () => void): Emitter {
        if (this.events.hasOwnProperty(type)) {
            this.events[type].push(handler);
        } else {
            this.events[type] = [handler];
        }
        return this;
    }

    public off(this: Emitter, type: string, handler: () => void) {
        if (arguments.length === 0) {
            return this._offAll();
        }
        if (handler === undefined) {
            return this._offByType(type);
        }
        return this._offByHandler(type, handler);
    }

    public trigger(this: Emitter, event: IEvent, args: Array<EventType>): Emitter | void {
        if (!(event instanceof Event) && (typeof event === 'string')) {
            event = new Event(event);
        }
        return this._dispatch(event, args);
    }

    private _dispatch(this: Emitter, event: IEvent, args: Array<EventType>): Emitter | void{
        if (!this.events.hasOwnProperty(event.type)) return;
        args = args || [];
        args.unshift(event);

        var handlers = this.events[event.type] || [];
        handlers.forEach(handler => handler.apply(null, args));
        return this;
    }

    private _offByHandler(this: Emitter, type: string, handler: () => void): Emitter | void {
        if (!this.events.hasOwnProperty(type)) return;
        var i = this.events[type].indexOf(handler);
        if (i > -1) {
            this.events[type].splice(i, 1);
        }
        return this;
    }

    private _offByType(this: Emitter, type:string): Emitter {
        if (this.events.hasOwnProperty(type)) {
            delete this.events[type];
        }
        return this;
    }

    private _offAll() {
        this.events = {};
        return this;
    }

    static Event = Event

}

