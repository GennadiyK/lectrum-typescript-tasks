var emitter = {};

interface IEvent {
    type: string,
    timeStamp: Date
}

type EventsType = {
    [key: string]: Array<Function>
}

interface IEmmiter {
    events: EventsType
    on: (type: string, handler: () => void)  => void
    off: (type: string, handler: () => void) => void
    trigger: (event: IEvent, args: []) => void
    mixin: (obj: EventsType, arr: Array<string>) => void
    _offAll: () => IEmmiter
    _offByType: (type: string) => IEmmiter
    _offByHandler: (type: string, handler: () => void) => IEmmiter
    _dispatch: (event: IEvent, args: []) => void
}

class Emitter implements IEmmiter {
    events: EventsType
  constructor () {
    // var e = Object.create(emitter);
    this.events = {};
    // return e;
  }

  public on = function (this:IEmmiter, type: string, handler: () => void) {
    if (this.events.hasOwnProperty(type)) {
      this.events[type].push(handler);
    } else {
      this.events[type] = [handler];
    }
    return this;
  };

  public trigger = function(this: IEmmiter, event: IEvent, args: []) {
    if (!(event instanceof EventCustom)) {
      event = new EventCustom(event.type);
    }
    return this._dispatch(event, args);
  };
 

  public off = function(this: IEmmiter, type: string, handler: () => void) {
    if (arguments.length === 0) {
      return this._offAll();
    }
    if (handler === undefined) {
      return this._offByType(type);
    }
    return this._offByHandler(type, handler);
  };

  public mixin = function(obj: EventsType, arr: Array<string>){
    var emitter = new Emitter();
    arr.map(function(name){
      obj[name] = function(){
        return emitter[name].apply(emitter, arguments);
      };
    });
  };

  private _offAll = function(this: IEmmiter): IEmmiter {
    this.events = {};
    return this;
  };

  private _offByType = function(this: IEmmiter, type: string): IEmmiter {
    if (this.events.hasOwnProperty(type)) {
      delete this.events[type];
    }
    return this;
  };

  private _offByHandler = function(this: IEmmiter, type: string, handler: () => void): IEmmiter {
    if (!this.events.hasOwnProperty(type)) return;
    var i = this.events[type].indexOf(handler);
    if (i > -1) {
      this.events[type].splice(i, 1);
    }
    return this;
  };

  private _dispatch = function(this: IEmmiter, event: IEvent, args: []) {
    if (!this.events.hasOwnProperty(event.type)) return;
    args = args || [];
    args.unshift(event);
  
    var handlers = this.events[event.type] || [];
    handlers.forEach(handler => handler.apply(null, args));
    return this;
  };

}

class EventCustom implements  IEvent {
  type:string
  timeStamp: Date
  constructor(type: string) {
    this.type = type;
    this.timeStamp = new Date();
  }  
}